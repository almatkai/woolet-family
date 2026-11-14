import { expect, test } from 'bun:test';
import { householdRouter } from '../../src/routers/household';
import { familyWallets, familyWalletTransactions, familyBudgetLimits, householdMembers } from '../../src/db/schema/households';
import { categories } from '../../src/db/schema';
import { FamilyLimitError } from '../../src/lib/household/errors';
import { createMockContext } from '../utils';
const householdId='11111111-1111-4111-8111-111111111111', memberId='22222222-2222-4222-8222-222222222222', walletId='33333333-3333-4333-8333-333333333333', categoryId='44444444-4444-4444-8444-444444444444';
const input={walletId,type:'expense' as const,amount:'2.00',date:'2024-02-15',today:'2024-02-15'};
function setup(options: {role?:string; balance?:string; limit?:any; spent?:string; category?:any; childMemberId?:string; secondWallet?:any; transactionRows?:any[]}={}) {
 const m={id:memberId,householdId,userId:'user',role:options.role??'child',isGuardian:true};
 const w={id:walletId,householdId,kind:'child',childMemberId:options.childMemberId??memberId,archivedAt:null,balance:options.balance??'20.00',currencyCode:'USD'};
 const writes:any[]=[];
 const db:any={transaction:async(fn:any)=>fn(db),select:(fields:any)=>({from:(table:any)=>{
  const value=()=>table===householdMembers?[{membership:m,household:{id:householdId}}]:table===familyWallets?[w,...(options.secondWallet?[options.secondWallet]:[])]:table===familyBudgetLimits?(options.limit?[{limit:options.limit,categoryName:'Food'}]:[]):table===categories?(options.category?[options.category]:[]):table===familyWalletTransactions?(fields?.total?[{total:options.spent??'0'}]:(options.transactionRows??[])):[];
  const chain:any={innerJoin:()=>chain,leftJoin:()=>chain,where:()=>chain,orderBy:()=>chain,limit:async()=>value(),for:async()=>value(),then:(resolve:any,reject:any)=>Promise.resolve(value()).then(resolve,reject)};return chain;
 }}),insert:(table:any)=>({values:(values:any)=>{writes.push({table,values});return {returning:async()=>[{id:'new',...values}],then:(resolve:any,reject:any)=>Promise.resolve().then(resolve,reject)};}}),update:(table:any)=>({set:(values:any)=>({where:async()=>{writes.push({table,values});}})}),delete:(table:any)=>({where:async()=>{writes.push({table,deleted:true});}})};
 return {caller:householdRouter.createCaller(createMockContext({userId:'user',db})),writes};
}
const limit={id:'limit',walletId,period:'monthly',amount:'10.00',categoryId:null};
test('child expense at limit succeeds',async()=>{const {caller}=setup({limit,spent:'8.00'});expect((await caller.addTransaction(input)).balance).toBe('18.00');});
test('child limit violation has structured cause',async()=>{try {await setup({limit,spent:'9.00'}).caller.addTransaction(input);throw Error('expected failure');} catch(e:any){expect(e.cause).toBeInstanceOf(FamilyLimitError);expect(e.cause.payload).toMatchObject({limitId:'limit',remaining:'1.00',periodEnd:'2024-02-29',categoryId:null});}});
test('backdated child expense checks the recorded period regardless of supplied today', async () => {
 for (const today of ['2024-02-15', '2024-03-15']) {
  const {caller, writes} = setup({limit, spent:'9.00'});
  await expect(caller.addTransaction({...input, date:'2024-01-20', today})).rejects.toMatchObject({
   cause: {payload: {periodEnd:'2024-01-31', remaining:'1.00'}},
  });
  expect(writes).toEqual([]);
 }
});
test('adult receives warnings; category limits carry category id',async()=>{const {caller}=setup({role:'owner',limit:{...limit,categoryId},spent:'9.00',category:{id:categoryId,userId:null}});expect((await caller.addTransaction({...input,categoryId})).limitWarnings[0]).toMatchObject({categoryId,categoryName:'Food'});});
test('child expense within limit succeeds',async()=>{expect((await setup({limit,spent:'1.00'}).caller.addTransaction(input)).limitWarnings).toEqual([]);});
test('child category violation identifies its category',async()=>{try {await setup({limit:{...limit,categoryId},spent:'9.00',category:{id:categoryId,userId:null}}).caller.addTransaction({...input,categoryId});throw Error('expected failure');} catch(e:any){expect(e.cause).toBeInstanceOf(FamilyLimitError);expect(e.cause.payload).toMatchObject({categoryId,categoryName:'Food'});}});
test('policy, balance, categories and dates are checked',async()=>{
 await expect(setup().caller.addTransaction({...input,type:'income'})).rejects.toMatchObject({code:'FORBIDDEN'});
 await expect(setup({childMemberId:categoryId}).caller.addTransaction(input)).rejects.toMatchObject({code:'NOT_FOUND'});
 await expect(setup({balance:'1.00'}).caller.addTransaction(input)).rejects.toThrow('Not enough money in this wallet');
 await expect(setup({category:{id:categoryId,userId:'user'}}).caller.addTransaction({...input,categoryId})).rejects.toThrow('Invalid category');
 await expect(setup().caller.addTransaction({...input,date:'2024-02-16'})).rejects.toThrow("Date can't be in the future");
 await expect(setup({role:'owner',category:{id:categoryId,userId:'user'}}).caller.setLimit({walletId,categoryId,period:'monthly',amount:'10'})).rejects.toThrow('Invalid category');
});
const secondId='55555555-5555-4555-8555-555555555555';
const secondWallet={id:secondId,householdId,kind:'shared',childMemberId:null,archivedAt:null,balance:'5.00',currencyCode:'USD'};
const transferInput={fromWalletId:walletId,toWalletId:secondId,amount:'2',date:'2024-02-15',today:'2024-02-15'};
test('backdated child-wallet transfer warns for the recorded period', async () => {
 const {caller} = setup({role:'owner', secondWallet, limit, spent:'9.00'});
 const result = await caller.transfer({...transferInput, date:'2024-01-20'});
 expect(result.limitWarnings).toMatchObject([{periodEnd:'2024-01-31', remaining:'1.00'}]);
});
test('transfer rejects child, identical wallets, and currencies',async()=>{
 await expect(setup().caller.transfer(transferInput)).rejects.toThrow("Children can't move money between wallets");
 await expect(setup({role:'owner'}).caller.transfer({...transferInput,toWalletId:walletId})).rejects.toThrow('Choose two different wallets');
 await expect(setup({role:'owner',secondWallet:{...secondWallet,currencyCode:'EUR'}}).caller.transfer(transferInput)).rejects.toThrow('Wallets use different currencies');
});
test('transfer writes paired legs and both balances',async()=>{
 const {caller,writes}=setup({role:'owner',secondWallet,limit,spent:'9.00'}); const result=await caller.transfer(transferInput);
 expect(result).toMatchObject({fromBalance:'18.00',toBalance:'7.00',limitWarnings:[{limitId:'limit'}]});
 expect(writes[0].values).toEqual([expect.objectContaining({type:'transfer_out',transferGroupId:result.transferGroupId}),expect.objectContaining({type:'transfer_in',transferGroupId:result.transferGroupId})]);
 expect(writes.slice(1).map(w=>w.values.balance)).toEqual(['18.00','7.00']);
});
test('delete transfer reverses both legs and denies children',async()=>{
 const transactionRows=[{id:categoryId,walletId,type:'transfer_out',amount:'2.00',transferGroupId:'group'},{id:secondId,walletId:secondId,type:'transfer_in',amount:'2.00',transferGroupId:'group'}];
 await expect(setup().caller.deleteTransaction({transactionId:categoryId})).rejects.toMatchObject({code:'FORBIDDEN'});
 const {caller,writes}=setup({role:'owner',secondWallet,transactionRows});
 expect(await caller.deleteTransaction({transactionId:categoryId})).toEqual({success:true,balances:[{walletId,balance:'22.00'},{walletId:secondId,balance:'3.00'}]});
 expect(writes[0]).toMatchObject({table:familyWalletTransactions,deleted:true});
 await expect(setup({role:'owner',secondWallet:{...secondWallet,balance:'1.00'},transactionRows}).caller.deleteTransaction({transactionId:categoryId})).rejects.toThrow('This would make the wallet balance negative');
});
