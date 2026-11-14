CREATE TYPE "public"."family_limit_period" AS ENUM('weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."family_transaction_type" AS ENUM('income', 'expense', 'transfer_in', 'transfer_out');--> statement-breakpoint
CREATE TYPE "public"."family_wallet_kind" AS ENUM('shared', 'child');--> statement-breakpoint
CREATE TYPE "public"."household_invitation_role" AS ENUM('adult', 'child');--> statement-breakpoint
CREATE TYPE "public"."household_member_status" AS ENUM('active', 'left', 'removed');--> statement-breakpoint
CREATE TYPE "public"."household_role" AS ENUM('owner', 'adult', 'child');--> statement-breakpoint
CREATE TABLE "family_budget_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"category_id" uuid,
	"period" "family_limit_period" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_limit_positive" CHECK ("family_budget_limits"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "family_wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"type" "family_transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category_id" uuid,
	"description" text,
	"date" date NOT NULL,
	"transfer_group_id" uuid,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_transaction_positive" CHECK ("family_wallet_transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "family_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"kind" "family_wallet_kind" NOT NULL,
	"name" text NOT NULL,
	"currency_code" text NOT NULL,
	"child_member_id" uuid,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"archived_at" timestamp,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_wallet_child_member_check" CHECK (("family_wallets"."kind" = 'shared' AND "family_wallets"."child_member_id" IS NULL) OR ("family_wallets"."kind" = 'child' AND ("family_wallets"."child_member_id" IS NOT NULL OR "family_wallets"."archived_at" IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "household_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"email_normalized" text NOT NULL,
	"role" "household_invitation_role" NOT NULL,
	"is_guardian" boolean DEFAULT false NOT NULL,
	"invited_by_user_id" text,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_by_user_id" text,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "household_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "household_role" NOT NULL,
	"is_guardian" boolean DEFAULT false NOT NULL,
	"show_balance_to_children" boolean DEFAULT false NOT NULL,
	"status" "household_member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"children_can_see_shared_wallets" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_budget_limits" ADD CONSTRAINT "family_budget_limits_wallet_id_family_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."family_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_budget_limits" ADD CONSTRAINT "family_budget_limits_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_budget_limits" ADD CONSTRAINT "family_budget_limits_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallet_transactions" ADD CONSTRAINT "family_wallet_transactions_wallet_id_family_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."family_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallet_transactions" ADD CONSTRAINT "family_wallet_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallet_transactions" ADD CONSTRAINT "family_wallet_transactions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallets" ADD CONSTRAINT "family_wallets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallets" ADD CONSTRAINT "family_wallets_currency_code_currencies_code_fk" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallets" ADD CONSTRAINT "family_wallets_child_member_id_household_members_id_fk" FOREIGN KEY ("child_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_wallets" ADD CONSTRAINT "family_wallets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "family_limits_total_unique" ON "family_budget_limits" USING btree ("wallet_id","period") WHERE "family_budget_limits"."category_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "family_limits_category_unique" ON "family_budget_limits" USING btree ("wallet_id","category_id","period") WHERE "family_budget_limits"."category_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "family_transactions_wallet_date_idx" ON "family_wallet_transactions" USING btree ("wallet_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_household_user_unique" ON "household_members" USING btree ("household_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_active_user_unique" ON "household_members" USING btree ("user_id") WHERE "household_members"."status" = 'active';