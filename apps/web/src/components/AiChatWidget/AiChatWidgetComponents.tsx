import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createPortal } from 'react-dom';
import posthog from 'posthog-js';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, FileImage, FileText, MessageCircle, Paperclip, ReceiptText, Wrench, X, Send, History, PlusCircle, Trash2, Settings, Info, Loader2 } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MomoIcon } from './MomoIcon';
import { MomoIconWrapper } from './MomoIconWrapper';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';

interface Message {
    role: 'user' | 'model';
    text: string;
    attachments?: ChatAttachment[];
    trace?: ChatTraceEvent[];
    clientAction?: ChatClientAction | null;
}

interface ChatSettings {
    allowAutonomousTransactions: boolean;
    receiptDrafts: boolean;
    navigationTools: boolean;
    financeAnalysis: boolean;
}

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
    allowAutonomousTransactions: false,
    receiptDrafts: true,
    navigationTools: true,
    financeAnalysis: true,
};

const CHAT_SETTINGS_STORAGE_KEY = 'woo-chat-settings';

interface ChatAttachment {
    id: string;
    name: string;
    mimeType: string;
    dataUrl: string;
    qrText?: string;
    previewUrl?: string;
    originalName?: string;
    originalMimeType?: string;
    originalDataUrl?: string;
    originalPageCount?: number;
    isProcessing?: boolean;
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
    detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

declare global {
    interface Window {
        BarcodeDetector?: BarcodeDetectorConstructor;
    }
}

type ChatClientAction = {
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
} | {
    type: 'navigate';
    path: string;
};

type ChatTraceEvent =
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
        args?: Record<string, unknown>;
        turn: number;
    }
    | {
        type: 'tool_result';
        name: string;
        success: boolean;
        turn: number;
    };

const CHAT_ERROR_MESSAGE = "Sorry, Woo's brain hit a service hiccup. Please try again in a moment.";
const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 860;
const MIN_CHAT_HEIGHT = 380;
const MAX_PDF_RENDER_PAGES = 5;
const MAX_CHAT_ATTACHMENTS = 5;

const TOOL_DISPLAY_NAMES: Record<string, { active: string; done: string }> = {
    get_capability_manifest: {
        active: 'Checking available actions',
        done: 'Checked available actions',
    },
    execute_capability: {
        active: 'Using Woo tools',
        done: 'Used Woo tools',
    },
    'transactions.search.v1': {
        active: 'Searching transactions',
        done: 'Searched transactions',
    },
    'accounts.getBalances.v1': {
        active: 'Checking balances',
        done: 'Checked balances',
    },
    'categories.list.v1': {
        active: 'Loading categories',
        done: 'Loaded categories',
    },
    'subscriptions.list.v1': {
        active: 'Checking subscriptions',
        done: 'Checked subscriptions',
    },
    'portfolio.list.v1': {
        active: 'Checking portfolio',
        done: 'Checked portfolio',
    },
    'spending.analyze.v1': {
        active: 'Analyzing spending',
        done: 'Analyzed spending',
    },
    'transactions.create.v1': {
        active: 'Preparing transaction',
        done: 'Prepared transaction',
    },
    'receipts.prepareTransaction.v1': {
        active: 'Reading receipt',
        done: 'Prepared receipt transaction',
    },
    'liabilities.summary.v1': {
        active: 'Checking debts and credits',
        done: 'Checked debts and credits',
    },
    'payments.upcoming.v1': {
        active: 'Checking upcoming payments',
        done: 'Checked upcoming payments',
    },
    'netWorth.breakdown.v1': {
        active: 'Calculating net worth',
        done: 'Calculated net worth',
    },
    'navigation.goTo.v1': {
        active: 'Opening page',
        done: 'Opened page',
    },
    'docs.query.v1': {
        active: 'Searching help',
        done: 'Searched help',
    },
};

function getReadableToolName(name: string) {
    return name
        .replace(/\.v\d+$/, '')
        .replace(/[_.]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getToolTraceLabel(event: Extract<ChatTraceEvent, { type: 'tool_call' | 'tool_result' }>) {
    const displayName = TOOL_DISPLAY_NAMES[event.name];

    if (event.type === 'tool_call') {
        return displayName?.active || `Using ${getReadableToolName(event.name)}`;
    }

    if (!event.success) {
        return `Couldn't finish ${displayName?.done.toLowerCase() || getReadableToolName(event.name).toLowerCase()}`;
    }

    return displayName?.done || `Finished ${getReadableToolName(event.name)}`;
}

function getProviderFailureLabel(event: Extract<ChatTraceEvent, { type: 'provider_failure' }>) {
    const provider = getReadableToolName(event.provider);
    if (event.willRetry && event.nextProvider) {
        return `${provider} failed, trying ${getReadableToolName(event.nextProvider)}`;
    }
    return `${provider} failed, no fallback provider`;
}

function isPendingModelMessage(message: Message, index: number, messages: Message[], isLoading: boolean) {
    return isLoading && index === messages.length - 1 && message.role === 'model' && message.text.trim().length === 0;
}

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function isSupportedReceiptFile(file: File) {
    return (file.type.startsWith('image/') || file.type === 'application/pdf') && file.size <= 6_000_000;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
    return mimeType === 'application/pdf'
        ? <FileText className="h-3 w-3 shrink-0" />
        : <FileImage className="h-3 w-3 shrink-0" />;
}

async function decodeQrWithNativeDetector(canvas: HTMLCanvasElement) {
    if (!window.BarcodeDetector) return undefined;

    try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const results = await detector.detect(canvas);
        return results.find((result) => result.rawValue)?.rawValue;
    } catch {
        return undefined;
    }
}

function createQrScanVariants(source: HTMLCanvasElement) {
    const variants: HTMLCanvasElement[] = [source];
    const transforms = [
        { rotation: 0, contrast: 1.35, threshold: 0 },
        { rotation: 0, contrast: 1.8, threshold: 128 },
        { rotation: 90, contrast: 1.35, threshold: 0 },
        { rotation: -90, contrast: 1.35, threshold: 0 },
        { rotation: 180, contrast: 1.35, threshold: 0 },
    ];

    for (const transform of transforms) {
        const rotated = Math.abs(transform.rotation) === 90;
        const canvas = document.createElement('canvas');
        canvas.width = rotated ? source.height : source.width;
        canvas.height = rotated ? source.width : source.height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) continue;

        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((transform.rotation * Math.PI) / 180);
        context.drawImage(source, -source.width / 2, -source.height / 2);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < imageData.data.length; index += 4) {
            const gray = imageData.data[index] * 0.299 + imageData.data[index + 1] * 0.587 + imageData.data[index + 2] * 0.114;
            const contrasted = Math.max(0, Math.min(255, (gray - 128) * transform.contrast + 128));
            const value = transform.threshold > 0 ? (contrasted >= transform.threshold ? 255 : 0) : contrasted;
            imageData.data[index] = value;
            imageData.data[index + 1] = value;
            imageData.data[index + 2] = value;
        }
        context.putImageData(imageData, 0, 0);
        variants.push(canvas);
    }

    return variants;
}

