import { describe, expect, test } from 'bun:test';
import { taxProfileSchema, paymentSchema, type TaxProfile } from '../src/lib/tax/input';
import { estimateTax, annualizationFactor } from '../src/lib/tax/estimate';
import { taxTables } from '../src/lib/tax/tables';
import { getState, states } from '../src/lib/tax/states';
const yearEnd = new Date('2026-12-31T12:00:00Z');
const profile = (patch: Partial<TaxProfile> = {}) =>
    taxProfileSchema.parse({ taxYear: 2026, filingStatus: 'single', state: 'TX', ...patch });
const estimate = (patch: Partial<TaxProfile> = {}) => estimateTax(profile(patch), [], yearEnd);
describe('US tax estimator', () => {
    test('single W-2 at $85k in Texas', () => {
        const e = estimate({ wageIncome: 85000 });
        // Hand check: taxable = 85,000 - 16,100 = 68,900.
        // 12,400*.10 + 38,000*.12 + 18,500*.22 = 9,870.
        expect(e.taxableIncome).toBe(68900);
        expect(e.federalTotal).toBe(9870);
        expect(e.stateTotal).toBe(0);
        expect(e.total).toBe(9870);
        expect(e.federalMarginalRate).toBeCloseTo(0.22, 8);
    });
    test('MFJ with two kids, $180k wages, Illinois', () => {
        const e = estimate({
            filingStatus: 'married_joint',
            qualifyingChildren: 2,
            wageIncome: 180000,
            state: 'IL',
        });
        // Hand check: taxable 147,800. 2,480+9,120+10,340 = 21,940;
        // less 4,400 CTC = 17,540. Illinois = 180,000*.0495 = 8,910.
        expect(e.federalTotal).toBe(17540);
        expect(e.stateTotal).toBe(8910);
        expect(e.total).toBe(26450);
    });
    test('$90k self-employment in Florida, half-SE deduction', () => {
        const e = estimate({ selfEmploymentIncome: 90000, state: 'FL' });
        // 90,000*.9235 = 83,115; SE = 83,115*.153 = 12,716.595;
        // half = 6,358.2975; taxable = 67,541.7025; income tax = 9,571.17455.
        expect(e.seBase).toBe(83115);
        expect(e.seTax).toBe(12716.6);
        expect(e.halfSe).toBe(6358.3);
        expect(e.agi).toBe(83641.7);
        expect(e.federalTotal).toBe(22287.77);
    });
    test('LTCG stacks above ordinary taxable income across the zero band', () => {
        const e = estimate({ wageIncome: 56100, longTermCapitalGains: 20000 });
        expect(e.taxableIncome).toBe(60000);
        expect(e.capitalGainsTax).toBe(1582.5); // 9,450 at 0%; 10,550 at 15%.
        expect(e.ordinaryTax).toBe(4552);
        expect(e.federalTotal).toBe(6134.5);
    });
    test('qualified dividends are a subset of ordinary dividends, not double-counted', () => {
        const e = estimate({ wageIncome: 56100, ordinaryDividends: 20000, qualifiedDividends: 20000 });
        expect(e.grossIncome).toBe(76100);
        expect(e.capitalGainsTax).toBe(1582.5);
        expect(taxProfileSchema.safeParse({ ...profile(), qualifiedDividends: 100 }).success).toBe(false);
    });
    test('CTC phases out by $50 for each started $1k', () => {
        const e = estimate({ wageIncome: 210001, qualifyingChildren: 1 });
        expect(e.nonrefundableCredits).toBe(1650);
        expect(e.refundableCredits).toBe(0);
    });
    test('high earner exhausts SS wage base and pays Additional Medicare', () => {
        const e = estimate({ wageIncome: 180000, selfEmploymentIncome: 100000 });
        expect(e.seSocialSecurity).toBe(558); // (184,500 - 180,000)*12.4%.
        expect(e.seMedicare).toBe(2678.15);
        expect(e.seTax).toBe(3236.15);
        expect(e.additionalMedicare).toBe(651.15); // (180,000+92,350-200,000)*.009.
        expect(estimate({ wageIncome: 300000, selfEmploymentIncome: 10000 }).seSocialSecurity).toBe(0);
    });
    test('NIIT applies to the lesser of investment income or AGI excess', () => {
        const e = estimate({ wageIncome: 195000, interestIncome: 20000 });
        expect(e.niit).toBe(570);
        expect(e.additionalMedicare).toBe(0);
    });
    test('withholding above tax produces a refund', () => {
        const e = estimate({ wageIncome: 85000, federalWithholdingYtd: 12000 });
        expect(e.remaining).toBe(-2130);
        expect(e.paidSoFar).toBe(12000);
        expect(e.estimatedPaymentsLikelyRequired).toBe(false);
    });
    test('safe harbor is 110% for prior AGI over $150k', () => {
        const e = estimate({ wageIncome: 250000, priorYearTax: 10000, priorYearAgi: 150001 });
        expect(e.safeHarborRequired).toBe(11000);
        expect(e.safeHarborBasis).toBe("110% of last year's tax");
        expect(
            estimate({ wageIncome: 250000, priorYearTax: 10000, priorYearAgi: 150000 }).safeHarborRequired,
        ).toBe(10000);
        expect(
            estimate({
                filingStatus: 'married_separate',
                wageIncome: 250000,
                priorYearTax: 10000,
                priorYearAgi: 75001,
            }).safeHarborRequired,
        ).toBe(11000);
    });
    test('quarterly dates, projected withholding, and injected next due date', () => {
        const e = estimateTax(
            profile({ wageIncome: 85000, federalWithholdingYtd: 1000 }),
            [{ quarter: 1, jurisdiction: 'federal', amount: 500, paidOn: '2026-04-15' }],
            new Date('2026-07-01T00:00:00Z'),
        );
        expect(e.quarterlySchedule.map((q) => q.dueDate)).toEqual([
            '2026-04-15',
            '2026-06-15',
            '2026-09-15',
            '2027-01-15',
        ]);
        expect(e.nextPayment?.quarter).toBe(3);
        expect(e.nextPayment?.daysUntil).toBe(76);
        expect(e.projectedFederalWithholding).toBeCloseTo((1000 * 365) / 182, 2);
        expect(e.nextPayment?.suggestedAmount).toBeCloseTo((8883 - (1000 * 365) / 182 - 500) / 2, 2);
        expect(e.quarterlySchedule[0].status).toBe('overdue');
        expect(e.quarterlySchedule[0].federalPaid).toBe(500);
        expect(e.quarterlySchedule[1].status).toBe('overdue');
    });
    test('next payment reports the part that catches up on missed quarters', () => {
        const p = profile({ selfEmploymentIncome: 90000 });
        const today = new Date('2026-11-15T12:00:00Z');
        const e = estimateTax(p, [], today);
        expect(e.quarterlySchedule.slice(0, 3).map((q) => q.status)).toEqual(['overdue', 'overdue', 'overdue']);
        expect(e.quarterlySchedule.slice(0, 3).map((q) => q.suggestedAmount)).toEqual([5014.75, 5014.75, 5014.75]);
        expect(e.nextPayment?.quarter).toBe(4);
        expect(e.nextPayment?.suggestedAmount).toBe(20058.99);
        expect(e.nextPayment?.catchUpAmount).toBe(15044.24);
        const late = estimateTax(p, [{ quarter: 1, jurisdiction: 'federal', amount: 5014.75, paidOn: '2026-11-15' }], today);
        expect(late.nextPayment?.suggestedAmount).toBe(15044.24);
        expect(late.nextPayment?.catchUpAmount).toBe(10029.49);
        const onTrack = estimateTax(p, [], new Date('2026-03-01T12:00:00Z'));
        expect(onTrack.nextPayment?.catchUpAmount).toBe(0);
    });
    test('partial federal payments keep the quarter due and reduce the next suggestion', () => {
        const e = estimateTax(
            profile({ wageIncome: 85000 }),
            [{ quarter: 1, jurisdiction: 'federal', amount: 500, paidOn: '2026-04-15' }],
            new Date('2026-04-15'),
        );
        expect(e.quarterlySchedule[0].status).toBe('due');
        expect(e.quarterlySchedule[0].federalPaid).toBe(500);
        expect(e.nextPayment?.quarter).toBe(1);
        expect(e.nextPayment?.suggestedAmount).toBe(e.quarterlySchedule[0].suggestedAmount - 500);
    });
    test.each([500, 4012.8])('Q1 payment of $%s leaves open-quarter targets unchanged', (amount) => {
        const p = profile({ selfEmploymentIncome: 90000 });
        const today = new Date('2026-03-01T12:00:00Z');
        const baseline = estimateTax(p, [], today);
        const e = estimateTax(p, [
            { quarter: 1, jurisdiction: 'federal', amount, paidOn: '2026-02-20' },
        ], today);

        expect(baseline.quarterlySchedule[0].suggestedAmount).toBe(5014.75);
        expect(e.quarterlySchedule.map((q) => q.suggestedAmount)).toEqual(
            baseline.quarterlySchedule.map((q) => q.suggestedAmount),
        );
        expect(e.quarterlySchedule[0].status).toBe('due');
        expect(e.nextPayment?.quarter).toBe(1);
        expect(e.nextPayment?.suggestedAmount).toBeCloseTo(5014.75 - amount, 2);
        const laterSuggestions = e.quarterlySchedule.slice(1).reduce((sum, q) => sum + q.suggestedAmount, 0);
        expect(e.nextPayment!.suggestedAmount + laterSuggestions + e.federalPaid).toBeCloseTo(
            4 * baseline.quarterlySchedule[0].suggestedAmount,
            2,
        );
    });
    test('state-only payments never mark a federal quarter paid or reduce its suggestion', () => {
        const today = new Date('2026-04-15');
        const baseline = estimateTax(profile({ wageIncome: 85000 }), [], today);
        const e = estimateTax(
            profile({ wageIncome: 85000 }),
            [{ quarter: 1, jurisdiction: 'state', amount: 5000, paidOn: '2026-04-15' }],
            today,
        );
        expect(e.quarterlySchedule[0].status).toBe('due');
        expect(e.quarterlySchedule[0].statePaid).toBe(5000);
        expect(e.nextPayment?.quarter).toBe(baseline.nextPayment?.quarter);
        expect(e.nextPayment?.suggestedAmount).toBe(baseline.nextPayment?.suggestedAmount);
        const noFederalTax = estimateTax(profile(), [
            { quarter: 1, jurisdiction: 'state', amount: 500, paidOn: '2026-04-15' },
        ], today);
        expect(noFederalTax.quarterlySchedule[0].status).toBe('none');
    });
    test('only federal payments meeting the suggestion mark a quarter paid', () => {
        const today = new Date('2026-04-15');
        const e = estimateTax(profile({ wageIncome: 85000 }), [
            { quarter: 1, jurisdiction: 'federal', amount: 2500, paidOn: '2026-04-15' },
        ], today);
        expect(e.quarterlySchedule[0].status).toBe('paid');
        expect(e.nextPayment?.quarter).toBe(2);
        const zeroSuggestion = estimateTax(profile(), [
            { quarter: 1, jurisdiction: 'federal', amount: 100, paidOn: '2026-04-15' },
        ], today);
        expect(zeroSuggestion.quarterlySchedule[0].suggestedAmount).toBe(0);
        expect(zeroSuggestion.quarterlySchedule[0].status).toBe('paid');
        expect(zeroSuggestion.nextPayment).toBeNull();
    });
    test.each([
        [2499.99, 'due'],
        [2500, 'paid'],
        [2500.01, 'paid'],
    ] as const)('federal paid %s respects the suggested amount boundary', (amount, status) => {
        const e = estimateTax(
            profile({ wageIncome: 250000, priorYearTax: 10000, priorYearAgi: 100000 }),
            [{ quarter: 1, jurisdiction: 'federal', amount, paidOn: '2026-04-15' }],
            new Date('2026-04-15'),
        );
        expect(e.quarterlySchedule[0].suggestedAmount).toBe(2500);
        expect(e.quarterlySchedule[0].status).toBe(status);
        if (status === 'due') expect(e.nextPayment?.suggestedAmount).toBe(0.01);
    });
    test('multiple fractional payments are compared at cent precision', () => {
        const e = estimateTax(
            profile({ wageIncome: 85000, priorYearTax: 4, priorYearAgi: 100000 }),
            [
                { quarter: 1, jurisdiction: 'federal', amount: 0.1, paidOn: '2026-04-15' },
                { quarter: 1, jurisdiction: 'federal', amount: 0.9, paidOn: '2026-04-15' },
            ],
            new Date('2026-04-15'),
        );
        expect(e.quarterlySchedule[0].federalPaid).toBe(1);
        expect(e.quarterlySchedule[0].suggestedAmount).toBe(1);
        expect(e.quarterlySchedule[0].status).toBe('paid');
        expect(e.nextPayment?.quarter).toBe(2);
    });
    test('no-payment-needed quarters never show a positive suggestion', () => {
        const e = estimate({ wageIncome: 20000 });
        expect(e.estimatedPaymentsLikelyRequired).toBe(false);
        expect(e.quarterlySchedule.every((q) => q.suggestedAmount === 0 && q.status === 'none')).toBe(true);
    });
    test('after Q4 returns no next payment and clamps annualization to one', () => {
        const e = estimateTax(profile({ wageIncome: 85000 }), [], new Date('2027-01-16T00:00:00Z'));
        expect(e.nextPayment).toBeNull();
        expect(e.returnDue).toBe('2027-04-15');
        expect(annualizationFactor(2026, new Date('2027-03-01'))).toBe(1);
    });
    test('today on due date is still due; a future payment is not paid so far', () => {
        const e = estimateTax(
            profile({ wageIncome: 85000 }),
            [{ quarter: 4, jurisdiction: 'federal', amount: 1000, paidOn: '2027-01-15' }],
            new Date('2026-04-15'),
        );
        expect(e.nextPayment?.quarter).toBe(1);
        expect(e.nextPayment?.daysUntil).toBe(0);
        expect(e.estimatedPaid).toBe(0);
    });
    test('refundable child credit cannot include other dependent credits', () => {
        const e = estimate({ wageIncome: 10000, qualifyingChildren: 1, otherDependents: 1 });
        expect(e.incomeTax).toBe(0);
        expect(e.refundableCredits).toBe(1125);
        expect(e.federalTotal).toBe(-1125);
    });
    test('senior/add-on, student loan, tips and overtime deductions', () => {
        const e = estimate({
            wageIncome: 90000,
            taxpayerAge65: true,
            taxpayerBlind: true,
            studentLoanInterest: 2500,
            tipsDeduction: 30000,
            overtimeDeduction: 30000,
        });
        expect(e.standardDeduction).toBe(20200);
        expect(e.studentLoanDeduction).toBe(1666.67);
        expect(e.seniorDeduction).toBe(5200);
        expect(e.tipsAndOvertime).toBe(37500);
    });
    test('flat exemptions, progressive missing rate, and reference-year state handling', () => {
        expect(estimate({ wageIncome: 50000, state: 'OH' }).stateTotal).toBe(658.63);
        expect(estimate({ wageIncome: 50000, state: 'CA' }).stateRateMissing).toBe(true);
        expect(estimate({ wageIncome: 50000, state: 'CA', stateEffectiveRate: 5.2 }).stateTotal).toBe(2600);
        expect(getState('IL', 2025).type).toBe('progressive');
        expect(states).toHaveLength(51);
        expect(taxTables[2025].verified).toBe(false);
        expect(taxTables[2026].brackets.single.every((b) => b.sourceUrl && b.asOf && b.verified)).toBe(true);
    });
    test('validation rejects invalid state rates, quarter and impossible dates', () => {
        expect(taxProfileSchema.safeParse({ ...profile(), stateEffectiveRate: 16 }).success).toBe(false);
        const payment = {
            taxYear: 2026,
            jurisdiction: 'federal',
            quarter: 1,
            amount: 100,
            paidOn: '2026-02-30',
        };
        expect(paymentSchema.safeParse(payment).success).toBe(false);
        expect(paymentSchema.safeParse({ ...payment, paidOn: '2026-03-01', quarter: 5 }).success).toBe(false);
    });
});
