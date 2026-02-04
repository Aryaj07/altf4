import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260204152900 extends Migration {

  override async up(): Promise<void> {
    // Drop the old constraint
    this.addSql(`ALTER TABLE "product_description_section" DROP CONSTRAINT IF EXISTS "product_description_section_template_check";`);
    
    // Add new constraint with all three template options
    this.addSql(`ALTER TABLE "product_description_section" ADD CONSTRAINT "product_description_section_template_check" CHECK ("template" IN ('image_left_text_right', 'image_right_text_left', 'full_width_image'));`);
  }

  override async down(): Promise<void> {
    // Revert to old constraint with only two options
    this.addSql(`ALTER TABLE "product_description_section" DROP CONSTRAINT IF EXISTS "product_description_section_template_check";`);
    this.addSql(`ALTER TABLE "product_description_section" ADD CONSTRAINT "product_description_section_template_check" CHECK ("template" IN ('image_left_text_right', 'full_width_image'));`);
  }

}
