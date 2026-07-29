import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { sendOrderUpdateEmailsStep } from "./steps/send-order-update-emails"

type WorkflowInput = {
  order_ids: string[]
  subject: string
  message: string
}

/**
 * Sends the same subject + free-form message to every order's customer,
 * personalized with their order number and item list. Used by the admin
 * "Order Updates" bulk-select page for preorder delay notices.
 */
export const sendOrderUpdateEmailsWorkflow = createWorkflow(
  "send-order-update-emails",
  (input: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "customer.id",
        "customer.first_name",
        "items.title",
      ],
      filters: { id: input.order_ids },
    })

    const stepInput = transform({ orders, input }, ({ orders, input }) => ({
      subject: input.subject,
      message: input.message,
      orders: (orders as any[]).map((order) => ({
        id: order.id,
        display_id: order.display_id ?? null,
        email: order.email,
        customer_id: order.customer?.id ?? null,
        first_name: order.customer?.first_name ?? null,
        items: (order.items ?? []).map((it: any) => ({ title: it.title })),
      })),
    }))

    const result = sendOrderUpdateEmailsStep(stepInput)

    return new WorkflowResponse(result)
  }
)
