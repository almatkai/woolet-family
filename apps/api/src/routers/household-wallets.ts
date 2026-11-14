import { TRPCError } from '@trpc/server';
import { and, eq, gte, lte, inArray, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure } from '../lib/trpc';
import { familyWallets as wallets, familyWalletTransactions as transactions, familyBudgetLimits as limits, householdMembers } from '../db/schema/households';
import { categories, currencies } from '../db/schema';
import { assertWalletAccess, getMembership } from '../lib/household/policy';
import { evaluateLimits, fromCents, periodBounds, toCents } from '../lib/household/limits';
import { FamilyLimitError } from '../lib/household/errors';
import { applyDelta, violationPayload } from '../lib/household/wallet-math';
import type { db as database } from '../db';
const amount = z.union([z.string(), z.number()]).transform(String).refine(v => /^\d+(\.\d{1,2})?$/.test(v) && Number(v)>0 && Number(v)<=1e9).transform(v => fromCents(toCents(v)));
const name = z.string().trim().min(1).max(60);
const walletInput = z.object({walletId:z.string().uuid()});
async function member(db: typeof database, userId:string) { const m = await getMembership(db,userId); if(!m) throw new TRPCError({code:'NOT_FOUND',message:'Family not found'}); return m; }
async function wallet(db: Pick<typeof database,'select'>, id:string, m: NonNullable<Awaited<ReturnType<typeof getMembership>>>, action:'view'|'income'|'manage'='view') { const [w]=await db.select().from(wallets).where(eq(wallets.id,id)).limit(1); if(!w) throw new TRPCError({code:'NOT_FOUND'}); assertWalletAccess(m,w,action); return w; }
const day = z.string().refine(v => { try { return periodBounds('weekly', v) !== null; } catch { return false; } }, 'Invalid date');
const description = z.string().trim().max(200).optional();
function checkDate(date: string, today?: string) {
 if (date > (today ?? new Date(Date.now() + 14 * 3600000).toISOString().slice(0, 10))) throw new TRPCError({code:'BAD_REQUEST',message:"Date can't be in the future"});
}
async function validateCategory(db: Pick<typeof database, 'select'>, id: string | null | undefined) {
 if (!id) return;
 const [c] = await db.select().from(categories).where(eq(categories.id,id)).limit(1);
 if (!c || c.userId !== null) throw new TRPCError({code:'BAD_REQUEST',message:'Invalid category'});
}
async function warnings(db: Pick<typeof database, 'select'>, walletId: string, value: string, categoryId: string | null, today: string) {
 const rows = await db.select({ limit: limits, categoryName: categories.name }).from(limits).leftJoin(categories,eq(limits.categoryId,categories.id)).where(eq(limits.walletId,walletId));
 const spent: Record<string,string> = {};
 for (const {limit} of rows) {
  const {start,end} = periodBounds(limit.period,today);
  const [sum] = await db.select({total: sql<string>`coalesce(sum(${transactions.amount}), 0)::text`}).from(transactions).where(and(eq(transactions.walletId,walletId),gte(transactions.date,start),lte(transactions.date,end),limit.categoryId === null ? or(eq(transactions.type,'expense'),eq(transactions.type,'transfer_out')) : and(eq(transactions.type,'expense'),eq(transactions.categoryId,limit.categoryId))));
  spent[limit.id] = sum?.total ?? '0';
 }
 return evaluateLimits(rows.map(r=>r.limit),spent,{amount:value,categoryId}).map(v=>{
  const row = rows.find(r=>r.limit.id===v.limitId)!;
  return violationPayload(row.limit,v.remaining,row.categoryName,today);
 });
}
export const householdWalletProcedures = {
 addTransaction: protectedProcedure.input(z.object({walletId:z.string().uuid(),type:z.enum(['income','expense']),amount,categoryId:z.string().uuid().nullable().optional(),description,date:day,today:day.optional()})).mutation(async({ctx,input})=>{
  const m=await member(ctx.db,ctx.userId);
  return ctx.db.transaction(async tx=>{
   const [w]=await tx.select().from(wallets).where(eq(wallets.id,input.walletId)).for('update');
   if(!w) throw new TRPCError({code:'NOT_FOUND'});
   assertWalletAccess(m,w,input.type);
   await validateCategory(tx,input.categoryId); checkDate(input.date,input.today);
   // Charge the period in which the ledger entry is recorded, including backdated expenses.
   const limitWarnings=input.type==='expense' && w.kind==='child' ? await warnings(tx,w.id,input.amount,input.categoryId ?? null,input.date) : [];
   if(m.role==='child' && limitWarnings.length) throw new TRPCError({code:'BAD_REQUEST',message:'This is more than you have left',cause:new FamilyLimitError(limitWarnings[0])});
   const balance=applyDelta(w.balance,input.amount,input.type);
   if(toCents(balance)<0) throw new TRPCError({code:'BAD_REQUEST',message:'Not enough money in this wallet'});
   const [transaction]=await tx.insert(transactions).values({walletId:w.id,type:input.type,amount:input.amount,categoryId:input.categoryId ?? null,description:input.description,date:input.date,createdByUserId:ctx.userId}).returning();
   await tx.update(wallets).set({balance,updatedAt:new Date()}).where(eq(wallets.id,w.id));
   return {transaction,balance,limitWarnings};
  });
 }),
 transfer: protectedProcedure.input(z.object({fromWalletId:z.string().uuid(),toWalletId:z.string().uuid(),amount,description,date:day,today:day.optional()})).mutation(async({ctx,input})=>{
  const m=await member(ctx.db,ctx.userId);
  if(m.role==='child') throw new TRPCError({code:'FORBIDDEN',message:"Children can't move money between wallets"});
  if(input.fromWalletId===input.toWalletId) throw new TRPCError({code:'BAD_REQUEST',message:'Choose two different wallets'});
  return ctx.db.transaction(async tx=>{
   const locked=await tx.select().from(wallets).where(inArray(wallets.id,[input.fromWalletId,input.toWalletId])).orderBy(wallets.id).for('update');
   const from=locked.find(w=>w.id===input.fromWalletId), to=locked.find(w=>w.id===input.toWalletId);
   if(!from||!to) throw new TRPCError({code:'NOT_FOUND'});
   for(const w of [from,to]) assertWalletAccess(m,w,w.kind==='child'?'manage':'transfer');
   if(from.currencyCode!==to.currencyCode) throw new TRPCError({code:'BAD_REQUEST',message:'Wallets use different currencies'});
   checkDate(input.date,input.today);
   const fromBalance=applyDelta(from.balance,input.amount,'transfer_out'),toBalance=applyDelta(to.balance,input.amount,'transfer_in');
   if(toCents(fromBalance)<0) throw new TRPCError({code:'BAD_REQUEST',message:'Not enough money in this wallet'});
   const limitWarnings=from.kind==='child'?await warnings(tx,from.id,input.amount,null,input.date):[];
   const transferGroupId=crypto.randomUUID();
   await tx.insert(transactions).values([{walletId:from.id,type:'transfer_out',amount:input.amount,description:input.description,date:input.date,transferGroupId,createdByUserId:ctx.userId},{walletId:to.id,type:'transfer_in',amount:input.amount,description:input.description,date:input.date,transferGroupId,createdByUserId:ctx.userId}]);
   for(const [id,balance] of [[from.id,fromBalance],[to.id,toBalance]] as const) await tx.update(wallets).set({balance,updatedAt:new Date()}).where(eq(wallets.id,id));
   return {transferGroupId,fromBalance,toBalance,limitWarnings};
  });
 }),
 deleteTransaction: protectedProcedure.input(z.object({transactionId:z.string().uuid()})).mutation(async({ctx,input})=>{
  const m=await member(ctx.db,ctx.userId);
  if(m.role==='child') throw new TRPCError({code:'FORBIDDEN'});
  return ctx.db.transaction(async tx=>{
   const [initial]=await tx.select().from(transactions).where(eq(transactions.id,input.transactionId)).limit(1);
   if(!initial) throw new TRPCError({code:'NOT_FOUND'});
   const predicate=initial.transferGroupId?eq(transactions.transferGroupId,initial.transferGroupId):eq(transactions.id,initial.id);
   const initialRows=await tx.select().from(transactions).where(predicate);
   const ids=[...new Set(initialRows.map(row=>row.walletId))].sort();
   if(!ids.length) throw new TRPCError({code:'NOT_FOUND'});
   const locked=await tx.select().from(wallets).where(inArray(wallets.id,ids)).orderBy(wallets.id).for('update');
   if(locked.length!==ids.length) throw new TRPCError({code:'NOT_FOUND'});
   for(const w of locked) assertWalletAccess(m,w,w.kind==='child'?'manage':'income');
   // Another deletion may have committed while waiting for the wallet locks.
   const rows=await tx.select().from(transactions).where(predicate);
   if(!rows.some(row=>row.id===initial.id)) throw new TRPCError({code:'NOT_FOUND'});
   const balances=locked.map(w=>({walletId:w.id,balance:rows.filter(row=>row.walletId===w.id).reduce((balance,row)=>applyDelta(balance,row.amount,row.type,true),w.balance)}));
   if(balances.some(b=>toCents(b.balance)<0)) throw new TRPCError({code:'BAD_REQUEST',message:'This would make the wallet balance negative'});
   await tx.delete(transactions).where(predicate);
   for(const b of balances) await tx.update(wallets).set({balance:b.balance,updatedAt:new Date()}).where(eq(wallets.id,b.walletId));
   return {success:true,balances};
  });
 }),
 createWallet: protectedProcedure.input(z.object({kind:z.enum(['shared','child']),name,currencyCode:z.string(),childMemberId:z.string().uuid().optional()})).mutation(async({ctx,input})=>{
 const m=await member(ctx.db,ctx.userId);
 if(m.role==='child'||(input.kind==='child'&&m.role!=='owner'&&!m.isGuardian)) throw new TRPCError({code:'FORBIDDEN'});
 if(input.kind==='child') { const [child]=await ctx.db.select().from(householdMembers).where(and(eq(householdMembers.id,input.childMemberId??'00000000-0000-0000-0000-000000000000'),eq(householdMembers.householdId,m.householdId),eq(householdMembers.status,'active'),eq(householdMembers.role,'child'))).limit(1); if(!child) throw new TRPCError({code:'BAD_REQUEST',message:'Active child member required'}); }
 const [currency]=await ctx.db.select().from(currencies).where(eq(currencies.code,input.currencyCode)).limit(1); if(!currency) throw new TRPCError({code:'BAD_REQUEST',message:'Unknown currency'});
 const [result]=await ctx.db.insert(wallets).values({...input,childMemberId:input.kind==='child'?input.childMemberId:null,householdId:m.householdId,createdByUserId:ctx.userId}).returning(); return result;
 }),
 updateWallet:protectedProcedure.input(walletInput.extend({name})).mutation(async({ctx,input})=>{const m=await member(ctx.db,ctx.userId);const w=await wallet(ctx.db,input.walletId,m);assertWalletAccess(m,w,w.kind==='child'?'manage':'income');const [result]=await ctx.db.update(wallets).set({name:input.name,updatedAt:new Date()}).where(eq(wallets.id,w.id)).returning();return result;}),
 archiveWallet:protectedProcedure.input(walletInput).mutation(async({ctx,input})=>{const m=await member(ctx.db,ctx.userId);return ctx.db.transaction(async tx=>{const [w]=await tx.select().from(wallets).where(eq(wallets.id,input.walletId)).for('update');if(!w)throw new TRPCError({code:'NOT_FOUND'});assertWalletAccess(m,w,w.kind==='child'?'manage':'income');if(toCents(w.balance)!==0)throw new TRPCError({code:'BAD_REQUEST',message:'Move the money out before archiving'});const [result]=await tx.update(wallets).set({archivedAt:new Date(),updatedAt:new Date()}).where(eq(wallets.id,w.id)).returning();return result;});}),
 setLimit:protectedProcedure.input(walletInput.extend({categoryId:z.string().uuid().nullable(),period:z.enum(['weekly','monthly']),amount})).mutation(async({ctx,input})=>{const m=await member(ctx.db,ctx.userId);return ctx.db.transaction(async tx=>{const [w]=await tx.select().from(wallets).where(eq(wallets.id,input.walletId)).for('update');if(!w)throw new TRPCError({code:'NOT_FOUND'});assertWalletAccess(m,w,'manage');if(input.categoryId){const [c]=await tx.select().from(categories).where(eq(categories.id,input.categoryId)).limit(1);if(!c||c.userId!==null)throw new TRPCError({code:'BAD_REQUEST',message:'Invalid category'});}const [result]=await tx.insert(limits).values({...input,updatedByUserId:ctx.userId}).onConflictDoUpdate({target:input.categoryId?[limits.walletId,limits.categoryId,limits.period]:[limits.walletId,limits.period],targetWhere:input.categoryId?sql`${limits.categoryId} is not null`:isNull(limits.categoryId),set:{amount:input.amount,updatedByUserId:ctx.userId,updatedAt:new Date()}}).returning();return result;});}),
 deleteLimit:protectedProcedure.input(z.object({limitId:z.string().uuid()})).mutation(async({ctx,input})=>{const m=await member(ctx.db,ctx.userId);const [l]=await ctx.db.select().from(limits).where(eq(limits.id,input.limitId)).limit(1);if(!l)throw new TRPCError({code:'NOT_FOUND'});await wallet(ctx.db,l.walletId,m,'manage');await ctx.db.delete(limits).where(eq(limits.id,l.id));return {success:true};}),
};
