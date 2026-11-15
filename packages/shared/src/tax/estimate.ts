import type { TaxProfile } from './input';
import { taxTables, type TaxYear } from './tables';
import { getState } from './states';
export type TaxPayment = {
    quarter: number;
    jurisdiction: 'federal' | 'state';
    amount: number;
    paidOn: string;
};
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const positive = (n: number) => Math.max(0, n);
export function annualizationFactor(year: TaxYear, today: Date) {
    const start = Date.UTC(year, 0, 1),
        end = Date.UTC(year + 1, 0, 1);
    const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const elapsed = Math.max(1, Math.min((end - start) / 86400000, (day - start) / 86400000 + 1));
    return (end - start) / 86400000 / elapsed;
}
function calculate(p: TaxProfile) {
    const t = taxTables[p.taxYear],
        r = t.rules,
        status = p.filingStatus;
    const joint = status === 'married_joint',
        jointRates = joint || status === 'qualifying_surviving_spouse';
    const separate = status === 'married_separate';
    const wages = positive(p.wageIncome - p.preTaxContributions);
    const seBase = p.selfEmploymentIncome < 400 ? 0 : p.selfEmploymentIncome * r.seMultiplier;
    const seSocialSecurity = r.socialSecurityRate * Math.min(seBase, positive(r.ssWageBase - wages));
    const seMedicare = r.medicareRate * seBase,
        seTax = seSocialSecurity + seMedicare,
        halfSe = seTax / 2;
    const grossIncome =
        p.wageIncome +
        p.selfEmploymentIncome +
        p.interestIncome +
        p.ordinaryDividends +
        p.longTermCapitalGains +
        p.shortTermCapitalGains +
        p.otherIncome;
    const magi =
        grossIncome -
        Math.min(p.wageIncome, p.preTaxContributions) -
        halfSe -
        p.iraDeduction -
        p.hsaDeduction;
    const studentLoanDeduction = separate
        ? 0
        : Math.min(2500, p.studentLoanInterest) *
          Math.max(0, Math.min(1, ((jointRates ? 205000 : 100000) - magi) / (jointRates ? 30000 : 15000)));
    const agi = magi - studentLoanDeduction;
    const addons =
        Number(p.taxpayerAge65) +
        Number(p.taxpayerBlind) +
        (joint ? Number(p.spouseAge65) + Number(p.spouseBlind) : 0);
    const standardDeduction =
        t.standard[status].amount +
        addons * (['single', 'head_of_household'].includes(status) ? r.unmarriedAddon : r.marriedAddon);
    const seniorCount = Number(p.taxpayerAge65) + (joint ? Number(p.spouseAge65) : 0);
    const seniorDeduction = separate
        ? 0
        : seniorCount * positive(r.seniorDeduction - 0.06 * positive(agi - (joint ? 150000 : 75000)));
    const phaseout = 100 * Math.ceil(positive(agi - (joint ? 300000 : 150000)) / 1000);
    const tipsAndOvertime = separate
        ? 0
        : positive(Math.min(25000, p.tipsDeduction) - phaseout) +
          positive(Math.min(joint ? 25000 : 12500, p.overtimeDeduction) - phaseout);
    const taxableIncome = positive(agi - standardDeduction - seniorDeduction - tipsAndOvertime);
    const preferential = Math.min(taxableIncome, positive(p.qualifiedDividends + p.longTermCapitalGains));
    const ordinary = taxableIncome - preferential;
    const brackets = t.brackets[status];
    const ordinaryTax = brackets.reduce(
        (sum, b, i) =>
            sum + positive(Math.min(ordinary, brackets[i + 1]?.lower ?? Infinity) - b.lower) * b.rate,
        0,
    );
    const g = t.gains[status];
    const gainsAtZero = Math.min(preferential, positive(g.zero - ordinary));
    const gainsAtFifteen = Math.min(
        preferential - gainsAtZero,
        positive(g.fifteen - Math.max(ordinary, g.zero)),
    );
    const capitalGainsTax = gainsAtFifteen * 0.15 + (preferential - gainsAtZero - gainsAtFifteen) * 0.2;
    const incomeTax = ordinaryTax + capitalGainsTax;
    const niitThreshold = jointRates ? 250000 : separate ? 125000 : 200000;
    const netInvestmentIncome = positive(
        p.interestIncome + p.ordinaryDividends + p.longTermCapitalGains + p.shortTermCapitalGains,
    );
    const niit = r.niitRate * Math.min(netInvestmentIncome, positive(agi - niitThreshold));
    const additionalMedicare =
        r.additionalMedicareRate * positive(wages + seBase - (joint ? 250000 : separate ? 125000 : 200000));
    const phaseoutCredit = 50 * Math.ceil(positive(agi - (joint ? 400000 : 200000)) / 1000);
    const childCredit = positive(p.qualifyingChildren * r.childCredit - phaseoutCredit);
    const otherCredit = positive(
        p.otherDependents * r.otherCredit - positive(phaseoutCredit - p.qualifyingChildren * r.childCredit),
    );
    const nonrefundableCredits = Math.min(incomeTax, childCredit + otherCredit);
    const unusedChildCredit = positive(childCredit - positive(incomeTax - otherCredit));
    const refundableCredits = Math.min(
        unusedChildCredit,
        r.refundableChildCredit * p.qualifyingChildren,
        0.15 * positive(wages + p.selfEmploymentIncome - halfSe - 2500),
    );
    const federalTotal =
        positive(incomeTax - nonrefundableCredits) + seTax + additionalMedicare + niit - refundableCredits;
    const state = getState(p.state, p.taxYear);
    const stateRate = state.type === 'none' ? 0 : state.type === 'flat' ? state.rate! : p.stateEffectiveRate;
    const stateTotal =
        stateRate === null
            ? 0
            : (stateRate / 100) * positive(agi - (state.type === 'flat' ? state.exemption : 0));
    return {
        grossIncome,
        adjustments: grossIncome - agi,
        agi,
        wages,
        seBase,
        seSocialSecurity,
        seMedicare,
        seTax,
        halfSe,
        studentLoanDeduction,
        standardDeduction,
        seniorDeduction,
        tipsAndOvertime,
        taxableIncome,
        ordinaryTax,
        capitalGainsTax,
        incomeTax,
        niit,
        additionalMedicare,
        nonrefundableCredits,
        refundableCredits,
        credits: nonrefundableCredits + refundableCredits,
        federalTotal,
        stateTotal,
        total: federalTotal + stateTotal,
        employeeFica: 0.062 * Math.min(wages, r.ssWageBase) + 0.0145 * wages,
        state,
        stateRate,
        stateRateMissing: stateRate === null,
    };
}
export function estimateTax(p: TaxProfile, payments: TaxPayment[], today: Date) {
    const raw = calculate(p);
    const figures = Object.fromEntries(
        Object.entries(raw)
            .filter(([, v]) => typeof v === 'number')
            .map(([k, v]) => [k, round(v as number)]),
    ) as { [K in keyof typeof raw as (typeof raw)[K] extends number ? K : never]: number };
    const factor = annualizationFactor(p.taxYear, today);
    const todayString = today.toISOString().slice(0, 10);
    const paid = payments.filter((v) => v.paidOn <= todayString);
    const federalPaid = paid
        .filter((v) => v.jurisdiction === 'federal')
        .reduce((sum, v) => sum + v.amount, 0);
    const statePaid = paid.filter((v) => v.jurisdiction === 'state').reduce((sum, v) => sum + v.amount, 0);
    const projectedFederalWithholding = p.federalWithholdingYtd * factor,
        projectedStateWithholding = p.stateWithholdingYtd * factor;
    const current = positive(raw.federalTotal) * 0.9;
    const highAgi =
        p.priorYearAgi !== null && p.priorYearAgi > (p.filingStatus === 'married_separate' ? 75000 : 150000);
    const prior = p.priorYearTax === null ? Infinity : p.priorYearTax * (highAgi ? 1.1 : 1);
    const safeHarborRequired = Math.min(current, prior);
    const safeHarborBasis =
        prior < current
            ? highAgi
                ? "110% of last year's tax"
                : "100% of last year's tax"
            : "90% of this year's tax";
    const dueDates = taxTables[p.taxYear].dueDates;
    const remainingQuarters = dueDates.filter((d) => d.date >= todayString).length;
    const pastFederalPaid = paid
        .filter((v) =>
            v.jurisdiction === 'federal' &&
            dueDates.some((d) => d.quarter === v.quarter && d.date < todayString),
        )
        .reduce((sum, v) => sum + v.amount, 0);
    const need = positive(safeHarborRequired - projectedFederalWithholding - pastFederalPaid);
    const estimatedPaymentsLikelyRequired =
        raw.federalTotal - projectedFederalWithholding >= 1000 && need > 0;
    const suggestedAmount =
        estimatedPaymentsLikelyRequired && remainingQuarters ? round(need / remainingQuarters) : 0;
    // A regular quarter's share. Future quarters may suggest more because they also
    // catch up on what earlier quarters missed; the UI explains that portion.
    const perQuarterAmount = round(positive(safeHarborRequired / 4 - projectedFederalWithholding / 4));
    const quarterlySchedule = dueDates.map((d) => {
        const federalPaid = paid
            .filter((v) => v.quarter === d.quarter && v.jurisdiction === 'federal')
            .reduce((s, v) => s + v.amount, 0);
        const statePaid = paid
            .filter((v) => v.quarter === d.quarter && v.jurisdiction === 'state')
            .reduce((s, v) => s + v.amount, 0);
        const quarterSuggestion = !estimatedPaymentsLikelyRequired
            ? 0
            : d.date < todayString
              ? perQuarterAmount
              : suggestedAmount;
        const status =
            round(federalPaid) > 0 && round(federalPaid) >= quarterSuggestion
                ? ('paid' as const)
                : !estimatedPaymentsLikelyRequired
                  ? ('none' as const)
                  : d.date < todayString
                    ? ('overdue' as const)
                    : ('due' as const);
        return {
            quarter: d.quarter,
            dueDate: d.date,
            federalPaid: round(federalPaid),
            statePaid: round(statePaid),
            paid: round(federalPaid + statePaid),
            suggestedAmount: quarterSuggestion,
            status,
        };
    });
    const nextPayment =
        quarterlySchedule.find((q) => q.dueDate >= todayString && q.status === 'due') ?? null;
    const bumped = calculate({ ...p, wageIncome: p.wageIncome + 100 });
    return {
        ...raw,
        ...figures,
        effectiveRate: raw.grossIncome > 0 ? raw.total / raw.grossIncome : 0,
        marginalRate: (bumped.total - raw.total) / 100,
        federalMarginalRate: (bumped.federalTotal - raw.federalTotal) / 100,
        stateMarginalRate: (bumped.stateTotal - raw.stateTotal) / 100,
        federalPaid: round(federalPaid),
        statePaid: round(statePaid),
        estimatedPaid: round(federalPaid + statePaid),
        withholdingYtd: round(p.federalWithholdingYtd + p.stateWithholdingYtd),
        paidSoFar: round(p.federalWithholdingYtd + p.stateWithholdingYtd + federalPaid + statePaid),
        projectedFederalWithholding: round(projectedFederalWithholding),
        projectedStateWithholding: round(projectedStateWithholding),
        remaining: round(
            raw.total - projectedFederalWithholding - projectedStateWithholding - federalPaid - statePaid,
        ),
        safeHarborRequired: round(safeHarborRequired),
        safeHarborBasis,
        estimatedPaymentsLikelyRequired,
        quarterlySchedule,
        nextPayment: nextPayment && {
            ...nextPayment,
            suggestedAmount: round(positive(nextPayment.suggestedAmount - nextPayment.federalPaid)),
            catchUpAmount: round(positive(nextPayment.suggestedAmount - perQuarterAmount)),
            daysUntil: Math.ceil(
                (Date.parse(nextPayment.dueDate + 'T00:00:00Z') - Date.parse(todayString + 'T00:00:00Z')) /
                    86400000,
            ),
        },
        returnDue: taxTables[p.taxYear].returnDue,
        tablesVerified: taxTables[p.taxYear].verified,
    };
}
