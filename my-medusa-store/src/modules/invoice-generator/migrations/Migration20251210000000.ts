import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251210000000 extends Migration {

  override async up(): Promise<void> {
    // Add GST-related fields to invoice_config table
    this.addSql(`alter table if exists "invoice_config" add column if not exists "template_type" text default 'default';`);
    this.addSql(`alter table if exists "invoice_config" add column if not exists "gstin" text;`);
    this.addSql(`alter table if exists "invoice_config" add column if not exists "state_name" text;`);
    this.addSql(`alter table if exists "invoice_config" add column if not exists "state_code" text;`);
    this.addSql(`alter table if exists "invoice_config" add column if not exists "pan" text;`);
    this.addSql(`alter table if exists "invoice_config" add column if not exists "authorized_signatory" text;`);
  }

  override async down(): Promise<void> {
    // Remove GST-related fields from invoice_config table
    this.addSql(`alter table if exists "invoice_config" drop column if exists "authorized_signatory";`);
    this.addSql(`alter table if exists "invoice_config" drop column if exists "pan";`);
    this.addSql(`alter table if exists "invoice_config" drop column if exists "state_code";`);
    this.addSql(`alter table if exists "invoice_config" drop column if exists "state_name";`);
    this.addSql(`alter table if exists "invoice_config" drop column if exists "gstin";`);
    this.addSql(`alter table if exists "invoice_config" drop column if exists "template_type";`);
  }

}
