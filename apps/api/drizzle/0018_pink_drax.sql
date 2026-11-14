CREATE TYPE "public"."tax_filing_status" AS ENUM('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_surviving_spouse');--> statement-breakpoint
CREATE TYPE "public"."tax_jurisdiction" AS ENUM('federal', 'state');--> statement-breakpoint
CREATE TABLE "tax_estimated_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tax_year" integer NOT NULL,
	"jurisdiction" "tax_jurisdiction" NOT NULL,
	"quarter" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"paid_on" date NOT NULL,
	"transaction_id" uuid,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_payments_quarter_range" CHECK ("tax_estimated_payments"."quarter" between 1 and 4),
	CONSTRAINT "tax_payments_positive_amount" CHECK ("tax_estimated_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "tax_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tax_year" integer NOT NULL,
	"filing_status" "tax_filing_status" NOT NULL,
	"state" text NOT NULL,
	"state_effective_rate" numeric(5, 2),
	"taxpayer_age_65" boolean DEFAULT false NOT NULL,
	"taxpayer_blind" boolean DEFAULT false NOT NULL,
	"spouse_age_65" boolean DEFAULT false NOT NULL,
	"spouse_blind" boolean DEFAULT false NOT NULL,
	"qualifying_children" integer DEFAULT 0 NOT NULL,
	"other_dependents" integer DEFAULT 0 NOT NULL,
	"wage_income" numeric(14, 2) DEFAULT '0' NOT NULL,
	"self_employment_income" numeric(14, 2) DEFAULT '0' NOT NULL,
	"interest_income" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ordinary_dividends" numeric(14, 2) DEFAULT '0' NOT NULL,
	"qualified_dividends" numeric(14, 2) DEFAULT '0' NOT NULL,
	"long_term_capital_gains" numeric(14, 2) DEFAULT '0' NOT NULL,
	"short_term_capital_gains" numeric(14, 2) DEFAULT '0' NOT NULL,
	"other_income" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pre_tax_contributions" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ira_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"hsa_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"student_loan_interest" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tips_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"overtime_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"federal_withholding_ytd" numeric(14, 2) DEFAULT '0' NOT NULL,
	"state_withholding_ytd" numeric(14, 2) DEFAULT '0' NOT NULL,
	"prior_year_tax" numeric(14, 2),
	"prior_year_agi" numeric(14, 2),
	"use_transactions_for_income" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_profiles_user_year_unique" UNIQUE("user_id","tax_year")
);
--> statement-breakpoint
ALTER TABLE "tax_estimated_payments" ADD CONSTRAINT "tax_estimated_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_estimated_payments" ADD CONSTRAINT "tax_estimated_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tax_payments_user_year_idx" ON "tax_estimated_payments" USING btree ("user_id","tax_year");