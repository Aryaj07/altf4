import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { upsertProductVariantPreorderWorkflow } from "../../../../workflows/upsert-product-variant-preorder"
import { disablePreorderVariantWorkflow } from "../../../../workflows/disable-preorder-variant"

export const BulkPreorderSchema = z
  .object({
    variant_ids: z.array(z.string()).min(1).max(200),
    action: z.enum(["enable", "disable"]),
    // required when enabling; ignored for disable
    available_date: z.string().datetime().optional(),
  })
  .refine((v) => v.action === "disable" || !!v.available_date, {
    message: "available_date is required when enabling preorders",
  })

/**
 * POST /admin/preorders/bulk
 * body: { variant_ids: string[], action: "enable" | "disable", available_date? }
 *
 * Bulk-toggles preorder on variants by running the existing single-variant
 * workflows per id. Partial failures don't abort the batch — the response
 * reports per-variant results.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const parsed = BulkPreorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid body" })
    return
  }
  const { variant_ids, action, available_date } = parsed.data

  const succeeded: string[] = []
  const failed: { variant_id: string; error: string }[] = []

  for (const variant_id of variant_ids) {
    try {
      if (action === "enable") {
        await upsertProductVariantPreorderWorkflow(req.scope).run({
          input: {
            variant_id,
            available_date: new Date(available_date!),
          },
        })
      } else {
        await disablePreorderVariantWorkflow(req.scope).run({
          input: { variant_id },
        })
      }
      succeeded.push(variant_id)
    } catch (e: any) {
      failed.push({ variant_id, error: e?.message ?? "unknown error" })
      logger.warn(
        `bulk-preorder: ${action} failed for ${variant_id} -> ${e?.message}`
      )
    }
  }

  res.json({
    action,
    succeeded: succeeded.length,
    failed_count: failed.length,
    failed,
  })
}
