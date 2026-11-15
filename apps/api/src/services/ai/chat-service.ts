import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { getCreditLimit } from '@woolet/shared';
import { db } from '../../db';
import { banks, categories, chatMessages, chatSessions, portfolioHoldings, users } from '../../db/schema';
import { checkPromptGuard, createChatCompletionStreamWithFallback, createChatCompletionWithFallback, MODEL_FLASH } from '../../lib/ai';
import {
  executeCapability,
  getCapabilityManifest,
  isCapabilityReadOnly,
  type CapabilityAction,
} from './capability-registry';
import { AiUsageService } from './ai-usage-service';
import { DEMO_AI_QUESTION_LIMIT, getDemoRole } from '../../lib/demo';

import { buildFamilyContext } from './family-context';

const MAX_CHAT_TOOL_TURNS = 5;
const CHAT_HISTORY_LIMIT = 30;
const CHAT_SERVICE_ERROR_MESSAGE = "Sorry, Woo's brain hit a service hiccup. Please try again in a moment.";
const MAX_QR_URL_FETCH_BYTES = 300_000;
const MAX_QR_URL_TEXT_LENGTH = 6000;
const RECEIPT_DOCUMENT_SKILL_PROMPT = `Receipt document skill for the current attached image/PDF/check/receipt:
- Follow the user's prompt, but always use the current uploaded document as the source of truth for receipt/check fields.
- Prepare an expense transaction by default unless the document clearly shows an incoming transfer or internal transfer.
- Use decoded QR data for fiscal fields such as amount, date, fiscal number, and verification URL, but do not stop there.
- If QR or fetched fiscal page lacks product, merchant, or line items, carefully inspect the attached image/PDF visually. Read the printed text line by line.
- Merchant/shop must be the seller printed on the receipt, such as an ИП/ТОО/business name or store name. Never treat WOFD, WebKassa, OFD, consumer.wofd.kz, Smartcontract, fiscal operators, QR generators, or verification sites as the merchant.
- Description must be meaningful to a user: product/service + merchant/shop when available. Examples: "Balhadisha cake at ИП Ниятбекова", "Groceries at Small", "Lunch at cafe". Never use QR URLs, fiscal IDs, receipt/check numbers, taxpayer IDs, cash register IDs, OFD/WebKassa metadata, or raw QR text.
- Extract visible line items for bill splitting. Preserve original item names and original currency.`;
const TRANSACTION_DRAFT_SKILL_PROMPT = `Transaction draft skill:
- Use receipts.prepareTransaction.v1 when extracting a draft from a receipt/check/PDF/image or when the transaction should be reviewed in the app before saving.
- A draft is not a saved transaction. It must produce a client action so the UI can show "Add transaction".
- Include type, amount, date, description, categoryId, currencyBalanceId, and currencyCode whenever available.`;
const TRANSACTION_CREATE_SKILL_PROMPT = `Manual transaction creation rule:
- Do not call transactions.create.v1 from AI chat for receipt/check/PDF/image drafts.
- For receipt/check/PDF/image workflows, always use receipts.prepareTransaction.v1 so the app shows an "Add transaction" button with autofilled fields.
- If the user confirms in chat with "yes", "add it", "create it", or similar, do not save directly. Re-show or prepare the transaction draft card and tell the user to press "Add transaction" to review and save it manually.`;

const chatTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_capability_manifest',
      description: 'Return all supported capability IDs, schemas, and metadata.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_capability',
      description: 'Execute one capability from the manifest with validated arguments.',
      parameters: {
        type: 'object',
        properties: {
          capabilityId: { type: 'string' },
          args: { type: 'object', additionalProperties: true },
          dryRun: { type: 'boolean' },
          confirmationToken: { type: 'string' },
          idempotencyKey: { type: 'string' },
        },
        required: ['capabilityId'],
        additionalProperties: false,
      },
    },
  },
];

export interface ChatRequest {
  userId: string;
  userTier: string;
  message: string;
  sessionId?: string | null;
  attachments?: ChatAttachment[];
  settings?: {
    allowAutonomousTransactions?: boolean;
  };
}

export interface ChatAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
  qrText?: string;
}

export type ChatTraceEvent =
  | {
      type: 'generation';
      status: 'started' | 'completed';
      provider?: string;
      model?: string;
      turn: number;
    }
  | {
      type: 'provider_failure';
      provider: string;
      model: string;
      error: string;
      willRetry: boolean;
      nextProvider?: string;
      turn: number;
    }
  | {
      type: 'tool_call';
      name: string;
      args: Record<string, unknown>;
      turn: number;
    }
  | {
      type: 'tool_result';
      name: string;
      success: boolean;
      turn: number;
    };

