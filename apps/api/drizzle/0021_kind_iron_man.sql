CREATE TABLE "household_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"category_id" uuid,
	"currency_code" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "household_budget_positive" CHECK ("household_budgets"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "household_budgets" ADD CONSTRAINT "household_budgets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_budgets" ADD CONSTRAINT "household_budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_budgets" ADD CONSTRAINT "household_budgets_currency_code_currencies_code_fk" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_budgets" ADD CONSTRAINT "household_budgets_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "household_budgets_total_unique" ON "household_budgets" USING btree ("household_id") WHERE "household_budgets"."category_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "household_budgets_category_unique" ON "household_budgets" USING btree ("household_id","category_id") WHERE "household_budgets"."category_id" IS NOT NULL;