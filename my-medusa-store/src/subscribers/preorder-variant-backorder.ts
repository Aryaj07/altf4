import type { SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function preorderVariantBackorderHandler({
  event: { data },
  container,
}: SubscriberConfig) {
  const productModuleService = container.resolve(Modules.PRODUCT)
  const remoteLink = container.resolve("remoteLink")
  const preorderModuleService = container.resolve("preorder")

  const { id: preorderVariantId, variant_id, status } = data

  if (status === "enabled") {
    // Enable backorder for this variant
    await productModuleService.updateProductVariants([{
      id: variant_id,
      allow_backorder: true,
      manage_inventory: false, // Don't manage inventory for preorder items
    }])
  } else if (status === "disabled") {
    // Restore default inventory management
    await productModuleService.updateProductVariants([{
      id: variant_id,
      allow_backorder: false,
      manage_inventory: true,
    }])
  }
}

export const config: SubscriberConfig = {
  event: [
    "preorder_variant.created",
    "preorder_variant.updated"
  ],
}
