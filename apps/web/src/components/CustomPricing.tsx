import React, { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Environments, initializePaddle, type Paddle } from '@paddle/paddle-js';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';
import { usePricing } from './PricingContext';

type TierId = 'free' | 'pro' | 'premium';

type Plan = {
    id: TierId;
    name: string;
    description: string;
    priceId?: string;
    fallbackPrice: string;
    features: string[];
    featured?: boolean;
};

const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'Build a clear picture of your money with the essentials.',
        fallbackPrice: '$0',
        features: ['Track your finances', '2 banks and 2 accounts each', '90 days of transaction history', '5 stocks in your portfolio'],
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'More room for your accounts, investments, and financial insights.',
        priceId: import.meta.env.VITE_PADDLE_PRO_PRICE_ID,
        fallbackPrice: import.meta.env.VITE_PADDLE_PRO_PRICE_LABEL || '$8',
        features: [
            'Market Insight Digest',
            'Unlimited banks',
            'Unlimited accounts',
            'Unlimited transaction history',
            '5 currencies per account',
            '20 stocks total in investing',
            'Woo Assistant (Limited)',
            'Special widgets unlocked',
        ],
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'The full Woolet experience, with more depth and priority support.',
        priceId: import.meta.env.VITE_PADDLE_PREMIUM_PRICE_ID,
        fallbackPrice: import.meta.env.VITE_PADDLE_PREMIUM_PRICE_LABEL || '$20',
        featured: true,
        features: [
            'Unlimited banks',
            'Unlimited accounts',
            'Unlimited currencies per account',
            'Up to 1000 stocks in portfolio',
            'Woo Assistant',
            'Special widgets unlocked',
            'Premium priority support',
            'Early access to features',
            'Premium Market Insight Digest',
            'Unlimited transaction history',
        ],
    },
];

const paddleToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
const paddleEnvironment: Environments = import.meta.env.VITE_PADDLE_ENV === 'production' ? 'production' : 'sandbox';
let paddlePromise: Promise<Paddle | undefined> | null = null;

function getPaddle(): Promise<Paddle | undefined> {
    if (!paddleToken) return Promise.resolve(undefined);
    if (!paddlePromise) {
        paddlePromise = initializePaddle({
            token: paddleToken,
            environment: paddleEnvironment,
        });
    }
    return paddlePromise;
}

// Keep icon rendering compatible with the repository's React 18/19 type setup.
const Icons = {
    Check: Check as any,
    Loader: Loader2 as any,
};

