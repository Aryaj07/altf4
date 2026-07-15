import { model } from "@medusajs/utils"

// Audit log of sent cart-recovery emails: exactly what was sent, to whom,
// with the rendered HTML kept for preview in the admin.
export const RecoveryEmail = model.define("recovery_email", {
  id: model.id({ prefix: "recem" }).primaryKey(),
  cart_id: model.text().index(),
  customer_id: model.text().index().nullable(),
  email: model.text().index(),
  subject: model.text(),
  html: model.text(),
  items: model.json(), // [{ title, quantity, line_total_formatted }]
  total_formatted: model.text().nullable(),
  manual: model.boolean().default(false),
})
