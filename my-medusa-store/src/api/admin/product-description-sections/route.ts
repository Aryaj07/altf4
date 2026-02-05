import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/product-description-sections
 * List all description sections (optionally filter by product_id)
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productDescriptionModuleService = req.scope.resolve("productDescriptionModule") as any;
  const { product_id } = req.query as any;

  const filters: any = {};
  if (product_id) {
    filters.product_id = product_id;
  }

  const sections = await productDescriptionModuleService.listProductDescriptionSections(
    filters,
    {
      order: { order: "ASC" }
    }
  );

  res.json({ sections });
}

/**
 * POST /admin/product-description-sections
 * Create a new description section
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productDescriptionModuleService = req.scope.resolve("productDescriptionModule") as any;
  
  const { product_id, title, content, image_url, template, order, metadata } = req.body as any;

  const section = await productDescriptionModuleService.createProductDescriptionSections({
    product_id,
    title,
    content,
    image_url,
    template: template || "image_left_text_right",
    order: order || 0,
    metadata: metadata || null,
  });

  res.json({ section });
}
