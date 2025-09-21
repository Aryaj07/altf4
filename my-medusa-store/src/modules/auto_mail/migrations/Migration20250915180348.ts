import { Migration } from '@mikro-orm/migrations';

export class Migration20250915180348 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "is_mail_sent" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" drop column if exists "is_mail_sent";`);
  }

}
