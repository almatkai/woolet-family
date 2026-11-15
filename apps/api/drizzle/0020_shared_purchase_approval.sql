CREATE TYPE "public"."family_purchase_proposal_status" AS ENUM('pending', 'countered', 'approved', 'declined');--> statement-breakpoint
CREATE TABLE "family_purchase_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"proposer_user_id" text,
	"last_actor_user_id" text,
	"awaiting_user_id" text,
	"original_amount" numeric(12, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category_id" uuid,
	"description" text,
	"date" date NOT NULL,
	"status" "family_purchase_proposal_status" DEFAULT 'pending' NOT NULL,
	"decided_by_user_id" text,
	"decided_at" timestamp,
	"transaction_id" uuid,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_purchase_proposal_positive" CHECK ("family_purchase_proposals"."amount" > 0 AND "family_purchase_proposals"."original_amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "shared_purchase_limit" numeric(12, 2) DEFAULT '1000.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "shared_purchase_limit_updated_by_user_id" text;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "shared_purchase_limit_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_wallet_id_family_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."family_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_proposer_user_id_users_id_fk" FOREIGN KEY ("proposer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_last_actor_user_id_users_id_fk" FOREIGN KEY ("last_actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_awaiting_user_id_users_id_fk" FOREIGN KEY ("awaiting_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_purchase_proposals" ADD CONSTRAINT "family_purchase_proposals_transaction_id_family_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."family_wallet_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_purchase_proposals_household_status_idx" ON "family_purchase_proposals" USING btree ("household_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "family_purchase_proposals_transaction_unique" ON "family_purchase_proposals" USING btree ("transaction_id") WHERE "family_purchase_proposals"."transaction_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_shared_purchase_limit_updated_by_user_id_users_id_fk" FOREIGN KEY ("shared_purchase_limit_updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "household_shared_purchase_limit_nonnegative" CHECK ("households"."shared_purchase_limit" >= 0);
