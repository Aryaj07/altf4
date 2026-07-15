import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/customers/me/active-cart
 *
 * Returns the authenticated customer's most recently updated open cart
 * (not completed, has items), so the storefront can restore it after a
 * login on a new device/browser. Requires customer auth (see middlewares).
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "updated_at", "items.id"],
    filters: { customer_id: customerId, completed_at: null },
    pagination: {
      order: { updated_at: "DESC" },
      take: 20,
      skip: 0,
    },
  })

  const active = carts.find((c: any) => (c.items?.length ?? 0) > 0)

  res.json({ cart: active ? { id: active.id } : null })
}
