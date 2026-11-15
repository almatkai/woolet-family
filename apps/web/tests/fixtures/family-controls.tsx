import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc } from '../../src/lib/trpc';
import { FamilyTransactionSheet } from '../../src/components/family/FamilyTransactionSheet';
import { LimitSheet } from '../../src/components/family/LimitSheet';
import { PurchaseApprovals } from '../../src/components/family/PurchaseApprovals';
import type { FamilyLimit, FamilyWallet } from '../../src/components/family/types';
import '../../src/index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const client = trpc.createClient({ transformer: superjson, links: [httpBatchLink({ url: '/trpc' })] });
const shared: FamilyWallet = {
    id: 'shared', kind: 'shared', name: 'Groceries', currencyCode: 'USD', balance: '100.00',
    childMemberId: null, childName: null, canWrite: true, canManage: true,
    canDeleteTransactions: true, limitSummary: null,
};
const children: FamilyWallet[] = ['Alex', 'Riley'].map((name) => ({
    ...shared, id: name.toLowerCase(), kind: 'child', name: `${name}'s wallet`,
    childMemberId: name.toLowerCase(), childName: name,
}));
const limits: FamilyLimit[] = [{
    id: 'limit', categoryId: null, categoryName: null, period: 'monthly', amount: '10.00',
    spent: '9.00', remaining: '1.00', periodStart: '2026-11-01', periodEnd: '2026-11-30',
}];

function Fixture() {
    const [form, setForm] = useState<'shared' | 'child' | 'expense' | 'limits' | 'approval' | 'proposals' | null>(null);
    return (
        <trpc.Provider client={client} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <button onClick={() => setForm('shared')}>Transfer from shared</button>
                <button onClick={() => setForm('child')}>Transfer from child</button>
                <button onClick={() => setForm('expense')}>Child expense</button>
                <button onClick={() => setForm('limits')}>Edit limits</button>
                <button onClick={() => setForm('approval')}>Shared purchase</button>
                <button onClick={() => setForm('proposals')}>Purchase proposals</button>
                {form === 'proposals' && <PurchaseApprovals wallets={[{ ...shared, balance: '2020.00' }]} onNewPurchase={() => setForm('approval')} />}
                {form === 'limits' ? (
                    <LimitSheet wallet={children[0]} limits={limits} onClose={() => setForm(null)} />
                ) : form && form !== 'proposals' && (
                    <FamilyTransactionSheet
                        key={form}
                        open
                        mode={form === 'expense' ? 'child' : form === 'approval' ? 'add' : 'transfer'}
                        wallets={form === 'expense'
                            ? children.map((wallet) => ({ ...wallet, canManage: false }))
                            : form === 'approval' ? [{ ...shared, balance: '2020.00' }] : [shared, ...children]}
                        presetWalletId={form === 'expense' ? undefined : form === 'shared' || form === 'approval' ? shared.id : children[0].id}
                        onOpenChange={(open) => { if (!open) setForm(null); }}
                    />
                )}
            </QueryClientProvider>
        </trpc.Provider>
    );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
