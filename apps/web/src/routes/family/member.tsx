import { useState } from 'react';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass';
import { FamilySectionState } from '@/components/family/FamilySectionShared';
import { FamilyLedgerRows } from '@/components/family/FamilyLedgerRows';
import { FamilyPeriodControls } from '@/components/family/FamilyPeriodControls';
import { FamilyMoney, MoneyTotals, roleLabel } from '@/components/family/shared';
import { familyTotals } from '@/components/family/familyTotals';
import { canOpenMember, isChildMember } from '@/components/family/permissions';
import { localToday, type HouseholdOverviewOutput, type FamilyFinancesOutput, type FamilyTransactionsOutput, type FamilyTaxOutput, type FamilyWalletsResponse } from '@/components/family/types';

export function FamilyMemberPage() {
    const { memberId } = useParams({ strict: false }) as { memberId: string };
    const search = useSearch({ strict: false }) as { month?: string; currency?: string };
    const navigate = useNavigate();
    const month = search.month ?? localToday().slice(0, 7);
    const [cursor, setCursor] = useState<string | undefined>();
    const overview = trpc.household.overview.useQuery({ month, currency: search.currency, memberId });
    const finances = trpc.household.familyFinances.useQuery({ memberId, currency: search.currency });
    const transactions = trpc.household.familyTransactions.useQuery({ month, memberId, cursor });
    const tax = trpc.household.familyTax.useQuery({ taxYear: 2026 });
    const wallets = trpc.household.wallets.useQuery({ today: localToday() });
    const data = overview.data as HouseholdOverviewOutput | undefined;
    const holdings = finances.data as FamilyFinancesOutput | undefined;
    const ledger = transactions.data as FamilyTransactionsOutput | undefined;
    const member = data?.members.find(member => member.memberId === memberId);
    const back = <Link to="/" search={{ month }}>Back to dashboard</Link>;
    const unavailable = [overview.error, finances.error, transactions.error].some(error => error?.data?.code === 'NOT_FOUND') || (member && !canOpenMember(member, member));
    if (unavailable) return <GlassCard className="p-4 space-y-3"><p>This member isn't available.</p>{back}</GlassCard>;
    if (!data || !holdings || !ledger) return <FamilySectionState error={!!(overview.error || finances.error || transactions.error)} retry={() => { void overview.refetch(); void finances.refetch(); void transactions.refetch(); }} />;
    if (!member) return <GlassCard className="p-4"><p>This member isn't available.</p>{back}</GlassCard>;
    const own = holdings.members[0];
    const currency = data.displayCurrency;
    const date = new Date(`${month}-01T12:00:00`);
    const monthName = date.toLocaleDateString('en', { month: 'long' });
    const update = (patch: { month?: string; currency?: string }) => { setCursor(undefined); void navigate({ to: '/family/members/$memberId', params: { memberId }, search: { ...search, ...patch } }); };
    const block = data.filtered ?? data.converted;
    const child = isChildMember(member);
    const taxRow = (tax.data as FamilyTaxOutput | undefined)?.find(row => row.memberId === memberId);
    const wallet = (wallets.data as FamilyWalletsResponse | undefined)?.wallets.find(row => row.childMemberId === memberId);
    const sections = own ? [
        { title: 'Accounts', rows: own.accounts.map(account => ({ name: `${account.bankName}: ${account.accountName}`, totals: account.balances.map(balance => ({ currency: balance.currencyCode, amount: balance.balance })) })) },
        { title: 'Loans', rows: [...own.credits, ...own.mortgages].map(item => ({ name: item.name, totals: [{ currency: item.currency, amount: item.remaining }] })) },
        { title: 'Deposits', rows: own.deposits.map(item => ({ name: item.name, totals: [{ currency: item.currency, amount: item.balance }] })) },
        { title: 'Debts', rows: own.debts.map(item => ({ name: item.type === 'i_owe' ? `Owes ${item.personName}` : `${item.personName} owes ${member.name}`, totals: [{ currency: item.currencyCode, amount: item.remaining }] })) },
        { title: 'Subscriptions', rows: own.subscriptions.map(item => ({ name: `${item.name}, ${item.frequency}`, totals: [{ currency: item.currency, amount: item.monthlyAmount }] })) },
        { title: 'Investments', rows: own.investments?.holdings.map(item => ({ name: `${item.symbol}, quantity ${item.quantity}`, totals: [{ currency: item.currency, amount: item.value }] })) ?? [] },
    ] : [];
    return <div className="space-y-4 md:space-y-6">
        <Link to="/" search={{ month }}>‹ Dashboard</Link>
        <PageHeader title={member.name} subtitle={roleLabel(member.role, member.isGuardian)} variant="one">{null}</PageHeader>
        <p className="text-sm text-muted-foreground">{member.isMe ? 'This is how your family sees your finances.' : `View only. Only ${member.name} can change these.`}</p>
        {member.isMe && <Link to="/" search={{ view: 'personal' }}>Open Personal view</Link>}
        <FamilyPeriodControls date={date} monthName={monthName} currency={currency} overview={data} update={update} move={n => { const next = new Date(date); next.setMonth(next.getMonth() + n); update({ month: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}` }); }} />
        <GlassCard className="p-4"><dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">{[
            ['Net worth', member.netWorth], ['Spent in ' + monthName, member.spent], ['Owes', holdings.summary.owesConverted], ['Monthly payments', holdings.summary.monthlyPaymentsConverted],
        ].map(([label, amount]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-base font-semibold tabular-nums">≈ <FamilyMoney amount={amount ?? '0'} currency={currency} /></dd></div>)}</dl></GlassCard>
        <h2 className="text-sm font-semibold">Spending in {monthName}</h2>
        <div className="grid gap-4 lg:grid-cols-2"><GlassCard className="p-3">{block.categories.map(category => <div key={category.categoryId ?? 'none'} className="flex justify-between gap-3 py-3 text-sm"><span>{category.categoryName}</span><MoneyTotals totals={category.totals.map(total => ({ currency: total.currencyCode, amount: total.amount }))} /></div>)}</GlassCard>
        <GlassCard className="p-2 sm:p-3"><FamilyLedgerRows items={ledger.items} />{!ledger.items.length && <p className="p-3 text-sm text-muted-foreground">No spending in {monthName} yet.</p>}{ledger.nextCursor && <Button variant="ghost" onClick={() => setCursor(ledger.nextCursor!)}>Show more</Button>}</GlassCard></div>
        {sections.filter(section => section.rows.length && (!child || section.title === 'Accounts')).map(section => <section key={section.title}><h2 className="text-sm font-semibold mb-2">{section.title}</h2><GlassCard className="p-2 sm:p-3"><div className="divide-y divide-border">{section.rows.map((row, index) => <div key={index} className="flex justify-between gap-3 p-3 text-sm"><span>{row.name}</span><MoneyTotals totals={row.totals} /></div>)}</div></GlassCard></section>)}
        {child && wallet && <GlassCard className="p-3"><Link to="/family/wallets/$walletId" params={{ walletId: wallet.id }}>Wallet: {wallet.name}</Link>{wallet.limitSummary && <p className="text-sm"><FamilyMoney amount={wallet.limitSummary.remaining} currency={wallet.currencyCode} /> left</p>}</GlassCard>}
        {!child && taxRow?.hasProfile && <section><h2 className="text-sm font-semibold">Tax</h2><GlassCard className="p-3 space-y-2"><p>Estimated tax: {taxRow.estimatedTax === null ? 'Unavailable' : <FamilyMoney amount={taxRow.estimatedTax} currency={taxRow.currency} />}</p><p>Paid so far: {taxRow.paid === null ? 'Unavailable' : <FamilyMoney amount={taxRow.paid} currency={taxRow.currency} />}</p>{taxRow.nextDue && <p>Next due {taxRow.nextDue.date}: <FamilyMoney amount={taxRow.nextDue.amount} currency={taxRow.currency} /></p>}</GlassCard></section>}
        {!sections.some(section => section.rows.length) && <p className="text-sm text-muted-foreground">{member.name} hasn't added any accounts yet.</p>}
    </div>;
}
