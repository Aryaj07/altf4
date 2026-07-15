import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import {
  Badge,
  Container,
  Heading,
  StatusBadge,
  Text,
} from "@medusajs/ui"
import { useCustomerInsights } from "../hooks/use-checkout-insights"

const formatMoney = (amount: number | null, currency?: string | null) =>
  amount == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: (currency || "inr").toUpperCase(),
      }).format(amount)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const ATTEMPT_COLORS: Record<string, "grey" | "red" | "orange" | "green"> = {
  initiated: "grey",
  failed: "red",
  authorized: "orange",
  captured: "green",
}

const CustomerCheckoutInsightsWidget = ({
  data: customer,
}: DetailWidgetProps<HttpTypes.AdminCustomer>) => {
  const { insights, isLoading } = useCustomerInsights(customer.id)

  if (isLoading) {
    return <></>
  }

  const hasCart = (insights?.open_carts.length ?? 0) > 0
  const hasAttempts = (insights?.attempts.length ?? 0) > 0
  if (!hasCart && !hasAttempts) {
    return <></>
  }

  const failedCount = insights!.summary.failed_attempts_not_converted

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Checkout insights</Heading>
        {failedCount > 0 && (
          <Badge color="red" size="small">
            Tried to pay {failedCount}× without completing
          </Badge>
        )}
      </div>

      {hasCart && (
        <div className="flex flex-col gap-3 px-6 py-4">
          <Text size="small" weight="plus">
            Active cart
          </Text>
          {insights!.open_carts.map((cart) => (
            <div key={cart.cart_id} className="flex flex-col gap-2">
              {cart.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  {it.thumbnail && (
                    <img
                      src={it.thumbnail}
                      alt={it.title}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <Text size="small" className="flex-1">
                    {it.title} ×{it.quantity}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {formatMoney(
                      it.unit_price != null
                        ? it.unit_price * it.quantity
                        : null,
                      cart.currency_code
                    )}
                  </Text>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2">
                <Text size="small" weight="plus">
                  Cart total
                </Text>
                <Text size="small" weight="plus">
                  {formatMoney(cart.total, cart.currency_code)}
                </Text>
              </div>
              {cart.recovery_email?.sent_at && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  Recovery email sent {formatDate(cart.recovery_email.sent_at)}
                </Text>
              )}
            </div>
          ))}
        </div>
      )}

      {hasAttempts && (
        <div className="flex flex-col gap-2 px-6 py-4">
          <Text size="small" weight="plus">
            Payment attempts
          </Text>
          {insights!.attempts.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <StatusBadge color={ATTEMPT_COLORS[a.status] ?? "grey"}>
                {a.status}
              </StatusBadge>
              <Text size="small" className="flex-1">
                {formatMoney(a.amount, a.currency_code)}
                {a.failure_reason ? ` — ${a.failure_reason}` : ""}
                {a.order_id ? " (converted)" : ""}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                {formatDate(a.created_at)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
})

export default CustomerCheckoutInsightsWidget
