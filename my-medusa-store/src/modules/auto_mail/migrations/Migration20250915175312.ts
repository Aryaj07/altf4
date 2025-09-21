import { Migration } from '@mikro-orm/migrations';

export class Migration20250915175312 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "review" ("id" text not null, "order_id" text not null, "line_item_id" text not null, "customer_email" text not null, "customer_first_name" text null, "customer_last_name" text null, "product_title" text null, "product_thumbnail" text null, "review_link" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`);
  }

}