async function decodeQrFromCanvas(canvas: HTMLCanvasElement) {
    for (const variant of createQrScanVariants(canvas)) {
        const nativeResult = await decodeQrWithNativeDetector(variant);
        if (nativeResult) return nativeResult;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;

    const { default: jsQR } = await import('jsqr');
    for (const variant of createQrScanVariants(canvas)) {
        const variantContext = variant.getContext('2d', { willReadFrequently: true });
        if (!variantContext) continue;

        const imageData = variantContext.getImageData(0, 0, variant.width, variant.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (result?.data) return result.data;
    }

    return undefined;
}

async function decodeQrFromDataUrl(dataUrl: string) {
    const image = new Image();
    image.decoding = 'async';
    const loaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load image for QR decoding'));
    });
    image.src = dataUrl;
    await loaded;

    const canvas = document.createElement('canvas');
    const maxSide = 2400;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight, 1));
    canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return decodeQrFromCanvas(canvas);
}

function createAttachmentId(name: string, index: number | string = 0) {
    return `${name}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function createProcessingAttachment(file: File): ChatAttachment {
    return {
        id: createAttachmentId(file.name, 'loading'),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: '',
        originalName: file.name,
        originalMimeType: file.type,
        originalPageCount: file.type === 'application/pdf' ? undefined : 1,
        isProcessing: true,
    };
}

async function renderPdfToImageAttachments(file: File, originalDataUrl: string): Promise<ChatAttachment[]> {
    const [pdfjsLib, pdfWorker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.mjs?url'),
    ]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pageCount = Math.min(pdf.numPages, MAX_PDF_RENDER_PAGES);
    const attachments: ChatAttachment[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1400 / Math.max(baseViewport.width, 1));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) continue;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const qrText = await decodeQrFromCanvas(canvas);

        attachments.push({
            id: createAttachmentId(file.name, pageNumber),
            name: `${file.name} page ${pageNumber}.png`,
            mimeType: 'image/png',
            dataUrl: canvas.toDataURL('image/png'),
            qrText,
            previewUrl: canvas.toDataURL('image/png'),
            originalName: file.name,
            originalMimeType: 'application/pdf',
            originalDataUrl,
            originalPageCount: pdf.numPages,
        });
    }

    return attachments;
}

async function fileToChatAttachments(file: File): Promise<ChatAttachment[]> {
    if (file.type === 'application/pdf') {
        const originalDataUrl = await readFileAsDataUrl(file);
        return renderPdfToImageAttachments(file, originalDataUrl);
    }

    const dataUrl = await readFileAsDataUrl(file);
    const qrText = await decodeQrFromDataUrl(dataUrl).catch(() => undefined);

    return [{
        id: createAttachmentId(file.name),
        name: file.name,
        mimeType: file.type,
        dataUrl,
        qrText,
        previewUrl: dataUrl,
        originalName: file.name,
        originalMimeType: file.type,
        originalDataUrl: dataUrl,
        originalPageCount: 1,
    }];
}

function normalizeMarkdown(markdown: string) {
    return markdown
        .replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => `\n\n\`\`\`math\n${String(formula).trim()}\n\`\`\`\n\n`)
        .replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula) => `\n\n\`\`\`math\n${String(formula).trim()}\n\`\`\`\n\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula) => `\`${String(formula).trim()}\``);
}

function MarkdownMessage({ text }: { text: string }) {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    pre: ({ children }) => (
                        <pre className="overflow-x-auto rounded-md border border-border/70 bg-background/70 p-2 text-xs leading-relaxed">
                            {children}
                        </pre>
                    ),
                    code: ({ children, className }) => {
                        const isMath = className === 'language-math';
                        return (
                            <code className={cn(
                                isMath
                                    ? 'block whitespace-pre-wrap font-mono text-[12px]'
                                    : 'rounded bg-background/80 px-1 py-0.5 font-mono text-[0.85em]',
                                className
                            )}>
                                {children}
                            </code>
                        );
                    },
                    table: ({ children }) => (
                        <div className="my-2 max-w-full overflow-x-auto rounded-md border border-border/70">
                            <table className="w-full border-collapse text-xs">{children}</table>
                        </div>
                    ),
                }}
            >
                {normalizeMarkdown(text)}
            </ReactMarkdown>
        </div>
    );
}

function getReceiptDescription(action: Extract<ChatClientAction, { type: 'prefill_transaction' }>) {
    const transaction = action.transaction;
    const itemCount = transaction.lineItems?.length || 0;
    const parts = [
        transaction.merchantName || transaction.description || 'Receipt',
        transaction.type,
        transaction.amount ? transaction.amount.toLocaleString() : null,
        transaction.currencyCode || null,
        transaction.bankName || null,
        itemCount ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : null,
    ].filter(Boolean);

    return parts.join(' • ');
}

function getChatErrorMessage(error: any) {
    if (error?.data?.code === 'FORBIDDEN' || error?.data?.code === 'NOT_FOUND') {
        return error.message;
    }

    return CHAT_ERROR_MESSAGE;
}

function loadChatSettings() {
    if (typeof window === 'undefined') return DEFAULT_CHAT_SETTINGS;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(CHAT_SETTINGS_STORAGE_KEY) || '{}');
        return { ...DEFAULT_CHAT_SETTINGS, ...parsed };
    } catch {
        return DEFAULT_CHAT_SETTINGS;
    }
}

function SettingsInfoTip({ text }: { text: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label="More info"
                    className="rounded-full text-muted-foreground transition hover:text-foreground"
                    onClick={(event) => event.stopPropagation()}
                >
                    <Info className="h-4 w-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-64 p-3 text-xs leading-relaxed">
                {text}
            </PopoverContent>
        </Popover>
    );
}

