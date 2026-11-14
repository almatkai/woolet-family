import { expect, test } from 'bun:test';
import { applyDelta, violationPayload } from '../src/lib/household/wallet-math';

test('ledger applies and reverses integer cent deltas', () => {
 expect(applyDelta('0.10','0.20','income')).toBe('0.30');
 expect(applyDelta('0.30','0.20','expense')).toBe('0.10');
 expect(applyDelta('0.30','0.20','transfer_in',true)).toBe('0.10');
 expect(applyDelta('0.10','0.20','transfer_out',true)).toBe('0.30');
});
test('builds a limit violation payload', () => {
 expect(violationPayload({id:'limit',period:'monthly',amount:'10.00',categoryId:'category'},'0.10','Food','2024-02-15')).toEqual({code:'LIMIT_EXCEEDED',limitId:'limit',categoryId:'category',categoryName:'Food',period:'monthly',remaining:'0.10',periodEnd:'2024-02-29'});
});
