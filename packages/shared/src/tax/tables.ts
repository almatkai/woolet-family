export const filingStatuses = [
    'single',
    'married_joint',
    'married_separate',
    'head_of_household',
    'qualifying_surviving_spouse',
] as const;
export type FilingStatus = (typeof filingStatuses)[number];
export type TaxYear = 2025 | 2026;
export type Provenance = { asOf: string; sourceUrl: string; verified: boolean };
const sourceUrl = 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf';
const rates = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
function yearTable(
    year: TaxYear,
    single: number[],
    joint: number[],
    head: number[],
    separate: number[],
    standard: number[],
    gains: number[][],
) {
    const meta: Provenance = {
        asOf: '2026-11-14',
        sourceUrl: year === 2026 ? sourceUrl : 'https://www.irs.gov/pub/irs-drop/rp-24-40.pdf',
        verified: year === 2026,
    };
    const statuses = [single, joint, separate, head, joint];
    return {
        ...meta,
        brackets: Object.fromEntries(
            filingStatuses.map((s, i) => [
                s,
                statuses[i].map((lower, j) => ({ ...meta, lower, rate: rates[j] })),
            ]),
        ) as Record<FilingStatus, (Provenance & { lower: number; rate: number })[]>,
        standard: Object.fromEntries(
            filingStatuses.map((s, i) => [s, { ...meta, amount: standard[i] }]),
        ) as Record<FilingStatus, Provenance & { amount: number }>,
        gains: Object.fromEntries(
            filingStatuses.map((s, i) => [s, { ...meta, zero: gains[i][0], fifteen: gains[i][1] }]),
        ) as Record<FilingStatus, Provenance & { zero: number; fifteen: number }>,
        rules: {
            ...meta,
            sourceUrl: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf',
            ssWageBase: year === 2026 ? 184500 : 176100,
            unmarriedAddon: year === 2026 ? 2050 : 2000,
            marriedAddon: year === 2026 ? 1650 : 1600,
            childCredit: 2200,
            refundableChildCredit: 1700,
            otherCredit: 500,
            seniorDeduction: 6000,
            seMultiplier: 0.9235,
            socialSecurityRate: 0.124,
            medicareRate: 0.029,
            additionalMedicareRate: 0.009,
            niitRate: 0.038,
        },
        dueDates: [
            `${year}-04-15`,
            `${year}-06-${year === 2025 ? '16' : '15'}`,
            `${year}-09-15`,
            `${year + 1}-01-15`,
        ].map((date, i) => ({
            ...meta,
            sourceUrl: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf',
            date,
            quarter: i + 1,
        })),
        returnDue: `${year + 1}-04-15`,
    };
}
export const taxTables = {
    2026: yearTable(
        2026,
        [0, 12400, 50400, 105700, 201775, 256225, 640600],
        [0, 24800, 100800, 211400, 403550, 512450, 768700],
        [0, 17700, 67450, 105700, 201750, 256200, 640600],
        [0, 12400, 50400, 105700, 201775, 256225, 384350],
        [16100, 32200, 16100, 24150, 32200],
        [
            [49450, 545500],
            [98900, 613700],
            [49450, 306850],
            [66200, 579600],
            [98900, 613700],
        ],
    ),
    2025: yearTable(
        2025,
        [0, 11925, 48475, 103350, 197300, 250525, 626350],
        [0, 23850, 96950, 206700, 394600, 501050, 751600],
        [0, 17000, 64850, 103350, 197300, 250500, 626350],
        [0, 11925, 48475, 103350, 197300, 250525, 375800],
        [15750, 31500, 15750, 23625, 31500],
        [
            [48350, 533400],
            [96700, 600050],
            [48350, 300000],
            [64750, 566700],
            [96700, 600050],
        ],
    ),
};
