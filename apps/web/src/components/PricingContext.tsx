import { createContext, useContext } from 'react';

export interface PricingContextType {
    isOpen: boolean;
    openPricing: () => void;
    closePricing: () => void;
    activePlanId: string | null;
    activePriceId: string | null;
    isPaid: boolean;
    isLoading: boolean;
}

export const PricingContext = createContext<PricingContextType | undefined>(undefined);

const defaultPricingContext: PricingContextType = {
    isOpen: false,
    openPricing: () => {},
    closePricing: () => {},
    activePlanId: null,
    activePriceId: null,
    isPaid: false,
    isLoading: false,
};

export function usePricing() {
    const context = useContext(PricingContext);
    return context ?? defaultPricingContext;
}
