
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ScopeSwitchRow } from '@/components/family/ScopeSwitch';
import posthog from 'posthog-js';
import { motion, useAnimation, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { AddBankSheet } from '@/components/AddBankSheet';
import { AddAccountSheet } from '@/components/AddAccountSheet';
import { AddCurrencyBalanceSheet } from '@/components/AddCurrencyBalanceSheet';
import { AccountActionSheet } from '@/components/AccountActionSheet';
import { PageHeader } from '@/components/PageHeader';
import { TransferSheet } from '@/components/TransferSheet';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Pencil, Plus, CircleDollarSign, X, Wifi, Landmark, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsBankSheet } from '@/components/SettingsBankSheet';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { IconDisplay } from '@/components/IconDisplay';
import { GlassEdge, StatTile, tint } from '@/components/ui/glass';
import { ProductEmptyState } from '@/components/financial/ProductCard';
import { parseAccountVisual } from '@/lib/image-utils';

interface CurrencyBalance {
    id: string;
    currencyCode: string;
    balance: string | number;
}

interface Account {
    id: string;
    name: string;
    type: string;
    icon?: string | null;
    last4Digits?: string | null;
    currencyBalances: CurrencyBalance[];
}

interface Bank {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    accounts: Account[];
}

// Predefined card colors for accounts within a bank
const CARD_COLORS = [
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#EF4444', // red
    '#6366F1', // indigo
];

function getCardColor(index: number): string {
    return CARD_COLORS[index % CARD_COLORS.length];
}

// Banks default to #000000, which would make the glass tint invisible; fall back to violet for dark colours
function getBankColor(color?: string | null): string {
    const match = color?.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
    if (!match) return '#8B5CF6';
    const [r, g, b] = match.slice(1).map((hex) => parseInt(hex, 16));
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.18 ? '#8B5CF6' : color!;
}

/** Deterministic 0–1 from seed so each card gets stable random tilt/shift. */
function seededRandom(seed: string): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    return (Math.abs(h) % 1e6) / 1e6;
}

