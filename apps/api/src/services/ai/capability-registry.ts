import { and, desc, eq, gte, inArray, lte, sql, sum } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db';
import {
  banks,
  categories,
  credits,
  currencyBalances,
  debts,
  mortgages,
  portfolioHoldings,
  subscriptions,
  transactions,
  users,
} from '../../db/schema';
import { currencyExchangeService } from '../currency-exchange-service';
import { DEMO_RESTRICTED_MESSAGE, getDemoRole } from '../../lib/demo';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const isoDateSchema = z.string().regex(ISO_DATE_REGEX, 'Use YYYY-MM-DD format');

const NAVIGATION_PATHS = ['/dashboard', '/transactions', '/accounts', '/insights', '/settings', '/budget'] as const;

type JsonSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type CapabilityAction = {
  type: 'navigate';
  path: (typeof NAVIGATION_PATHS)[number];
} | {
  type: 'prefill_transaction';
  transaction: {
    type: 'income' | 'expense' | 'transfer';
    amount?: number;
    description?: string;
    date?: string;
    currencyCode?: string;
    categoryId?: string;
    currencyBalanceId?: string;
    merchantName?: string;
    bankName?: string;
    lineItems?: Array<{
      name: string;
      quantity?: number;
      amount?: number;
      note?: string;
    }>;
  };
};

interface CapabilityExecutionContext {
  userId: string;
  dryRun?: boolean;
  confirmationToken?: string | null;
  idempotencyKey?: string | null;
}

interface CapabilityExecutionPayload {
  data?: unknown;
  userMessage?: string;
  clientAction?: CapabilityAction;
}

interface CapabilityDefinition<TArgs extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  aliases?: string[];
  description: string;
  readOnly: boolean;
  requiresConfirmation: boolean;
  introducedAt: string;
  deprecatedAt?: string;
  argsSchema: TArgs;
  argsJsonSchema: JsonSchema;
  execute: (ctx: CapabilityExecutionContext, args: z.infer<TArgs>) => Promise<CapabilityExecutionPayload>;
}

export interface CapabilityManifestItem {
  id: string;
  aliases: string[];
  description: string;
  readOnly: boolean;
  requiresConfirmation: boolean;
  introducedAt: string;
  deprecatedAt?: string;
  argsSchema: JsonSchema;
}

export interface CapabilityManifest {
  version: string;
  generatedAt: string;
  capabilities: CapabilityManifestItem[];
}

export interface CapabilityExecutionResult {
  success: boolean;
  capabilityId: string;
  aliasUsed?: string;
  readOnly?: boolean;
  data?: unknown;
  userMessage?: string;
  clientAction?: CapabilityAction;
  error?: {
    code: 'UNKNOWN_CAPABILITY' | 'INVALID_ARGS' | 'EXECUTION_ERROR' | 'DEMO_READ_ONLY';
    message: string;
    details?: unknown;
  };
}

export interface ExecuteCapabilityInput {
  userId: string;
  capabilityId: string;
  args?: Record<string, unknown>;
  dryRun?: boolean;
  confirmationToken?: string | null;
  idempotencyKey?: string | null;
}

const docsIndex = [
  {
    topic: 'Dashboard',
    keywords: ['dashboard', 'home', 'overview', 'summary'],
    content: 'Dashboard shows net worth, recent transactions, and active accounts. Widgets are customizable.',
  },
  {
    topic: 'Transactions',
    keywords: ['transaction', 'add', 'edit', 'delete', 'spending', 'expense', 'income'],
    content: 'Use Transactions to view history and add records. Filters include date, category, and account.',
  },
  {
    topic: 'Accounts',
    keywords: ['account', 'bank', 'card', 'manual', 'sync'],
    content: 'Accounts lists linked banks and manual accounts. You can add banks and cash wallets there.',
  },
  {
    topic: 'Insights',
    keywords: ['insight', 'report', 'graph', 'chart', 'analysis'],
    content: 'Insights includes spending reports, trends, and income versus expense breakdowns.',
  },
  {
    topic: 'Settings',
    keywords: ['setting', 'preference', 'currency', 'theme', 'profile'],
    content: 'Settings controls profile, default currency, notifications, and app behavior.',
  },
  {
    topic: 'Budgets',
    keywords: ['budget', 'limit', 'save', 'goal'],
    content: 'Budgets tracks category limits and progress against monthly targets.',
  },
  {
    topic: 'AI Chat',
    keywords: ['ai', 'woo', 'chat', 'assistant', 'help'],
    content: 'Woo can answer finance questions, inspect data, and run approved actions.',
  },
];

