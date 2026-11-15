import { and, eq, inArray } from 'drizzle-orm';
import { debts } from '../../db/schema/debts';
import { banks } from '../../db/schema/banks';
import { subscriptions, credits, mortgages, deposits } from '../../db/schema';
import type { DB } from './dashboard';

/** Uncached hierarchy; callers must authorize the user before using this read. */
export function readBankHierarchy(db: DB, userId: string, isTest: boolean) {
    return db.query.banks.findMany({
        where: and(eq(banks.userId, userId), eq(banks.isTest, isTest)),
        with: { accounts: { with: { currencyBalances: true } } },
    });
}

export const ownedActiveDebts = (userId: string, isTest: boolean) => and(
    eq(debts.userId, userId), eq(debts.isTest, isTest), eq(debts.lifecycleStatus, 'active'),
);

/** Same ownership reads as memberFinances; no personal-user caches are shared. */
export async function readMemberProducts(db: DB, userId: string, accountIds: string[]) {
    const [activeSubscriptions, debtRows, creditRows, mortgageRows, depositRows] = await Promise.all([
        db.query.subscriptions.findMany({ where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')) }),
        db.query.debts.findMany({ where: ownedActiveDebts(userId, false), with: { currencyBalance: true } }),
        accountIds.length ? db.query.credits.findMany({ where: inArray(credits.accountId, accountIds) }) : [],
        accountIds.length ? db.query.mortgages.findMany({ where: inArray(mortgages.accountId, accountIds) }) : [],
        accountIds.length ? db.query.deposits.findMany({ where: inArray(deposits.accountId, accountIds) }) : [],
    ]);
    return { activeSubscriptions, debtRows, creditRows, mortgageRows, depositRows };
}
