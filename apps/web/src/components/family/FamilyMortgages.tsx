import { FamilyLoans } from './FamilyLoans';
import type { HouseholdOverview } from './types';

export function FamilyMortgages({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    return (
        <FamilyLoans
            family={family}
            title="Mortgages"
            singular="mortgage"
            rows={(member) => member.mortgages}
            detail={(item) => `Payment day: ${item.paymentDay ?? 'Not set'}`}
        />
    );
}
