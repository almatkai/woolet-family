import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import posthog from 'posthog-js';
import { toast } from 'sonner';
import { ArrowUp, CalendarClock, ChevronRight, Clock3, Landmark, PieChart, Plus, Trash2, Wallet, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Momo, type MomoMood } from '@/components/ai/Momo';
import { GlassEdge, tint } from '@/components/ui/glass';

type Message = { id: string; role: 'user' | 'model'; text: string; pending?: boolean };

const QUICK_PROMPTS = [
    { prompt: 'Where did I spend the most this month?', icon: PieChart, color: '#8B5CF6' },
    { prompt: 'What payments are coming up?', icon: CalendarClock, color: '#0284C7' },
    { prompt: 'Give me a breakdown of my net worth.', icon: Wallet, color: '#059669' },
    { prompt: 'How are my credits and mortgages doing?', icon: Landmark, color: '#E11D48' },
];

// Full-page Woo assistant, mirroring the mobile-v2 Woo tab
export function WooPage() {
    const utils = trpc.useUtils();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [mood, setMood] = useState<MomoMood>('idle');
    const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const sequence = useRef(0);

    const { data: usage } = trpc.ai.getChatUsage.useQuery();
    const { data: sessions } = trpc.ai.listSessions.useQuery(undefined, { enabled: showHistory });

    const chat = trpc.ai.chat.useMutation({
        onSuccess: (data: any) => {
            setMessages((current) => [
                ...current.filter((message) => !message.pending),
                { id: `m-${++sequence.current}`, role: 'model', text: String(data.response || '').trimStart() },
            ]);
            if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
                utils.ai.listSessions.invalidate();
            }
            utils.ai.getChatUsage.invalidate();
            showMood('happy', 1600);
        },
        onError: (error: any) => {
            setMessages((current) => [
                ...current.filter((message) => !message.pending),
                { id: `m-${++sequence.current}`, role: 'model', text: error.message || 'Sorry, something went wrong. Try again!' },
            ]);
        },
    });

    const loadSession = trpc.ai.getSession.useMutation({
        onSuccess: (session: any) => {
            setSessionId(session.id);
            setMessages((session.messages || []).map((message: any) => ({
                id: message.id,
                role: message.role,
                text: message.role === 'model' ? String(message.content).trimStart() : message.content,
            })));
            setShowHistory(false);
        },
        onError: (error: any) => toast.error(error.message || 'Could not load conversation'),
    });

    const deleteSession = trpc.ai.deleteSession.useMutation({
        onSuccess: (_: unknown, variables: { sessionId: string }) => {
            utils.ai.listSessions.invalidate();
            if (variables.sessionId === sessionId) startNew();
        },
        onError: (error: any) => toast.error(error.message || 'Could not delete conversation'),
    });

    useEffect(() => () => {
        if (moodTimer.current) clearTimeout(moodTimer.current);
    }, []);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const showMood = (next: MomoMood, duration: number) => {
        if (moodTimer.current) clearTimeout(moodTimer.current);
        setMood(next);
        moodTimer.current = setTimeout(() => setMood('idle'), duration);
    };

    // Momo watches the composer: reads along while typing, side-eyes deletions, gets cross when a long draft is wiped
    const changeInput = (next: string) => {
        if (next.length > input.length) showMood('typing', 1400);
        else if (!next.trim() && input.trim().length >= 8) showMood('angry', 2000);
        else if (next.length < input.length) showMood('erasing', 1100);
        setInput(next);
    };

    const startNew = () => {
        setSessionId(null);
        setMessages([]);
        setInput('');
        setShowHistory(false);
    };

    const send = (value: string) => {
        const text = value.trim();
        if (!text || chat.isLoading || isOutOfQuestions) return;
        setMessages((current) => [
            ...current,
            { id: `m-${++sequence.current}`, role: 'user', text },
            { id: `m-${++sequence.current}`, role: 'model', text: '', pending: true },
        ]);
        setInput('');
        chat.mutate({ message: text, sessionId });
        posthog.capture('ai_message_sent', { session_id: sessionId, message_length: text.length, surface: 'woo_page' });
        inputRef.current?.focus();
    };

    const usageInfo = usage as { remaining?: number; limit?: number; lifetimeLimit?: number } | undefined;
    const isOutOfQuestions = usageInfo?.remaining === 0;
    const showPrompts = !input && mood !== 'angry';
    const lastLine = input.split('\n').pop() || '';
    const gaze = ((lastLine.length % 34) / 34) * 2 - 1;

    return (
        <div className="relative mx-auto flex h-full max-w-3xl flex-col">
            {/* Floating controls: history on the left, new chat on the right (like the mobile Woo tab) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setShowHistory((open) => !open)}
                    aria-label="History"
                    className={cn(
                        'pointer-events-auto flex size-10 items-center justify-center rounded-[13px] border shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors',
                        showHistory ? 'border-primary/40 bg-primary/10 text-primary dark:bg-primary/25 dark:text-violet-200' : 'border-border bg-card/90 dark:border-white/10 dark:bg-[#16161d]/70 text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Clock3 className="size-[18px]" />
                </button>
                <button
                    type="button"
                    onClick={startNew}
                    aria-label="New chat"
                    className="pointer-events-auto flex size-10 items-center justify-center rounded-[13px] border border-border bg-card/90 dark:border-white/10 dark:bg-[#16161d]/70 text-muted-foreground shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:text-foreground"
                >
                    <Plus className="size-[18px]" />
                </button>
            </div>

            {/* History drawer */}
            {showHistory && (
                <div className="absolute left-0 top-12 z-30 w-[min(320px,100%)] overflow-hidden rounded-[22px] border border-border bg-popover/95 shadow-lg dark:border-white/10 dark:bg-[#121218]/90 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                    <GlassEdge />
                    <div className="flex items-center justify-between px-4 pb-2 pt-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Recent chats</p>
                        <button type="button" onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close history">
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto px-2 pb-2">
                        {!sessions || (sessions as any[]).length === 0 ? (
                            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet</p>
                        ) : (sessions as any[]).map((session) => (
                            <div key={session.id} className="group flex items-center gap-2 rounded-2xl px-2 hover:bg-white/[0.05]">
                                <button
                                    type="button"
                                    onClick={() => loadSession.mutate({ sessionId: session.id })}
                                    className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">{session.title || 'Conversation'}</span>
                                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                                            {new Date(session.updatedAt || session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </span>
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteSession.mutate({ sessionId: session.id })}
                                    aria-label="Delete conversation"
                                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 max-md:opacity-100"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Conversation */}
            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
                {messages.length === 0 ? (
                    <div className="flex min-h-full flex-col gap-5 pb-1 pt-12 text-center">
                        {/* Greeting fills the space above the prompts, so it stays centred whether or not they are visible */}
                        <div className="flex flex-1 flex-col items-center justify-center gap-5">
                            <div className="relative">
                                <div className="absolute inset-0 -z-10 rounded-full bg-violet-500/30 blur-3xl" />
                                <span className="flex size-24 items-center justify-center overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_18px_45px_rgba(139,92,246,0.4)]">
                                    <Momo size={58} mood={mood} gaze={gaze} drowsy />
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Hi, I'm Woo</h2>
                        </div>

                        {/* Prompts keep their space and only slide down / fade, so nothing above them jumps */}
                        <motion.div
                            initial={false}
                            animate={showPrompts ? 'shown' : 'hidden'}
                            variants={{
                                shown: { transition: { staggerChildren: 0.04 } },
                                hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                            }}
                            className={cn('grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2', !showPrompts && 'pointer-events-none')}
                            aria-hidden={!showPrompts}
                        >
                            {QUICK_PROMPTS.map(({ prompt, icon: Icon, color }) => (
                                <motion.button
                                    key={prompt}
                                    type="button"
                                    tabIndex={showPrompts ? 0 : -1}
                                    onClick={() => send(prompt)}
                                    variants={{
                                        shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 32 } },
                                        hidden: { opacity: 0, y: 28, transition: { duration: 0.18, ease: 'easeIn' } },
                                    }}
                                    className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/95 p-3 text-left backdrop-blur-xl transition-colors hover:bg-accent dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08] active:scale-[0.99]"
                                >
                                    <span
                                        className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
                                        style={{ color, backgroundColor: tint(color, 0.13), borderColor: tint(color, 0.28) }}
                                    >
                                        <Icon className="size-[18px]" />
                                    </span>
                                    <span className="text-[13px] font-semibold leading-snug">{prompt}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    </div>
                ) : (
                    <div className="space-y-3 pt-14">
                        {messages.map((message) => message.role === 'user' ? (
                            <div key={message.id} className="flex justify-end">
                                <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-sm text-white shadow-[0_8px_20px_rgba(139,92,246,0.25)]">
                                    {message.text}
                                </div>
                            </div>
                        ) : (
                            <div key={message.id} className="flex items-end gap-2">
                                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-primary">
                                    <Momo size={17} mood={message.pending ? 'typing' : 'idle'} />
                                </span>
                                <div className="relative max-w-[85%] overflow-hidden rounded-[20px] rounded-bl-md border border-white/10 bg-white/[0.055] px-4 py-2.5 text-sm backdrop-blur-xl">
                                    {message.pending ? (
                                        <span className="flex items-center gap-1 py-1" aria-label="Woo is thinking">
                                            {[0, 1, 2].map((dot) => (
                                                <span key={dot} className="size-1.5 animate-bounce rounded-full bg-violet-300" style={{ animationDelay: `${dot * 120}ms` }} />
                                            ))}
                                        </span>
                                    ) : (
                                        <div className="leading-relaxed [&_a]:text-primary dark:[&_a]:text-violet-300 [&_a]:underline [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
                                            <ReactMarkdown>{message.text}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Composer */}
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    send(input);
                }}
                className="relative flex items-end gap-2 overflow-hidden rounded-[22px] border border-border bg-card/95 dark:border-white/[0.12] dark:bg-white/[0.06] p-1.5 pl-4 shadow-[0_4px_16px_rgba(30,20,60,0.08)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl focus-within:border-primary/50"
            >
                <GlassEdge />
                <textarea
                    ref={inputRef}
                    value={input}
                    rows={1}
                    onChange={(event) => changeInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            send(input);
                        }
                    }}
                    placeholder="Ask Woo…"
                    className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || chat.isLoading || isOutOfQuestions}
                    aria-label="Send"
                    className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-primary text-white shadow-[0_6px_16px_rgba(139,92,246,0.35)] transition-all disabled:bg-muted dark:disabled:bg-white/10 disabled:text-muted-foreground disabled:shadow-none"
                >
                    <ArrowUp className="size-5" strokeWidth={2.5} />
                </button>
            </form>
        </div>
    );
}
