import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
} from '@/components/ui/select';
import type { HouseholdOverviewOutput } from './types';
export function FamilyPeriodControls({
    monthName,
    date,
    move,
    update,
    currency,
    overview,
}: {
    monthName: string;
    date: Date;
    move: (n: number) => void;
    update: (patch: {
        month?: string;
        day?: string;
        member?: string;
        category?: string;
        currency?: string;
    }) => void;
    currency: string;
    overview?: HouseholdOverviewOutput;
}) {
    return (
        <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
                variant="ghost"
                className="size-10 min-h-10"
                aria-label="Previous month"
                onClick={() => move(-1)}
            >
                ‹
            </Button>
            <span className="text-sm">
                {monthName} {date.getFullYear()}
            </span>
            <Button
                variant="ghost"
                className="size-10 min-h-10"
                aria-label="Next month"
                onClick={() => move(1)}
            >
                ›
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="min-h-10"
                onClick={() =>
                    update({
                        month: undefined,
                        day: undefined,
                        member: undefined,
                        category: undefined,
                    })
                }
            >
                This month
            </Button>
            <Select
                value={currency}
                onValueChange={(v) =>
                    update({
                        currency: v === overview?.baseCurrency ? undefined : v,
                    })
                }
            >
                <SelectTrigger
                    aria-label="Show totals in"
                    className="h-9 min-w-[5.5rem] w-auto"
                >
                    <SelectValue>{currency}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Show totals in</SelectLabel>
                        {overview?.availableCurrencies.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c} —{' '}
                                {new Intl.DisplayNames(['en'], {
                                    type: 'currency',
                                }).of(c)}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
