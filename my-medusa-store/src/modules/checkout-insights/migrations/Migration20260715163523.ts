import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260715163523 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_attempt" ("id" text not null, "cart_id" text not null, "order_id" text null, "customer_id" text null, "email" text null, "provider_id" text not null default 'razorpay', "status" text check ("status" in ('initiated', 'failed', 'authorized', 'captured')) not null, "amount" numeric null, "currency_code" text null, "failure_code" text null, "failure_reason" text null, "external_payment_id" text null, "raw_payload" jsonb null, "raw_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_attempt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_cart_id" ON "payment_attempt" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_order_id" ON "payment_attempt" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_customer_id" ON "payment_attempt" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_email" ON "payment_attempt" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_deleted_at" ON "payment_attempt" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_external_payment_id_status" ON "payment_attempt" ("external_payment_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_cart_id_status" ON "payment_attempt" ("cart_id", "status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_attempt" cascade;`);
  }

}
