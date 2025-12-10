import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../modules/invoice-generator"
import InvoiceModuleService from "../../modules/invoice-generator/service"

type StepInput = {
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

export const updateInvoiceConfigStep = createStep(
  "update-invoice-config",
  async ({ id, ...updateData}: StepInput, { container }) => {
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as InvoiceModuleService

    const prevData = id ? 
      await invoiceGeneratorService.retrieveInvoiceConfig(id) : 
      (await invoiceGeneratorService.listInvoiceConfigs())[0]

    const updatedData = await invoiceGeneratorService.updateInvoiceConfigs({
      id: prevData.id,
      ...updateData
    })

    return new StepResponse(updatedData, prevData)
  },
  async (prevInvoiceConfig, { container }) => {
    if (!prevInvoiceConfig) {
      return
    }

    const invoiceGeneratorService = container.resolve(INVOICE_MODULE) as InvoiceModuleService

    await invoiceGeneratorService.updateInvoiceConfigs({
      id: prevInvoiceConfig.id,
      company_name: prevInvoiceConfig.company_name,
      company_phone: prevInvoiceConfig.company_phone,
      company_email: prevInvoiceConfig.company_email,
      company_logo: prevInvoiceConfig.company_logo
    })
  }
)