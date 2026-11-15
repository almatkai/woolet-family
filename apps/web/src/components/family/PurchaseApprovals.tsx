import { useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { FamilyMoney, Initials, sheetClass } from './shared';
import type { FamilyWallet } from './types';

type Agreement = { limit: string; canEdit: boolean; updatedByName: string | null; updatedAt: string | Date | null };
type Proposal = {
    id: string; description: string | null; amount: string; originalAmount: string;
    proposerUserId: string; proposerName: string; lastActorName: string; awaitingName: string | null;
    walletName: string; currencyCode: string; walletBalance: string; date: string;
    status: 'pending' | 'countered' | 'approved' | 'declined'; canRespond: boolean; canWithdraw: boolean; canDecline: boolean; unavailableReason: string | null;
    createdAt: string | Date; decidedAt: string | Date | null;
};
const pendingStatus = (proposal: Proposal) => proposal.status === 'pending' || proposal.status === 'countered';
const moneyPattern = /^\d+(\.\d{1,2})?$/;

export function PurchaseApprovals({ wallets, onNewPurchase }: { wallets: FamilyWallet[]; onNewPurchase: () => void }) {
    const utils = trpc.useContext();
    const agreementQuery = trpc.household.purchaseAgreement.useQuery();
    const proposalQuery = trpc.household.purchaseProposals.useQuery();
    const agreement = agreementQuery.data as Agreement | undefined;
    const proposals = (proposalQuery.data?.proposals ?? []) as Proposal[];
    const pending = proposals.filter(pendingStatus).sort((a, b) => Number(b.canRespond) - Number(a.canRespond) || +new Date(b.createdAt) - +new Date(a.createdAt));
    const decided = proposals.filter(proposal => !pendingStatus(proposal));
    const [editing, setEditing] = useState(false);
    const [limit, setLimit] = useState('');
    const [counter, setCounter] = useState<Proposal | null>(null);
    const [counterAmount, setCounterAmount] = useState('');
    const compact = useIsMobile(470);
    const shared = wallets.filter(wallet => wallet.kind === 'shared');
    const currencies = [...new Set(shared.map(wallet => wallet.currencyCode))];
    const displayCurrency = currencies.length === 1 ? currencies[0] : null;
    const validLimit = moneyPattern.test(limit) && Number(limit) >= 0 && Number(limit) <= 1e9;
    const validCounter = moneyPattern.test(counterAmount) && Number(counterAmount) > 0 && Number(counterAmount) <= 1e9 && Number(counterAmount) !== Number(counter?.amount);
    const update = trpc.household.updatePurchaseAgreement.useMutation({
        onSuccess: () => { setEditing(false); void utils.household.purchaseAgreement.invalidate(); toast.success('Shared purchase limit updated'); },
    });
    const respond = trpc.household.respondToPurchaseProposal.useMutation({
        onSuccess: (_result: unknown, variables: { action: string }) => {
            setCounter(null);
            for (const key of ['purchaseProposals', 'wallets', 'walletTransactions', 'walletSummary']) void utils.household[key].invalidate();
            toast.success(variables.action === 'approve' ? 'Purchase approved and added to the wallet' : variables.action === 'decline' ? 'Purchase declined. Nothing was spent.' : 'Counter sent. Nothing spent yet.');
        },
    });
    const rowPending = (proposal: Proposal) => respond.isLoading && respond.variables?.proposalId === proposal.id;

    return <div className="space-y-4">
        <section aria-labelledby="purchase-agreement-heading" className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 id="purchase-agreement-heading" className="text-base font-semibold">Shared purchase agreement</h2>
                    {agreement && <p className="mt-1 text-sm">Purchases over {displayCurrency ? <FamilyMoney amount={agreement.limit} currency={displayCurrency} /> : `${Number(agreement.limit).toLocaleString('en-US')} in each wallet's currency`} need another adult's approval.</p>}
                    {agreementQuery.isLoading && <Skeleton className="mt-2 h-5 w-60 max-w-full" />}
                    <p className="mt-1 text-xs text-muted-foreground">The limit uses each shared wallet's currency. Personal accounts and children's wallets keep their own rules.</p>
                    {agreement?.updatedByName && <p className="mt-1 text-xs text-muted-foreground">Last changed by {agreement.updatedByName}</p>}
                </div>
                {agreement?.canEdit && !editing && <Button type="button" variant="ghost" className="min-h-11" onClick={() => { setLimit(agreement.limit); update.reset(); setEditing(true); }}>Change</Button>}
            </div>
            {editing && <form className="mt-4 space-y-2" onSubmit={event => { event.preventDefault(); if (validLimit && !update.isLoading) update.mutate({ limit }); }}>
                <Label htmlFor="shared-purchase-limit">Approval needed above (wallet currency)</Label>
                <div className="flex flex-wrap gap-2">
                    <Input id="shared-purchase-limit" type="text" inputMode="decimal" className="w-full sm:w-48" value={limit} disabled={update.isLoading} onChange={event => setLimit(event.target.value.replace(',', '.'))} />
                    <Button variant="neutral" className="min-h-11" disabled={!validLimit || update.isLoading}>{update.isLoading ? 'Saving…' : 'Save'}</Button>
                    <Button className="min-h-11" type="button" variant="outline" disabled={update.isLoading} onClick={() => setEditing(false)}>Cancel</Button>
                </div>
                {!validLimit && <p className="text-sm text-destructive">Enter an amount from 0 to 1,000,000,000 with up to two decimals.</p>}
                {update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
            </form>}
            {agreementQuery.error && <p role="alert" className="mt-2 text-sm text-destructive">Couldn't load the agreement. <button type="button" className="min-h-11 underline" onClick={() => void agreementQuery.refetch()}>Try again</button></p>}
        </section>

        <section aria-labelledby="purchase-proposals-heading" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="purchase-proposals-heading" className="text-base font-semibold">{pending.some(proposal => proposal.canRespond) ? 'Purchases waiting for you' : 'Purchase proposals'}</h2>
                {shared.some(wallet => wallet.canWrite) && <Button type="button" variant="outline" className="min-h-11" onClick={onNewPurchase}>New shared purchase</Button>}
            </div>
            <p className="text-xs text-muted-foreground">Nothing is spent or reserved until a purchase is approved.</p>
            {proposalQuery.isLoading && <Skeleton className="h-28 rounded-2xl" />}
            {proposalQuery.error && <p role="alert" className="text-sm text-destructive">Couldn't load purchase proposals. <button type="button" className="min-h-11 underline" onClick={() => void proposalQuery.refetch()}>Try again</button></p>}
            {!proposalQuery.isLoading && !proposalQuery.error && pending.length === 0 && <p className="text-sm text-muted-foreground">No purchases waiting for approval.</p>}
            {pending.length > 0 && <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {pending.map(proposal => {
                    const remaining = (Math.round(Number(proposal.walletBalance) * 100) - Math.round(Number(proposal.amount) * 100)) / 100;
                    const busy = rowPending(proposal);
                    return <article key={proposal.id} className="space-y-3 p-4" aria-label={proposal.description || 'Shared purchase'} aria-busy={busy}>
                        <div className="flex items-start gap-3">
                            <Initials name={proposal.proposerName} />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><h3 className="min-w-0 break-words text-sm font-semibold">{proposal.description || 'Shared purchase'}</h3><span className="text-sm font-semibold"><FamilyMoney amount={proposal.amount} currency={proposal.currencyCode} /></span></div>
                                <p className="mt-1 text-xs text-muted-foreground">{proposal.proposerName} · {proposal.walletName} · {format(new Date(`${proposal.date}T12:00:00`), 'MMM d, yyyy', { locale: enUS })}</p>
                                <p className="mt-1 text-sm">{proposal.canRespond ? 'Waiting for you' : proposal.awaitingName ? `Waiting for ${proposal.awaitingName}` : "Waiting for another adult's approval"}</p>
                                {proposal.status === 'countered' && <p className="mt-1 text-xs text-muted-foreground">{proposal.lastActorName} suggested this amount. Originally <FamilyMoney amount={proposal.originalAmount} currency={proposal.currencyCode} />.</p>}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{proposal.walletName} has <FamilyMoney amount={proposal.walletBalance} currency={proposal.currencyCode} />. {remaining >= 0 ? <><FamilyMoney amount={remaining} currency={proposal.currencyCode} /> left after approval.</> : <>This needs <FamilyMoney amount={-remaining} currency={proposal.currencyCode} /> more before it can be approved.</>}</p>
                        {proposal.unavailableReason && <p className="text-sm text-muted-foreground">{proposal.unavailableReason}</p>}
                        {(proposal.canRespond || proposal.canDecline) && <div className="flex flex-wrap gap-2">
                            {proposal.canRespond && <><Button variant="neutral" className="min-h-11 flex-1 sm:flex-none" disabled={busy || remaining < 0} onClick={() => respond.mutate({ proposalId: proposal.id, action: 'approve' })}>{busy && respond.variables?.action === 'approve' ? 'Approving…' : 'Approve'}</Button>
                            <Button variant="outline" className="min-h-11 flex-1 sm:flex-none" disabled={busy} onClick={() => { setCounter(proposal); setCounterAmount(''); respond.reset(); }}>Counter</Button></>}
                            {proposal.canDecline && <Button variant="ghost" className="min-h-11 flex-1 sm:flex-none" disabled={busy} onClick={() => respond.mutate({ proposalId: proposal.id, action: 'decline' })}>{busy && respond.variables?.action === 'decline' ? 'Closing…' : proposal.canWithdraw ? 'Withdraw' : 'Decline'}</Button>}
                        </div>}
                        {respond.error && respond.variables?.proposalId === proposal.id && <p role="alert" className="text-sm text-destructive">{respond.error.message}</p>}
                    </article>;
                })}
            </div>}
            {decided.length > 0 && <details className="rounded-xl border border-border p-3">
                <summary className="min-h-11 cursor-pointer py-3 text-sm">Show decided ({decided.length})</summary>
                <div className="divide-y divide-border">{decided.map(proposal => <div key={proposal.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><p>{proposal.description || 'Shared purchase'}</p><p className="text-xs text-muted-foreground">{proposal.status === 'approved' ? 'Approved' : 'Declined'} by {proposal.lastActorName}{proposal.decidedAt ? ` · ${format(new Date(proposal.decidedAt), 'MMM d, yyyy', { locale: enUS })}` : ''}</p></div><FamilyMoney amount={proposal.amount} currency={proposal.currencyCode} /></div>)}</div>
            </details>}
        </section>

        <Sheet open={counter !== null} onOpenChange={open => { if (!open && !respond.isLoading) setCounter(null); }}>
            <SheetContent side={compact ? 'bottom' : 'right'} className={sheetClass}>
                <SheetHeader><SheetTitle>Suggest a different amount</SheetTitle><SheetDescription>{counter ? `${counter.lastActorName} asked for ${counter.amount} ${counter.currencyCode} for ${counter.description || 'a shared purchase'}.` : ''}</SheetDescription></SheetHeader>
                {counter && <form className="mt-6 space-y-4" onSubmit={event => { event.preventDefault(); if (validCounter && !respond.isLoading) respond.mutate({ proposalId: counter.id, action: 'counter', amount: counterAmount }); }}>
                    <Label htmlFor="purchase-counter-amount">New amount, {counter.currencyCode}</Label>
                    <Input id="purchase-counter-amount" type="text" inputMode="decimal" value={counterAmount} disabled={respond.isLoading} onChange={event => setCounterAmount(event.target.value.replace(',', '.'))} />
                    {counterAmount && !validCounter && <p className="text-sm text-destructive">Enter a different positive amount with up to two decimals.</p>}
                    <p className="text-sm text-muted-foreground">The other adult must approve your counter, even below the limit. Nothing is spent yet.</p>
                    {respond.error && <p role="alert" className="text-sm text-destructive">{respond.error.message}</p>}
                    <Button variant="neutral" className="min-h-11 w-full" disabled={!validCounter || respond.isLoading}>{respond.isLoading ? 'Sending…' : 'Send counter'}</Button>
                </form>}
            </SheetContent>
        </Sheet>
    </div>;
}
