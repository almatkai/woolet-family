#!/usr/bin/env bun

/**
 * Add KZT (Kazakhstani Tenge) exchange rate manually
 * 
 * KZT is not supported by exchangerate-api.com, so we need to add it manually.
 * Current rate (as of Feb 2026): 1 USD ≈ 450 KZT (approximate)
 * 
 * Usage:
 *   bun add-kzt-rate.ts
 */ 

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { fxRates, currencies } from './src/db/schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
    const today = new Date().toISOString().split('T')[0];
    
    // Current KZT rate (you can update this with the latest rate)
    // As of Feb 2026: 1 USD = ~450 KZT
    const usdToKzt = 450.00;
    
    console.log(`📊 Adding KZT exchange rate: 1 USD = ${usdToKzt} KZT`);
    
    // 1. Update currencies table with the exchange rate
    await db.update(currencies)
        .set({ exchangeRate: String(usdToKzt) })
        .where(eq(currencies.code, 'KZT'));
    
    console.log('✅ Updated currencies table');
    
    // 2. Add to fxRates for historical tracking
    await db.insert(fxRates)
        .values({
            date: today,
            fromCurrency: 'USD',
            toCurrency: 'KZT',
            rate: String(usdToKzt)
        })
        .onConflictDoNothing();
    
    console.log('✅ Added to fxRates table');
    console.log('');
    console.log('🎉 KZT rate added successfully!');
    console.log('💡 Note: This rate should be updated periodically as it\'s not fetched from the API');
    
    await client.end();
}

main().catch((err) => {
    console.error('❌ Error adding KZT rate:', err);
    process.exit(1);
});
