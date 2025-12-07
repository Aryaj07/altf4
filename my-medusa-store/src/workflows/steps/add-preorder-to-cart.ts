import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export const addPreorderToCartStep = createStep(
  "add-preorder-to-cart-step",
  async (
    { 
      cart_id, 
      variant_id, 
      quantity 
    }: { 
      cart_id: string
      variant_id: string
      quantity: number 
    },
    { container }
  ) => {
    const cartModuleService = container.resolve(Modules.CART)
    const productModuleService = container.resolve(Modules.PRODUCT)
    const pricingModuleService = container.resolve(Modules.PRICING)

    // Get variant and product details with prices
    const variant = await productModuleService.retrieveProductVariant(variant_id, {
      relations: ["product", "options", "prices"]
    })

    if (!variant || !variant.product) {
      throw new Error(`Variant ${variant_id} or its product not found`)
    }

    const product = variant.product

    // Get the cart to determine currency
    const cartData = await cartModuleService.retrieve(cart_id, {
      relations: ["region"]
    })

    // Get variant prices
    const variantPrices = variant.prices || []
    const cartCurrency = (cartData as any).region?.currency_code || "inr"
    
    // Find price for cart's currency
    const variantPrice = variantPrices.find(
      (p: any) => p.currency_code?.toLowerCase() === cartCurrency.toLowerCase()
    )

    const unitPrice = variantPrice?.amount || 0

    // Add item to cart with all required fields
    const cart = await cartModuleService.addLineItems(cart_id, [
      {
        variant_id,
        quantity,
        title: product.title,
        subtitle: variant.title,
        thumbnail: product.thumbnail,
        product_id: product.id,
        product_title: product.title,
        product_description: product.description,
        product_subtitle: product.subtitle,
        product_type: product.type_id,
        product_type_id: product.type_id,
        product_handle: product.handle,
        variant_sku: variant.sku,
        variant_barcode: variant.barcode,
        variant_title: variant.title,
        unit_price: unitPrice,
      }
    ])

    return new StepResponse(cart)
  }
)
