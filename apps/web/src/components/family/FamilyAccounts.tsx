import { useSearch } from '@tanstack/react-router';
import { familyTotals } from './familyTotals';
import { trpc } from '@/lib/trpc';
import {
    FamilySection,
    FamilySectionState,
    FamilySectionTotal,
} from './FamilySectionShared';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';
import { MoneyTotals, rowClass } from './shared';
import { orderFamilyMembers } from './permissions';
import { useFinanceView } from './useFinanceView';
import { WalletRow } from './WalletRow';
import {
    localToday,
    type HouseholdOverview,
    type FamilyFinancesOutput,
    type FamilyWalletsResponse,
} from './types';
export function FamilyAccounts({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    const search = useSearch({ strict: false });
    const query = trpc.household.familyFinances.useQuery({ currency: search.currency });
    const wallets = trpc.household.wallets.useQuery({ today: localToday() });
    const data = query.data as FamilyFinancesOutput | undefined;
    const { setView } = useFinanceView();
    return (
        <FamilySection title="Accounts" family={family}>
            {data ? (
                <>
                    <FamilySectionTotal
                        unconvertedCurrencies={data.unconvertedCurrencies}
                        label="Family balances"
                        totals={data.summary.balances}
                        converted={data.summary.balancesConverted}
                        currency={data.displayCurrency}
                    />
                    {orderFamilyMembers(family.me, data.members).map(
                        (member) => (
                            <FamilyGroupList key={member.memberId}>
                                <FamilyGroupHeader
                                    member={member}
                                    totals={familyTotals(
                                        member.accounts.flatMap((a) =>
                                            a.balances.map((b) => ({
                                                currencyCode: b.currencyCode,
                                                amount: b.balance,
                                            })),
                                        ),
                                    )}
                                    onManage={() => setView('personal')}
                                />
                                {!member.accounts.length && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        No accounts added.
                                    </p>
                                )}
                                {[
                                    ...new Set(
                                        member.accounts.map((a) => a.bankName),
                                    ),
                                ].map((bank) => (
                                    <section key={bank}>
                                        <h3 className="px-3 pt-3 text-xs text-muted-foreground">
                                            {bank}
                                        </h3>
                                        {member.accounts
                                            .filter((a) => a.bankName === bank)
                                            .map((account) => (
                                                <div
                                                    key={account.id}
                                                    className={rowClass}
                                                >
                                                    <span className="min-w-0 flex-1 text-sm">
                                                        {account.accountName}
                                                        {account.last4
                                                            ? ` •••• ${account.last4}`
                                                            : ''}
                                                    </span>
                                                    <MoneyTotals
                                                        totals={account.balances.map(
                                                            (b) => ({
                                                                currency:
                                                                    b.currencyCode,
                                                                amount: b.balance,
                                                            }),
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                    </section>
                                ))}
                            </FamilyGroupList>
                        ),
                    )}
                </>
            ) : (
                <FamilySectionState
                    error={!!query.error}
                    retry={() => void query.refetch()}
                />
            )}
            <FamilyGroupList>
                <h2 className="p-3 text-sm font-semibold">Family wallets</h2>
                {wallets.error ? (
                    <FamilySectionState
                        error
                        retry={() => void wallets.refetch()}
                    />
                ) : !wallets.data ? (
                    <FamilySectionState error={false} retry={() => {}} />
                ) : (wallets.data as FamilyWalletsResponse).wallets.length ? (
                    (wallets.data as FamilyWalletsResponse).wallets.map(
                        (wallet) => (
                            <WalletRow key={wallet.id} wallet={wallet} />
                        ),
                    )
                ) : (
                    <p className="p-3 text-sm text-muted-foreground">
                        No family wallets yet.
                    </p>
                )}
            </FamilyGroupList>
        </FamilySection>
    );
}
