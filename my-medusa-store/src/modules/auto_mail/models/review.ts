import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  // A unique ID for this review request
  id: model.id().primaryKey(),
  
  // The ID of the order
  order_id: model.text(),
  
  // The ID of the specific line item in the order
  line_item_id: model.text(),

  // The customer's email
  customer_email: model.text(),

  //Customer First Name
  customer_first_name: model.text().nullable(), // Using nullable() is good practice if it might be empty

  //Customer Last Name
  customer_last_name: model.text().nullable(), // Using nullable() is good practice if it might be empty

  //Product Title
  product_title: model.text().nullable(),
  
  //Product Thumbnail
  product_thumbnail: model.text().nullable(),

  //review link
  review_link: model.text().nullable(), // Using nullable() is good practice if it might be empty

  //is mail sent
  is_mail_sent: model.boolean().default(false),
})

export default Review