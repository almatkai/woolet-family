import React, { useState, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CustomPricing } from './CustomPricing';
import { PricingContext } from './PricingContext';
import { trpc } from '@/lib/trpc';

interface PricingProviderProps {
    children: ReactNode;
}

export { usePricing } from './PricingContext';

export function PricingProvider({ children }: PricingProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isSignedIn } = useAuth();
    const { data: user, isLoading } = trpc.user.me.useQuery(undefined, { enabled: Boolean(isSignedIn) });

    const openPricing = () => setIsOpen(true);
    const closePricing = () => setIsOpen(false);

    const activePlanId = user?.subscriptionTier && user.subscriptionTier !== 'free' ? user.subscriptionTier : null;
    const activePriceId = user?.paddlePriceId || null;
    const isPaid = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'premium';

    return (
        <PricingContext.Provider value={{ isOpen, openPricing, closePricing, activePlanId, activePriceId, isPaid, isLoading }}>
            {children}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="h-[90vh] max-h-[900px] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl">
                    <DialogTitle className="sr-only">Plans and pricing</DialogTitle>
                    <div className="h-full overflow-y-auto">
                        <CustomPricing />
                    </div>
                </DialogContent>
            </Dialog>
        </PricingContext.Provider>
    );
}
