-- CreateTable
CREATE TABLE "paypoint_accounts" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "reserved_balance" DECIMAL(30,0) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paypoint_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paypoint_transactions" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(30,0) NOT NULL,
    "order_id" TEXT,
    "receipt_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paypoint_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL DEFAULT 'PAYPOINT',
    "entry_type" TEXT NOT NULL,
    "amount" DECIMAL(30,0) NOT NULL,
    "balance_before" DECIMAL(30,0) NOT NULL,
    "balance_after" DECIMAL(30,0) NOT NULL,
    "receipt_id" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "idempotency_key" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "merchant_id" TEXT,
    "agent_id" TEXT,
    "intent_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(30,0) NOT NULL,
    "asset_type" TEXT NOT NULL DEFAULT 'PAYPOINT',
    "policy_decision" JSONB,
    "settlement_route" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_events" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_products" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "product_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "face_value" DECIMAL(30,0) NOT NULL,
    "price_paypoint" DECIMAL(30,0) NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "credit_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_redemptions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "receipt_id" TEXT,
    "status" TEXT NOT NULL,
    "provider_ref" TEXT,
    "code_display" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "credit_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paypoint_policies" (
    "policy_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "policy_json" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paypoint_policies_pkey" PRIMARY KEY ("policy_id","version")
);

-- CreateTable
CREATE TABLE "paypoint_earn_locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "earn_rate" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paypoint_earn_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paypoint_conversions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "from_amount" DECIMAL(30,0) NOT NULL,
    "from_unit" TEXT NOT NULL DEFAULT 'PAYPOINT',
    "to_asset" TEXT NOT NULL,
    "to_chain_id" BIGINT,
    "status" TEXT NOT NULL,
    "quote" JSONB,
    "tx_hash" TEXT,
    "settlement_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paypoint_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paypoint_exceptions" (
    "id" UUID NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "detail" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "paypoint_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "idempotency_key" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("idempotency_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "paypoint_accounts_user_id_key" ON "paypoint_accounts"("user_id");

-- CreateIndex
CREATE INDEX "paypoint_transactions_account_id_created_at_idx" ON "paypoint_transactions"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "paypoint_transactions_receipt_id_idx" ON "paypoint_transactions"("receipt_id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_created_at_idx" ON "ledger_entries"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_user_id_created_at_idx" ON "ledger_entries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_receipt_id_idx" ON "ledger_entries"("receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_idempotency_key_key" ON "ledger_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "receipts_user_id_created_at_idx" ON "receipts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "receipts_merchant_id_created_at_idx" ON "receipts"("merchant_id", "created_at");

-- CreateIndex
CREATE INDEX "receipts_status_created_at_idx" ON "receipts"("status", "created_at");

-- CreateIndex
CREATE INDEX "receipt_events_receipt_id_created_at_idx" ON "receipt_events"("receipt_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_products_product_type_status_idx" ON "credit_products"("product_type", "status");

-- CreateIndex
CREATE INDEX "credit_products_category_status_idx" ON "credit_products"("category", "status");

-- CreateIndex
CREATE INDEX "credit_redemptions_user_id_created_at_idx" ON "credit_redemptions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_redemptions_product_id_status_idx" ON "credit_redemptions"("product_id", "status");

-- CreateIndex
CREATE INDEX "paypoint_policies_policy_id_status_idx" ON "paypoint_policies"("policy_id", "status");

-- CreateIndex
CREATE INDEX "paypoint_earn_locations_is_active_sort_order_idx" ON "paypoint_earn_locations"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "paypoint_conversions_user_id_status_idx" ON "paypoint_conversions"("user_id", "status");

-- CreateIndex
CREATE INDEX "paypoint_exceptions_status_created_at_idx" ON "paypoint_exceptions"("status", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "paypoint_transactions" ADD CONSTRAINT "paypoint_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paypoint_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "paypoint_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_events" ADD CONSTRAINT "receipt_events_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_redemptions" ADD CONSTRAINT "credit_redemptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "credit_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
