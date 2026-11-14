import postgres from 'postgres';

export async function ensureDatabaseExists() {
    const fullUrl = process.env.DATABASE_URL;

    if (!fullUrl) {
        console.warn('⚠️ DATABASE_URL is not defined, skipping database existence check');
        return;
    }

    try {
        // Skip database check on alem.ai hosts as they usually have restricted permissions
        if (fullUrl.includes('alem.ai')) {
            return;
        }
        const url = new URL(fullUrl);
        const targetDb = url.pathname.slice(1);

        if (!targetDb || targetDb === 'postgres') {
            return;
        }

        console.log(`⏳ Checking if database '${targetDb}' exists...`);

        const adminUrl = new URL(fullUrl);
        adminUrl.pathname = '/postgres';

        const sql = postgres(adminUrl.toString(), { max: 1 });

        const exists = await sql`
            SELECT 1 FROM pg_database WHERE datname = ${targetDb}
        `;

        if (exists.length === 0) {
            console.log(`🚧 Database '${targetDb}' does not exist. Creating...`);
            await sql.unsafe(`CREATE DATABASE "${targetDb}"`);
            console.log(`✅ Database '${targetDb}' created successfully.`);
        } else {
            console.log(`✅ Database '${targetDb}' already exists.`);
        }

        await sql.end();
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            console.log(`✅ Database already exists (handled error).`);
        } else {
            console.warn('⚠️ Database setup check failed (this is normal on some managed hosts):', error.message);
        }
    }
}
