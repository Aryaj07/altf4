import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { sendOrderUpdateEmailsWorkflow } from "../../../../workflows/send-order-update-emails"

export const SendOrderUpdateEmailsSchema = z.object({
  order_ids: z.array(z.string()).min(1).max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

/**
 * POST /admin/order-updates/send
 * body: { order_ids: string[], subject: string, message: string }
 *
 * Sends the same update email to every selected order's customer. Partial
 * failures don't abort the batch — the response reports per-chunk results.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const parsed = SendOrderUpdateEmailsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid body" })
    return
  }

  const { result } = await sendOrderUpdateEmailsWorkflow(req.scope).run({
    input: parsed.data,
  })

  if (result.failed.length) {
    logger.warn(
      `order-updates: ${result.failed.length} email(s) failed in batch ${result.batch_id}`
    )
  }

  res.json({
    batch_id: result.batch_id,
    succeeded: result.succeeded.length,
    failed_count: result.failed.length,
    failed: result.failed,
  })
}
