/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_CLERK_PUBLISHABLE_KEY: string;
    readonly VITE_CLERK_PROXY_URL: string;
    readonly VITE_PADDLE_CLIENT_TOKEN: string;
    readonly VITE_PADDLE_ENV: 'sandbox' | 'production';
    readonly VITE_PADDLE_PRO_PRICE_ID: string;
    readonly VITE_PADDLE_PREMIUM_PRICE_ID: string;
    readonly VITE_PADDLE_PRO_PRICE_LABEL: string;
    readonly VITE_PADDLE_PREMIUM_PRICE_LABEL: string;
    readonly VITE_API_URL: string;
    readonly VITE_PUBLIC_POSTHOG_KEY: string;
    readonly VITE_PUBLIC_POSTHOG_HOST: string;
    readonly VITE_PUBLIC_POSTHOG_UI_HOST: string;
    readonly VITE_PUBLIC_POSTHOG_ACQUISITION_SURVEY_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
