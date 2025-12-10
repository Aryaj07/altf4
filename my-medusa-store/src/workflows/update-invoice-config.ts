import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateInvoiceConfigStep } from "./steps/update-invoice-config"

type WorkflowInput = {
  id?: string
  company_name?: string
  company_phone?: string
  company_email?: string
  company_logo?: string
  notes?: string
  template_type?: string
  gstin?: string
  state_name?: string
  state_code?: string
  pan?: string
  authorized_signatory?: string
}

export const updateInvoiceConfigWorkflow = createWorkflow(
  "update-invoice-config",
  (input: WorkflowInput) => {
    const invoiceConfig = updateInvoiceConfigStep(input)

    return new WorkflowResponse({
      invoice_config: invoiceConfig
    })
  }
)