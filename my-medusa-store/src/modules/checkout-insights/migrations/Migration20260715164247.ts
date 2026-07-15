import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260715164247 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_attempt" alter column "cart_id" type text using ("cart_id"::text);`);
    this.addSql(`alter table if exists "payment_attempt" alter column "cart_id" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payment_attempt" alter column "cart_id" type text using ("cart_id"::text);`);
    this.addSql(`alter table if exists "payment_attempt" alter column "cart_id" set not null;`);
  }

}
