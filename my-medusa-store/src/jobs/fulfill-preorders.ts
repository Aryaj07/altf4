import {
  InferTypeOf,
  MedusaContainer
} from "@medusajs/framework/types";
import { fulfillPreorderWorkflow } from "../workflows/fulfill-preorder";
import { PreorderVariant } from "../modules/preorder/models/preorder-variant";

export default async function fulfillPreordersJob(container: MedusaContainer) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  logger.info("Starting daily fulfill preorders job...")

  const now = new Date()

  const limit = 1000
  let preorderVariantsOffset = 0
  let preorderVariantsCount = 0
  let successfulFulfillments = 0
  let failedFulfillments = 0

  do {
    const { 
      data: preorderVariants,
      metadata
    } = await query.graph({
      entity: "preorder_variant",
      fields: [
        "*",
        "product_variant.*",
      ],
      filters: {
        status: "enabled",
        available_date: {
          $lte: now  // Only fulfill preorders whose available date has passed
        }
      },
      pagination: {
        take: limit,
        skip: preorderVariantsOffset
      }
    })

    preorderVariantsCount = metadata?.count || 0
    preorderVariantsOffset += limit

    let preordersOffset = 0
    let preordersCount = 0
    
    do {
      const { 
        data: unfulfilledPreorders,
        metadata: preorderMetadata
      } = await query.graph({
        entity: "preorder",
        fields: ["*"],
        filters: {
          item_id: preorderVariants.map((variant) => variant.id),
          status: "pending"
        },
        pagination: {
          take: limit,
          skip: preordersOffset
        }
      })
      if (!unfulfilledPreorders.length) {
        continue
      }

      preordersCount = preorderMetadata?.count || 0
      preordersOffset += limit
      for (const preorder of unfulfilledPreorders) {
        const variant = preorderVariants.find((v) => v.id === preorder.item_id)
        try {
          await fulfillPreorderWorkflow(container)
          .run({
            input: {
              preorder_id: preorder!.id,
              item: variant as unknown as InferTypeOf<typeof PreorderVariant>,
              order_id: preorder!.order_id
            }
          })
          successfulFulfillments++
          logger.info(`Successfully fulfilled preorder ${preorder.id}`)
        } catch (e) {
          failedFulfillments++
          logger.error(`Failed to fulfill preorder ${preorder.id}: ${e.message}`)
        }
      }
    } while (preordersCount > limit * preordersOffset)
  } while (preorderVariantsCount > limit * preorderVariantsOffset)

  logger.info(`Preorder fulfillment job completed. Successful: ${successfulFulfillments}, Failed: ${failedFulfillments}`)
}

export const config = {
  name: "daily-fulfill-preorders",
  schedule: "0 0 * * *", // Every day at midnight
  // schedule: "* * * * *", // Every 2 minutes for testing purposes
};