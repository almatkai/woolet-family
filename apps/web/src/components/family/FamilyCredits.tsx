import { FamilyLoans } from './FamilyLoans';
import { formatDay } from './formatDay';
import type { HouseholdOverview } from './types';

export function FamilyCredits({
    family,
}: {
    family: NonNullable<HouseholdOverview>;
}) {
    return (
        <FamilyLoans
            family={family}
            title="Credits"
            singular="credit"
            rows={(member) => member.credits}
            detail={(item) => `Ends ${formatDay(item.endDate)}`}
        />
    );
}
