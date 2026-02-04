import { model } from "@medusajs/framework/utils";

/**
 * Product Description Section Model
 * Stores rich content sections for product pages with different layout templates
 */
export const ProductDescriptionSection = model.define("product_description_section", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  title: model.text().nullable(),
  content: model.text().nullable(), // HTML/Markdown content
  image_url: model.text().nullable(),
  template: model.enum(["image_left_text_right", "image_right_text_left", "full_width_image"]).default("image_left_text_right"),
  order: model.number().default(0), // For sorting sections
  metadata: model.json().nullable(),
});
