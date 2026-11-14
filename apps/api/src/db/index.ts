import '../env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const maxConnections = Number(process.env.DB_MAX_CONNECTIONS || '2');

const client = postgres(connectionString, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
});

export const db = drizzle(client, { schema });
