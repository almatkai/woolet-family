import { and, eq } from 'drizzle-orm';
import { debts } from '../../db/schema/debts';
import { banks } from '../../db/schema/banks';
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
