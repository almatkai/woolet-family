import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { db as database } from '../../db';
import { users } from '../../db/schema/users';
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