const RAW_RECEIPT_DESCRIPTION_PATTERNS = [
  /^https?:\/\//i,
  /\b(qr|fiscal|фиск|фд|фп|рнм|знм|ккм|кгд|iin|инн|бин|код|чек|webkassa|consumer\.wofd|wofd|ofd|офд|smartcontract)\b/i,
  /\b\d{8,}\b/,
];
const RAW_RECEIPT_MERCHANT_PATTERNS = [
  /^(wofd|webkassa|ofd|офд|smartcontract)$/i,
  /consumer\.wofd/i,
  /фиск|fiscal|verification|провер/i,
];

function formatCurrencyAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-US')}`;
  }
}

function buildReceiptTransactionDescription(args: z.infer<typeof prepareReceiptTransactionArgsSchema>) {
  const lineItems = args.lineItems || [];
  const itemNames = lineItems
    .map((item) => item.name.trim())
    .filter(Boolean)
    .slice(0, 3);
  const merchantName = getReceiptMerchantName(args.merchantName);
  const modelDescription = args.description?.trim();
  const descriptionLooksRaw = modelDescription
    ? RAW_RECEIPT_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(modelDescription))
    : false;

  if (itemNames.length > 0 && merchantName) {
    const itemSummary = itemNames.join(', ');
    const suffix = lineItems.length > itemNames.length ? ` +${lineItems.length - itemNames.length} more` : '';
    return `${itemSummary}${suffix} at ${merchantName}`;
  }

  if (itemNames.length > 0) {
    return itemNames.join(', ');
  }

  if (modelDescription && !descriptionLooksRaw) {
    return modelDescription;
  }

  if (merchantName) {
    return `Purchase at ${merchantName}`;
  }

  return 'Receipt transaction';
}

function getReceiptMerchantName(merchantName?: string) {
  const trimmed = merchantName?.trim();
  if (!trimmed) return undefined;
  return RAW_RECEIPT_MERCHANT_PATTERNS.some((pattern) => pattern.test(trimmed)) ? undefined : trimmed;
}

async function getUserHierarchy(userId: string) {
  const userBanks = await db.query.banks.findMany({
    where: eq(banks.userId, userId),
    with: {
      accounts: {
        with: {
          currencyBalances: true,
        },
      },
    },
  });

  const accountIds = userBanks.flatMap((bank) => bank.accounts.map((account) => account.id));
  const balanceIds = userBanks.flatMap((bank) =>
    bank.accounts.flatMap((account) => account.currencyBalances.map((balance) => balance.id))
  );

  return { userBanks, accountIds, balanceIds };
}

const searchTransactionsArgsSchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    minAmount: z.number().positive().optional(),
    maxAmount: z.number().positive().optional(),
  })
  .strict();

const analyzeSpendingArgsSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .strict();

const createTransactionArgsSchema = z
  .object({
    amount: z.number().positive(),
    description: z.string().trim().min(1).max(500).optional(),
    date: isoDateSchema,
    categoryId: z.string().uuid(),
    currencyBalanceId: z.string().uuid(),
    type: z.enum(['income', 'expense', 'transfer']),
  })
  .strict();

const upcomingPaymentsArgsSchema = z
  .object({
    days: z.number().int().min(1).max(365).optional(),
  })
  .strict();

const navigateArgsSchema = z
  .object({
    path: z.enum(NAVIGATION_PATHS),
  })
  .strict();

const queryDocsArgsSchema = z
  .object({
    query: z.string().trim().min(2).max(200),
  })
  .strict();

const prepareReceiptTransactionArgsSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    merchantName: z.string().trim().min(1).max(120).optional(),
    totalAmount: z.number().positive().optional(),
    currencyCode: z.string().trim().min(2).max(8).optional(),
    date: isoDateSchema.optional(),
    description: z.string().trim().min(1).max(200).optional(),
    categoryId: z.string().uuid().optional(),
    currencyBalanceId: z.string().uuid().optional(),
    bankName: z.string().trim().min(1).max(120).optional(),
    senderName: z.string().trim().min(1).max(120).optional(),
    recipientName: z.string().trim().min(1).max(120).optional(),
    directionEvidence: z.string().trim().min(1).max(300).optional(),
    lineItems: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(120),
            quantity: z.number().positive().optional(),
            amount: z.number().nonnegative().optional(),
            note: z.string().trim().max(120).optional(),
          })
          .strict()
      )
      .max(30)
      .optional(),
  })
  .strict();

const CAPABILITY_MANIFEST_VERSION = '1.0.0';

const capabilities: CapabilityDefinition[] = [
  {
    id: 'transactions.search.v1',
    aliases: ['search_transactions'],
    description: 'Search user transactions with optional filters.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: searchTransactionsArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'YYYY-MM-DD' },
        endDate: { type: 'string', description: 'YYYY-MM-DD' },
        categoryId: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
        minAmount: { type: 'number' },
        maxAmount: { type: 'number' },
      },
      additionalProperties: false,
    },
    execute: async ({ userId }, args) => {
      const { balanceIds } = await getUserHierarchy(userId);
      if (balanceIds.length === 0) {
        return { data: { transactions: [] } };
      }

      const whereParts: any[] = [inArray(transactions.currencyBalanceId, balanceIds)];
      if (args.startDate) whereParts.push(gte(transactions.date, args.startDate));
      if (args.endDate) whereParts.push(lte(transactions.date, args.endDate));
      if (args.categoryId) whereParts.push(eq(transactions.categoryId, args.categoryId));
      if (args.type) whereParts.push(eq(transactions.type, args.type));
      if (args.minAmount !== undefined) whereParts.push(gte(transactions.amount, args.minAmount.toString()));
      if (args.maxAmount !== undefined) whereParts.push(lte(transactions.amount, args.maxAmount.toString()));

      const rows = await db.query.transactions.findMany({
        where: and(...whereParts),
        with: { category: true, currencyBalance: true },
        orderBy: [desc(transactions.date)],
        limit: 50,
      });

      return {
        data: {
          transactions: rows.map((row) => ({
            id: row.id,
            date: row.date,
            amount: row.amount,
            currency: row.currencyBalance.currencyCode,
            formattedAmount: formatCurrencyAmount(Number(row.amount), row.currencyBalance.currencyCode),
            description: row.description,
            category: row.category?.name,
            type: row.type,
          })),
        },
      };
    },
  },
  {
    id: 'accounts.getBalances.v1',
    aliases: ['get_account_balance'],
    description: 'Get all banks, accounts, and balances for the current user.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: z.object({}).strict(),
    argsJsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async ({ userId }) => {
      const { userBanks } = await getUserHierarchy(userId);
      return {
        data: {
          banks: userBanks.map((bank) => ({
            name: bank.name,
            accounts: bank.accounts.map((account) => ({
              name: account.name,
              type: account.type,
              balances: account.currencyBalances.map((balance) => ({
                id: balance.id,
                amount: balance.balance,
                currency: balance.currencyCode,
              })),
            })),
          })),
        },
      };
    },
  },
  {
    id: 'categories.list.v1',
    aliases: ['get_categories'],
    description: 'List default and user-defined categories.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: z.object({}).strict(),
    argsJsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async ({ userId }) => {
      const rows = await db.query.categories.findMany({
        where: sql`${categories.userId} IS NULL OR ${categories.userId} = ${userId}`,
      });

      return {
        data: {
          categories: rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            icon: row.icon,
          })),
        },
      };
    },
  },
  {
    id: 'subscriptions.list.v1',
    aliases: ['get_subscriptions'],
    description: 'List recurring subscriptions.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: z.object({}).strict(),
    argsJsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async ({ userId }) => {
      const rows = await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, userId),
      });

      return {
        data: {
          subscriptions: rows.map((row) => ({
            id: row.id,
            name: row.name,
            amount: row.amount,
            currency: row.currency,
            frequency: row.frequency,
            status: row.status,
          })),
        },
      };
    },
  },
  {
    id: 'portfolio.list.v1',
    aliases: ['get_portfolio'],
    description: 'Get stock holdings in portfolio.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: z.object({}).strict(),
    argsJsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async ({ userId }) => {
      const rows = await db.query.portfolioHoldings.findMany({
        where: eq(portfolioHoldings.userId, userId),
        with: { stock: true },
      });

      return {
        data: {
          holdings: rows.map((row) => ({
            ticker: row.stock.ticker,
            name: row.stock.name,
            quantity: row.quantity,
            avgCost: row.averageCostBasis,
          })),
        },
      };
    },
  },
  {
    id: 'spending.analyze.v1',
    aliases: ['analyze_spending'],
    description: 'Aggregate expenses by category and currency for a date range. Do not add amounts across different currencies unless conversion is explicitly requested.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: analyzeSpendingArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'YYYY-MM-DD' },
        endDate: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['startDate', 'endDate'],
      additionalProperties: false,
    },
    execute: async ({ userId }, args) => {
      const { balanceIds } = await getUserHierarchy(userId);
      if (balanceIds.length === 0) {
        return { data: { spendingByCategory: [] } };
      }

      const rows = await db
        .select({
          categoryName: categories.name,
          currency: currencyBalances.currencyCode,
          totalAmount: sql`SUM(ABS(${transactions.amount}))`,
          count: sql`count(*)`.mapWith(Number),
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .innerJoin(currencyBalances, eq(transactions.currencyBalanceId, currencyBalances.id))
        .where(
          and(
            inArray(transactions.currencyBalanceId, balanceIds),
            gte(transactions.date, args.startDate),
            lte(transactions.date, args.endDate),
            eq(transactions.type, 'expense'),
            eq(transactions.excludeFromMonthlyStats, false),
            eq(transactions.lifecycleStatus, 'active'),
            sql`${transactions.parentTransactionId} IS NULL`
          )
        )
        .groupBy(categories.name, currencyBalances.currencyCode);

      const spendingByCategory = rows.map((row) => {
        const amount = Number(row.totalAmount || 0);
        const currency = row.currency || 'UNKNOWN';

        return {
          ...row,
          totalAmount: amount,
          currency,
          formattedTotalAmount: formatCurrencyAmount(amount, currency),
        };
      });

      const totalsByCurrency = spendingByCategory.reduce<Record<string, { currency: string; totalAmount: number; formattedTotalAmount: string }>>(
        (acc, row) => {
          acc[row.currency] ??= {
            currency: row.currency,
            totalAmount: 0,
            formattedTotalAmount: formatCurrencyAmount(0, row.currency),
          };
          acc[row.currency].totalAmount += row.totalAmount;
          acc[row.currency].formattedTotalAmount = formatCurrencyAmount(acc[row.currency].totalAmount, row.currency);
          return acc;
        },
        {}
      );

      return {
        data: {
          spendingByCategory,
          totalsByCurrency: Object.values(totalsByCurrency),
          currencyRule: 'Amounts are already grouped by original transaction currency. Do not label them as USD or combine currencies unless the user explicitly asks for currency conversion.',
        },
      };
    },
  },
  {
    id: 'transactions.create.v1',
    aliases: ['create_transaction'],
    description: 'Create a transaction in a user-owned account balance.',
    readOnly: false,
    requiresConfirmation: true,
    introducedAt: '2026-02-21',
    argsSchema: createTransactionArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        description: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        categoryId: { type: 'string', format: 'uuid' },
        currencyBalanceId: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
      },
      required: ['amount', 'date', 'categoryId', 'currencyBalanceId', 'type'],
      additionalProperties: false,
    },
    execute: async (ctx, args) => {
      const balance = await db.query.currencyBalances.findFirst({
        where: eq(currencyBalances.id, args.currencyBalanceId),
        with: {
          account: {
            with: {
              bank: true,
            },
          },
        },
      });

      if (!balance || balance.account.bank.userId !== ctx.userId) {
        throw new Error('Invalid account or access denied');
      }

      if (ctx.dryRun) {
        return {
          data: {
            dryRun: true,
            preview: {
              amount: args.amount,
              description: args.description || 'Added via AI',
              date: args.date,
              categoryId: args.categoryId,
              currencyBalanceId: args.currencyBalanceId,
              type: args.type,
            },
          },
          userMessage: 'Dry run complete. No transaction was created.',
        };
      }

      const [created] = await db
        .insert(transactions)
        .values({
          currencyBalanceId: args.currencyBalanceId,
          categoryId: args.categoryId,
          amount: args.amount.toString(),
          description: args.description || 'Added via AI',
          date: args.date,
          type: args.type,
          idempotencyKey: ctx.idempotencyKey || undefined,
        })
        .returning();

      return {
        data: {
          success: true,
          transactionId: created.id,
        },
      };
    },
  },
  {
    id: 'receipts.prepareTransaction.v1',
    aliases: ['prepare_receipt_transaction'],
    description: 'Prepare a transaction draft from a receipt, check, bank transfer, or bill image/PDF. Infer income when the current user is the recipient and expense when the current user is the sender/payer. For transfer receipts, use explicit sender/recipient labels: "Отправитель"/Sender/From is the payer, and a current-user header or recipient name means income. Include guessed categoryId and currencyBalanceId only when they match the provided context. This does not create a transaction; it asks the user to confirm.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-05-19',
    argsSchema: prepareReceiptTransactionArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
        merchantName: { type: 'string' },
        totalAmount: { type: 'number' },
        currencyCode: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        description: {
          type: 'string',
          description: 'Human-readable purchase summary only, such as "Balhadisha cake at ИП Ниятбекова" or "Groceries at Small". Do not use QR URLs, fiscal IDs, receipt numbers, taxpayer IDs, or raw metadata.',
        },
        categoryId: { type: 'string', format: 'uuid' },
        currencyBalanceId: { type: 'string', format: 'uuid' },
        bankName: { type: 'string' },
        senderName: { type: 'string', description: 'Visible sender/payer name, e.g. the value beside Отправитель/Sender/From.' },
        recipientName: { type: 'string', description: 'Visible recipient/account holder name, including header name when it indicates who received the transfer.' },
        directionEvidence: { type: 'string', description: 'Short reason for income/expense direction, quoting the visible labels used.' },
        lineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              amount: { type: 'number' },
              note: { type: 'string' },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    } as JsonSchema,
    execute: async (_ctx, args) => {
      const description = buildReceiptTransactionDescription(args);
      const merchantName = getReceiptMerchantName(args.merchantName);
      const type = args.type || 'expense';

      return {
        data: {
          readyToAdd: true,
          transaction: {
            type,
            amount: args.totalAmount,
            description,
            date: args.date,
            currencyCode: args.currencyCode,
            categoryId: args.categoryId,
            currencyBalanceId: args.currencyBalanceId,
            merchantName,
            bankName: args.bankName,
            senderName: args.senderName,
            recipientName: args.recipientName,
            directionEvidence: args.directionEvidence,
            lineItems: args.lineItems || [],
          },
        },
        userMessage: 'Receipt transaction draft is ready for review.',
        clientAction: {
          type: 'prefill_transaction',
          transaction: {
            type,
            amount: args.totalAmount,
            description,
            date: args.date,
            currencyCode: args.currencyCode,
            categoryId: args.categoryId,
            currencyBalanceId: args.currencyBalanceId,
            merchantName,
            bankName: args.bankName,
            senderName: args.senderName,
            recipientName: args.recipientName,
            directionEvidence: args.directionEvidence,
            lineItems: args.lineItems || [],
          },
        },
      };
    },
  },
  {
    id: 'liabilities.summary.v1',
    aliases: ['get_debts_and_credits'],
    description: 'Get debts, credits, and mortgages summary.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: z.object({}).strict(),
    argsJsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async ({ userId }) => {
      const [{ accountIds }, debtsList] = await Promise.all([
        getUserHierarchy(userId),
        db.query.debts.findMany({ where: eq(debts.userId, userId) }),
      ]);

      if (accountIds.length === 0) {
        return {
          data: {
            debts: debtsList.map((debtItem) => ({
              person: debtItem.personName,
              amount: debtItem.amount,
              type: debtItem.type,
              status: debtItem.status,
            })),
            credits: [],
            mortgages: [],
          },
        };
      }

      const [creditsList, mortgagesList] = await Promise.all([
        db.query.credits.findMany({ where: inArray(credits.accountId, accountIds) }),
        db.query.mortgages.findMany({ where: inArray(mortgages.accountId, accountIds) }),
      ]);

      return {
        data: {
          debts: debtsList.map((debtItem) => ({
            person: debtItem.personName,
            amount: debtItem.amount,
            type: debtItem.type,
            status: debtItem.status,
          })),
          credits: creditsList.map((creditItem) => ({
            name: creditItem.name,
            principal: creditItem.principalAmount,
            remaining: creditItem.remainingBalance,
            monthly: creditItem.monthlyPayment,
          })),
          mortgages: mortgagesList.map((mortgageItem) => ({
            property: mortgageItem.propertyName,
            remaining: mortgageItem.remainingBalance,
            monthly: mortgageItem.monthlyPayment,
          })),
        },
      };
    },
  },
  {
    id: 'payments.upcoming.v1',
    aliases: ['get_upcoming_payments'],
    description: 'List upcoming recurring payments.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: upcomingPaymentsArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', minimum: 1, maximum: 365 },
      },
      additionalProperties: false,
    },
    execute: async ({ userId }, args) => {
      const [{ accountIds }, subscriptionRows] = await Promise.all([
        getUserHierarchy(userId),
        db.query.subscriptions.findMany({ where: eq(subscriptions.userId, userId) }),
      ]);

      if (accountIds.length === 0) {
        return {
          data: {
            daysLookahead: args.days || 30,
            subscriptions: subscriptionRows.map((subscriptionItem) => ({
              name: subscriptionItem.name,
              amount: subscriptionItem.amount,
              frequency: subscriptionItem.frequency,
              nextDate: `Check billing day ${subscriptionItem.billingDay}`,
            })),
            credits: [],
            mortgages: [],
          },
        };
      }

      const [creditsList, mortgagesList] = await Promise.all([
        db.query.credits.findMany({ where: inArray(credits.accountId, accountIds) }),
        db.query.mortgages.findMany({ where: inArray(mortgages.accountId, accountIds) }),
      ]);

      return {
        data: {
          daysLookahead: args.days || 30,
          subscriptions: subscriptionRows.map((subscriptionItem) => ({
            name: subscriptionItem.name,
            amount: subscriptionItem.amount,
            frequency: subscriptionItem.frequency,
            nextDate: `Check billing day ${subscriptionItem.billingDay}`,
          })),
          credits: creditsList.map((creditItem) => ({
            name: creditItem.name,
            amount: creditItem.monthlyPayment,
            nextDate: 'Monthly',
          })),
          mortgages: mortgagesList.map((mortgageItem) => ({
            name: mortgageItem.propertyName,
            amount: mortgageItem.monthlyPayment,
            nextDate: `Monthly on day ${mortgageItem.paymentDay}`,
          })),
        },
      };
    },
  },
  {
    id: 'netWorth.breakdown.v1',
    aliases: ['get_net_worth_breakdown'],
    description: 'Get net worth breakdown with each account balance in its original currency, per-currency totals, and a separate converted estimate in the user default currency.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: z.object({}).strict(),
    argsJsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    execute: async ({ userId }) => {
      const [user, { userBanks }] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, userId) }),
        getUserHierarchy(userId),
      ]);

      const defaultCurrency = user?.defaultCurrency || 'USD';
      const usdRates = await currencyExchangeService.getExchangeRates('USD');
      const usdToDefaultCurrency = usdRates[defaultCurrency];

      if (!usdToDefaultCurrency) {
        throw new Error(`Missing USD-based exchange rate for default currency ${defaultCurrency}`);
      }

      const getConversionRateToDefaultCurrency = (currency: string) => {
        if (currency === defaultCurrency) return 1;

        const usdToSourceCurrency = usdRates[currency];
        if (!usdToSourceCurrency) return null;

        // Rates are stored as USD -> currency. Cross-rate source -> default is:
        // (USD -> default) / (USD -> source). For source -> USD this is 1 / USD->source.
        return usdToDefaultCurrency / usdToSourceCurrency;
      };

      let convertedTotalNetWorth = 0;
      const missingConversionRates = new Set<string>();
      const totalsByCurrency = new Map<string, number>();
      const breakdown = userBanks.map((bankItem) => {
        let convertedBankTotal = 0;
        const bankTotalsByCurrency = new Map<string, number>();

        const accounts = bankItem.accounts.map((accountItem) => {
          const balances = accountItem.currencyBalances.map((balance) => {
            const rate = getConversionRateToDefaultCurrency(balance.currencyCode);
            const amount = Number(balance.balance);
            const convertedAmount = rate === null ? null : amount * rate;

            if (convertedAmount === null) {
              missingConversionRates.add(balance.currencyCode);
            } else {
              convertedBankTotal += convertedAmount;
            }
            totalsByCurrency.set(balance.currencyCode, (totalsByCurrency.get(balance.currencyCode) || 0) + amount);
            bankTotalsByCurrency.set(balance.currencyCode, (bankTotalsByCurrency.get(balance.currencyCode) || 0) + amount);

            return {
              id: balance.id,
              amount: balance.balance,
              currency: balance.currencyCode,
              formattedAmount: formatCurrencyAmount(amount, balance.currencyCode),
              convertedAmount: convertedAmount === null ? null : convertedAmount.toFixed(2),
              convertedCurrency: defaultCurrency,
              formattedConvertedAmount: convertedAmount === null ? null : formatCurrencyAmount(convertedAmount, defaultCurrency),
              conversionRateToDefaultCurrency: rate,
            };
          });

          return {
            name: accountItem.name,
            type: accountItem.type,
            balances,
          };
        });

        convertedTotalNetWorth += convertedBankTotal;

        return {
          bankName: bankItem.name,
          accounts,
          totalsByCurrency: Array.from(bankTotalsByCurrency.entries()).map(([currency, amount]) => ({
            currency,
            totalAmount: amount.toFixed(2),
            formattedTotalAmount: formatCurrencyAmount(amount, currency),
          })),
          convertedTotalValue: convertedBankTotal.toFixed(2),
          formattedConvertedTotalValue: formatCurrencyAmount(convertedBankTotal, defaultCurrency),
          totalValue: convertedBankTotal.toFixed(2),
          currency: defaultCurrency,
        };
      });

      breakdown.sort((a, b) => Number(b.convertedTotalValue) - Number(a.convertedTotalValue));

      return {
        data: {
          defaultCurrency,
          totalsByCurrency: Array.from(totalsByCurrency.entries()).map(([currency, amount]) => ({
            currency,
            totalAmount: amount.toFixed(2),
            formattedTotalAmount: formatCurrencyAmount(amount, currency),
          })),
          convertedTotalNetWorth: convertedTotalNetWorth.toFixed(2),
          formattedConvertedTotalNetWorth: formatCurrencyAmount(convertedTotalNetWorth, defaultCurrency),
          totalNetWorth: convertedTotalNetWorth.toFixed(2),
          breakdown,
          conversion: {
            targetCurrency: defaultCurrency,
            usdBasedRates: true,
            formula: 'amount * ((USD -> targetCurrency) / (USD -> sourceCurrency))',
            missingRates: Array.from(missingConversionRates),
          },
          notes: [
            'Use totalsByCurrency and account balances for user-facing answers unless the user explicitly asks for a converted estimate.',
            `For converted estimates, use conversionRateToDefaultCurrency from this tool result. Never assume 1:1 conversion between different currencies.`,
            `convertedTotalNetWorth is an estimate in ${defaultCurrency}; do not present it as the only net worth when multiple currencies are present.`,
          ],
        },
      };
    },
  },
  {
    id: 'navigation.goTo.v1',
    aliases: ['navigate_to'],
    description: 'Return a client navigation action to a supported path.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: navigateArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          enum: NAVIGATION_PATHS,
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
    execute: async (_ctx, args) => {
      return {
        data: { success: true, path: args.path },
        clientAction: { type: 'navigate', path: args.path },
      };
    },
  },
  {
    id: 'docs.query.v1',
    aliases: ['query_docs'],
    description: 'Search built-in product help snippets.',
    readOnly: true,
    requiresConfirmation: false,
    introducedAt: '2026-02-21',
    argsSchema: queryDocsArgsSchema,
    argsJsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    },
    execute: async (_ctx, args) => {
      const normalized = args.query.toLowerCase();
      const results = docsIndex
        .filter((doc) => {
          const topicMatch = doc.topic.toLowerCase().includes(normalized);
          const keywordMatch = doc.keywords.some((keyword) => normalized.includes(keyword));
          const contentMatch = doc.content.toLowerCase().includes(normalized);
          return topicMatch || keywordMatch || contentMatch;
        })
        .map((doc) => `${doc.topic}: ${doc.content}`);

      return {
        data: {
          results: results.length > 0 ? results : ['No specific help article found. Try a more precise query.'],
        },
      };
    },
  },
];

