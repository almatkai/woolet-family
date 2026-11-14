import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

const BATCH_DELAY_MS = 2000;
const PENDING_STORAGE_KEY = 'woolet:pending-read-notification-ids';
const MAX_BATCH_SIZE = 100;
const IDS_ADDED_EVENT = 'woolet:notification-read-ids-added';
const IDS_COMPLETED_EVENT = 'woolet:notification-read-ids-completed';
const IDS_ROLLED_BACK_EVENT = 'woolet:notification-read-ids-rolled-back';
let hasClaimedPersistedQueue = false;

function readPersistedIds(): string[] {
    if (typeof window === 'undefined') return [];

    try {
        const value = window.localStorage.getItem(PENDING_STORAGE_KEY);
        if (!value) return [];

        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed.filter((id): id is string => typeof id === 'string')
            : [];
    } catch {
        return [];
    }
}

function writePersistedIds(ids: Iterable<string>) {
    if (typeof window === 'undefined') return;

    try {
        const values = Array.from(new Set(ids));
        if (values.length === 0) {
            window.localStorage.removeItem(PENDING_STORAGE_KEY);
        } else {
            window.localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(values));
        }
    } catch {
        // The in-memory queue still works when storage is unavailable.
    }
}

function persistIds(ids: Iterable<string>) {
    const addedIds = Array.from(ids);
    writePersistedIds([...readPersistedIds(), ...addedIds]);
    window.dispatchEvent(new CustomEvent(IDS_ADDED_EVENT, { detail: addedIds }));
}

function removePersistedIds(ids: Iterable<string>) {
    const completed = Array.from(ids);
    const completedIds = new Set(completed);
    writePersistedIds(readPersistedIds().filter(id => !completedIds.has(id)));
    window.dispatchEvent(new CustomEvent(IDS_COMPLETED_EVENT, { detail: completed }));
}

function rollBackIds(ids: Iterable<string>) {
    window.dispatchEvent(new CustomEvent(IDS_ROLLED_BACK_EVENT, {
        detail: Array.from(ids),
    }));
}

export function useBatchedMarkNotificationsAsRead() {
    const utils = trpc.useContext();
    const queuedIdsRef = useRef(new Set<string>());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flushQueueRef = useRef<() => void>(() => undefined);
    const [optimisticReadIds, setOptimisticReadIds] = useState<Set<string>>(
        () => new Set(readPersistedIds())
    );

    const mutation = trpc.notification.markAsRead.useMutation({
        onSuccess: async (_result: unknown, variables: { id: string }) => {
            removePersistedIds([variables.id]);
            await utils.notification.list.invalidate();
            setOptimisticReadIds(current => {
                const next = new Set(current);
                next.delete(variables.id);
                return next;
            });
        },
        onError: (_error: unknown, variables: { id: string }) => {
            rollBackIds([variables.id]);
            setOptimisticReadIds(current => {
                const next = new Set(current);
                next.delete(variables.id);
                return next;
            });
            toast.error('Could not mark notifications as read');
        },
    });

    const markQueuedNotifications = useCallback(async (ids: string[]) => {
        await Promise.allSettled(ids.map(id => mutation.mutateAsync({ id })));
    }, [mutation]);

    const flushQueue = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        const ids = Array.from(queuedIdsRef.current).slice(0, MAX_BATCH_SIZE);
        ids.forEach(id => queuedIdsRef.current.delete(id));

        if (ids.length > 0) {
            void markQueuedNotifications(ids);
        }

        if (queuedIdsRef.current.size > 0) {
            timerRef.current = setTimeout(() => flushQueueRef.current(), 0);
        }
    }, [markQueuedNotifications]);

    useEffect(() => {
        flushQueueRef.current = flushQueue;
    }, [flushQueue]);

    const markAsRead = useCallback((id: string) => {
        setOptimisticReadIds(current => {
            if (current.has(id)) return current;
            const next = new Set(current);
            next.add(id);
            return next;
        });

        queuedIdsRef.current.add(id);
        persistIds([id]);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flushQueue, BATCH_DELAY_MS);
    }, [flushQueue]);

    useEffect(() => {
        if (!hasClaimedPersistedQueue) {
            hasClaimedPersistedQueue = true;
            const persistedIds = readPersistedIds();

            if (persistedIds.length > 0) {
                persistedIds.forEach(id => queuedIdsRef.current.add(id));
                timerRef.current = setTimeout(flushQueue, 0);
            }
        }

        const handlePageHide = () => flushQueue();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushQueue();
        };
        const addOptimisticIds = (event: Event) => {
            const ids = (event as CustomEvent<string[]>).detail;
            setOptimisticReadIds(current => new Set([...current, ...ids]));
        };
        const removeOptimisticIds = (event: Event) => {
            const ids = new Set((event as CustomEvent<string[]>).detail);
            setOptimisticReadIds(current => {
                const next = new Set(current);
                ids.forEach(id => next.delete(id));
                return next;
            });
        };

        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener(IDS_ADDED_EVENT, addOptimisticIds);
        window.addEventListener(IDS_COMPLETED_EVENT, removeOptimisticIds);
        window.addEventListener(IDS_ROLLED_BACK_EVENT, removeOptimisticIds);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener(IDS_ADDED_EVENT, addOptimisticIds);
            window.removeEventListener(IDS_COMPLETED_EVENT, removeOptimisticIds);
            window.removeEventListener(IDS_ROLLED_BACK_EVENT, removeOptimisticIds);
            flushQueue();
        };
    }, [flushQueue]);

    return {
        markAsRead,
        optimisticReadIds,
    };
}
