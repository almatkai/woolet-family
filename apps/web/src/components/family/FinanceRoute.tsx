import { useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScopeSwitch } from './ScopeSwitch';
import { useFinanceView } from './useFinanceView';
import { visibleFamilyMember } from './permissions';
import { FamilyGroupHeader, FamilyGroupList } from './FamilyGroupList';

export function FinanceRoute({
    personal: Personal,
    title,
}: {
    personal: ComponentType;
    title: string;
}) {
    const { view, family, query, setView, canUseFamily } = useFinanceView();
    const container = useRef<HTMLDivElement>(null);
    const [target, setTarget] = useState<HTMLElement | null>(null);
    useLayoutEffect(() => {
        if (view !== 'personal' || !canUseFamily) return;
        const heading = container.current?.querySelector('h1');
        const header = heading?.parentElement?.parentElement;
        if (!header) return;
        const slot = document.createElement('div');
        slot.className = 'flex flex-wrap items-center gap-2';
        header.after(slot);
        setTarget(slot);
        return () => {
            slot.remove();
            setTarget(null);
        };
    }, [view, canUseFamily, query.isLoading]);
    if (query.isLoading)
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
            </div>
        );
    if (query.error)
        return (
            <div role="alert">
                Couldn't load your family.
                <Button variant="ghost" onClick={() => void query.refetch()}>
                    Try again
                </Button>
            </div>
        );
    if (view === 'personal')
        return (
            <div ref={container}>
                <Personal />
                {target && createPortal(<ScopeSwitch />, target)}
            </div>
        );
    if (!family) return null;
    const members = family.members
        .filter((member) => visibleFamilyMember(family.me, member))
        .sort(
            (a, b) =>
                Number(b.id === family.me.id) - Number(a.id === family.me.id) ||
                Number(a.role === 'child') - Number(b.role === 'child') ||
                a.name.localeCompare(b.name),
        );
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title={title}
                subtitle={family.household.name}
                variant="one"
            >
                {null}
            </PageHeader>
            <div className="flex flex-wrap items-center gap-2">
                <ScopeSwitch />
            </div>
            <FamilyGroupList>
                {members.map((member) => (
                    <FamilyGroupHeader
                        key={member.id}
                        member={{ ...member, isMe: member.id === family.me.id }}
                        onManage={() => setView('personal')}
                    />
                ))}
            </FamilyGroupList>
        </div>
    );
}
