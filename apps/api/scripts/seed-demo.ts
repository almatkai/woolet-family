import '../src/env';
import { createClerkClient } from '@clerk/backend';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { demoActors, demoEmail, demoNames, seedDemo, type DemoActorIds } from '../src/lib/demo/seed';

if (!process.argv.includes('--apply')) {
    console.log('Creates only synthetic Martinez demo users and data. Run with --apply to provision. Existing demo data and AI usage are preserved.');
    process.exit(0);
}
if (!process.env.CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY is required');
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });
const actors = {} as DemoActorIds;
try {
    for (const actor of demoActors) {
        const email = demoEmail(actor);
        const matches = await clerk.users.getUserList({ emailAddress: [email], limit: 2 });
        if (matches.data.length > 1) throw new Error('Duplicate synthetic Clerk identity');
        let user = matches.data[0];
        if (user && user.privateMetadata.wooletDemo !== true) throw new Error('Existing identity is not marked as a synthetic demo');
        if (!user) user = await clerk.users.createUser({
            emailAddress: [email], firstName: demoNames[actor], lastName: 'Martinez',
            skipPasswordRequirement: true, skipLegalChecks: true,
            privateMetadata: { wooletDemo: true, demoRole: actor },
        });
        actors[actor] = user.id;
    }
    console.log(JSON.stringify(await seedDemo(db, actors)));
    // These IDs identify synthetic users; they are not credentials or sign-in tickets.
    for (const actor of demoActors) console.log(`DEMO_${actor.toUpperCase()}_USER_ID=${actors[actor]}`);
} catch (error) {
    const failure = error as { status?: number; errors?: { code?: string; message?: string; longMessage?: string }[] };
    console.error(JSON.stringify({ error: 'Demo provisioning failed', status: failure.status, details: failure.errors?.map(detail => ({ code: detail.code, message: detail.message, detail: detail.longMessage })) ?? (error instanceof Error ? error.message : 'Unknown error') }));
    process.exitCode = 1;
} finally {
    await client.end();
}
