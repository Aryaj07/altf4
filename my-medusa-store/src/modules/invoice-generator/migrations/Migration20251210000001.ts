import { Migration } from '@mikro-orm/migrations';

export class Migration20251210000001 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "invoice_config" drop column if exists "company_address";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "invoice_config" add column "company_address" text null;');
  }

}
