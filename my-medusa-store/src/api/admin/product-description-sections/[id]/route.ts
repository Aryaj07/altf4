import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/product-description-sections/:id
 * Get a single description section
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productDescriptionModuleService = req.scope.resolve("productDescriptionModule") as any;
  const { id } = req.params as any;

  const section = await productDescriptionModuleService.retrieveProductDescriptionSection(id);

  if (!section) {
    return res.status(404).json({ message: "Section not found" });
  }

  res.json({ section });
}

/**
 * POST /admin/product-description-sections/:id
 * Update a description section
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const productDescriptionModuleService = req.scope.resolve("productDescriptionModule") as any;
    const { id } = req.params as any;
    const body = req.body as any;
    
    // Only include fields that are present in the request body
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.template !== undefined) updateData.template = body.template;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const section = await productDescriptionModuleService.updateProductDescriptionSections(id, updateData);

    res.json({ section });
  } catch (error) {
    console.error("Error updating section:", error);
    return res.status(500).json({ 
      message: "Failed to update section",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * DELETE /admin/product-description-sections/:id
 * Delete a description section
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productDescriptionModuleService = req.scope.resolve("productDescriptionModule") as any;
  const { id } = req.params as any;

  await productDescriptionModuleService.deleteProductDescriptionSections(id);

  res.json({ success: true, message: "Section deleted" });
}