export function CustomPricing() {
    const { user } = useUser();
    const { isSignedIn } = useAuth();
    const { resolvedTheme } = useTheme();
    const { activePlanId, activePriceId } = usePricing();
    const [paddle, setPaddle] = useState<Paddle | undefined>();
    const [localizedPrices, setLocalizedPrices] = useState<Record<string, string>>({});
    const [isPreviewLoading, setIsPreviewLoading] = useState(Boolean(paddleToken));
    const [openingPlan, setOpeningPlan] = useState<TierId | null>(null);

    const paidPlans = useMemo(() => plans.filter((plan): plan is Plan & { priceId: string } => Boolean(plan.priceId)), []);

    useEffect(() => {
        let cancelled = false;
        getPaddle()
            .then((instance) => {
                if (!cancelled) setPaddle(instance);
            })
            .catch(() => {
                if (!cancelled) setIsPreviewLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!paddle || paidPlans.length === 0) {
            setIsPreviewLoading(false);
            return;
        }

        let cancelled = false;
        setIsPreviewLoading(true);
        paddle.PricePreview({
            items: paidPlans.map((plan) => ({ priceId: plan.priceId, quantity: 1 })),
        })
            .then((response) => {
                if (cancelled) return;
                const prices = response.data.details.lineItems.reduce<Record<string, string>>((result, item) => {
                    result[item.price.id] = item.formattedTotals.total;
                    return result;
                }, {});
                setLocalizedPrices(prices);
            })
            .catch(() => {
                // Keep the configured fallback labels if Paddle is unavailable.
            })
            .finally(() => {
                if (!cancelled) setIsPreviewLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [paddle, paidPlans]);

    async function handleCheckout(plan: Plan) {
        if (!plan.priceId) return;
        if (!isSignedIn) {
            window.location.assign('/login');
            return;
        }

        setOpeningPlan(plan.id);
        try {
            const instance = paddle ?? (await getPaddle());
            if (!instance) {
                toast.error('Checkout is not configured yet. Add a Paddle client-side token.');
                return;
            }

            instance.Checkout.open({
                items: [{ priceId: plan.priceId, quantity: 1 }],
                ...(user?.primaryEmailAddress?.emailAddress
                    ? { customer: { email: user.primaryEmailAddress.emailAddress } }
                    : {}),
                customData: { user_id: user?.id, tier: plan.id },
                settings: {
                    displayMode: 'overlay',
                    variant: 'one-page',
                    theme: resolvedTheme === 'light' ? 'light' : 'dark',
                    allowLogout: false,
                    successUrl: `${window.location.origin}/pricing?checkout=success`,
                },
            });
        } catch {
            toast.error('Paddle checkout could not be opened. Please try again.');
        } finally {
            setOpeningPlan(null);
        }
    }

    return (
        <main className="relative min-h-full overflow-hidden bg-background text-foreground">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,hsl(198_90%_55%_/_0.10),transparent_34%),radial-gradient(circle_at_100%_100%,hsl(38_90%_55%_/_0.07),transparent_30%)]" />
            <div className="relative mx-auto max-w-[1240px] px-4 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
                <header className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Woolet membership</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Choose your plan</h1>
                </header>

                <section className="mt-10 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3" aria-label="Plans">
                    {plans.map((plan) => {
                        const isCurrent = plan.id === 'free'
                            ? !activePlanId
                            : activePlanId === plan.id || activePriceId === plan.priceId;
                        const displayPrice = plan.priceId && localizedPrices[plan.priceId]
                            ? localizedPrices[plan.priceId]
                            : isPreviewLoading && plan.priceId
                                ? '…'
                                : plan.fallbackPrice;

                        return (
                            <article
                                key={plan.id}
                                className={cn(
                                    'relative flex min-h-[590px] flex-col rounded-[var(--radius-lg)] border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-8',
                                    plan.featured
                                        ? 'border-cyan-500/70 bg-cyan-500/[0.05] shadow-[0_0_0_1px_rgba(34,211,238,0.24),0_18px_55px_rgba(8,145,178,0.16)] dark:border-cyan-300/70 dark:bg-cyan-300/[0.08] dark:shadow-[0_0_0_1px_rgba(103,232,249,0.22),0_18px_55px_rgba(8,145,178,0.24)]'
                                        : 'border-border'
                                )}
                            >
                                {plan.featured && (
                                    <div className="absolute right-6 top-6 rounded-full bg-cyan-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:bg-cyan-200/15 dark:text-cyan-200">
                                        Recommended
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{plan.name}</h2>
                                        </div>
                                    </div>
                                    <div className="mt-14 flex items-baseline gap-2">
                                        <span className="text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">{displayPrice}</span>
                                        <span className="text-sm text-muted-foreground">{plan.priceId ? '/ month' : 'forever'}</span>
                                    </div>
                                    {plan.priceId && <p className="mt-2 text-xs text-muted-foreground">Taxes and final currency are confirmed at checkout.</p>}
                                    <p className="mt-8 text-base leading-6 text-muted-foreground">{plan.description}</p>
                                </div>

                                <Button
                                    className={cn(
                                        'mt-8 h-12 w-full rounded-full border font-medium transition-colors',
                                        plan.featured
                                            ? 'border-transparent bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200'
                                            : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                    variant={plan.featured ? 'default' : 'outline'}
                                    onClick={() => plan.priceId ? void handleCheckout(plan) : undefined}
                                    disabled={isCurrent || !plan.priceId || openingPlan !== null}
                                >
                                    {openingPlan === plan.id ? <Icons.Loader className="h-4 w-4 animate-spin" /> : null}
                                    {isCurrent ? 'Your current plan' : plan.priceId ? `Upgrade to ${plan.name}` : 'Your current plan'}
                                </Button>

                                <div className="mt-10 flex-1 space-y-5">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3 text-[15px] text-foreground/85">
                                            <Icons.Check className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-300" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {plan.id === 'free' && (
                                    <p className="mt-auto pt-10 text-sm text-muted-foreground">Have an existing plan? <span className="text-foreground underline underline-offset-2">Manage billing</span></p>
                                )}
                            </article>
                        );
                    })}
                </section>

            </div>
        </main>
    );
}