const capabilityById = new Map<string, CapabilityDefinition>(capabilities.map((capability) => [capability.id, capability]));

const aliasToCapabilityId = new Map<string, string>();
for (const capability of capabilities) {
  for (const alias of capability.aliases || []) {
    aliasToCapabilityId.set(alias, capability.id);
  }
}

function resolveCapability(idOrAlias: string): { capabilityId: string; aliasUsed?: string; definition?: CapabilityDefinition } {
  const direct = capabilityById.get(idOrAlias);
  if (direct) {
    return { capabilityId: direct.id, definition: direct };
  }

  const mappedId = aliasToCapabilityId.get(idOrAlias);
  if (!mappedId) {
    return { capabilityId: idOrAlias };
  }

  return {
    capabilityId: mappedId,
    aliasUsed: idOrAlias,
    definition: capabilityById.get(mappedId),
  };
}

export function getCapabilityManifest(): CapabilityManifest {
  return {
    version: CAPABILITY_MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    capabilities: capabilities.map((capability) => ({
      id: capability.id,
      aliases: capability.aliases || [],
      description: capability.description,
      readOnly: capability.readOnly,
      requiresConfirmation: capability.requiresConfirmation,
      introducedAt: capability.introducedAt,
      deprecatedAt: capability.deprecatedAt,
      argsSchema: capability.argsJsonSchema,
    })),
  };
}

