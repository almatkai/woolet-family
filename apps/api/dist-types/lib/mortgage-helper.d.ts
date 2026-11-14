/**
 * Checks if a transaction is a mortgage payment and links it to the mortgage.
 *
 * Logic:
 * 1. Transaction must be an EXPENSE.
 * 2. It must have a category named "Mortgage" (or similar).
 * 3. It must belong to an account that has an Active Mortgage.
 * 4. Create a record in `mortgage_payments` for the transaction month.
 * 5. Update the mortgage remaining balance.
 */
export declare function processMortgagePaymentFromTransaction(transactionId: string): Promise<void>;
