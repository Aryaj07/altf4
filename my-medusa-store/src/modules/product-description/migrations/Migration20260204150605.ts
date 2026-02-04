import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260204150605 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_description_section" ("id" text not null, "product_id" text not null, "title" text null, "content" text null, "image_url" text null, "template" text check ("template" in ('image_left_text_right', 'full_width_image')) not null default 'image_left_text_right', "order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_description_section_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_description_section_deleted_at" ON "product_description_section" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_description_section" cascade;`);
  }

}