export interface ChatResponse {
  response: string;
  sessionId: string;
  clientAction: CapabilityAction | null;
  trace: ChatTraceEvent[];
}

export type ChatStreamEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'generation_start'; turn: number }
  | { type: 'generation_model'; turn: number; provider: string; model: string }
  | { type: 'provider_failure'; turn: number; provider: string; model: string; error: string; willRetry: boolean; nextProvider?: string }
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_call'; turn: number; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; turn: number; name: string; success: boolean }
  | { type: 'final'; response: string; sessionId: string; clientAction: CapabilityAction | null; trace: ChatTraceEvent[] }
  | { type: 'error'; message: string };

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function extractHttpUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) || [];
  return [...new Set(matches.map((url) => url.replace(/[.,;:]+$/, '')))].slice(0, 3);
}

function isBlockedReceiptUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  return (
    !['http:', 'https:'].includes(url.protocol) ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function htmlToReceiptText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchReceiptUrlText(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return undefined;
  }

  if (isBlockedReceiptUrl(url)) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/json,text/plain;q=0.9,*/*;q=0.5',
        'user-agent': 'WooletReceiptReader/1.0',
      },
    });

    if (!response.ok) {
      return `Receipt URL ${url.toString()} returned HTTP ${response.status}.`;
    }

    const reader = response.body?.getReader();
    if (!reader) return undefined;

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (totalBytes < MAX_QR_URL_FETCH_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      totalBytes += value.byteLength;
    }
    await reader.cancel().catch(() => undefined);

    const body = new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_QR_URL_FETCH_BYTES));
    const contentType = response.headers.get('content-type') || '';
    const text = contentType.includes('html') ? htmlToReceiptText(body) : body.replace(/\s+/g, ' ').trim();
    return text ? `Receipt URL: ${url.toString()}\nFetched receipt page text:\n${text.slice(0, MAX_QR_URL_TEXT_LENGTH)}` : undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Receipt URL ${url.toString()} could not be fetched: ${message}`;
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichAttachmentsWithQrUrlContent(attachments?: ChatAttachment[]) {
  if (!attachments?.length) return attachments;

  return Promise.all(attachments.map(async (attachment) => {
    if (!attachment.qrText) return attachment;

    const fetchedTexts = (await Promise.all(
      extractHttpUrls(attachment.qrText).map((url) => fetchReceiptUrlText(url))
    )).filter((text): text is string => Boolean(text));

    if (!fetchedTexts.length) return attachment;

    return {
      ...attachment,
      qrText: `${attachment.qrText}\n\n${fetchedTexts.join('\n\n')}`.slice(0, 10_000),
    };
  }));
}

function enforceChatUsageLimit(userTier: string, usage: Awaited<ReturnType<typeof AiUsageService.getUsage>>, userId: string) {
  // Demo messages have already reserved one of the fixed lifetime questions.
  if (getDemoRole(userId)) return;
  const creditConfig = getCreditLimit(userTier, 'aiChat');

  if (creditConfig.limit > 0) {
    if (usage.questionCountToday >= creditConfig.limit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You've reached your daily limit of ${creditConfig.limit} questions. Upgrade for more!`,
      });
    }
    return;
  }

  if (creditConfig.lifetimeLimit) {
    if (usage.questionCountLifetime >= creditConfig.lifetimeLimit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You've used all ${creditConfig.lifetimeLimit} free trial questions. Upgrade to continue chatting with Woo!`,
      });
    }
    return;
  }

  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'AI Chat is not available for your current tier.',
  });
}

async function ensureSession(userId: string, requestedSessionId: string | null | undefined, message: string) {
  if (!requestedSessionId) {
    const [newSession] = await db
      .insert(chatSessions)
      .values({
        userId,
        title: `${message.slice(0, 30)}...`,
      })
      .returning();

    return newSession.id;
  }

  const existingSession = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, requestedSessionId), eq(chatSessions.userId, userId)),
  });

  if (!existingSession) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Chat session not found.' });
  }

  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, requestedSessionId));

  return requestedSessionId;
}

async function loadHistory(sessionId: string, shouldLoad: boolean) {
  if (!shouldLoad) {
    return [] as Array<{ role: string; content: string }>;
  }

  const rows = await db.query.chatMessages.findMany({
    where: eq(chatMessages.sessionId, sessionId),
    orderBy: [asc(chatMessages.createdAt)],
    limit: CHAT_HISTORY_LIMIT,
  });

  return rows.map((row) => ({
    role: row.role,
    content: row.role === 'model'
      ? appendClientActionContext(row.content, row.clientAction)
      : row.content,
  }));
}

function appendClientActionContext(content: string, clientAction: unknown) {
  const draft = getTransactionDraftFromClientAction(clientAction);
  if (!draft) return content;

  return `${content}\n\n[Pending transaction draft for future confirmations. Use this exact JSON if the user confirms adding it: ${JSON.stringify(draft)}]`;
}

function getTransactionDraftFromClientAction(clientAction: unknown) {
  if (!isRecord(clientAction) || clientAction.type !== 'prefill_transaction') return null;
  const transaction = clientAction.transaction;
  return isRecord(transaction) ? transaction : null;
}

async function buildFinancialContext(userId: string) {
  const [user, holdings, userBanks, categoryRows, familyContext] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true, username: true, email: true, defaultCurrency: true },
    }),
    db.query.portfolioHoldings.findMany({
      where: eq(portfolioHoldings.userId, userId),
      with: { stock: true },
    }),
    db.query.banks.findMany({
      where: eq(banks.userId, userId),
      with: {
        accounts: {
          with: {
            currencyBalances: true,
          },
        },
      },
    }),
    db.query.categories.findMany({
      where: (category, { or, isNull, eq }) => or(isNull(category.userId), eq(category.userId, userId)),
    }),
    buildFamilyContext(db, userId),
  ]);

  const top = holdings
    .slice(0, 3)
    .map((holding) => `${holding.stock.ticker} (${holding.quantity})`)
    .join(', ');

  const userName = user?.name || user?.username || user?.email || 'Unknown user';
  const userAliases = Array.from(new Set([
    user?.name,
    user?.username,
    user?.email,
    user?.email?.split('@')[0],
  ].filter((value): value is string => Boolean(value?.trim()))));

  return {
    userName,
    userAliases,
    familyContext,
    defaultCurrency: user?.defaultCurrency || 'USD',
    positionCount: holdings.length,
    topHoldings: top || 'None',
    accounts: userBanks.flatMap((bank) =>
      bank.accounts.flatMap((account) =>
        account.currencyBalances.map((balance) => ({
          currencyBalanceId: balance.id,
          bankName: bank.name,
          bankIcon: bank.icon,
          accountName: account.name,
          accountType: account.type,
          last4Digits: account.last4Digits,
          currencyCode: balance.currencyCode,
        }))
      )
    ).slice(0, 20),
    recommendedCategories: categoryRows
      .filter((category) => ['income', 'expense'].includes(category.type))
      .map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
      }))
      .slice(0, 40),
    today: new Date().toISOString().split('T')[0],
  };
}

function formatContextList<T>(items: T[], formatter: (item: T) => string, fallback = 'None') {
  if (items.length === 0) return fallback;
  return items.map(formatter).join('\n');
}

export function buildSystemPrompt(context: Awaited<ReturnType<typeof buildFinancialContext>>) {
  return `You are Woo, a helpful financial assistant.

Use these tools only:
- get_capability_manifest
- execute_capability

Skills:
${TRANSACTION_DRAFT_SKILL_PROMPT}

${TRANSACTION_CREATE_SKILL_PROMPT}

Rules:
- Do not invent capability IDs.
- Use execute_capability whenever app data or actions are needed.
- For capabilities marked requiresConfirmation=true, ask for confirmation before execution if user intent is unclear.
- Never assume USD. Use each transaction or aggregate currency exactly as returned by tools.
- Do not add amounts across different currencies unless the user explicitly asks for conversion; report totals per currency instead.
- For family, we, us, household, wife/husband/kids, or other family members, use family.spending.analyze.v1 (analyze_family_spending). Use its converted totals in displayCurrency, mention missing rates, and never sum byCurrency across currencies. spending.analyze.v1 covers only the signed-in user's personal accounts.
- For netWorth.breakdown.v1, answer from totalsByCurrency and account balances first. Only mention convertedTotalNetWorth as a converted estimate if the user asks for a single-currency valuation.
- Prefer formatted amount fields from tool results when available.
- Receipt/check/bank PDF/bill-image handling applies only when the current user message includes current attachments or decoded QR data. Do not ask the user to upload a PDF/image because of older chat history.
- When the current user message includes a receipt, check, bank PDF, or bill image, use the receipt document skill included in the user message. QR data is useful for fiscal fields, but if it does not include product/shop/line items, inspect the image/PDF carefully.
- Read the merchant, date, currency, total, transfer direction, sender, recipient, account holder/header name, bank, and line items.
- Use the current user identity below to infer direction. Match names by visible full name, first name, username, transliterated spelling, initials, and Kazakh/Russian initials. A header name near the amount is often the receipt owner/recipient, not the sender.
- Incoming-transfer rule: if the receipt has labels like "Отправитель", "Sender", or "From" with a person who is not the current user, and the current user's name/alias appears as the receipt owner/header or recipient, prepare type=income.
- Outgoing-transfer rule: if the current user's name/alias appears under "Отправитель", "Sender", "From", "С карты", or "Откуда", prepare type=expense unless both source and destination are the user's own accounts.
- Russian/Kaspi example: "Перевод успешно совершен", amount, header "Алмат Қ.", and row "Отправитель Калкин Е.Ж." means Калкин sent money to Алмат, so it is type=income for the current user.
- If direction evidence conflicts, prefer explicit sender/recipient labels over generic success wording. Only use type=transfer for movement between the user's own accounts.
- Choose categoryId from the recommended categories below when there is a clear match. For person-to-person incoming transfers, prefer Gifts, Debt, Refunds, Salary, Freelance Work, or Other depending on the receipt text; do not default to expense categories.
- Guess currencyBalanceId from visible bank name/icon/account info and currency when there is a clear match. For Kaspi/Kaspi Gold receipts, prefer a matching Kaspi account balance in the receipt currency.
- For transaction description, write a short human-readable purchase summary using product/service + merchant, for example "Balhadisha cake at ИП Ниятбекова" or "Groceries at Small". Never use QR URLs, fiscal IDs, receipt/check numbers, taxpayer IDs, cash register IDs, OFD/WebKassa metadata, raw QR text, WOFD, WebKassa, OFD, Smartcontract, or verification-site names as the description or merchant.
- Then call receipts.prepareTransaction.v1 so the app can ask the user whether to add the transaction. Include senderName, recipientName, and directionEvidence when visible.
- Keep answers concise and practical.

User financial context:
${context.familyContext ? `- ${context.familyContext}\n` : ''}- Current user: ${context.userName}
- Current user aliases: ${context.userAliases.length ? context.userAliases.join(', ') : 'None'}
- Default currency: ${context.defaultCurrency}
- Portfolio positions: ${context.positionCount}
- Top holdings: ${context.topHoldings}
- Accounts:
${formatContextList(context.accounts, (account) => `  - ${account.currencyBalanceId}: ${account.bankName}${account.bankIcon ? ` ${account.bankIcon}` : ''} / ${account.accountName}${account.last4Digits ? ` *${account.last4Digits}` : ''} / ${account.currencyCode}`)}
- Recommended categories:
${formatContextList(context.recommendedCategories, (category) => `  - ${category.id}: ${category.name} (${category.type})`)}
- Today: ${context.today}`;
}

function buildUserMessageContent(message: string, attachments?: ChatAttachment[]): string | ChatCompletionContentPart[] {
  const imageAttachments = (attachments || []).filter((attachment) => attachment.mimeType.startsWith('image/'));
  const unsupportedPdfCount = (attachments || []).filter((attachment) => attachment.mimeType === 'application/pdf').length;
  const hasReceiptDocument = (attachments || []).length > 0;
  const qrData = (attachments || [])
    .filter((attachment) => attachment.qrText)
    .map((attachment, index) => `QR ${index + 1} from ${attachment.name}:\n${attachment.qrText}`)
    .join('\n\n');
  const messageWithReceiptSkill = hasReceiptDocument
    ? `${message}\n\n${RECEIPT_DOCUMENT_SKILL_PROMPT}`
    : message;
  const textWithQr = qrData
    ? `${messageWithReceiptSkill}\n\nDecoded receipt QR data. Use it for fiscal fields, then inspect the image/PDF for product, shop, and line items:\n${qrData}`
    : messageWithReceiptSkill;
  const text = unsupportedPdfCount > 0
    ? `${textWithQr}\n\nNote: ${unsupportedPdfCount} PDF attachment${unsupportedPdfCount === 1 ? '' : 's'} could not be sent directly to this provider. Ask the user to re-upload after PDF page conversion if document details are required.`
    : textWithQr;

  if (imageAttachments.length === 0) {
    return text;
  }

  return [
    { type: 'text', text },
    ...imageAttachments.map((attachment) => ({
      type: 'image_url' as const,
      image_url: {
        url: attachment.dataUrl,
      },
    })),
  ];
}

function hasVisionAttachments(attachments?: ChatAttachment[]) {
  return Boolean(attachments?.some((attachment) => attachment.mimeType.startsWith('image/')));
}

function getPersistedUserMessage(message: string, attachments?: ChatAttachment[]) {
  return message;
}

function isInfrastructureError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return [
    'remaining connection slots',
    'SUPERUSER',
    'too many connections',
    'ECONNREFUSED',
    'ConnectionRefused',
    'FailedToOpenSocket',
    'getaddrinfo ENOTFOUND',
    '57P03',
    'the database system is starting up',
  ].some((fragment) => message.includes(fragment));
}

function getChatFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('No enabled AI chat models are available')) {
    return "We're having trouble with our AI providers right now. Please try again in a few moments.";
  }
  if (message.includes('no enabled AI chat model supports vision')) {
    return "We're having trouble processing images right now. Please try again later or send your message without an attachment.";
  }
  if (message.includes('Insufficient credits')) {
    return 'OpenRouter failed because the account has insufficient credits. No other vision-capable provider is configured for this request.';
  }
  return isInfrastructureError(error) ? CHAT_SERVICE_ERROR_MESSAGE : 'AI Service Error';
}

function canParallelizeToolCalls(toolCalls: ChatCompletionMessageToolCall[]) {
  return toolCalls.every((toolCall) => {
    if (toolCall.type !== 'function') return false;

    if (toolCall.function.name === 'get_capability_manifest') {
      return true;
    }

    if (toolCall.function.name !== 'execute_capability') {
      return false;
    }

    const args = parseJsonObject(toolCall.function.arguments);
    const capabilityId = readString(args.capabilityId);
    return Boolean(capabilityId && isCapabilityReadOnly(capabilityId));
  });
}

async function runToolCall(
  userId: string,
  toolCall: ChatCompletionMessageToolCall,
  options: { allowAutonomousTransactions?: boolean } = {}
) {
  if (toolCall.type !== 'function') {
    return { toolCallId: toolCall.id, result: { error: { code: 'INVALID_TOOL', message: 'Unsupported tool call type.' } } };
  }

  if (toolCall.function.name === 'get_capability_manifest') {
    return {
      toolCallId: toolCall.id,
      toolName: 'get_capability_manifest',
      result: getCapabilityManifest(),
      clientAction: null as CapabilityAction | null,
    };
  }

  if (toolCall.function.name !== 'execute_capability') {
    return {
      toolCallId: toolCall.id,
      result: {
        success: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Unknown tool: ${toolCall.function.name}`,
        },
      },
      toolName: toolCall.function.name,
      clientAction: null as CapabilityAction | null,
    };
  }

  const args = parseJsonObject(toolCall.function.arguments);
  const capabilityId = readString(args.capabilityId);

  if (!capabilityId) {
    return {
      toolCallId: toolCall.id,
      result: {
        success: false,
        error: {
          code: 'INVALID_ARGS',
          message: 'execute_capability requires capabilityId.',
        },
      },
      toolName: 'execute_capability',
      clientAction: null as CapabilityAction | null,
    };
  }

  if (capabilityId === 'transactions.create.v1' && !options.allowAutonomousTransactions) {
    return {
      toolCallId: toolCall.id,
      toolName: capabilityId,
      result: {
        success: false,
        error: {
          code: 'MANUAL_CONFIRMATION_REQUIRED',
          message: 'AI chat must not create transactions directly. Use receipts.prepareTransaction.v1 to show an Add transaction button with autofilled fields.',
        },
      },
      clientAction: null as CapabilityAction | null,
    };
  }

  const executionResult = await executeCapability({
    userId,
    capabilityId,
    args: asRecord(args.args),
    dryRun: readBoolean(args.dryRun),
    confirmationToken: readString(args.confirmationToken) || null,
    idempotencyKey: readString(args.idempotencyKey) || null,
  });

  return {
    toolCallId: toolCall.id,
    toolName: capabilityId,
    result: executionResult,
    clientAction: executionResult.clientAction || null,
  };
}

export async function chatWithCapabilities(request: ChatRequest): Promise<ChatResponse> {
  if (!getDemoRole(request.userId)) return runChatWithCapabilities(request);
  const reservation = await AiUsageService.reserveDemoQuestion(request.userId);
  let blocked = false;
  try {
    const response = await runChatWithCapabilities(request, () => { blocked = true; });
    if (blocked) await AiUsageService.releaseDemoQuestion(reservation, request.userId);
    return response;
  } catch (error) {
    await AiUsageService.releaseDemoQuestion(reservation, request.userId);
    throw error;
  }
}

async function runChatWithCapabilities(request: ChatRequest, onGuardBlocked?: () => void): Promise<ChatResponse> {
  const [usage, guard] = await Promise.all([
    AiUsageService.getUsage(request.userId),
    checkPromptGuard(request.message),
  ]);

  enforceChatUsageLimit(request.userTier, usage, request.userId);

  if (!guard.isSafe) {
    onGuardBlocked?.();
    return {
      response: 'Looks like you are trying to prompt inject, huh? 🤨',
      sessionId: request.sessionId || 'blocked',
      clientAction: null,
      trace: [],
    };
  }

  const sessionId = await ensureSession(request.userId, request.sessionId, request.message);

  await db.insert(chatMessages).values({
    sessionId,
    role: 'user',
    content: getPersistedUserMessage(request.message, request.attachments),
  });

  const [history, context] = await Promise.all([
    loadHistory(sessionId, Boolean(request.sessionId)),
    buildFinancialContext(request.userId),
  ]);
  const enrichedAttachments = await enrichAttachmentsWithQrUrlContent(request.attachments);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: buildSystemPrompt(context),
    },
    ...history.map((message) => ({
      role: message.role === 'model' ? 'assistant' : 'user',
      content: message.content,
    })) as ChatCompletionMessageParam[],
    {
      role: 'user',
      content: buildUserMessageContent(request.message, enrichedAttachments),
    },
  ];

  let finalResponse = '';
  let clientAction: CapabilityAction | null = null;
  const trace: ChatTraceEvent[] = [];
  const requireVision = hasVisionAttachments(enrichedAttachments);

  try {
    for (let turn = 0; turn < MAX_CHAT_TOOL_TURNS; turn += 1) {
      trace.push({
        type: 'generation',
        status: 'started',
        turn,
      });

      const completion = await createChatCompletionWithFallback(
        {
          model: MODEL_FLASH,
          messages,
          tools: chatTools,
          tool_choice: 'auto',
        },
        {
          purpose: 'chat',
          requireVision,
        }
      );
      const provider = (completion as any).__wooletProvider as string | undefined;
      const model = ((completion as any).__wooletModel || completion.model) as string | undefined;

      trace.push({
        type: 'generation',
        status: 'completed',
        provider,
        model,
        turn,
      });

      console.log('[Woo AI] generation completed', {
        provider,
        model,
        turn,
        purpose: 'chat',
      });

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) {
        break;
      }

      messages.push(responseMessage);

      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        finalResponse = responseMessage.content || '';
        break;
      }

      const toolCalls = responseMessage.tool_calls.filter((toolCall) => toolCall.type === 'function');
      for (const toolCall of toolCalls) {
        const parsedArgs = parseJsonObject(toolCall.function.arguments);
        const capabilityId = readString(parsedArgs.capabilityId) || toolCall.function.name;
        trace.push({
          type: 'tool_call',
          name: capabilityId,
          args: asRecord(parsedArgs.args),
          turn,
        });
        console.log('[Woo AI] tool call', {
          name: capabilityId,
          args: asRecord(parsedArgs.args),
          turn,
          provider,
          model,
        });
      }

      const executeInParallel = canParallelizeToolCalls(toolCalls);

      const toolResults = executeInParallel
        ? await Promise.all(toolCalls.map((toolCall) => runToolCall(request.userId, toolCall, request.settings)))
        : await toolCalls.reduce(async (promiseAcc, toolCall) => {
            const acc = await promiseAcc;
            const next = await runToolCall(request.userId, toolCall, request.settings);
            acc.push(next);
            return acc;
          }, Promise.resolve([] as Awaited<ReturnType<typeof runToolCall>>[]));

      for (const toolResult of toolResults) {
        if (toolResult.clientAction) {
          clientAction = toolResult.clientAction;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolResult.toolCallId,
          content: JSON.stringify(toolResult.result),
        });

        trace.push({
          type: 'tool_result',
          name: ('toolName' in toolResult && toolResult.toolName) ? toolResult.toolName : 'unknown',
          success: Boolean((toolResult.result as any)?.success !== false && !(toolResult.result as any)?.error),
          turn,
        });
      }
    }

    const responseText = finalResponse || '(No response)';

    try {
      await Promise.all([
        db.insert(chatMessages).values({
          sessionId,
          role: 'model',
          content: responseText,
          trace,
          clientAction: clientAction as Record<string, unknown> | null,
        }),
        AiUsageService.incrementUsage(request.userId),
      ]);
    } catch (persistenceError) {
      console.error('AI chat persistence failed after successful generation:', persistenceError);
    }

    return {
      response: responseText,
      sessionId,
      clientAction,
      trace,
    };
  } catch (error: any) {
    console.error('AI Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: isInfrastructureError(error) ? CHAT_SERVICE_ERROR_MESSAGE : 'AI Service Error',
    });
  }
}

export async function chatWithCapabilitiesStream(
  request: ChatRequest,
  emit: (event: ChatStreamEvent) => void | Promise<void>
): Promise<void> {
  if (!getDemoRole(request.userId)) return runChatWithCapabilitiesStream(request, emit);
  let reservation: string;
  try { reservation = await AiUsageService.reserveDemoQuestion(request.userId); }
  catch (error) {
    await emit({ type: 'error', message: error instanceof Error ? error.message : 'Demo AI is unavailable.' });
    return;
  }
  let completed = false;
  try {
    await runChatWithCapabilitiesStream(request, async event => {
      if (event.type === 'final') completed = true;
      await emit(event);
    });
  } finally {
    if (!completed) await AiUsageService.releaseDemoQuestion(reservation, request.userId);
  }
}

async function runChatWithCapabilitiesStream(
  request: ChatRequest,
  emit: (event: ChatStreamEvent) => void | Promise<void>
): Promise<void> {
  const [usage, guard] = await Promise.all([
    AiUsageService.getUsage(request.userId),
    checkPromptGuard(request.message),
  ]);

  enforceChatUsageLimit(request.userTier, usage, request.userId);

  if (!guard.isSafe) {
    await emit({ type: 'error', message: 'Looks like you are trying to prompt inject, huh? 🤨' });
    return;
  }

  const sessionId = await ensureSession(request.userId, request.sessionId, request.message);
  await emit({ type: 'session', sessionId });

  await db.insert(chatMessages).values({
    sessionId,
    role: 'user',
    content: getPersistedUserMessage(request.message, request.attachments),
  });

  const [history, context] = await Promise.all([
    loadHistory(sessionId, Boolean(request.sessionId)),
    buildFinancialContext(request.userId),
  ]);
  const enrichedAttachments = await enrichAttachmentsWithQrUrlContent(request.attachments);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: buildSystemPrompt(context),
    },
    ...history.map((message) => ({
      role: message.role === 'model' ? 'assistant' : 'user',
      content: message.content,
    })) as ChatCompletionMessageParam[],
    {
      role: 'user',
      content: buildUserMessageContent(request.message, enrichedAttachments),
    },
  ];

  let finalResponse = '';
  let clientAction: CapabilityAction | null = null;
  const trace: ChatTraceEvent[] = [];
  const requireVision = hasVisionAttachments(enrichedAttachments);

  try {
    for (let turn = 0; turn < MAX_CHAT_TOOL_TURNS; turn += 1) {
      trace.push({ type: 'generation', status: 'started', turn });
      await emit({ type: 'generation_start', turn });

      const { provider, model, stream } = await createChatCompletionStreamWithFallback(
        {
          model: MODEL_FLASH,
          messages,
          tools: chatTools,
          tool_choice: 'auto',
        },
        {
          purpose: 'chat',
          requireVision,
          onProviderFailure: async (event) => {
            const traceEvent: ChatTraceEvent = {
              type: 'provider_failure',
              turn,
              provider: event.provider,
              model: event.model,
              error: event.error,
              willRetry: event.willRetry,
              nextProvider: event.nextProvider,
            };
            trace.push(traceEvent);
            await emit({
              type: 'provider_failure',
              turn,
              provider: event.provider,
              model: event.model,
              error: event.error,
              willRetry: event.willRetry,
              nextProvider: event.nextProvider,
            });
          },
        }
      );

      trace.push({ type: 'generation', status: 'completed', provider, model, turn });
      await emit({ type: 'generation_model', turn, provider, model });
      console.log('[Woo AI] stream generation started', { provider, model, turn, purpose: 'chat' });

      let assistantContent = '';
      let assistantReasoningContent = '';
      const toolCallParts = new Map<number, {
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>();
      let finishReason: string | null = null;

      for await (const chunk of stream) {
        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        finishReason = choice?.finish_reason || finishReason;
        const reasoningDelta = typeof (delta as any)?.reasoning_content === 'string'
          ? (delta as any).reasoning_content
          : '';

        if (reasoningDelta) {
          assistantReasoningContent += reasoningDelta;
        }

        if (delta?.content) {
          assistantContent += delta.content;
          finalResponse += delta.content;
          await emit({ type: 'text_delta', delta: delta.content });
        }

        for (const toolCall of delta?.tool_calls || []) {
          const index = toolCall.index ?? 0;
          const existing = toolCallParts.get(index) || {
            id: toolCall.id || `tool-${turn}-${index}`,
            type: 'function' as const,
            function: { name: '', arguments: '' },
          };

          if (toolCall.id) existing.id = toolCall.id;
          if (toolCall.function?.name) existing.function.name += toolCall.function.name;
          if (toolCall.function?.arguments) existing.function.arguments += toolCall.function.arguments;
          toolCallParts.set(index, existing);
        }
      }

      const toolCalls = Array.from(toolCallParts.values()).filter((toolCall) => toolCall.function.name);

      messages.push({
        role: 'assistant',
        content: assistantContent || null,
        ...(assistantReasoningContent ? { reasoning_content: assistantReasoningContent } : {}),
        ...(toolCalls.length ? { tool_calls: toolCalls as ChatCompletionMessageToolCall[] } : {}),
      } as ChatCompletionMessageParam);

      if (toolCalls.length === 0) {
        console.log('[Woo AI] stream generation completed', { provider, model, turn, finishReason });
        break;
      }

      for (const toolCall of toolCalls) {
        const parsedArgs = parseJsonObject(toolCall.function.arguments);
        const capabilityId = readString(parsedArgs.capabilityId) || toolCall.function.name;
        const capabilityArgs = asRecord(parsedArgs.args);
        trace.push({ type: 'tool_call', name: capabilityId, args: capabilityArgs, turn });
        await emit({ type: 'tool_call', turn, name: capabilityId, args: capabilityArgs });
        console.log('[Woo AI] stream tool call', { name: capabilityId, args: capabilityArgs, turn, provider, model });
      }

      const executeInParallel = canParallelizeToolCalls(toolCalls as ChatCompletionMessageToolCall[]);
      const toolResults = executeInParallel
        ? await Promise.all(toolCalls.map((toolCall) => runToolCall(request.userId, toolCall as ChatCompletionMessageToolCall, request.settings)))
        : await toolCalls.reduce(async (promiseAcc, toolCall) => {
            const acc = await promiseAcc;
            const next = await runToolCall(request.userId, toolCall as ChatCompletionMessageToolCall, request.settings);
            acc.push(next);
            return acc;
          }, Promise.resolve([] as Awaited<ReturnType<typeof runToolCall>>[]));

      for (const toolResult of toolResults) {
        if (toolResult.clientAction) {
          clientAction = toolResult.clientAction;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolResult.toolCallId,
          content: JSON.stringify(toolResult.result),
        });

        const name = ('toolName' in toolResult && toolResult.toolName) ? toolResult.toolName : 'unknown';
        const success = Boolean((toolResult.result as any)?.success !== false && !(toolResult.result as any)?.error);
        trace.push({ type: 'tool_result', name, success, turn });
        await emit({ type: 'tool_result', turn, name, success });
      }
    }

    const responseText = finalResponse || '(No response)';

    try {
      await Promise.all([
        db.insert(chatMessages).values({
          sessionId,
          role: 'model',
          content: responseText,
          trace,
          clientAction: clientAction as Record<string, unknown> | null,
        }),
        AiUsageService.incrementUsage(request.userId),
      ]);
    } catch (persistenceError) {
      console.error('AI chat persistence failed after successful streamed generation:', persistenceError);
    }

    await emit({
      type: 'final',
      response: responseText,
      sessionId,
      clientAction,
      trace,
    });
  } catch (error: any) {
    console.error('AI Stream Error:', error);
    await emit({
      type: 'error',
      message: getChatFailureMessage(error),
    });
  }
}

export async function getChatUsageStats(userId: string, userTier: string) {
  const usage = await AiUsageService.getUsage(userId);
  const isDemo = Boolean(getDemoRole(userId));
  const creditConfig = isDemo ? { limit: 0, lifetimeLimit: DEMO_AI_QUESTION_LIMIT } : getCreditLimit(userTier, 'aiChat');

  return {
    usageToday: usage.questionCountToday,
    usageLifetime: usage.questionCountLifetime,
    limit: creditConfig.limit,
    lifetimeLimit: creditConfig.lifetimeLimit,
    tierTitle: 'Woo',
    isLimited: isDemo || userTier === 'pro',
    isFull: !isDemo && userTier === 'premium',
    remaining:
      creditConfig.limit > 0
        ? Math.max(0, creditConfig.limit - usage.questionCountToday)
        : creditConfig.lifetimeLimit
          ? Math.max(0, creditConfig.lifetimeLimit - usage.questionCountLifetime)
          : 0,
  };
}

export async function listChatSessions(userId: string) {
  return db.query.chatSessions.findMany({
    where: eq(chatSessions.userId, userId),
    orderBy: [desc(chatSessions.updatedAt)],
    limit: 20,
  });
}

export async function getChatSessionById(userId: string, sessionId: string) {
  const session = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
    with: {
      messages: {
        orderBy: [asc(chatMessages.createdAt)],
      },
    },
  });

  if (!session) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return session;
}

export async function deleteChatSessionById(userId: string, sessionId: string) {
  await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));

  return { success: true };
}
