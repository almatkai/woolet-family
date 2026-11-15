import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import type { db as database } from '../../db';
import { users } from '../../db/schema/users';
import { fromCents, toCents } from './limits';
import { householdMembers } from '../../db/schema/households';
import { getMembership } from './policy';

export type DB = typeof database;
export async function dashboardMembership(db: DB, userId: string) {
    const member = await getMembership(db, userId);
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });
    return member;
}
export async function householdBaseCurrency(db: DB, ownerUserId: string): Promise<string> {
    const owner = await db.query.users.findFirst({ where: eq(users.id, ownerUserId), columns: { defaultCurrency: true } });
    if (!owner) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family owner not found' });
    return owner.defaultCurrency;
}

/** Rates are base -> foreign, so foreign amounts must be divided by the rate. */
export function baseConverter(baseCurrency: string, rates: Record<string, number>) {
    const missing = new Set<string>();
    const convert = (amount: string, currencyCode: string): string | null => {
        const rate = currencyCode === baseCurrency ? 1 : rates[currencyCode];
        if (!Number.isFinite(rate) || rate <= 0) { missing.add(currencyCode); return null; }
        return fromCents(Math.round(toCents(String(amount)) / rate));
    };
    return { convert, missing };
}

// PostgreSQL JSON aggregation may decode numeric columns as JS numbers.
export const moneyAmount = (amount: string): string => fromCents(toCents(String(amount)));

export function readFamilyMembers(db: DB, householdId: string) {
    return db.select({ member: householdMembers, name: users.name, email: users.email }).from(householdMembers)
        .innerJoin(users, eq(users.id, householdMembers.userId))
        .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.status, 'active')));
}
export const memberName = (row: { name: string | null; email: string }) => row.name?.trim() || row.email.split('@')[0];
export function orderFamilyMembers<T extends { member: { id: string; userId: string; role: string }; name: string | null; email: string }>(rows: T[], userId: string): T[] {
    const rank = (row: T) => row.member.userId === userId ? 0 : row.member.role === 'child' ? 2 : 1;
    return [...rows].sort((a, b) => rank(a) - rank(b) || memberName(a).localeCompare(memberName(b)) || a.member.id.localeCompare(b.member.id));
}
