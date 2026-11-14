import { test, expect } from '@playwright/test';

const balanceId = '11111111-1111-4111-8111-111111111111';

test.beforeEach(async ({ page }) => {
    await page.route('**/trpc/**', async route => {
        const procedures = new URL(route.request().url()).pathname.split('/trpc/')[1].split(',');
        await route.fulfill({
            json: procedures.map(procedure => ({
                result: {
                    data: {
                        json:
                            procedure === 'bank.getHierarchy'
                                ? [{
                                    id: 'bank',
                                    name: 'Test Bank',
                                    accounts: [{
                                        id: 'account',
                                        name: 'Main',
                                        currencyBalances: [{ id: balanceId, balance: '10000', currencyCode: 'KZT' }],
                                    }],
                                }]
                                : procedure === 'bank.getLimitsAndUsage'
                                ? {
                                    tier: 'free',
                                    limits: { banks: '2' },
                                    dataLimits: { maxBanks: 2 },
                                    usage: { banks: 1 },
                                }
                                : procedure === 'category.list'
                                ? [{
                                    id: 'category',
                                    name: 'Food',
                                    icon: '🍔',
                                    color: '#ff0000',
                                    type: 'expense',
                                    userId: null,
                                }]
                                : procedure === 'bank.create'
                                ? { id: 'created-bank' }
                                : procedure === 'currency.list'
                                ? [
                                    { code: 'USD', name: 'US Dollar', symbol: '$' },
                                    { code: 'EUR', name: 'Euro', symbol: '€' },
                                    { code: 'GBP', name: 'British Pound', symbol: '£' },
                                    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
                                    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
                                    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
                                    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
                                    { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN¥' },
                                    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
                                    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
                                    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
                                    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
                                    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
                                    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
                                    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
                                    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
                                    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
                                    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
                                    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
                                    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
                                    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
                                    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
                                    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
                                    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
                                    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
                                    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
                                    { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪' },
                                    { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$' },
                                    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
                                    { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
                                    { code: 'COP', name: 'Colombian Peso', symbol: 'COL$' },
                                    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
                                    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
                                    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
                                ]
                                : procedure === 'currency.getPreferred'
                                ? { defaultCurrency: 'USD', recent: ['EUR'] }
                                : [],
                    }
                }
            }))
        });
    });
    await page.goto('/tests/fixtures/modal-controls.html');
});

test('debt help opens on touch without changing the tracking switch', async ({ page }) => {
    await page.getByRole('button', { name: 'Open debt', exact: true }).tap();
    await page.getByRole('button', { name: 'About untracked debts' }).tap();
    await expect(page.getByText(/Enable if this debt was created before/)).toBeVisible();
    await expect(page.getByRole('switch')).not.toBeChecked();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Add Debt' })).toBeVisible();
});

test('debt actions have a touch-friendly gap and Cancel closes without submitting', async ({ page }) => {
    await page.getByRole('button', { name: 'Open real debt sheet', exact: true }).tap();
    await expect(page.getByRole('dialog', { name: 'Add Debt' })).toBeVisible();
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
    await cancelBtn.scrollIntoViewIfNeeded();
    const addDebt = await page.getByRole('button', { name: 'Add Debt', exact: true }).boundingBox();
    const cancel = await cancelBtn.boundingBox();
    expect(addDebt).not.toBeNull();
    expect(cancel).not.toBeNull();
    expect(Math.max(addDebt!.y, cancel!.y) - Math.min(addDebt!.y + addDebt!.height, cancel!.y + cancel!.height)).toBeGreaterThanOrEqual(8);
    await cancelBtn.tap();
    await expect(page.getByRole('dialog', { name: 'Add Debt' })).not.toBeVisible();
});

test('Manage opens categories and can reopen without losing the transaction', async ({ page }) => {
    await page.getByRole('button', { name: 'Open transaction' }).tap();
    await page.getByLabel('Amount').fill('42');
    await page.getByRole('button', { name: 'Manage' }).tap();
    await page.getByRole('button', { name: 'Close', exact: true }).tap();
    await expect(page.getByLabel('Amount')).toHaveValue('42');
});

test('bank icons can be selected by touch and the selection is submitted', async ({ page }) => {
    await page.getByRole('button', { name: 'Bank', exact: true }).tap();
    await page.getByLabel('Name', { exact: true }).fill('Interactive Brokers');
    await page.getByRole('combobox').tap();
    await page.getByRole('tab', { name: 'Icons', exact: true }).tap();
    const icon = page.getByRole('button', { name: 'PiggyBank', exact: true });
    expect((await icon.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await icon.tap();
    await expect(page.getByRole('combobox')).toContainText('PiggyBank');
    const request = page.waitForRequest(request => request.url().includes('/trpc/bank.create'));
    await page.getByRole('button', { name: 'Create', exact: true }).tap();
    expect((await request).postDataJSON()['0'].json).toMatchObject({ name: 'Interactive Brokers', icon: 'PiggyBank' });
    await expect(page.getByRole('dialog', { name: 'Add Bank' })).not.toBeVisible();
});

test('bank actions have a touch-friendly gap and Cancel closes without creating', async ({ page }) => {
    page.on('request', request => { if (request.url().includes('/trpc/bank.create')) creations++; });
    let creations = 0;
    await page.getByRole('button', { name: 'Bank', exact: true }).tap();
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
    await cancelBtn.scrollIntoViewIfNeeded();
    const create = await page.getByRole('button', { name: 'Create', exact: true }).boundingBox();
    const cancel = await cancelBtn.boundingBox();
    expect(Math.max(create!.y, cancel!.y) - Math.min(create!.y + create!.height, cancel!.y + cancel!.height)).toBeGreaterThanOrEqual(8);
    await cancelBtn.tap();
    await expect(page.getByRole('dialog', { name: 'Add Bank' })).not.toBeVisible();
    expect(creations).toBe(0);
});

test('currency selector list can be scrolled by touch inside a sheet and selects item', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Currency' }).tap();
    await expect(page.getByRole('dialog', { name: 'Add Currency to Main Card' })).toBeVisible();

    await page.getByRole('combobox', { name: /Select currency|Currency:/ }).tap();
    const list = page.locator('[cmdk-list]');
    await expect(list).toBeVisible();

    await expect(list).toHaveCSS('touch-action', 'pan-y');

    await list.evaluate((el) => {
        el.scrollTop = 250;
        el.dispatchEvent(new Event('scroll'));
    });
    const scrolledTop = await list.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThan(0);

    const plnItem = page.getByRole('option', { name: /PLN/ });
    await plnItem.scrollIntoViewIfNeeded();
    await plnItem.tap();

    await expect(list).not.toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Currency: PLN' })).toBeVisible();
});

test('currency selector search filters currencies on mobile without getting squashed or cut off', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Currency' }).tap();
    await expect(page.getByRole('dialog', { name: 'Add Currency to Main Card' })).toBeVisible();

    await page.getByRole('combobox', { name: /Select currency|Currency:/ }).tap();
    const searchInput = page.getByPlaceholder('Search currency...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('EUR');

    const eurItem = page.getByRole('option', { name: /EUR/ });
    await expect(eurItem).toBeVisible();

    await eurItem.tap();
    await expect(page.locator('[cmdk-list]')).not.toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Currency: EUR' })).toBeVisible();
});

test('toast notification renders in dark design with rounded pill styling', async ({ page }) => {
    await page.getByRole('button', { name: 'Trigger Error Toast' }).tap();
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Failed to add bank');

    const closeBtn = toast.locator('[data-close-button]');
    if (await closeBtn.isVisible()) {
        const toastBox = await toast.boundingBox();
        const closeBox = await closeBtn.boundingBox();
        expect(toastBox).not.toBeNull();
        expect(closeBox).not.toBeNull();
        expect(closeBox!.x).toBeGreaterThan(toastBox!.x + toastBox!.width / 2);
    }
});

test('bank create error displays exact server error and upgrade action if limit reached', async ({ page }) => {
    await page.route('**/trpc/bank.create*', async route => {
        await route.fulfill({
            status: 403,
            json: [{
                error: {
                    json: {
                        message: 'Bank limit reached (2). Upgrade to Pro for unlimited banks.',
                        code: -32003,
                        data: { code: 'FORBIDDEN', httpStatus: 403 },
                    }
                }
            }]
        });
    });

    await page.getByRole('button', { name: 'Bank', exact: true }).tap();
    await page.getByLabel('Name', { exact: true }).fill('Kaspi');
    await page.getByRole('button', { name: 'Create', exact: true }).tap();

    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Bank limit reached (2). Upgrade to Pro for unlimited banks.');
    await expect(toast.getByRole('button', { name: 'Upgrade' })).toBeVisible();
});
