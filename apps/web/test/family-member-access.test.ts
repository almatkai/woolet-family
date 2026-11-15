import { expect, test, spyOn } from 'bun:test';
import { canRequestMemberFinances } from '../src/components/family/permissions';
import { FinanceQueryClient, isUnavailableMemberError } from '../src/lib/family-query-errors';
import type { HouseholdOverview } from '../src/components/family/types';

function family(role: 'owner' | 'adult' | 'child', guardian = false) {
    return { me: { role, isGuardian: guardian }, members: [
        { id: 'adult', role: 'adult' }, { id: 'child', role: 'child' },
    ] } as NonNullable<HouseholdOverview>;
}

test('solo, child and non-guardian member routes do not enable forbidden queries', () => {
    expect(canRequestMemberFinances(undefined, 'adult')).toBe(false);
    expect(canRequestMemberFinances(null, 'adult')).toBe(false);
    expect(canRequestMemberFinances(family('child'), 'adult')).toBe(false);
    expect(canRequestMemberFinances(family('child'), 'child')).toBe(false);
    expect(canRequestMemberFinances(family('adult'), 'child')).toBe(false);
    expect(canRequestMemberFinances(family('owner'), 'missing')).toBe(false);
    expect(canRequestMemberFinances(family('adult'), 'adult')).toBe(true);
    expect(canRequestMemberFinances(family('owner'), 'child')).toBe(true);
    expect(canRequestMemberFinances(family('adult', true), 'child')).toBe(true);
});

test('only expected family access denials are excluded from error logging', () => {
    expect(isUnavailableMemberError({ data: { code: 'NOT_FOUND', path: 'household.familyFinances' } })).toBe(true);
    expect(isUnavailableMemberError({ data: { code: 'FORBIDDEN', path: 'household.familyTransactions' } })).toBe(true);
    expect(isUnavailableMemberError({ data: { code: 'INTERNAL_SERVER_ERROR', path: 'household.familyFinances' } })).toBe(false);
    expect(isUnavailableMemberError({ data: { code: 'NOT_FOUND', path: 'account.get' } })).toBe(false);
    expect(isUnavailableMemberError(new Error('network failed'))).toBe(false);
});

test('handled member denial does not log on startup or query failure', async () => {
    const errors = spyOn(console, 'error').mockImplementation(() => {});
    const client = new FinanceQueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
    try {
        expect(errors).not.toHaveBeenCalled();
        const denial = Object.assign(new Error('Member not found'), { data: { code: 'NOT_FOUND', path: 'household.familyFinances' } });
        await expect(client.fetchQuery({ queryKey: ['denied-member'], queryFn: () => Promise.reject(denial) })).rejects.toBe(denial);
        expect(errors).not.toHaveBeenCalled();
        client.getLogger().error(new Error('Unexpected failure'));
        expect(errors).toHaveBeenCalledTimes(1);
    } finally {
        client.clear();
        errors.mockRestore();
    }
});
