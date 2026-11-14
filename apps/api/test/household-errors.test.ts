import { describe, expect, test } from 'bun:test';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../src/lib/trpc';
import { FamilyLimitError } from '../src/lib/household/errors';
import { createMockContext } from './utils';

describe('family limit errors', () => {
    test('errorFormatter exposes the limit payload as data.limitViolation', async () => {
        const payload = { code: 'LIMIT_EXCEEDED' as const, limitId: 'l1', categoryId: null, categoryName: null, period: 'weekly' as const, remaining: '4.50', periodEnd: '2026-11-15' };
        const r = router({
            boom: protectedProcedure.input(z.void()).mutation(() => {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'This is more than you have left', cause: new FamilyLimitError(payload) });
            }),
        });
        const shapes: any[] = [];
        const caller = r.createCaller(createMockContext());
        await expect(caller.boom()).rejects.toBeInstanceOf(TRPCError);
        const error = await caller.boom().catch((e) => e);
        expect(error.cause).toBeInstanceOf(FamilyLimitError);
        const shape = r._def._config.errorFormatter({ shape: { message: error.message, code: -32600, data: { code: 'BAD_REQUEST', httpStatus: 400 } } as any, error, type: 'mutation', path: 'boom', input: undefined, ctx: undefined });
        shapes.push(shape);
        expect((shape as any).data.limitViolation).toEqual(payload);
    });
});
