import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/browser',
    testMatch: '**/*.e2e.ts',
    fullyParallel: true,
    workers: 4,
    timeout: 15_000,
    expect: { timeout: 3_000 },
    use: {
        baseURL: 'http://127.0.0.1:5186',
        isMobile: true,
        hasTouch: true,
        channel: process.env.PLAYWRIGHT_CHANNEL,
    },
    projects: [
        { name: 'mobile-small', use: { viewport: { width: 320, height: 640 } } },
        { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
        { name: 'mobile-wide', use: { viewport: { width: 430, height: 932 } } },
    ],
    webServer: {
        command: 'bun x vite --config tests/vite.config.ts',
        url: 'http://127.0.0.1:5186/tests/fixtures/modal-controls.html',
        reuseExistingServer: false,
    },
});
