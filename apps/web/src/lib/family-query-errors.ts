import { QueryClient } from '@tanstack/react-query';

/** Expected denials render the member-unavailable state, without error telemetry. */
export function isUnavailableMemberError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('data' in error)) return false;
    const data = error.data as { code?: string; path?: string } | undefined;
    return (data?.code === 'NOT_FOUND' || data?.code === 'FORBIDDEN') &&
        ['household.familyFinances', 'household.overview', 'household.familyTransactions'].includes(data.path ?? '');
}

/** QueryCache uses this logger for handled query failures in development. */
export class FinanceQueryClient extends QueryClient {
    override getLogger() {
        const logger = super.getLogger();
        return {
            ...logger,
            error: (error: unknown) => {
                if (!isUnavailableMemberError(error)) logger.error(error);
            },
        };
    }
}
