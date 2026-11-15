import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    let proposal = { id: 'purchase-1', description: 'New washing machine', amount: '1200.00', originalAmount: '1200.00', proposerUserId: 'jordan', proposerName: 'Jordan Martinez', lastActorName: 'Jordan Martinez', awaitingName: null as string | null, walletName: 'Groceries', walletId: 'shared', currencyCode: 'USD', walletBalance: '2020.00', date: '2026-11-15', status: 'pending', canRespond: true, canDecline: true, canWithdraw: false, unavailableReason: null, createdAt: '2026-11-15T12:00:00Z', decidedAt: null };
    await page.route('**/trpc/**', async (route) => {
        const url = new URL(route.request().url());
        const procedures = url.pathname.split('/trpc/')[1].split(',');
        const inputs = JSON.parse(url.searchParams.get('input') ?? route.request().postData() ?? '{}');
        await route.fulfill({
            json: procedures.map((procedure, index) => {
                const input = inputs[index]?.json ?? {};
                if (procedure === 'household.respondToPurchaseProposal' && input.action === 'counter') proposal = { ...proposal, amount: input.amount, lastActorName: 'Alex Martinez', awaitingName: 'Jordan Martinez', canRespond: false, canWithdraw: true, status: 'countered' };
                return { result: { data: { json:
                    procedure === 'household.purchaseAgreement' ? { limit: '1000.00', canEdit: true, updatedByName: null, updatedAt: null }
                    : procedure === 'household.purchaseProposals' ? { proposals: [proposal] }
                    : procedure === 'household.addTransaction' ? { approvalRequired: true, proposal: { id: 'purchase-2' }, transaction: null, balance: '2020.00', limitWarnings: [] }
                    : procedure === 'household.respondToPurchaseProposal' ? { proposal, transactionId: null }
                    : procedure === 'household.limits' && input.walletId !== 'shared' ? [{
                        id: 'limit', categoryId: null, categoryName: null, period: 'monthly',
                        amount: input.walletId === 'alex' ? '10.00' : '50.00', spent: '9.00',
                        remaining: input.walletId === 'alex' ? '1.00' : '41.00',
                        periodStart: `${input.today.slice(0, 7)}-01`, periodEnd: `${input.today.slice(0, 7)}-28`,
                    }] : procedure === 'household.deleteLimit' || procedure === 'household.setLimit'
                        ? { success: true } : [],
                } } };
            }),
        });
    });
    await page.goto('/tests/fixtures/family-controls.html');
});

test('shared purchase switches to approval strictly above the limit and closes after sending', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Shared purchase', exact: true }).click();
    await page.getByLabel('Amount, USD').fill('1000');
    await expect(page.getByRole('button', { name: 'Add expense', exact: true })).toBeEnabled();
    await page.getByLabel('Amount, USD').fill('1000.01');
    await expect(page.getByText(/Another adult must approve this/)).toBeVisible();
    const sent = page.waitForRequest(request => request.method() === 'POST' && request.url().includes('household.addTransaction'));
    await page.getByRole('button', { name: 'Send for approval', exact: true }).click();
    await sent;
    await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('counter works at 375px and returns the turn without spending', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Purchase proposals', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Purchases waiting for you', exact: true })).toBeVisible();
    await expect(page.getByText(/Nothing is spent or reserved/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: '/tmp/woolet-approval-375.png', fullPage: true });
    await page.getByRole('button', { name: 'Counter', exact: true }).click();
    await page.getByLabel('New amount, USD').fill('950,50');
    await expect(page.getByLabel('New amount, USD')).toHaveValue('950.50');
    await page.getByRole('button', { name: 'Send counter', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Waiting for Jordan Martinez', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
});

test('guardian transfer warns for the selected child source and excludes it from destinations', async ({ page }) => {
    await page.getByRole('button', { name: 'Transfer from shared', exact: true }).click();
    await page.getByLabel('Amount, USD').fill('5');
    await page.getByLabel('From', { exact: true }).click();
    await page.getByRole('option', { name: "Alex's wallet · USD", exact: true }).click();
    await expect(page.getByText(/This puts Alex/)).toBeVisible();
    await page.getByLabel('To', { exact: true }).click();
    await expect(page.getByRole('option', { name: "Alex's wallet · USD", exact: true })).toHaveCount(0);
    await page.getByRole('option', { name: 'Groceries · USD', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Add anyway', exact: true })).toBeEnabled();
    await page.getByLabel('From', { exact: true }).click();
    await page.getByRole('option', { name: "Riley's wallet · USD", exact: true }).click();
    await expect(page.getByText(/This puts Alex/)).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Transfer', exact: true })).toBeEnabled();
});

test('child switches wallets and previews limits for the recorded expense date', async ({ page }) => {
    await page.getByRole('button', { name: 'Child expense', exact: true }).click();
    await page.getByLabel('Amount, USD').fill('5');
    await expect(page.getByRole('button', { name: 'Add expense', exact: true })).toBeDisabled();
    await expect(page.getByRole('alert')).toContainText('This is more than you have left');
    await page.getByLabel('Wallet', { exact: true }).click();
    await page.getByRole('option', { name: "Riley's wallet · USD", exact: true }).click();
    await expect(page.getByRole('button', { name: 'Add expense', exact: true })).toBeEnabled();
    const historicalLimits = page.waitForRequest((request) => request.url().includes('household.limits') && request.url().includes('2024-01-20'));
    await page.getByLabel('Date', { exact: true }).fill('2024-01-20');
    await historicalLimits;
    await expect(page.getByText(/in the period ending Jan 28/)).toBeVisible();
    await expect(page.getByLabel('Category', { exact: true })).toHaveRole('combobox');
});

test('canceling limit removal leaves the edit form open without submitting', async ({ page }) => {
    const writes: string[] = [];
    page.on('request', (request) => { if (request.method() === 'POST') writes.push(request.url()); });
    await page.getByRole('button', { name: 'Edit limits', exact: true }).click();
    await page.locator('form').evaluate((form) => {
        form.addEventListener('submit', () => { document.documentElement.dataset.submitted = 'yes'; });
    });
    await page.getByRole('button', { name: 'Remove all limits', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Total limit, USD')).toHaveValue('10.00');
    expect(await page.locator('html').getAttribute('data-submitted')).toBeNull();
    expect(writes).toEqual([]);
});

test('removing limits sends only removal and never submits the save form', async ({ page }) => {
    const writes: string[] = [];
    page.on('request', (request) => { if (request.method() === 'POST') writes.push(new URL(request.url()).pathname); });
    await page.getByRole('button', { name: 'Edit limits', exact: true }).click();
    await page.getByRole('button', { name: 'Remove all limits', exact: true }).click();
    await page.getByRole('button', { name: 'Remove limits', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('household.deleteLimit');
});
