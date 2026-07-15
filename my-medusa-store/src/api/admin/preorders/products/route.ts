import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/preorders/products?q=&limit=&offset=
 *
 * Products with their variants and current preorder state, for the bulk
 * preorder management page.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0
    const q = (req.query.q as string | undefined)?.trim()

    const filters: any = { status: "published" }
    if (q) {
      filters.title = { $ilike: `%${q}%` }
    }

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.preorder_variant.id",
        "variants.preorder_variant.status",
        "variants.preorder_variant.available_date",
      ],
      filters,
      pagination: {
        take: limit,
        skip: offset,
        order: { title: "ASC" },
      },
    })

    res.json({
      count: metadata?.count ?? products.length,
      limit,
      offset,
      products: products.map((p: any) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail,
        variants: (p.variants ?? []).map((v: any) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          preorder: v.preorder_variant
            ? {
                status: v.preorder_variant.status,
                available_date: v.preorder_variant.available_date,
              }
            : null,
        })),
      })),
    })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
