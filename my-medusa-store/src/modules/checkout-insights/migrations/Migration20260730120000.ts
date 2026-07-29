import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260730120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "order_update_email" ("id" text not null, "order_id" text not null, "order_display_id" text null, "customer_id" text null, "email" text not null, "subject" text not null, "message" text not null, "html" text not null, "batch_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_update_email_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_update_email_order_id" ON "order_update_email" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_update_email_customer_id" ON "order_update_email" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_update_email_email" ON "order_update_email" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_update_email_batch_id" ON "order_update_email" ("batch_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_update_email_deleted_at" ON "order_update_email" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "order_update_email" cascade;`);
  }

}
