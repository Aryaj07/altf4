import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type ResolvedCartInfo = {
  cart_id: string | null
  customer_id: string | null
  email: string | null
  currency_code: string | null
}

const EMPTY: ResolvedCartInfo = {
  cart_id: null,
  customer_id: null,
  email: null,
  currency_code: null,
}

/**
 * payment_session id -> payment_collection -> linked cart.
 */
export async function resolveCartFromPaymentSession(
  container: MedusaContainer,
  paymentSessionId: string
): Promise<ResolvedCartInfo> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sessions } = await query.graph({
    entity: "payment_session",
    fields: ["id", "payment_collection_id"],
    filters: { id: paymentSessionId },
  })

  const collectionId = sessions?.[0]?.payment_collection_id
  if (!collectionId) {
    return EMPTY
  }

  return await resolveCartFromPaymentCollection(container, collectionId)
}

export async function resolveCartFromPaymentCollection(
  container: MedusaContainer,
  paymentCollectionId: string
): Promise<ResolvedCartInfo> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: collections } = await query.graph({
    entity: "payment_collection",
    fields: ["id", "cart.id", "cart.email", "cart.customer_id", "cart.currency_code"],
    filters: { id: paymentCollectionId },
  })

  const cart = collections?.[0]?.cart
  if (!cart?.id) {
    return EMPTY
  }

  return {
    cart_id: cart.id,
    customer_id: cart.customer_id ?? null,
    email: cart.email ?? null,
    currency_code: cart.currency_code ?? null,
  }
}
