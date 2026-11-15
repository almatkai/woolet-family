import { trpc } from "@/lib/trpc";
import { FamilySection, FamilySectionState } from "./FamilySectionShared";
import { FamilyGroupHeader, FamilyGroupList } from "./FamilyGroupList";
import { FamilyMoney, MoneyTotals, rowClass } from "./shared";
import { orderFamilyMembers } from "./permissions";
import { useFinanceView } from "./useFinanceView";
import { familyTotals } from "./familyTotals";
import type { HouseholdOverview, FamilyFinancesOutput } from "./types";

export function FamilyCredits({
  family,
}: {
  family: NonNullable<HouseholdOverview>;
}) {
  const query = trpc.household.familyFinances.useQuery({});
  const data = query.data as FamilyFinancesOutput | undefined;
  const { setView } = useFinanceView();
  const totals = (members: FamilyFinancesOutput["members"]) =>
    familyTotals(
      members.flatMap((member) =>
        member.credits.map((item) => ({
          currencyCode: item.currency,
          amount: item.remaining,
        })),
      ),
    );
  return (
    <FamilySection title="Credits" family={family}>
      {!data ? (
        <FamilySectionState
          error={!!query.error}
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          <FamilyGroupList>
            <h2 className="p-3 text-sm font-semibold">
              Family credits remaining
            </h2>
            <div className="p-3">
              <MoneyTotals
                totals={totals(data.members).map((t) => ({
                  currency: t.currencyCode,
                  amount: t.amount,
                }))}
              />
            </div>
            <div className="p-3 text-sm">
              Monthly payments
              <MoneyTotals
                totals={familyTotals(
                  data.members.flatMap((m) =>
                    m.credits.map((i) => ({
                      currencyCode: i.currency,
                      amount: i.monthlyPayment,
                    })),
                  ),
                ).map((t) => ({ currency: t.currencyCode, amount: t.amount }))}
              />
            </div>
          </FamilyGroupList>
          {!data.members.some((member) => member.credits.length) && (
            <p className="text-sm text-muted-foreground">
              No one in the family has added a credit.
            </p>
          )}
          {orderFamilyMembers(family.me, data.members).map((member) => (
            <FamilyGroupList key={member.memberId}>
              <FamilyGroupHeader
                member={member}
                totals={totals([member])}
                onManage={() => setView("personal")}
              />
              {!member.credits.length && (
                <p className="p-3 text-sm text-muted-foreground">
                  No credits added.
                </p>
              )}
              {member.credits.map((item) => (
                <div key={item.id} className={rowClass}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{`Ends ${item.endDate}`}</p>
                  </div>
                  <div className="text-right">
                    <FamilyMoney
                      amount={item.remaining}
                      currency={item.currency}
                    />
                    <p className="text-xs text-muted-foreground">
                      <FamilyMoney
                        amount={item.monthlyPayment}
                        currency={item.currency}
                      />{" "}
                      a month
                    </p>
                  </div>
                </div>
              ))}
            </FamilyGroupList>
          ))}
        </>
      )}
    </FamilySection>
  );
}