function AccountCard({
    account,
    index,
    totalCards,
    isActive,
    onTabClick,
    onClose,
    onDeleteAccount,
    onSelectAccount,
}: {
    account: Account;
    index: number;
    totalCards: number;
    isActive: boolean;
    onTabClick: () => void;
    onClose: () => void;
    onDeleteAccount: (id: string) => void;
    onSelectAccount: (account: Account) => void;
}) {
    const CARD_H = 208;
    const TAB_TRANSFORM_Y = 38;
    const WALLET_Z_INDEX = 20;
    const ACTIVE_CARD_Z_INDEX = WALLET_Z_INDEX + 1;

    const baseZIndex = totalCards - index;
    const inactiveBottom = index * TAB_TRANSFORM_Y;
    const activeY = (index + 1) * TAB_TRANSFORM_Y ;
    // Per-card random tilt (max 1.5°) and shift (1–6px any direction), stable via account.id
    const stackRandom = useMemo(() => {
        const r1 = seededRandom(account.id + 'r');
        const r2 = seededRandom(account.id + 'x');
        const r3 = seededRandom(account.id + 'y');
        return {
            rotateZ: (r1 - 0.5) * 3,
            x: (r2 - 0.5) * 12,
            y: (r3 - 0.5) * 12,
        };
    }, [account.id]);

    const controls = useAnimation();
    const [cardScale, setCardScale] = useState(1);
    const hasInitialized = useRef(false);
    const prevIsActive = useRef(isActive);
    const isAnimating = useRef(false);
    const isHovering = useRef(false);
    const normalizedLast4 = (account.last4Digits ?? '').replace(/\D/g, '').slice(-4);
    const visual = parseAccountVisual(account.icon);
    const cardColor = visual.color || getCardColor(index);
    const cardSkin = visual.skinUrl;

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const isHovered = useMotionValue(0);

    const springConfig = { stiffness: 400, damping: 30 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]), springConfig);

    const bgX = useSpring(useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]), springConfig);
    const bgY = useSpring(useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]), springConfig);

    const glareOpacity = useSpring(isHovered, springConfig);
    const glareBg = useMotionTemplate`radial-gradient(circle at ${bgX} ${bgY}, rgba(255,255,255,0.4) 0%, transparent 60%)`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isActive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(px);
        mouseY.set(py);
    };

    const handleMouseEnter = () => {
        isHovering.current = true;
        if (isActive) {
            isHovered.set(1);
            return;
        }
        if (!isAnimating.current) {
            void controls.start({
                y: stackRandom.y - 22,
                rotateX: -20,
                scale: 1.04,
                transition: { type: 'spring', stiffness: 400, damping: 30 },
            });
        }
    };

    const handleMouseLeave = () => {
        isHovering.current = false;
        if (isActive) {
            mouseX.set(0);
            mouseY.set(0);
            isHovered.set(0);
            return;
        }
        if (!isAnimating.current) {
            void controls.start({
                y: stackRandom.y,
                rotateX: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 30 },
            });
        }
    };

    useLayoutEffect(() => {
        if (hasInitialized.current) {
            return;
        }

        hasInitialized.current = true;
        prevIsActive.current = isActive;
        controls.set({
            x: isActive ? 0 : stackRandom.x,
            y: isActive ? activeY : stackRandom.y,
            rotateZ: isActive ? 0 : stackRandom.rotateZ,
            scale: 1,
        });
    }, [activeY, baseZIndex, controls, isActive, ACTIVE_CARD_Z_INDEX, stackRandom]);

    useEffect(() => {
        if (!hasInitialized.current) {
            return;
        }

        if (prevIsActive.current === isActive) {
            if (!isAnimating.current) {
                controls.set({
                    x: isActive ? 0 : stackRandom.x,
                    y: isActive ? activeY : stackRandom.y,
                    rotateZ: isActive ? 0 : stackRandom.rotateZ,
                    scale: 1,
                });
            }
            return;
        }

        prevIsActive.current = isActive;
        const liftY = -CARD_H + 10;
        let cancelled = false;

        const runAnimation = async () => {
            isAnimating.current = true;
            if (isActive) {
                isHovering.current = false;
                await controls.start({
                    x: [stackRandom.x, stackRandom.x, 0],
                    y: [stackRandom.y, -CARD_H + 30, activeY],
                    rotateZ: [stackRandom.rotateZ, stackRandom.rotateZ, 0],
                    scale: [1, 1.25, 1],
                    zIndex: [baseZIndex, ACTIVE_CARD_Z_INDEX, ACTIVE_CARD_Z_INDEX],
                    transition: {
                        duration: 0.3,
                        times: [0, 0.5, 1]
                    },
                });
                isAnimating.current = false;
                return;
            }

            await controls.start({
                x: stackRandom.x,
                y: liftY,
                rotateZ: stackRandom.rotateZ,
                scale: 1.25,
                transition: {
                    duration: 0.2,
                    ease: 'circInOut',
                },
            });

            if (cancelled) {
                isAnimating.current = false;
                return;
            }
            setCardScale(1);
            await controls.start({
                x: stackRandom.x,
                y: stackRandom.y,
                rotateZ: stackRandom.rotateZ,
                scale: 1,
                zIndex: baseZIndex,
                transition: {
                    delay: 0.1,
                    duration: 0.1,
                },
            });

            isAnimating.current = false;

            // If cursor is still over the card after deactivation, show hover state
            if (isHovering.current) {
                void controls.start({
                    y: stackRandom.y - 22,
                    rotateX: -20,
                    scale: 1.04,
                    transition: { type: 'spring', stiffness: 400, damping: 30 },
                });
            }
        };

        void runAnimation();

        return () => {
            cancelled = true;
            // Don't stop controls — let animation reach its final position naturally
        };
    }, [activeY, baseZIndex, controls, isActive, ACTIVE_CARD_Z_INDEX, stackRandom]);

    // Inactive position is relative to its regular spot in the flex stack
    // Active position needs to sit neatly over the wallet.
    // The wallet is right below the card wrapper.

    return (
        <motion.div
            onClick={!isActive ? onTabClick : undefined}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={false}
            animate={controls}
            transformTemplate={(transforms, generated) => {
                const centered = `translateX(-50%) ${generated}`;
                return !isActive ? `perspective(600px) ${centered}` : centered;
            }}
            className={cn(
                "absolute flex flex-col justify-between text-white overflow-hidden rounded-[20px] p-5",
                isActive ? "shadow-2xl" : "cursor-pointer hover:brightness-110"
            )}
            style={{
                left: "50%",
                width: isActive ? "100%" : "calc(100% - 8px)",
                maxWidth: "100%",
                height: CARD_H,
                // Same recipe as the dashboard hero card: glow top-right, shade bottom-left, deep diagonal base
                backgroundImage: cardSkin
                    ? `url("${cardSkin}")`
                    : [
                        'radial-gradient(110% 90% at 100% 0%, rgba(255,255,255,0.30), transparent 55%)',
                        'radial-gradient(110% 110% at 0% 110%, rgba(16,8,40,0.55), transparent 60%)',
                        `linear-gradient(135deg, ${cardColor} 0%, color-mix(in srgb, ${cardColor} 72%, #1e0a46) 52%, color-mix(in srgb, ${cardColor} 45%, #0b0b14) 100%)`,
                    ].join(', '),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                bottom: inactiveBottom,
                rotateX: isActive ? rotateX : 0,
                rotateY: isActive ? rotateY : 0,
                scale: cardScale,
                zIndex: isActive ? ACTIVE_CARD_Z_INDEX : baseZIndex,
                boxShadow: isActive
                    ? `0 24px 48px -12px ${tint(cardColor, 0.55)}, 0 12px 24px rgba(0,0,0,0.35)`
                    : '0 -6px 16px rgba(0,0,0,0.25)',
                transformStyle: "preserve-3d",
            }}
        >
            {/* Dynamic Glare Overlay */}
            {isActive && (
                <motion.div
                    className="pointer-events-none absolute inset-0 z-50 rounded-[20px] mix-blend-overlay"
                    style={{ background: glareBg, opacity: glareOpacity }}
                />
            )}

            {/* Uploaded skins get a scrim so the text stays readable */}
            {cardSkin && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />}

            {/* Angled light slice, like the hero card */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    clipPath: 'polygon(0 0, 36% 0, 10% 100%, 0 100%)',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.14), rgba(255,255,255,0))',
                }}
            />
            {/* Glass rim + specular strips */}
            <div className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]" />
            <GlassEdge />

            {/* Hologram / Chip & Contactless */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                className="absolute left-5 top-[56px] flex items-center gap-3 z-10 pointer-events-none"
            >
                <svg className="w-[34px] h-[25px] opacity-55" viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="39" height="27" rx="4.5" stroke="currentColor" strokeWidth="1" fill="none" />
                    <path d="M 0 9 L 14 9 M 0 19 L 14 19 M 26 9 L 40 9 M 26 19 L 40 19 M 14 0 L 14 28 M 26 0 L 26 28" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
                    <rect x="14" y="9" width="12" height="10" fill="currentColor" fillOpacity="0.15" />
                </svg>
                <Wifi className="w-4 h-4 opacity-50 rotate-90" />
            </motion.div>

            {/* Card Number from account data (no fake fallback). */}
            {normalizedLast4 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    className="absolute left-5 bottom-[4.6rem] font-mono text-sm tracking-[0.2em] text-white/85 flex items-center gap-2.5 z-10 pointer-events-none"
                >
                    <span className="text-[10px] text-white/55">•••• •••• ••••</span>
                    <span>{normalizedLast4}</span>
                </motion.div>
            )}

            {/* Top row: name + actions, visible fully when active or partially when inactive */}
            <div className="flex items-start justify-between relative z-20">
                <h3 className={cn("font-semibold leading-tight tracking-tight drop-shadow-sm", isActive ? "text-base" : "text-[13px] mt-[-4px]")}>
                    {visual.icon && <span className="mr-1.5">{visual.icon}</span>}
                    {account.name}
                    {!isActive && normalizedLast4 && (
                        <span className="ml-1.5 font-medium text-white/60">{normalizedLast4}</span>
                    )}
                </h3>

                <div
                    className={cn(
                        "flex items-center gap-0.5 transition-opacity duration-300",
                        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <DeleteConfirm
                        title="Delete this account?"
                        description={`This will permanently delete "${account.name}". This action cannot be undone.`}
                        onConfirm={() => {
                            onDeleteAccount(account.id);
                            onClose();
                        }}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white/75 hover:text-white hover:bg-white/15">
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        }
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectAccount(account);
                        }}
                        className="h-7 w-7 rounded-full text-white/75 hover:text-white hover:bg-white/15"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AddCurrencyBalanceSheet
                        accountId={account.id}
                        accountName={account.name}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white/75 hover:text-white hover:bg-white/15">
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        }
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="h-7 w-7 rounded-full text-white/75 hover:text-white hover:bg-white/15 ml-1"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Balances: first one large like the hero card, others as compact chips */}
            <div
                className={cn(
                    "mt-auto flex items-end justify-between gap-3 transition-opacity duration-300 relative z-20",
                    isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {account.currencyBalances.slice(0, 1).map((cb) => (
                    <TransferSheet
                        key={cb.id}
                        preselectedSenderId={cb.id}
                        trigger={
                            <button onClick={(e) => e.stopPropagation()} className="text-left transition-opacity hover:opacity-90">
                                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Balance</span>
                                <CurrencyDisplay amount={cb.balance} currency={cb.currencyCode} className="text-xl font-bold tracking-tight tabular-nums text-white drop-shadow-sm" />
                            </button>
                        }
                    />
                ))}
                {account.currencyBalances.length > 1 && (
                    <div className="flex flex-wrap justify-end gap-1">
                        {account.currencyBalances.slice(1).map((cb) => (
                            <TransferSheet
                                key={cb.id}
                                preselectedSenderId={cb.id}
                                trigger={
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                                    >
                                        <CurrencyDisplay amount={cb.balance} currency={cb.currencyCode} abbreviate />
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function WalletBank({
    bank,
    activeCardId,
    onActiveCardChange,
    onDeleteBank,
    onDeleteAccount,
    onSelectAccount,
}: {
    bank: Bank & { visibleAccounts: Account[] };
    activeCardId: string | null;
    onActiveCardChange: (accountId: string | null) => void;
    onDeleteBank: () => void;
    onDeleteAccount: (id: string) => void;
    onSelectAccount: (account: Account) => void;
}) {
    const isActiveWallet = bank.visibleAccounts.some((account) => account.id === activeCardId);
    const bankColor = getBankColor(bank.color);

    const handleCardTabClick = (accountId: string) => {
        onActiveCardChange(activeCardId === accountId ? null : accountId);
    };

    const CARD_H = 208;
    const TAB_H = 192;
    const TAB_TRANSFORM_Y = 34;

    return (
        <div
            className="relative flex flex-col items-center w-full max-w-[380px] mx-auto"
            style={{ zIndex: isActiveWallet ? 1 : 0 }}
        >
            {/* Wallet wrapper — card overlays on top */}
            <div className="relative w-full max-w-[376px] mt-[30px]">
                {/* Wallet Back Panel — frosted glass tinted with the bank colour */}
                <div
                    className="absolute inset-x-0 bottom-0 rounded-b-[26px] rounded-t-[28px] border border-white/10 pointer-events-none backdrop-blur-xl transition-all duration-300"
                    style={{
                        zIndex: -1,
                        top: bank.visibleAccounts.length > 0 ? -12 : 20,
                        background: `linear-gradient(180deg, ${tint(bankColor, 0.22)} 0%, rgba(255,255,255,0.03) 100%)`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 50px rgba(0,0,0,0.45), 0 0 60px ${tint(bankColor, 0.12)}`,
                    }}
                />

                {/* Card tabs peeking out from top of wallet */}
                {bank.visibleAccounts.length > 0 && (
                    <div
                        className="relative ml-2 mr-2 flex flex-col items-center"
                        style={{
                            height: `${TAB_H + (bank.visibleAccounts.length - 1) * TAB_TRANSFORM_Y}px`,
                            marginBottom: `-${TAB_H - TAB_TRANSFORM_Y}px`,
                        }}
                    >
                        {bank.visibleAccounts.map((account, index) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                index={index}
                                totalCards={bank.visibleAccounts.length}
                                isActive={account.id === activeCardId}
                                onTabClick={() => handleCardTabClick(account.id)}
                                onClose={() => onActiveCardChange(null)}
                                onDeleteAccount={onDeleteAccount}
                                onSelectAccount={onSelectAccount}
                            />
                        ))}
                    </div>
                )}

                {/* Wallet body — fixed height so content can pin to bottom */}
                <div
                    className="flex flex-col relative z-20 group drop-shadow-2xl"
                    style={{
                        width: "100%",
                        height: CARD_H,
                        minHeight: CARD_H,
                        marginTop: '-16px',
                        filter: 'drop-shadow(0 -4px 12px rgba(0,0,0,0.15)) drop-shadow(0 12px 24px rgba(0,0,0,0.2))'
                    }}
                >
                    <svg className="absolute size-0 pointer-events-none" aria-hidden="true">
                        <defs>
                            <clipPath id={`pocket-${bank.id}`} clipPathUnits="objectBoundingBox">
                                <path d="M0,.089 C0,.039 .021,0 .049,0 L.366,0 C.390,0 .405,.022 .418,.056 C.436,.122 .457,.156 .5,.156 C.543,.156 .564,.122 .582,.056 C.595,.022 .610,0 .634,0 L.951,0 C.979,0 1,.039 1,.089 L1,1 L0,1 Z" />
                            </clipPath>
                        </defs>
                    </svg>
                    {/* Glass pocket */}
                    <div
                        className="absolute inset-0 rounded-b-[26px] overflow-hidden backdrop-blur-2xl"
                        style={{
                            clipPath: `url(#pocket-${bank.id})`,
                            background: `linear-gradient(160deg, ${tint(bankColor, 0.3)} 0%, rgba(24,24,32,0.72) 55%, rgba(12,12,18,0.85) 100%)`,
                        }}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.16)_0%,transparent_65%)] pointer-events-none" />
                    </div>

                    {/* Specular rim along the pocket opening */}
                    <svg className="absolute top-0 left-0 pointer-events-none z-10" width="100%" height="40" viewBox="0 0 328 40" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id={`rim-${bank.id}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#fff" stopOpacity="0.05" />
                                <stop offset="50%" stopColor="#fff" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
                            </linearGradient>
                        </defs>
                        <path d="M1,16 C1,7.5 7.5,1 16,1 L120,1 C128,1 133,5 137,11 C143,23 150,29 164,29 C178,29 185,23 191,11 C195,5 200,1 208,1 L312,1 C320.5,1 327,7.5 327,16"
                            fill="none" stroke={`url(#rim-${bank.id})`} strokeWidth="1.5" />
                    </svg>
                    <div className="absolute inset-x-0 bottom-0 top-4 rounded-b-[26px] border-x border-b border-white/10 pointer-events-none z-10" />

                    {/* Wallet Content */}
                    <div className="relative z-20 flex flex-col h-full min-h-0 p-5 pt-8">
                        {/* Bank actions */}
                        <div className="flex items-center justify-end gap-0.5 mb-2 mt-[-10px] mr-[-5px] shrink-0">
                            <DeleteConfirm
                                title="Delete this institution?"
                                description={`This will permanently delete "${bank.name}" and all its ${bank.accounts.length} accounts. This action cannot be undone.`}
                                onConfirm={onDeleteBank}
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/50 hover:text-red-400 hover:bg-white/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                }
                            />
                            <SettingsBankSheet
                                bank={bank}
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                }
                            />
                            <AddAccountSheet bankId={bank.id} bankName={bank.name}
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                }
                            />
                        </div>

                        {/* Spacer: pushes bank name & balances to bottom */}
                        <div className="flex-1 min-h-0" />

                        {/* Bank name & aggregated balances at bottom */}
                        <div className="flex items-end justify-between gap-3 shrink-0 pb-0.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                    className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm"
                                    style={{ backgroundColor: tint(bankColor, 0.25), color: bankColor, boxShadow: `inset 0 0 0 1px ${tint(bankColor, 0.4)}` }}
                                >
                                    {bank.icon ? <IconDisplay icon={bank.icon} className="size-full object-cover" /> : <Landmark className="size-4" />}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-bold leading-tight text-white">{bank.name}</h3>
                                    <p className="text-[11px] text-white/50">
                                        {bank.visibleAccounts.length} account{bank.visibleAccounts.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                {aggregateBalances(bank.visibleAccounts).map(({ code, total }) => (
                                    <CurrencyDisplay key={code} amount={total} currency={code} className="block text-base font-bold tabular-nums text-white" />
                                ))}
                            </div>
                        </div>

                        {bank.visibleAccounts.length === 0 && (
                            <p className="text-xs text-white/50 font-medium text-center mt-4">
                                No accounts yet. Add one to get started.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function aggregateBalances(accounts: Account[]) {
    const map = new Map<string, number>();
    for (const acc of accounts) {
        for (const cb of acc.currencyBalances) {
            map.set(cb.currencyCode, (map.get(cb.currencyCode) ?? 0) + Number(cb.balance));
        }
    }
    return Array.from(map.entries()).map(([code, total]) => ({ code, total }));
}

export function AccountsPage() {
    const { data: banks, isLoading } = trpc.bank.getHierarchy.useQuery(undefined, {
        staleTime: 1000 * 60,
    }) as { data: Bank[] | undefined; isLoading: boolean };

    useEffect(() => {
        if (banks) {
            const totalAccounts = banks.reduce((acc, bank) => acc + bank.accounts.length, 0);
            posthog.setPersonProperties({
                bank_count: banks.length,
                account_count: totalAccounts,
            });
            posthog.capture('accounts_viewed', {
                bank_count: banks.length,
                account_count: totalAccounts,
            });
        }
    }, [banks]);

    const banksWithAccounts = useMemo(() => {
        if (!banks) return [];
        return banks.map((bank) => ({
            ...bank,
            visibleAccounts: bank.accounts,
        }));
    }, [banks]);

    // Sorted largest first so the hero tile shows the main currency
    const totals = useMemo(
        () => aggregateBalances(banksWithAccounts.flatMap((bank) => bank.visibleAccounts)).sort((a, b) => b.total - a.total),
        [banksWithAccounts]
    );
    // Converted total in the user's preferred currency, from the same summary the dashboard uses.
    const { data: summary } = trpc.dashboard.getSummary.useQuery();
    const accountCount = banksWithAccounts.reduce((sum, bank) => sum + bank.visibleAccounts.length, 0);

    const utils = trpc.useUtils();
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);

    const deleteBank = trpc.bank.delete.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            toast.success('Bank deleted');
        },
        onError: (error: any) => toast.error(error.message || 'Failed to delete bank'),
    });

    const deleteAccount = trpc.account.delete.useMutation({
        onSuccess: () => {
            utils.bank.getHierarchy.invalidate();
            toast.success('Account deleted');
        },
        onError: (error: any) => toast.error(error.message || 'Failed to delete account'),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Accounts" subtitle="Manage your finances" variant="one">
                    {null}
                </PageHeader>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Skeleton className="h-56 w-full rounded-[28px]" />
                    <Skeleton className="h-56 w-full rounded-[28px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Accounts"
                subtitle="Manage your banks and asset accounts"
                variant="two-with-text"
            >
                <TransferSheet
                    trigger={
                        <ActionButton variant="secondary" className="flex-1 sm:flex-none">
                            <CircleDollarSign className="h-4 w-4" />
                            Transfer
                        </ActionButton>
                    }
                />
                <AddBankSheet />
            </PageHeader>
            <ScopeSwitchRow />

            <AccountActionSheet
                account={selectedAccount}
                open={!!selectedAccount}
                onOpenChange={(open) => !open && setSelectedAccount(null)}
            />

            {(!banks || banks.length === 0) ? (
                <ProductEmptyState
                    icon={<Landmark className="size-5" />}
                    title="No institutions yet"
                    description="Add a bank or brokerage (like Chase, Bank of America, Fidelity) to get started"
                    action={<AddBankSheet />}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        <StatTile
                            label="Total across banks"
                            color="#8B5CF6"
                            icon={<Wallet className="size-4" />}
                            value={summary?.currency
                                ? <CurrencyDisplay amount={summary.totalBalance ?? 0} currency={summary.currency} />
                                : totals.length === 0 ? '0' : <CurrencyDisplay amount={totals[0].total} currency={totals[0].code} />}
                            hint={totals.length > 1 ? (
                                <span className="flex flex-wrap gap-x-2">
                                    {totals.map(({ code, total }) => (
                                        <CurrencyDisplay key={code} amount={total} currency={code} abbreviate />
                                    ))}
                                </span>
                            ) : summary?.currency ? `In ${summary.currency}` : 'In one currency'}
                        />
                        <StatTile label="Institutions" color="#38BDF8" icon={<Landmark className="size-4" />} value={banks.length} hint="Banks & brokers" />
                        <StatTile
                            label="Accounts"
                            color="#34D399"
                            icon={<CreditCard className="size-4" />}
                            className="col-span-2 lg:col-span-1"
                            value={accountCount}
                            hint="Tap a card to open it"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-12 pt-4 md:grid-cols-2 2xl:grid-cols-3">
                        {banksWithAccounts.map((bank) => (
                            <WalletBank
                                key={bank.id}
                                bank={bank}
                                onDeleteBank={() => deleteBank.mutate({ id: bank.id })}
                                activeCardId={activeCardId}
                                onActiveCardChange={setActiveCardId}
                                onDeleteAccount={(id) => {
                                    if (activeCardId === id) {
                                        setActiveCardId(null);
                                    }
                                    deleteAccount.mutate({ id });
                                }}
                                onSelectAccount={setSelectedAccount}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
