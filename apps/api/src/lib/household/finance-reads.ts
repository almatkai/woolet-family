import { and, eq } from 'drizzle-orm';
import { banks } from '../../db/schema/banks';
import type { DB } from './dashboard';

/** Uncached hierarchy; callers must authorize the user before using this read. */
export function readBankHierarchy(db: DB, userId: string, isTest: boolean) {
    return db.query.banks.findMany({
        where: and(eq(banks.userId, userId), eq(banks.isTest, isTest)),
        with: { accounts: { with: { currencyBalances: true } } },
    });
}
