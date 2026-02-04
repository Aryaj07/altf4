import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260204153027 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_description_section" drop constraint if exists "product_description_section_template_check";`);

    this.addSql(`alter table if exists "product_description_section" add constraint "product_description_section_template_check" check("template" in ('image_left_text_right', 'image_right_text_left', 'full_width_image'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_description_section" drop constraint if exists "product_description_section_template_check";`);

    this.addSql(`alter table if exists "product_description_section" add constraint "product_description_section_template_check" check("template" in ('image_left_text_right', 'full_width_image'));`);
  }

}
