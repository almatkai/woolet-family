import type { ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { GlassCard } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UniversalAddSheet } from '@/components/UniversalAddSheet';
import { ActionButton } from '@/components/ui/action-button';
import { ScopeSwitch } from './ScopeSwitch';
import { MoneyTotals, FamilyMoney } from './shared';
import type { CurrencyAmount, HouseholdOverview } from './types';
export function FamilySection({ title, family, children, controls }: { title: string; family: NonNullable<HouseholdOverview>; children: ReactNode; controls?: ReactNode }) {
    return <div className="space-y-4 md:space-y-6"><PageHeader title={title} subtitle={family.household.name} variant="one"><UniversalAddSheet trigger={<ActionButton>+ Add</ActionButton>} /></PageHeader><div className="flex flex-wrap items-center gap-2"><ScopeSwitch />{controls}</div>{children}</div>;
}
export function FamilySectionState({ error, retry }: { error: boolean; retry: () => void }) {
    return error ? <GlassCard className="p-4" role="alert">Couldn't load these family finances.<Button variant="ghost" onClick={retry}>Try again</Button></GlassCard> : <div className="space-y-4"><Skeleton className="h-24" />{[0, 1].map(n => <div key={n} className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>)}</div>;
}
export function FamilySectionTotal({ label, totals, converted, currency }: { label: string; totals: CurrencyAmount[]; converted: string; currency: string }) {
    return <GlassCard className="p-4 space-y-2"><h2 className="text-sm font-semibold">{label}</h2><MoneyTotals totals={totals.map(t => ({ currency: t.currencyCode, amount: t.amount }))} /><p className="text-xs text-muted-foreground">≈ <FamilyMoney amount={converted} currency={currency} /> in {currency}</p></GlassCard>;
}