export function isCapabilityReadOnly(capabilityIdOrAlias: string): boolean {
  const { definition } = resolveCapability(capabilityIdOrAlias);
  return definition?.readOnly ?? false;
}

export async function executeCapability(input: ExecuteCapabilityInput): Promise<CapabilityExecutionResult> {
  const { capabilityId, aliasUsed, definition } = resolveCapability(input.capabilityId);

  if (!definition) {
    return {
      success: false,
      capabilityId,
      aliasUsed,
      error: {
        code: 'UNKNOWN_CAPABILITY',
        message: `Unknown capability: ${input.capabilityId}`,
        details: {
          available: capabilities.map((capability) => capability.id),
        },
      },
    };
  }

  if (getDemoRole(input.userId) && !definition.readOnly) {
    return { success: false, capabilityId, aliasUsed, readOnly: false, error: { code: 'DEMO_READ_ONLY', message: DEMO_RESTRICTED_MESSAGE } };
  }
  const parsedArgs = definition.argsSchema.safeParse(input.args || {});
  if (!parsedArgs.success) {
    return {
      success: false,
      capabilityId,
      aliasUsed,
      readOnly: definition.readOnly,
      error: {
        code: 'INVALID_ARGS',
        message: 'Arguments do not match capability schema.',
        details: parsedArgs.error.flatten(),
      },
    };
  }

  try {
    const payload = await definition.execute(
      {
        userId: input.userId,
        dryRun: input.dryRun,
        confirmationToken: input.confirmationToken,
        idempotencyKey: input.idempotencyKey,
      },
      parsedArgs.data
    );

    return {
      success: true,
      capabilityId,
      aliasUsed,
      readOnly: definition.readOnly,
      data: payload.data,
      userMessage: payload.userMessage,
      clientAction: payload.clientAction,
    };
  } catch (error: any) {
    return {
      success: false,
      capabilityId,
      aliasUsed,
      readOnly: definition.readOnly,
      error: {
        code: 'EXECUTION_ERROR',
        message: error?.message || 'Capability execution failed.',
      },
    };
  }
}
