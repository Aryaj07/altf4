import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260715184842 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "recovery_email" ("id" text not null, "cart_id" text not null, "customer_id" text null, "email" text not null, "subject" text not null, "html" text not null, "items" jsonb not null, "total_formatted" text null, "manual" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "recovery_email_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recovery_email_cart_id" ON "recovery_email" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recovery_email_customer_id" ON "recovery_email" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recovery_email_email" ON "recovery_email" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_recovery_email_deleted_at" ON "recovery_email" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "recovery_email" cascade;`);
  }

}
