import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

const environmentFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';

// Load the environment-specific file first, then fill in shared defaults.
// Existing process variables (for example Docker/CI values) always win.
dotenv.config({ path: path.join(repoRoot, environmentFile) });
dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(repoRoot, '.env.local') });

if (!process.env.DATABASE_URL && process.env.DB_HOST && process.env.DB_PORT && process.env.DB_USER && process.env.DB_NAME) {
    const dbPassword = encodeURIComponent(process.env.DB_PASSWORD || '');
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(process.env.DB_USER)}:${dbPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${encodeURIComponent(process.env.DB_NAME)}`;
}

if (!process.env.REDIS_URL && process.env.REDIS_HOST && process.env.REDIS_PORT) {
    const password = process.env.REDIS_PASSWORD ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@` : '';
    const database = process.env.REDIS_DB || '0';
    process.env.REDIS_URL = `redis://${password}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${database}`;
}
