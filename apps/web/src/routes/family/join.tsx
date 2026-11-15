import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { roleLabel, sectionLabel } from '@/components/family/shared';
import type { InvitationPreview } from '@/components/family/types';

export function FamilyJoinPage() {
    const { token } = useSearch({ from: '/family/join' });
    useEffect(() => {
        if (token) {
            try {
                sessionStorage.removeItem('woolet.pendingFamilyJoin');
            } catch {
                // The token from the current URL is sufficient without storage.
            }
        }
    }, [token]);
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useClerk();
    const utils = trpc.useContext();
    const [failure, setFailure] = useState<string | null>(null);
    const preview = trpc.household.previewInvitation.useQuery(
        { token: token ?? '' },
        { enabled: Boolean(token), retry: false },
    );
    const data = preview.data as InvitationPreview | undefined;
    const email =
        user?.primaryEmailAddress?.emailAddress ?? data?.callerEmail ?? '';
    const familyName = data?.householdName ?? '';
    const inviter = data?.inviterName ?? '';
    const accept = trpc.household.acceptInvitation.useMutation({
        onSuccess: async () => {
            await utils.household.get.invalidate();
            void navigate({ to: '/family', replace: true });
            toast.success(`You joined ${familyName}`);
        },
        onError: async (error: { message: string }) => {
            setFailure(error.message);
            await preview.refetch();
        },
    });
    const retry = () => {
        setFailure(null);
        void preview.refetch();
    };
    const switchAccount = async () => {
        try {
            sessionStorage.setItem('woolet.pendingFamilyJoin', token ?? '');
        } catch {
            // Switching accounts can continue without preserving the token.
        }
        try {
            await signOut({ redirectUrl: window.location.href });
        } catch (error) {
            setFailure(
                error instanceof Error
                    ? error.message
                    : "Couldn't switch account",
            );
        }
    };
    let title = "Couldn't load this invite";
    let body = failure ?? preview.error?.message ?? 'Please try again.';
    let primary = (
        <Button className="min-h-10" onClick={retry}>
            Try again
        </Button>
    );
    const reason = data?.reason;
    if (!token) {
        title = 'This invite link is incomplete';
        body = 'Ask the person who invited you to send the full link.';
        primary = <></>;
    } else if (reason) {
        primary = <></>;
        switch (reason) {
            case 'not_found':
            case 'accepted':
                title = "This invite link isn't valid";
                body =
                    'Check that you copied the whole link, or ask for a new one.';
                break;
            case 'expired':
                title = 'This invite has expired';
                body = `Ask ${inviter} to send you a new link.`;
                break;
            case 'revoked':
                title = 'This invite was cancelled';
                body = `${inviter} cancelled it. Ask them for a new link if you still want to join.`;
                break;
            case 'wrong_email':
                title = 'This invite is for a different email';
                body = `It was sent to ${data?.invitedEmail}, but you're signed in as ${email}. Sign in with that email to join.`;
                primary = (
                    <Button
                        className="min-h-10"
                        onClick={() => void switchAccount()}
                    >
                        Switch account
                    </Button>
                );
                break;
            case 'already_in_family':
                title = "You're already in a family";
                body = `You're a member of ${data?.currentFamilyName}. Leave it before joining ${familyName}.`;
                primary = (
                    <Button
                        className="min-h-10"
                        onClick={() => void navigate({ to: '/family' })}
                    >
                        Open my family
                    </Button>
                );
                break;
            case 'full':
                title = `${familyName} is full`;
                body = `A family can have up to 6 members. Ask ${inviter} to make room.`;
        }
    }
    const valid = token && data?.canAccept && !failure && !preview.error;
    return (
        <div className="mx-auto w-full max-w-md pt-4 md:pt-12">
            <GlassCard className="p-6">
                {token && preview.isLoading ? (
                    <div className="space-y-3" aria-label="Loading invite">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ) : valid ? (
                    <>
                        <p className={sectionLabel}>Family invite</p>
                        <h1 className="mt-2 break-words text-xl font-bold tracking-tight">
                            {familyName}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {inviter} invited you to join as{' '}
                            {data.role === 'child'
                                ? 'a child'
                                : data.isGuardian
                                  ? 'an adult and guardian'
                                  : 'an adult'}
                            .
                        </p>
                        <dl className="mt-5 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="shrink-0 text-muted-foreground">
                                    Signed in as
                                </dt>
                                <dd className="min-w-0 break-words text-right">
                                    {email}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">Role</dt>
                                <dd>
                                    {roleLabel(
                                        data.role ?? 'adult',
                                        data.isGuardian,
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <p className="mt-4 text-xs text-muted-foreground">
                            {data.role === 'child'
                                ? "You'll get your own wallet, managed by your family. Your other accounts stay private."
                                : `Adults in ${familyName} see each other's accounts, spending, loans, investments and taxes. You'll still change only your own.`}
                        </p>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button
                                className="min-h-10 h-auto whitespace-normal break-words"
                                disabled={accept.isLoading}
                                onClick={() => accept.mutate({ token })}
                            >
                                {accept.isLoading
                                    ? 'Joining...'
                                    : `Join ${familyName}`}
                            </Button>
                            <Button
                                className="min-h-10"
                                variant="ghost"
                                onClick={() => void navigate({ to: '/' })}
                            >
                                Not now
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="break-words text-xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <p
                            className="mt-2 break-words text-sm text-muted-foreground"
                            role="alert"
                        >
                            {body}
                        </p>
                        <div className="mt-6 flex flex-col gap-2">
                            {primary}
                            <Button
                                className="min-h-10"
                                variant="ghost"
                                onClick={() => void navigate({ to: '/' })}
                            >
                                Go to dashboard
                            </Button>
                        </div>
                    </>
                )}
            </GlassCard>
        </div>
    );
}
