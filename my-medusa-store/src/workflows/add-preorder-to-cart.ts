import { createWorkflow, WorkflowResponse, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { addPreorderToCartStep } from "./steps/add-preorder-to-cart"

type WorkflowInput = {
  cart_id: string
  variant_id: string
  quantity: number
}

export const addPreorderToCartWorkflow = createWorkflow(
  "add-preorder-to-cart",
  (input: WorkflowInput) => {
    // Check if variant has preorder enabled
    const { data: preorderVariants } = useQueryGraphStep({
      entity: "preorder_variant",
      fields: ["*"],
      filters: {
        variant_id: input.variant_id,
        status: "enabled",
      },
    })

    // If preorder is enabled, use custom add to cart (skips inventory check)
    const preorderCart = when(
      { preorderVariants },
      (data) => data.preorderVariants.length > 0
    ).then(() => {
      return addPreorderToCartStep({
        cart_id: input.cart_id,
        variant_id: input.variant_id,
        quantity: input.quantity,
      })
    })

    // If not a preorder, use regular add to cart workflow
    const regularCart = when(
      { preorderVariants },
      (data) => data.preorderVariants.length === 0
    ).then(() => {
      return addToCartWorkflow.runAsStep({
        input: {
          cart_id: input.cart_id,
          items: [{
            variant_id: input.variant_id,
            quantity: input.quantity,
          }]
        }
      })
    })

    return new WorkflowResponse(preorderCart || regularCart)
  }
)
