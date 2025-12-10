import { model } from "@medusajs/framework/utils"

export const InvoiceConfig = model.define("invoice_config", {
  id: model.id().primaryKey(),
  company_name: model.text(),
  company_phone: model.text(),
  company_email: model.text(),
  company_logo: model.text().nullable(),
  notes: model.text().nullable(),
  // Indian GST fields
  template_type: model.text().default("default"), // "default" or "indian_gst"
  gstin: model.text().nullable(), // GST Identification Number
  state_name: model.text().nullable(), // State name for GST
  state_code: model.text().nullable(), // State code for GST
  pan: model.text().nullable(), // PAN number
  authorized_signatory: model.text().nullable(), // Name for signature
})