import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { toast } from 'sonner';
import { trpc } from '../../src/lib/trpc';
import { AddBankSheet } from '../../src/components/AddBankSheet';
import { AddDebtSheet } from '../../src/components/AddDebtSheet';
import { AddDebtForm } from '../../src/components/AddDebtForm';
import { AddTransactionForm } from '../../src/components/AddTransactionForm';
import { AddCurrencyBalanceSheet } from '../../src/components/AddCurrencyBalanceSheet';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../../src/components/ui/sheet';
import { ThemeProvider } from '../../src/components/theme-provider';
import { Toaster } from '../../src/components/ui/sonner';
import '../../src/index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const client = trpc.createClient({
    transformer: superjson,
    links: [httpBatchLink({ url: '/trpc' })],
});

function Fixture() {
    const [form, setForm] = useState<'debt' | 'transaction' | null>(null);
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <trpc.Provider client={client} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    <AddBankSheet />
                    <AddDebtSheet trigger={<button>Open real debt sheet</button>} />
                    <AddCurrencyBalanceSheet
                        accountId="account"
                        accountName="Main Card"
                        trigger={<button>Add Currency</button>}
                    />
                    <button onClick={() => setForm('debt')}>Open debt</button>
                    <button onClick={() => setForm('transaction')}>Open transaction</button>
                    <button onClick={() => toast.error('Failed to add bank')}>Trigger Error Toast</button>
                    <Sheet open={form !== null} onOpenChange={(open) => { if (!open) setForm(null); }}>
                        <SheetContent side="bottom" className="h-[92dvh]">
                            <SheetTitle>{form === 'debt' ? 'Add Debt' : 'Add Transaction'}</SheetTitle>
                            <SheetDescription>Interaction test</SheetDescription>
                            {form === 'debt' && <AddDebtForm onSuccess={() => setForm(null)} onCancel={() => setForm(null)} />}
                            {form === 'transaction' && <AddTransactionForm onSuccess={() => setForm(null)} onCancel={() => setForm(null)} />}
                        </SheetContent>
                    </Sheet>
                    <Toaster position="bottom-right" closeButton duration={5000} />
                </QueryClientProvider>
            </trpc.Provider>
        </ThemeProvider>
    );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
