import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route('**/trpc/**', async (route) => {
        const url = new URL(route.request().url());
        const procedures = url.pathname.split('/trpc/')[1].split(',');
        const inputs = JSON.parse(url.searchParams.get('input') ?? route.request().postData() ?? '{}');
        await route.fulfill({
            json: procedures.map((procedure, index) => {
                const input = inputs[index]?.json ?? {};
                return { result: { data: { json:
                    procedure === 'household.limits' && input.walletId !== 'shared' ? [{
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
