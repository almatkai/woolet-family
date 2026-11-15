import type { Provenance, TaxYear } from './tables';
const names = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District of Columbia',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
};
const flat: Record<string, number> = {
    AZ: 2.5,
    IN: 2.95,
    OH: 2.75,
    LA: 3,
    PA: 3.07,
    KY: 3.5,
    IA: 3.8,
    NC: 3.99,
    MS: 4,
    CO: 4.4,
    MI: 4.25,
    UT: 4.5,
    IL: 4.95,
    GA: 5.19,
    ID: 5.3,
};
export type StateTable = Provenance & {
    code: string;
    name: string;
    type: 'none' | 'flat' | 'progressive';
    rate: number | null;
    exemption: number;
};
export const states: StateTable[] = Object.entries(names).map(([code, name]) => ({
    code,
    name,
    type: ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'].includes(code)
        ? 'none'
        : flat[code]
          ? 'flat'
          : 'progressive',
    rate: flat[code] ?? null,
    exemption: code === 'OH' ? 26050 : code === 'MS' ? 10000 : 0,
    asOf: '2026-11-01',
    sourceUrl: 'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/',
    verified: false,
}));
// 2025 is reference-only: do not silently apply 2026 state rates to a prior year.
export function getState(code: string, year: TaxYear): StateTable {
    const state = states.find((s) => s.code === code);
    if (!state) throw new Error('Unknown state');
    return year === 2025 && state.type === 'flat'
        ? { ...state, type: 'progressive', rate: null, asOf: '2025-12-31' }
        : state;
}
