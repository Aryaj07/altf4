import { model } from "@medusajs/utils"

// Audit log of bulk "order update" emails (e.g. preorder delay notices):
// one row per recipient per send, grouped by batch_id so a bulk send shows
// up as a single entry in the admin history list.
export const OrderUpdateEmail = model.define("order_update_email", {
  id: model.id({ prefix: "oue" }).primaryKey(),
  order_id: model.text().index(),
  order_display_id: model.text().nullable(),
  customer_id: model.text().index().nullable(),
  email: model.text().index(),
  subject: model.text(),
  message: model.text(),
  html: model.text(),
  batch_id: model.text().index(),
})
