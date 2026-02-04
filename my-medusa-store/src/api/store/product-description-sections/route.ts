import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /store/product-description-sections?product_id=xxx
 * Get description sections for a product (public store API)
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productDescriptionModuleService = req.scope.resolve("productDescriptionModule");
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ message: "product_id is required" });
  }

  const sections = await productDescriptionModuleService.listProductDescriptionSections(
    { product_id },
    {
      order: { order: "ASC" }
    }
  );

  res.json({ sections });
}
