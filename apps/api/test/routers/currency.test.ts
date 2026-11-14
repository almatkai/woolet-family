import { describe, expect, test, mock } from "bun:test";
import { currencyRouter } from "../../src/routers/currency";
import { DEFAULT_CURRENCIES } from "../../src/db/schema/currencies";
import { createMockContext } from "../utils";

describe("Currency Router", () => {
  test("list should return all currencies", async () => {
    const mockDb = {
      select: mock(() => ({
        from: mock(() => Promise.resolve([
            { code: "USD", name: "US Dollar", symbol: "$" },
            { code: "EUR", name: "Euro", symbol: "€" }
        ])),
      })),
    };
    
    const ctx = createMockContext({ db: mockDb as any });
    const caller = currencyRouter.createCaller(ctx);
    
    const result = await caller.list();
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("USD");
    expect(mockDb.select).toHaveBeenCalled();
  });

  test("list should auto-seed default currencies when table has missing rows", async () => {
    let callCount = 0;
    const insertedValues: any[] = [];
    const mockDb = {
      select: mock(() => ({
        from: mock(() => {
          callCount++;
          if (callCount === 1) {
            // First select returns only 2 currencies (like on unseeded prod)
            return Promise.resolve([
              { code: "USD", name: "US Dollar", symbol: "$" },
              { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" }
            ]);
          }
          // After insert, returns the seeded list
          return Promise.resolve(DEFAULT_CURRENCIES);
        }),
      })),
      insert: mock(() => ({
        values: mock((vals: any) => {
          insertedValues.push(...vals);
          return {
            onConflictDoNothing: mock(() => Promise.resolve()),
          };
        }),
      })),
    };

    const ctx = createMockContext({ db: mockDb as any });
    const caller = currencyRouter.createCaller(ctx);

    const result = await caller.list();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(insertedValues.length).toBe(DEFAULT_CURRENCIES.length);
    expect(result.length).toBe(DEFAULT_CURRENCIES.length);
  });
});

