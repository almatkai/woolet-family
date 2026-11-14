import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// Keep drizzle-kit aligned with the API's environment-specific database config.
const environmentFile = process.env.NODE_ENV === 'production' ? '../../.env.prod' : '../../.env.dev';
config({ path: environmentFile });
config({ path: '../../.env' });

if (!process.env.DATABASE_URL && process.env.DB_HOST && process.env.DB_PORT && process.env.DB_USER && process.env.DB_NAME) {
    const dbPassword = encodeURIComponent(process.env.DB_PASSWORD || '');
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(process.env.DB_USER)}:${dbPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodeURIComponent(process.env.DB_NAME)}`;
}

export default {
    schema: './src/db/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
} satisfies Config;