function ChatSettingsDialog({
    open,
    onOpenChange,
    settings,
    onSettingsChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: ChatSettings;
    onSettingsChange: (settings: ChatSettings) => void;
}) {
    const setSetting = (key: keyof ChatSettings, value: boolean) => {
        const next = { ...settings, [key]: value };
        onSettingsChange(next);
        window.localStorage.setItem(CHAT_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-base">Woo Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">Transactions</p>
                            <SettingsInfoTip text="Add bar shows a prefilled Add transaction button for manual review. Autonomous lets Woo create transactions directly when you explicitly ask." />
                        </div>
                        <div className="mt-2 grid grid-cols-2 rounded-lg bg-muted p-1">
                            <button
                                type="button"
                                className={cn("rounded-md px-2 py-1.5 text-xs font-semibold", !settings.allowAutonomousTransactions && "bg-background shadow")}
                                onClick={() => setSetting('allowAutonomousTransactions', false)}
                            >
                                Add bar
                            </button>
                            <button
                                type="button"
                                className={cn("rounded-md px-2 py-1.5 text-xs font-semibold", settings.allowAutonomousTransactions && "bg-background shadow")}
                                onClick={() => setSetting('allowAutonomousTransactions', true)}
                            >
                                Autonomous
                            </button>
                        </div>
                    </div>
                    {([
                        ['receiptDrafts', 'Receipt drafts', 'Allows Woo to read receipts, checks, PDFs, and images, then prepare an autofilled transaction draft.'],
                        ['navigationTools', 'Navigation tools', 'Allows Woo to suggest or open supported app pages when you ask where to go.'],
                        ['financeAnalysis', 'Finance analysis', 'Allows Woo to inspect balances, transactions, categories, subscriptions, and portfolio data for answers.'],
                    ] as const).map(([key, label, text]) => (
                        <label key={key} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                            <span className="flex items-center gap-2">
                                {label}
                                <SettingsInfoTip text={text} />
                            </span>
                            <input
                                type="checkbox"
                                checked={settings[key]}
                                onChange={(event) => setSetting(key, event.target.checked)}
                                className="h-4 w-4 accent-purple-500"
                            />
                        </label>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ChatTrace({ trace }: { trace?: ChatTraceEvent[] }) {
    if (!trace?.length) return null;

    const completedGeneration = [...trace].reverse().find((event) => event.type === 'generation' && event.status === 'completed');
    const providerFailures = trace.filter((event) => event.type === 'provider_failure');
    const toolEvents = trace.filter((event) => event.type === 'tool_call' || event.type === 'tool_result');
    const hasVisibleTrace = Boolean(completedGeneration) || providerFailures.length > 0 || toolEvents.length > 0;

    if (!hasVisibleTrace) return null;

    return (
        <div className="mb-2 space-y-1 border-b border-border/50 pb-2 text-[10px] text-muted-foreground">
            {completedGeneration?.type === 'generation' && (
                <div className="flex items-center gap-1.5">
                    <Cpu className="size-3" />
                    <span className="truncate">
                        {completedGeneration.provider || 'provider'} / {completedGeneration.model || 'model'}
                    </span>
                </div>
            )}
            {providerFailures.map((event) => (
                <div key={`${event.type}-${event.provider}-${event.model}-${event.turn}-${event.willRetry}`} className="flex items-center gap-1.5">
                    <Cpu className="size-3" />
                    <span className="truncate" title={`${event.provider} / ${event.model}: ${event.error}`}>
                        {getProviderFailureLabel(event)}
                    </span>
                </div>
            ))}
            {toolEvents.map((event) => (
                <div key={`${event.type}-${event.name}-${event.turn}-${JSON.stringify(event)}`} className="flex items-center gap-1.5">
                    <Wrench className="size-3" />
                    <span className="truncate" title={event.name}>
                        {getToolTraceLabel(event)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ChatActionCard({
    action,
    onAddTransaction,
}: {
    action?: ChatClientAction | null;
    onAddTransaction?: (action: Extract<ChatClientAction, { type: 'prefill_transaction' }>) => void;
}) {
    if (!action || action.type !== 'prefill_transaction') return null;

    return (
        <div className="mt-3 rounded-md border border-border/60 bg-background/70 p-2">
            <div className="flex items-start gap-2">
                <ReceiptText className="mt-0.5 h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">Receipt ready</p>
                    <p className="truncate text-[11px] text-muted-foreground">{getReceiptDescription(action)}</p>
                </div>
            </div>
            {Boolean(action.transaction.lineItems?.length) && (
                <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
                    {action.transaction.lineItems!.slice(0, 4).map((item, index) => (
                        <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="truncate">{item.name}</span>
                            {item.amount !== undefined && <span className="shrink-0 text-muted-foreground">{item.amount.toLocaleString()}</span>}
                        </div>
                    ))}
                    {action.transaction.lineItems!.length > 4 && (
                        <p className="text-[11px] text-muted-foreground">+{action.transaction.lineItems!.length - 4} more</p>
                    )}
                </div>
            )}
            <Button
                type="button"
                size="sm"
                className="mt-2 h-8 w-full text-xs"
                onClick={() => onAddTransaction?.(action)}
            >
                Add transaction
            </Button>
        </div>
    );
}

function AttachmentPreviewDialog({
    attachment,
    onOpenChange,
}: {
    attachment: ChatAttachment | null;
    onOpenChange: (open: boolean) => void;
}) {
    const originalMimeType = attachment?.originalMimeType || attachment?.mimeType || '';
    const originalDataUrl = attachment?.originalDataUrl || attachment?.dataUrl;
    const title = attachment?.originalName || attachment?.name || 'Attachment';

    return (
        <Dialog open={Boolean(attachment)} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88dvh] max-w-[min(920px,94vw)] overflow-hidden p-0">
                <DialogHeader className="border-b px-4 py-3">
                    <DialogTitle className="max-w-[calc(100%-2rem)] truncate text-sm">{title}</DialogTitle>
                </DialogHeader>
                <div className="flex max-h-[calc(88dvh-4rem)] min-h-[240px] items-center justify-center bg-black/90 p-2">
                    {originalMimeType === 'application/pdf' ? (
                        <iframe
                            title={title}
                            src={originalDataUrl || ''}
                            className="h-[72dvh] w-full rounded-md bg-white"
                        />
                    ) : (
                        <img
                            src={originalDataUrl || ''}
                            alt={title}
                            className="max-h-[76dvh] max-w-full rounded-md object-contain"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function getAttachmentDisplayGroups(attachments: ChatAttachment[]) {
    const groups: Array<{ key: string; primary: ChatAttachment; items: ChatAttachment[] }> = [];
    const groupIndex = new Map<string, number>();

    for (const attachment of attachments) {
        const isPdf = attachment.originalMimeType === 'application/pdf';
        const key = isPdf
            ? `pdf:${attachment.originalName || attachment.name}:${attachment.originalDataUrl || attachment.id}`
            : attachment.id;
        const existingIndex = groupIndex.get(key);

        if (existingIndex === undefined) {
            groupIndex.set(key, groups.length);
            groups.push({ key, primary: attachment, items: [attachment] });
        } else {
            groups[existingIndex].items.push(attachment);
        }
    }

    return groups;
}

function hasProcessingAttachments(attachments: ChatAttachment[]) {
    return attachments.some(attachment => attachment.isProcessing);
}

function AttachmentPreviewTray({
    attachments,
    onRemove,
    onPreview,
}: {
    attachments: ChatAttachment[];
    onRemove: (id: string) => void;
    onPreview: (attachment: ChatAttachment) => void;
}) {
    if (!attachments.length) return null;
    const attachmentGroups = getAttachmentDisplayGroups(attachments);

    return (
        <div className="mt-2 flex max-w-full items-center gap-2 overflow-x-auto pb-0.5">
            {attachmentGroups.map((group) => {
                const attachment = group.primary;
                const isPdf = attachment.originalMimeType === 'application/pdf';
                const pageCount = attachment.originalPageCount || group.items.length;
                return (
                    <div
                        key={group.key}
                        className="group relative h-8 w-8 shrink-0"
                        title={attachment.originalName || attachment.name}
                    >
                        <button
                            type="button"
                            className="h-8 w-8 overflow-hidden rounded-md border border-border/70 bg-muted shadow-sm outline-none ring-offset-background transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={() => onPreview(attachment)}
                            aria-label={`Preview ${attachment.originalName || attachment.name}`}
                            disabled={attachment.isProcessing}
                        >
                            {attachment.isProcessing ? (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : attachment.previewUrl ? (
                                <img src={attachment.previewUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <AttachmentIcon mimeType={attachment.mimeType} />
                                </div>
                            )}
                            {isPdf && (
                                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[7px] font-semibold leading-3 text-white">
                                    PDF
                                </span>
                            )}
                            {isPdf && pageCount > 1 && (
                                <span className="absolute -bottom-1 -left-1 rounded-full bg-background px-1 text-[8px] font-semibold text-foreground ring-1 ring-border">
                                    {pageCount}p
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-muted-foreground shadow ring-1 ring-border transition hover:text-destructive"
                            onClick={(event) => {
                                event.stopPropagation();
                                group.items.forEach(item => onRemove(item.id));
                            }}
                            aria-label={`Remove ${attachment.originalName || attachment.name}`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function SentAttachmentStrip({ attachments }: { attachments?: ChatAttachment[] }) {
    if (!attachments?.length) return null;
    const attachmentGroups = getAttachmentDisplayGroups(attachments);

    return (
        <div className="mt-2 flex max-w-full flex-wrap gap-1.5">
            {attachmentGroups.map((group) => {
                const attachment = group.primary;
                const isPdf = attachment.originalMimeType === 'application/pdf';
                const pageCount = attachment.originalPageCount || group.items.length;
                return (
                    <div
                        key={group.key}
                        className="flex max-w-[180px] items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-[11px] text-white/90"
                        title={attachment.originalName || attachment.name}
                    >
                        {attachment.isProcessing ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <AttachmentIcon mimeType={attachment.mimeType} />}
                        <span className="truncate">{attachment.originalName || attachment.name}</span>
                        {isPdf && <span className="shrink-0 rounded bg-black/30 px-1 text-[9px] font-semibold">PDF</span>}
                        {isPdf && pageCount > 1 && <span className="shrink-0 text-[10px] text-white/70">{pageCount}p</span>}
                    </div>
                );
            })}
        </div>
    );
}


// Shared hook for anger state management
function useAngryState(isOpen: boolean, hasSentMessage: boolean) {
    const [isAngry, setIsAngry] = useState(false);
    const wasOpen = useRef(isOpen);

    useEffect(() => {
        if (wasOpen.current && !isOpen && !hasSentMessage) {
            // Use setTimeout to avoid synchronous setState in effect (React Compiler warning)
            const angerTimer = setTimeout(() => setIsAngry(true), 0);
            const resetTimer = setTimeout(() => setIsAngry(false), 5000);
            return () => {
                clearTimeout(angerTimer);
                clearTimeout(resetTimer);
            };
        }
        wasOpen.current = isOpen;
    }, [isOpen, hasSentMessage]);

    return { isAngry, setIsAngry };
}

// Shared hook for chat logic
function useChatLogic(settings: ChatSettings, isOpen: boolean) {
    const { userId } = useAuth();
    const [currentSessionId, setSessionId] = useState<string | null>(null);
    const activeUserId = useRef(userId);
    activeUserId.current = userId;
    const sessionVersion = useRef(0);
    const attemptedRestore = useRef<string | null>(null);
    const storageKey = userId ? `woo-chat-session:${userId}` : null;
    const setCurrentSessionId = useCallback((id: string | null) => {
        setSessionId(id);
        if (!storageKey) return;
        try {
            if (id) localStorage.setItem(storageKey, id);
            else localStorage.removeItem(storageKey);
        } catch { /* Chat still works when storage is unavailable. */ }
    }, [storageKey]);
    const utils = trpc.useUtils();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hi! I\'m Woo. Ask me anything about your finances!' }
    ]);
    const [hasSentMessage, setHasSentMessage] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    const { mutateAsync: getSession, isLoading: isLoadingSession } = trpc.ai.getSession.useMutation();
    const { mutateAsync: deleteSession } = trpc.ai.deleteSession.useMutation();

    const loadSession = useCallback(async ({ sessionId }: { sessionId: string }) => {
        const version = ++sessionVersion.current;
        setIsStreaming(false);
        try {
            const data = await getSession({ sessionId });
            if (activeUserId.current !== userId || sessionVersion.current !== version) return;
            setMessages((data.messages || []).map((message: any) => ({
                role: message.role,
                text: message.content,
                trace: Array.isArray(message.trace) ? message.trace : undefined,
                clientAction: message.clientAction || undefined,
            })));
            setCurrentSessionId(data.id);
            setHasSentMessage(data.messages.length > 0);
        } catch (error) {
            if (activeUserId.current !== userId || sessionVersion.current !== version) return;
            const code = (error as { data?: { code?: string } }).data?.code;
            if (code === 'NOT_FOUND' || code === 'BAD_REQUEST') setCurrentSessionId(null);
            else toast.error('Could not restore chat. Please try again.');
        }
    }, [getSession, setCurrentSessionId, userId]);

    useEffect(() => {
        sessionVersion.current++;
        attemptedRestore.current = null;
        setSessionId(null);
        setMessages([{ role: 'model', text: 'Hi! I\'m Woo. Ask me anything about your finances!' }]);
        setHasSentMessage(false);
        setIsStreaming(false);
    }, [userId]);

    useEffect(() => () => { sessionVersion.current++; }, []);

    useEffect(() => {
        if (!isOpen) { attemptedRestore.current = null; return; }
        if (!storageKey || currentSessionId || messages.length !== 1 || messages[0].text !== 'Hi! I\'m Woo. Ask me anything about your finances!') return;
        let storedId: string | null = null;
        try { storedId = localStorage.getItem(storageKey); } catch { /* Optional persistence. */ }
        if (storedId && attemptedRestore.current !== `${storageKey}:${storedId}`) {
            attemptedRestore.current = `${storageKey}:${storedId}`;
            void loadSession({ sessionId: storedId });
        }
    }, [isOpen, storageKey, currentSessionId, messages, loadSession]);

    const loadSessionMutation = { isLoading: isLoadingSession, mutate: loadSession };
    const deleteSessionMutation = {
        mutate: async ({ sessionId }: { sessionId: string }) => {
            try {
                await deleteSession({ sessionId });
                if (activeUserId.current !== userId) return;
                let storedId: string | null = null;
                try { storedId = storageKey ? localStorage.getItem(storageKey) : null; } catch { /* Optional persistence. */ }
                if (sessionId === currentSessionId || sessionId === storedId) handleNewChat();
                void utils.ai.listSessions.invalidate();
                toast.success('Chat deleted');
            } catch { toast.error('Could not delete chat. Please try again.'); }
        },
    };

    const appendModelTrace = (event: ChatTraceEvent) => {
        setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];

            if (!last || last.role !== 'model') {
                next.push({ role: 'model', text: '', trace: [event] });
                return next;
            }

            next[next.length - 1] = {
                ...last,
                trace: [...(last.trace || []), event],
            };
            return next;
        });
    };

    const appendModelText = (delta: string) => {
        setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];

            if (!last || last.role !== 'model') {
                next.push({ role: 'model', text: delta, trace: [] });
                return next;
            }

            next[next.length - 1] = {
                ...last,
                text: `${last.text}${delta}`,
            };
            return next;
        });
    };

    const setFinalModelMessage = (response: string | undefined, clientAction: ChatClientAction | null | undefined) => {
        setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            const text = typeof response === 'string' && response.trim().length > 0 ? response : last?.text || '';

            if (!last || last.role !== 'model') {
                next.push({ role: 'model', text, trace: [], clientAction });
                return next;
            }

            next[next.length - 1] = {
                ...last,
                text: last.text.trim().length > 0 ? last.text : text,
                clientAction: clientAction || last.clientAction,
            };
            return next;
        });
    };

    const streamChat = async (message: string, attachments: ChatAttachment[] = []) => {
        const version = ++sessionVersion.current;
        const isCurrent = () => activeUserId.current === userId && sessionVersion.current === version;
        setIsStreaming(true);
        setMessages(prev => [...prev, { role: 'model', text: '', trace: [] }]);
        const requestAttachments = attachments.map(({ name, mimeType, dataUrl, qrText }) => ({
            name,
            mimeType,
            dataUrl,
            qrText,
        }));

        try {
            const token = await window.Clerk?.session?.getToken();
            if (!isCurrent()) return;
            const response = await fetch('/ai/chat/stream', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message,
                    sessionId: currentSessionId,
                    attachments: requestAttachments,
                    settings: {
                        allowAutonomousTransactions: settings.allowAutonomousTransactions,
                    },
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`Chat stream failed: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (!isCurrent()) { await reader.cancel(); return; }
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const rawEvent of events) {
                    const line = rawEvent.split('\n').find(part => part.startsWith('data: '));
                    if (!line) continue;

                    const event = JSON.parse(line.slice(6));

                    if (event.type === 'session') {
                        if (event.sessionId && !currentSessionId) {
                            setCurrentSessionId(event.sessionId);
                            utils.ai.listSessions.invalidate();
                        }
                    } else if (event.type === 'generation_start') {
                        appendModelTrace({ type: 'generation', status: 'started', turn: event.turn });
                    } else if (event.type === 'generation_model') {
                        appendModelTrace({
                            type: 'generation',
                            status: 'completed',
                            turn: event.turn,
                            provider: event.provider,
                            model: event.model,
                        });
                    } else if (event.type === 'provider_failure') {
                        appendModelTrace({
                            type: 'provider_failure',
                            turn: event.turn,
                            provider: event.provider,
                            model: event.model,
                            error: event.error,
                            willRetry: event.willRetry,
                            nextProvider: event.nextProvider,
                        });
                    } else if (event.type === 'tool_call') {
                        appendModelTrace({
                            type: 'tool_call',
                            name: event.name,
                            args: event.args,
                            turn: event.turn,
                        });
                    } else if (event.type === 'tool_result') {
                        appendModelTrace({
                            type: 'tool_result',
                            name: event.name,
                            success: event.success,
                            turn: event.turn,
                        });
                    } else if (event.type === 'text_delta') {
                        appendModelText(event.delta);
                    } else if (event.type === 'final') {
                        if (event.sessionId && !currentSessionId) {
                            setCurrentSessionId(event.sessionId);
                            utils.ai.listSessions.invalidate();
                        }
                        setFinalModelMessage(event.response, event.clientAction);
                        utils.ai.getChatUsage.invalidate();
                    } else if (event.type === 'error') {
                        appendModelText(event.message || CHAT_ERROR_MESSAGE);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            if (isCurrent()) appendModelText(CHAT_ERROR_MESSAGE);
        } finally {
            if (isCurrent()) setIsStreaming(false);
        }
    };

    const chatMutation = { isLoading: isStreaming || isLoadingSession };

    const handleSend = (inputValue: string, attachments: ChatAttachment[] = []) => {
        if (!inputValue.trim() || chatMutation.isLoading || !userId) return;

        const newMsg: Message = { role: 'user', text: inputValue, attachments };
        setMessages(prev => [...prev, newMsg]);
        setHasSentMessage(true);
        streamChat(inputValue, attachments);
        posthog.capture('ai_message_sent', { session_id: currentSessionId, message_length: inputValue.length, attachment_count: attachments.length });
    };

    const handleNewChat = () => {
        sessionVersion.current++;
        setIsStreaming(false);
        setMessages([{ role: 'model', text: 'Hi! I\'m Woo. Ask me anything about your finances!' }]);
        setHasSentMessage(false);
        setCurrentSessionId(null);
    };

    return { messages, currentSessionId, handleSend, handleNewChat, chatMutation, loadSessionMutation, deleteSessionMutation, hasSentMessage, setHasSentMessage };
}

function useResizablePanel(initialSize = { w: 380, h: 600 }) {
    const [size, setSize] = useState(initialSize);
    const resizeStart = useRef({ x: 0, y: 0, w: initialSize.w, h: initialSize.h });

    const startResize = (edge: 'left' | 'top' | 'topLeft') => (event: React.PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const start = {
            x: event.clientX,
            y: event.clientY,
            w: size.w,
            h: size.h,
        };
        resizeStart.current = start;
        document.body.style.cursor = edge === 'top' ? 'ns-resize' : edge === 'left' ? 'ew-resize' : 'nwse-resize';
        document.body.style.userSelect = 'none';

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - start.x;
            const dy = moveEvent.clientY - start.y;
            const maxHeight = Math.floor(window.innerHeight * 0.9);

            setSize({
                w: Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, edge === 'left' || edge === 'topLeft' ? start.w - dx : start.w)),
                h: Math.max(MIN_CHAT_HEIGHT, Math.min(maxHeight, edge === 'top' || edge === 'topLeft' ? start.h - dy : start.h)),
            });
        };

        const stopResize = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', stopResize);
            window.removeEventListener('pointercancel', stopResize);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', stopResize);
        window.addEventListener('pointercancel', stopResize);
    };

    return { size, startResize };
}

function ResizeHandles({ startResize, className }: { startResize: ReturnType<typeof useResizablePanel>['startResize']; className?: string }) {
    return (
        <div className={cn('hidden md:block', className)}>
            <button
                type="button"
                aria-label="Resize chat vertically"
                className="absolute left-6 right-6 top-0 z-50 h-2 cursor-ns-resize"
                onPointerDown={startResize('top')}
            >
                <span className="absolute left-1/2 top-0 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/20 transition-colors hover:bg-muted-foreground/40" />
            </button>
            <button
                type="button"
                aria-label="Resize chat horizontally"
                className="absolute bottom-6 left-0 top-6 z-50 w-2 cursor-ew-resize"
                onPointerDown={startResize('left')}
            >
                <span className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-muted-foreground/20 transition-colors hover:bg-muted-foreground/40" />
            </button>
            <button
                type="button"
                aria-label="Resize chat"
                className="absolute left-0 top-0 z-50 h-5 w-5 cursor-nwse-resize"
                onPointerDown={startResize('topLeft')}
            />
        </div>
    );
}

export function AiChatSidebarItem() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'chat' | 'history'>('chat');
    const [inputValue, setInputValue] = useState('');
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatSettings, setChatSettings] = useState<ChatSettings>(() => loadChatSettings());
    const [transactionDraft, setTransactionDraft] = useState<Extract<ChatClientAction, { type: 'prefill_transaction' }>['transaction'] | null>(null);
    const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [sidebarPressed, setSidebarPressed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { size, startResize } = useResizablePanel();

    const { isAngry, setIsAngry } = useAngryState(isOpen, false);
    const { messages, currentSessionId, handleSend, handleNewChat, chatMutation, loadSessionMutation, deleteSessionMutation } = useChatLogic(chatSettings, isOpen);

    // Queries
    const { data: usage } = trpc.ai.getChatUsage.useQuery(undefined, { enabled: isOpen });
    const { data: sessions, isLoading: isHistoryLoading } = trpc.ai.listSessions.useQuery(undefined, { enabled: isOpen && view === 'history' });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, view]);

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hasProcessingAttachments(attachments)) {
            toast.info('Still loading the PDF. Send after it finishes.');
            return;
        }
        handleSend(inputValue, attachments);
        setInputValue('');
        setAttachments([]);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        const remainingSlots = Math.max(0, MAX_CHAT_ATTACHMENTS - attachments.length);
        const supportedFiles = files.filter(isSupportedReceiptFile).slice(0, remainingSlots);

        if (supportedFiles.length !== files.length) {
            toast.error(`Receipt upload supports images and PDFs up to 6 MB, max ${MAX_CHAT_ATTACHMENTS} attachments.`);
        }

        const pendingAttachments = supportedFiles.map(createProcessingAttachment);
        setAttachments(prev => [...prev, ...pendingAttachments].slice(0, MAX_CHAT_ATTACHMENTS));

        await Promise.all(pendingAttachments.map(async (pendingAttachment, index) => {
            try {
                const readyAttachments = await fileToChatAttachments(supportedFiles[index]);
                setAttachments(prev => {
                    const pendingIndex = prev.findIndex(item => item.id === pendingAttachment.id);
                    if (pendingIndex === -1) return prev;
                    const next = [...prev];
                    next.splice(pendingIndex, 1, ...readyAttachments);
                    return next.slice(0, MAX_CHAT_ATTACHMENTS);
                });
            } catch (error) {
                console.error(error);
                setAttachments(prev => prev.filter(item => item.id !== pendingAttachment.id));
                toast.error('Failed to read attachment');
            }
        }));
    };

    const handleAddTransactionAction = (action: Extract<ChatClientAction, { type: 'prefill_transaction' }>) => {
        setTransactionDraft(action.transaction);
        setIsTransactionSheetOpen(true);
    };

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size="lg"
                        onClick={() => setIsOpen(true)}
                        onMouseEnter={() => setSidebarHovered(true)}
                        onMouseLeave={() => { setSidebarHovered(false); setSidebarPressed(false); }}
                        onMouseDown={() => setSidebarPressed(true)}
                        onMouseUp={() => { setSidebarPressed(false); setIsOpen(true); }}
                        className="group relative h-auto py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-200 border-none flex items-center gap-3 w-full bg-transparent hover:bg-transparent text-white"
                    >
                        <motion.div
                            layoutId="ai-chat-container"
                            className={cn("absolute inset-0 rounded-2xl z-0", !isOpen ? "bg-purple-500" : "bg-transparent")}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <div className="flex-shrink-0 relative z-10">
                            <motion.div
                                layoutId="woo-wallet-icon-box"
                                className="flex items-center justify-center"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <MomoIcon
                                    size={35}
                                    className={cn(!isOpen ? "text-white" : "text-transparent")}
                                    isHovered={sidebarHovered}
                                    isPressed={sidebarPressed}
                                    isAngry={isAngry}
                                />
                            </motion.div>
                        </div>
                        <div className={cn("flex-1 text-left leading-tight transition-opacity duration-200 z-10", isOpen ? "opacity-0" : "opacity-100")}>
                            <span className="text-xl font-bold tracking-tight text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-200">Woo</span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-y-0 left-0 z-[46] flex items-end p-4 pointer-events-none">
                            <div className="pointer-events-auto">
                                <motion.div
                                    layoutId="ai-chat-container"
                                    className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-3xl overflow-visible shadow-2xl border border-purple-200 dark:border-purple-800 flex flex-col relative"
                                    style={{ width: size.w, height: size.h, maxHeight: '85vh' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    <ResizeHandles startResize={startResize} />
                                    <div className="flex-1 flex flex-col overflow-hidden rounded-3xl">
                                        <CardHeader className="p-3 border-b bg-purple-50/50 dark:bg-purple-900/20 flex flex-row items-center justify-between space-y-0">
                                            <div className="flex items-center gap-2">
                                                <MomoIconWrapper
                                                    layoutId="woo-wallet-icon-box"
                                                    height="h-6"
                                                    width="w-6"
                                                    iconClassName="h-4 w-4"
                                                />
                                                <div className="flex flex-col">
                                                    <CardTitle className="text-sm font-medium leading-none">
                                                        {usage?.tierTitle || 'Woo'}
                                                    </CardTitle>
                                                    {usage && (
                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                            {usage.remaining} / {usage.limit || usage.lifetimeLimit} {usage.limit > 0 ? 'left today' : 'questions left'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {view === 'chat' ? (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setView('history')} title="History">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setView('chat')} title="Back to Chat">
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewChat} title="New Chat">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSettingsOpen(true)} title="Settings">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                                            {view === 'chat' ? (
                                                <div className="absolute inset-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                                    {loadSessionMutation.isLoading ? (
                                                        <div className="space-y-4">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex justify-end">
                                                                        <Skeleton className="h-10 w-2/3 rounded-lg" />
                                                                    </div>
                                                                    <div className="flex justify-start">
                                                                        <Skeleton className="h-20 w-3/4 rounded-lg" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {messages.map((m, i) => (
                                                                <div key={i} className={cn(
                                                                    "flex w-full",
                                                                    m.role === 'user' ? "justify-end" : "justify-start"
                                                                )}>
                                                                    <div className={cn(
                                                                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                                                        m.role === 'user'
                                                                            ? "bg-purple-600 text-white"
                                                                            : "bg-muted text-foreground"
                                                                    )}>
                                                                        {m.role === 'model' && <ChatTrace trace={m.trace} />}
                                                                        {typeof m.text === 'string' && m.text.trim().length > 0 && (
                                                                            <MarkdownMessage text={m.text} />
                                                                        )}
                                                                        {m.role === 'user' && <SentAttachmentStrip attachments={m.attachments} />}
                                                                        {isPendingModelMessage(m, i, messages, chatMutation.isLoading) && (
                                                                            <span className="text-muted-foreground animate-pulse">Processing</span>
                                                                        )}
                                                                        <ChatActionCard action={m.clientAction} onAddTransaction={handleAddTransactionAction} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 overflow-y-auto">
                                                    <div className="p-2 space-y-2">
                                                        <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase">Recent Chats</h3>
                                                        {isHistoryLoading ? (
                                                            <div className="space-y-3">
                                                                {[1, 2, 3, 4, 5].map((i) => (
                                                                    <div key={i} className="flex flex-col space-y-2 p-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <Skeleton className="h-4 w-32" />
                                                                            <Skeleton className="h-3 w-16" />
                                                                        </div>
                                                                        <Skeleton className="h-3 w-48" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {sessions?.length === 0 && (
                                                                    <p className="text-sm text-center text-muted-foreground py-8">No chat history yet.</p>
                                                                )}
                                                                {sessions?.map((session: any) => (
                                                                    <div
                                                                        key={session.id}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group",
                                                                            currentSessionId === session.id ? "bg-muted" : ""
                                                                        )}
                                                                        onClick={() => {
                                                                            setView('chat');
                                                                            loadSessionMutation.mutate({ sessionId: session.id });
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col overflow-hidden">
                                                                            <span className="text-sm font-medium truncate">{session.title}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {new Date(session.updatedAt).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                deleteSessionMutation.mutate({ sessionId: session.id });
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex-col items-stretch p-3 border-t bg-background">
                                            {view === 'chat' && (
                                                <AttachmentPreviewTray
                                                    attachments={attachments}
                                                    onPreview={setPreviewAttachment}
                                                    onRemove={(id) => setAttachments(prev => prev.filter(item => item.id !== id))}
                                                />
                                            )}
                                            {view === 'chat' && (
                                                <form
                                                    className="flex w-full items-center space-x-2 pointer-events-auto"
                                                    onSubmit={handleInputSubmit}
                                                >
                                                    <Label htmlFor="ai-chat-input" className="sr-only">Ask about your spending</Label>
                                                    <Input
                                                        ref={inputRef}
                                                        autoFocus
                                                        id="ai-chat-input"
                                                        name="ai-chat-input"
                                                        placeholder="Ask about your spending..."
                                                        value={inputValue}
                                                        onChange={e => setInputValue(e.target.value)}
                                                        className="flex-1 h-9 pointer-events-auto"
                                                    />
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 pointer-events-auto"
                                                        disabled={chatMutation.isLoading}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        title="Upload receipt image"
                                                    >
                                                        {attachments.length ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        size="icon"
                                                        className="h-9 w-9 pointer-events-auto"
                                                        disabled={chatMutation.isLoading || hasProcessingAttachments(attachments) || (usage?.remaining === 0 && !chatMutation.isLoading)}
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </CardFooter>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
            <AddTransactionSheet
                open={isTransactionSheetOpen}
                onOpenChange={(open) => {
                    setIsTransactionSheetOpen(open);
                    if (!open) setTransactionDraft(null);
                }}
                trigger={null}
                preselectedType={transactionDraft?.type}
                preselectedCurrencyBalanceId={transactionDraft?.currencyBalanceId}
                preselectedCategoryId={transactionDraft?.categoryId}
                preselectedAmount={transactionDraft?.amount}
                preselectedDescription={transactionDraft?.description}
                preselectedDate={transactionDraft?.date}
                preselectedCurrencyCode={transactionDraft?.currencyCode}
            />
            <AttachmentPreviewDialog attachment={previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)} />
            <ChatSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                settings={chatSettings}
                onSettingsChange={setChatSettings}
            />
        </>
    );
}

export function AiChatFloatingItem({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'chat' | 'history'>('chat');
    const [inputValue, setInputValue] = useState('');
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatSettings, setChatSettings] = useState<ChatSettings>(() => loadChatSettings());
    const [transactionDraft, setTransactionDraft] = useState<Extract<ChatClientAction, { type: 'prefill_transaction' }>['transaction'] | null>(null);
    const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [sidebarPressed, setSidebarPressed] = useState(false);
    const [hasSentMessage, setHasSentMessage] = useState(false);
    const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isCompactMobile = useIsMobile(470);
    const isSmallScreen = useIsMobile(768);
    const useMobilePanel = variant === 'mobile' || isSmallScreen;
    const { size, startResize } = useResizablePanel();

    const { isAngry, setIsAngry } = useAngryState(isOpen, hasSentMessage);
    const { messages, handleSend, handleNewChat, chatMutation, loadSessionMutation, deleteSessionMutation, setHasSentMessage: setMsgSent } = useChatLogic(chatSettings, isOpen);



    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-woo-chat', handleOpen);
        return () => window.removeEventListener('open-woo-chat', handleOpen);
    }, []);

    useEffect(() => {
        if (isOpen && view === 'chat' && !useMobilePanel) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, useMobilePanel, view]);

    useEffect(() => {
        if (!isOpen || !useMobilePanel) return;

        const updateHeight = () => {
            const nextHeight = window.visualViewport?.height ?? window.innerHeight;
            setMobileViewportHeight(Math.floor(nextHeight));
        };

        updateHeight();

        const viewport = window.visualViewport;
        viewport?.addEventListener('resize', updateHeight);
        viewport?.addEventListener('scroll', updateHeight);
        window.addEventListener('resize', updateHeight);

        const previousBodyOverflow = document.body.style.overflow;
        const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        return () => {
            viewport?.removeEventListener('resize', updateHeight);
            viewport?.removeEventListener('scroll', updateHeight);
            window.removeEventListener('resize', updateHeight);
            document.body.style.overflow = previousBodyOverflow;
            document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
        };
    }, [isOpen, useMobilePanel]);

    // Queries
    const { data: usage } = trpc.ai.getChatUsage.useQuery(undefined, { enabled: isOpen });
    const { data: sessions, isLoading: isHistoryLoading } = trpc.ai.listSessions.useQuery(undefined, { enabled: isOpen && view === 'history' });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, view]);

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        if (hasProcessingAttachments(attachments)) {
            toast.info('Still loading the PDF. Send after it finishes.');
            return;
        }

        const message = inputValue;
        setInputValue('');
        const selectedAttachments = attachments;
        setAttachments([]);
        setHasSentMessage(true);
        setMsgSent(true);
        handleSend(message, selectedAttachments);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        const remainingSlots = Math.max(0, MAX_CHAT_ATTACHMENTS - attachments.length);
        const supportedFiles = files.filter(isSupportedReceiptFile).slice(0, remainingSlots);

        if (supportedFiles.length !== files.length) {
            toast.error(`Receipt upload supports images and PDFs up to 6 MB, max ${MAX_CHAT_ATTACHMENTS} attachments.`);
        }

        const pendingAttachments = supportedFiles.map(createProcessingAttachment);
        setAttachments(prev => [...prev, ...pendingAttachments].slice(0, MAX_CHAT_ATTACHMENTS));

        await Promise.all(pendingAttachments.map(async (pendingAttachment, index) => {
            try {
                const readyAttachments = await fileToChatAttachments(supportedFiles[index]);
                setAttachments(prev => {
                    const pendingIndex = prev.findIndex(item => item.id === pendingAttachment.id);
                    if (pendingIndex === -1) return prev;
                    const next = [...prev];
                    next.splice(pendingIndex, 1, ...readyAttachments);
                    return next.slice(0, MAX_CHAT_ATTACHMENTS);
                });
            } catch (error) {
                console.error(error);
                setAttachments(prev => prev.filter(item => item.id !== pendingAttachment.id));
                toast.error('Failed to read attachment');
            }
        }));
    };

    const handleAddTransactionAction = (action: Extract<ChatClientAction, { type: 'prefill_transaction' }>) => {
        setTransactionDraft(action.transaction);
        setIsTransactionSheetOpen(true);
    };

    const mobilePanelHeight = mobileViewportHeight
        ? `${Math.max(280, mobileViewportHeight - 16)}px`
        : 'calc(100dvh - 1rem)';

    return (
        <>
            <div
                className={cn(
                    "fixed z-[45] flex right-4 bottom-4 min-[850px]:right-6 min-[850px]:bottom-6",
                    isCompactMobile && "hidden",
                    "pointer-events-auto items-center justify-center"
                )}
            >
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={() => setSidebarHovered(true)}
                    onMouseLeave={() => { setSidebarHovered(false); setSidebarPressed(false); }}
                    onMouseDown={() => setSidebarPressed(true)}
                    onMouseUp={() => { setSidebarPressed(false); setIsOpen(true); }}
                    className="relative h-14 w-14 rounded-2xl shadow-lg cursor-pointer transition-all duration-500 flex items-center justify-center pointer-events-auto overflow-hidden bg-transparent hover:bg-transparent"
                    aria-label="Open Woo AI chat"
                    aria-expanded={isOpen}
                >
                    <motion.div
                        layoutId="ai-chat-container"
                        className={cn("absolute inset-0 rounded-2xl z-0", !isOpen ? "bg-purple-500" : "bg-transparent")}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <div className="relative z-10">
                        <motion.div
                            layoutId="woo-wallet-icon-box"
                            className="flex items-center justify-center"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <MomoIcon
                                size={35}
                                className={cn(!isOpen ? "text-white" : "text-transparent")}
                                isHovered={sidebarHovered}
                                isPressed={sidebarPressed}
                                isAngry={isAngry}
                            />
                        </motion.div>
                    </div>
                </button>
            </div>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            className={cn(
                                "fixed inset-0 right-0 z-[46] flex items-end justify-end p-2 md:p-4 w-full h-full",
                                useMobilePanel ? "pointer-events-auto bg-black/35 backdrop-blur-[2px]" : "pointer-events-none"
                            )}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => useMobilePanel && setIsOpen(false)}
                        >
                            <div className="pointer-events-auto flex h-auto w-full items-end justify-center md:w-auto md:justify-end" onClick={(event) => event.stopPropagation()}>
                                <motion.div
                                    layoutId="ai-chat-container"
                                    role="dialog"
                                    aria-modal={useMobilePanel}
                                    aria-label="Woo AI chat"
                                    className="relative flex w-full flex-col overflow-visible rounded-2xl border border-purple-300/70 bg-background/95 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 md:rounded-3xl dark:border-purple-700/70"
                                    style={useMobilePanel
                                        ? { height: mobilePanelHeight, maxHeight: mobilePanelHeight }
                                        : { width: size.w, height: size.h, maxHeight: '90vh' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    {!useMobilePanel && <ResizeHandles startResize={startResize} />}
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl md:rounded-3xl">
                                        <CardHeader className="min-h-14 px-3 py-2 md:p-3 border-b bg-purple-50/70 dark:bg-purple-950/35 flex flex-row items-center justify-between space-y-0 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <MomoIconWrapper
                                                    layoutId="woo-wallet-icon-box"
                                                    height="h-6"
                                                    width="w-6"
                                                    iconClassName="h-4 w-4"
                                                />
                                                <div className="flex flex-col">
                                                    <CardTitle className="text-sm font-medium leading-none">
                                                        {usage?.tierTitle || 'Woo'}
                                                    </CardTitle>
                                                    {usage && (
                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                            {usage.remaining} / {usage.limit || usage.lifetimeLimit} {usage.limit > 0 ? 'left today' : 'questions left'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                {view === 'chat' ? (
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={() => setView('history')} title="History" aria-label="Chat history">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={() => setView('chat')} title="Back to Chat" aria-label="Back to chat">
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={handleNewChat} title="New Chat" aria-label="Start a new chat">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={() => setIsSettingsOpen(true)} title="Settings" aria-label="Chat settings">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={() => setIsOpen(false)} aria-label="Close chat">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden relative">
                                            {/* Chat View */}
                                            {view === 'chat' ? (
                                                <div className="absolute inset-0 overflow-y-auto overscroll-contain px-3 py-4 md:p-4 space-y-4 scroll-pb-4" ref={scrollRef}>
                                                    {loadSessionMutation.isLoading ? (
                                                        <div className="space-y-4">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex justify-end"><Skeleton className="h-10 w-2/3 rounded-lg" /></div>
                                                                    <div className="flex justify-start"><Skeleton className="h-20 w-3/4 rounded-lg" /></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {messages.map((m, i) => (
                                                                <div key={i} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                                                                    <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", m.role === 'user' ? "bg-purple-600 text-white" : "bg-muted text-foreground")}>
                                                                        {m.role === 'model' && <ChatTrace trace={m.trace} />}
                                                                        {typeof m.text === 'string' && m.text.trim().length > 0 && (
                                                                            <MarkdownMessage text={m.text} />
                                                                        )}
                                                                        {m.role === 'user' && <SentAttachmentStrip attachments={m.attachments} />}
                                                                        {isPendingModelMessage(m, i, messages, chatMutation.isLoading) && (
                                                                            <span className="text-muted-foreground animate-pulse">Processing</span>
                                                                        )}
                                                                        <ChatActionCard action={m.clientAction} onAddTransaction={handleAddTransactionAction} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                /* History View */
                                                <div className="absolute inset-0 overflow-y-auto overscroll-contain">
                                                    <div className="p-2 space-y-2">
                                                        <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase">Recent Chats</h3>
                                                        {isHistoryLoading ? (
                                                            <div className="space-y-3">
                                                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {sessions?.map((session: any) => (
                                                                    <div key={session.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer group" onClick={() => { loadSessionMutation.mutate({ sessionId: session.id }); setView('chat'); }}>
                                                                        <div className="flex-1 min-w-0 mr-2">
                                                                            <p className="text-sm font-medium truncate">{session.title}</p>
                                                                            <p className="text-xs text-muted-foreground">{new Date(session.updatedAt).toLocaleDateString()}</p>
                                                                        </div>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); if (confirm('Delete chat?')) deleteSessionMutation.mutate({ sessionId: session.id }); }}>
                                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                {sessions?.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No recent chats</div>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex-col items-stretch border-t bg-background/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur-xl shrink-0 md:p-3">
                                            {view === 'chat' && (
                                                <AttachmentPreviewTray
                                                    attachments={attachments}
                                                    onPreview={setPreviewAttachment}
                                                    onRemove={(id) => setAttachments(prev => prev.filter(item => item.id !== id))}
                                                />
                                            )}
                                            {view === 'chat' && (
                                                <form
                                                    className="flex w-full items-center gap-1.5 rounded-2xl border border-border/80 bg-muted/55 p-1.5 shadow-sm pointer-events-auto focus-within:border-purple-400/70 focus-within:ring-2 focus-within:ring-purple-500/15"
                                                    onSubmit={handleInputSubmit}
                                                >
                                                    <Label htmlFor="ai-chat-input-mobile" className="sr-only">Ask about your spending</Label>
                                                    <Input
                                                        ref={inputRef}
                                                        id="ai-chat-input-mobile"
                                                        name="ai-chat-input-mobile"
                                                        placeholder="Ask about your spending..."
                                                        value={inputValue}
                                                        onChange={e => setInputValue(e.target.value)}
                                                        className="flex-1 h-10 border-0 bg-transparent px-2 text-base shadow-none pointer-events-auto focus-visible:ring-0 md:h-9 md:text-sm"
                                                    />
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground pointer-events-auto md:h-9 md:w-9"
                                                        disabled={chatMutation.isLoading}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        title="Upload receipt image"
                                                        aria-label="Upload receipt image"
                                                    >
                                                        {attachments.length ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                                                    </Button>
                                                    <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-purple-600 text-white shadow-sm hover:bg-purple-500 pointer-events-auto md:h-9 md:w-9" disabled={!inputValue.trim() || chatMutation.isLoading || hasProcessingAttachments(attachments) || (usage?.remaining === 0 && !chatMutation.isLoading)} aria-label="Send message">
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </CardFooter>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
            <AddTransactionSheet
                open={isTransactionSheetOpen}
                onOpenChange={(open) => {
                    setIsTransactionSheetOpen(open);
                    if (!open) setTransactionDraft(null);
                }}
                trigger={null}
                preselectedType={transactionDraft?.type}
                preselectedCurrencyBalanceId={transactionDraft?.currencyBalanceId}
                preselectedCategoryId={transactionDraft?.categoryId}
                preselectedAmount={transactionDraft?.amount}
                preselectedDescription={transactionDraft?.description}
                preselectedDate={transactionDraft?.date}
                preselectedCurrencyCode={transactionDraft?.currencyCode}
            />
            <AttachmentPreviewDialog attachment={previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)} />
            <ChatSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                settings={chatSettings}
                onSettingsChange={setChatSettings}
            />
        </>
    );
}
