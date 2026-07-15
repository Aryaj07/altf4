import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CHECKOUT_INSIGHTS_MODULE } from "../../../../../modules/checkout-insights"
import CheckoutInsightsModuleService from "../../../../../modules/checkout-insights/service"

/**
 * GET /admin/checkout-insights/customers/:id
 *
 * Per-customer CRM view: open cart(s) with items, full payment attempt
 * timeline (matched by customer_id OR email, so guest attempts made with
 * the same email are included), and order history summary.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const insights = req.scope.resolve<CheckoutInsightsModuleService>(
      CHECKOUT_INSIGHTS_MODULE
    )
    const customerId = req.params.id

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: [
        "id",
        "email",
        "first_name",
        "last_name",
        "created_at",
        "orders.id",
        "orders.total",
        "orders.currency_code",
        "orders.created_at",
      ],
      filters: { id: customerId },
    })

    const customer = customers?.[0] as any
    if (!customer) {
      res.status(404).json({ message: `Customer ${customerId} not found` })
      return
    }

    // Open carts for this customer
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "total",
        "created_at",
        "updated_at",
        "metadata",
        "items.title",
        "items.quantity",
        "items.unit_price",
        // Without this the totals decorator treats prices as tax-exclusive
        "items.is_tax_inclusive",
        "items.thumbnail",
      ],
      filters: { customer_id: customerId, completed_at: null },
    })

    const openCarts = carts
      .filter((c: any) => (c.items?.length ?? 0) > 0)
      .map((c: any) => ({
        cart_id: c.id,
        currency_code: c.currency_code,
        total: c.total != null ? Number(c.total) : null,
        items: c.items.map((it: any) => ({
          title: it.title,
          quantity: it.quantity,
          unit_price: it.unit_price != null ? Number(it.unit_price) : null,
          thumbnail: it.thumbnail,
        })),
        recovery_email: c.metadata?.abandoned_notification ?? null,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }))

    // Attempt timeline: by customer_id OR by email (covers guest attempts)
    const filters: any[] = [{ customer_id: customerId }]
    if (customer.email) {
      filters.push({ email: customer.email })
    }
    const attempts = await insights.listPaymentAttempts(
      { $or: filters },
      { order: { created_at: "DESC" }, take: 100 }
    )

    const failedNotConverted = attempts.filter(
      (a) => a.status === "failed" && !a.order_id
    ).length

    const orders = customer.orders ?? []

    res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: [customer.first_name, customer.last_name]
          .filter(Boolean)
          .join(" "),
        created_at: customer.created_at,
      },
      open_carts: openCarts,
      attempts: attempts.map((a) => ({
        id: a.id,
        cart_id: a.cart_id,
        order_id: a.order_id,
        status: a.status,
        amount: a.amount != null ? Number(a.amount) : null,
        currency_code: a.currency_code,
        failure_code: a.failure_code,
        failure_reason: a.failure_reason,
        created_at: a.created_at,
      })),
      summary: {
        failed_attempts_not_converted: failedNotConverted,
        orders_count: orders.length,
        lifetime_value: orders.reduce(
          (acc: number, o: any) => acc + Number(o.total ?? 0),
          0
        ),
      },
    })
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Internal error" })
  }
}
