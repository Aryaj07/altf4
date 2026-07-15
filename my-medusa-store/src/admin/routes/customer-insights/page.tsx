import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Select,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { ChartBar } from "@medusajs/icons"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AbandonedCartRow,
  useAbandonedCarts,
  useCheckoutOverview,
  useRecoveryEmailDetail,
  useRecoveryEmails,
  useSendRecoveryEmail,
} from "../../hooks/use-checkout-insights"

const PAGE_SIZE = 20

const STAGE_LABELS: Record<string, { label: string; color: "grey" | "orange" | "blue" | "red" }> = {
  created: { label: "Cart created", color: "grey" },
  checkout_started: { label: "Checkout started", color: "blue" },
  payment_reached: { label: "Payment reached", color: "orange" },
  payment_failed: { label: "Payment failed", color: "red" },
}

const formatMoney = (amount: number | null, currency: string) =>
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

const daysAgoIso = (days: number) => {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

const KpiCard = ({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) => (
  <Container className="p-4 flex flex-col gap-1">
    <Text size="small" className="text-ui-fg-muted">
      {label}
    </Text>
    <Heading level="h2">{value}</Heading>
    {hint && (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {hint}
      </Text>
    )}
  </Container>
)

const FunnelBar = ({
  label,
  value,
  max,
}: {
  label: string
  value: number
  max: number
}) => {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 2
  return (
    <div className="flex items-center gap-3">
      <Text size="small" className="w-40 shrink-0 text-ui-fg-subtle">
        {label}
      </Text>
      <div className="flex-1 h-6 bg-ui-bg-subtle rounded overflow-hidden">
        <div
          className="h-full bg-ui-button-inverted rounded"
          style={{ width: `${width}%` }}
        />
      </div>
      <Text size="small" className="w-12 text-right font-medium">
        {value}
      </Text>
    </div>
  )
}

const SendEmailButton = ({ cart }: { cart: AbandonedCartRow }) => {
  const { mutate, isPending } = useSendRecoveryEmail()
  const sentAt = cart.recovery_email?.sent_at
  const alreadySent =
    sentAt &&
    Date.now() - new Date(sentAt).getTime() < 24 * 60 * 60 * 1000

  const send = (force: boolean) => {
    if (
      force &&
      !window.confirm(
        `A recovery email was already sent on ${formatDate(sentAt!)}. Send again?`
      )
    ) {
      return
    }
    mutate(
      { cart_id: cart.cart_id, force },
      {
        onSuccess: (r) => toast.success(`Recovery email sent to ${r.sent_to}`),
        onError: (e) => toast.error(e.message || "Failed to send"),
      }
    )
  }

  if (!cart.email) {
    return (
      <Text size="xsmall" className="text-ui-fg-muted">
        No email
      </Text>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="small"
        variant={alreadySent ? "secondary" : "primary"}
        isLoading={isPending}
        onClick={() => send(!!alreadySent)}
      >
        {alreadySent ? "Resend" : "Send email"}
      </Button>
      {sentAt && (
        <Text size="xsmall" className="text-ui-fg-muted">
          Sent {formatDate(sentAt)}
        </Text>
      )}
    </div>
  )
}

const RecoveryEmailsSection = () => {
  const [offset, setOffset] = useState(0)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const { data, isLoading } = useRecoveryEmails(PAGE_SIZE, offset)
  const { detail, isLoading: detailLoading } = useRecoveryEmailDetail(previewId)

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <Heading level="h2">Recovery emails sent</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Every send is recorded with its exact content — click Preview to
            see the email as the customer received it.
          </Text>
        </div>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Sent at</Table.HeaderCell>
            <Table.HeaderCell>To</Table.HeaderCell>
            <Table.HeaderCell>Items</Table.HeaderCell>
            <Table.HeaderCell>Cart value</Table.HeaderCell>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Content</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={6}>Loading…</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && !data?.recovery_emails.length && (
            <Table.Row>
              <Table.Cell colSpan={6}>No recovery emails sent yet.</Table.Cell>
            </Table.Row>
          )}
          {data?.recovery_emails.map((re) => (
            <Table.Row key={re.id}>
              <Table.Cell>
                <Text size="small">{formatDate(re.created_at)}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text size="small">{re.email}</Text>
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col">
                  <Text size="small">{re.items.length} item(s)</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {re.items
                      .slice(0, 3)
                      .map((it) => `${it.title} ×${it.quantity}`)
                      .join(", ")}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                <Text size="small">{re.total_formatted ?? "—"}</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge size="small" color={re.manual ? "blue" : "green"}>
                  {re.manual ? "Manual" : "Automatic"}
                </Badge>
              </Table.Cell>
              <Table.Cell className="text-right">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setPreviewId(re.id)}
                >
                  Preview
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div className="flex items-center justify-between p-4">
        <Text size="small" className="text-ui-fg-muted">
          {data
            ? `${Math.min(offset + 1, data.count)}–${Math.min(
                offset + PAGE_SIZE,
                data.count
              )} of ${data.count}`
            : ""}
        </Text>
        <div className="flex gap-2">
          <Button
            size="small"
            variant="secondary"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            size="small"
            variant="secondary"
            disabled={!data || offset + PAGE_SIZE >= data.count}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <Drawer open={!!previewId} onOpenChange={(o) => !o && setPreviewId(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {detail ? `Sent to ${detail.email}` : "Email preview"}
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="p-0 overflow-hidden">
            {detailLoading && (
              <Text size="small" className="p-6 text-ui-fg-muted">
                Loading…
              </Text>
            )}
            {detail && (
              <iframe
                title="recovery-email-preview"
                srcDoc={detail.html}
                sandbox=""
                className="w-full h-full border-0 bg-white"
              />
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

const CustomerInsightsPage = () => {
  const [rangeDays, setRangeDays] = useState("30")
  const [stage, setStage] = useState<string>("")
  const [offset, setOffset] = useState(0)

  const from = useMemo(() => daysAgoIso(parseInt(rangeDays)), [rangeDays])
  const to = useMemo(() => daysAgoIso(0), [])

  const { overview, isLoading: overviewLoading } = useCheckoutOverview(from, to)
  const { data: abandoned, isLoading: cartsLoading } = useAbandonedCarts(
    PAGE_SIZE,
    offset,
    stage || undefined
  )

  const funnel = overview?.funnel
  const failedNoOrder = overview?.attempts.carts_with_failed_no_order ?? 0

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-6 flex items-center justify-between">
        <div>
          <Heading level="h1">Customer Insights</Heading>
          <Text className="text-ui-fg-muted" size="small">
            Checkout funnel, abandoned carts and failed payment attempts
          </Text>
        </div>
        <div className="w-44">
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <Select.Trigger>
              <Select.Value placeholder="Date range" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="7">Last 7 days</Select.Item>
              <Select.Item value="30">Last 30 days</Select.Item>
              <Select.Item value="90">Last 90 days</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </Container>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Open abandoned carts"
          value={cartsLoading ? "…" : abandoned?.count ?? 0}
          hint="Not completed, with items"
        />
        <KpiCard
          label="Abandonment rate"
          value={
            overviewLoading ? "…" : `${overview?.rates.abandonment_rate ?? 0}%`
          }
          hint="Of carts that started checkout"
        />
        <KpiCard
          label="Failed payment attempts"
          value={
            overviewLoading
              ? "…"
              : overview?.attempts.by_status?.failed ?? 0
          }
          hint="In selected range"
        />
        <KpiCard
          label="Failed & never completed"
          value={overviewLoading ? "…" : failedNoOrder}
          hint="Carts with a failed attempt, no order"
        />
      </div>

      <Container className="p-6 flex flex-col gap-4">
        <Heading level="h2">Checkout funnel</Heading>
        {overviewLoading || !funnel ? (
          <Text size="small" className="text-ui-fg-muted">
            Loading…
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            <FunnelBar
              label="Carts created"
              value={funnel.created}
              max={funnel.created}
            />
            <FunnelBar
              label="Checkout started"
              value={funnel.checkout_started}
              max={funnel.created}
            />
            <FunnelBar
              label="Payment reached"
              value={funnel.payment_reached}
              max={funnel.created}
            />
            <FunnelBar
              label="Completed"
              value={funnel.completed}
              max={funnel.created}
            />
          </div>
        )}
        {overview && overview.attempts.failure_reasons.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Heading level="h3">Why payments fail</Heading>
            {overview.attempts.failure_reasons.map((f) => (
              <div key={f.reason} className="flex justify-between">
                <Text size="small">{f.reason}</Text>
                <Text size="small" className="font-medium">
                  {f.count}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Container>

      <Container className="p-0">
        <div className="flex items-center justify-between p-6 pb-4">
          <Heading level="h2">Abandoned carts</Heading>
          <div className="w-52">
            <Select
              value={stage}
              onValueChange={(v) => {
                setStage(v === "all" ? "" : v)
                setOffset(0)
              }}
            >
              <Select.Trigger>
                <Select.Value placeholder="All stages" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All stages</Select.Item>
                <Select.Item value="checkout_started">
                  Checkout started
                </Select.Item>
                <Select.Item value="payment_reached">
                  Payment reached
                </Select.Item>
                <Select.Item value="payment_failed">Payment failed</Select.Item>
              </Select.Content>
            </Select>
          </div>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Value</Table.HeaderCell>
              <Table.HeaderCell>Stage</Table.HeaderCell>
              <Table.HeaderCell>Failed attempts</Table.HeaderCell>
              <Table.HeaderCell>Last activity</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                Recovery email
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cartsLoading && (
              <Table.Row>
                <Table.Cell colSpan={7}>Loading…</Table.Cell>
              </Table.Row>
            )}
            {!cartsLoading && !abandoned?.carts.length && (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  No abandoned carts found. Nice!
                </Table.Cell>
              </Table.Row>
            )}
            {abandoned?.carts.map((cart) => {
              const stageInfo = STAGE_LABELS[cart.stage]
              return (
                <Table.Row key={cart.cart_id}>
                  <Table.Cell>
                    {cart.customer ? (
                      <Link
                        to={`/customers/${cart.customer.id}`}
                        className="text-ui-fg-interactive hover:underline"
                      >
                        {cart.customer.name || cart.email}
                      </Link>
                    ) : (
                      cart.email ?? (
                        <Text size="small" className="text-ui-fg-muted">
                          Guest
                        </Text>
                      )
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <Text size="small">{cart.items_count} item(s)</Text>
                      <Text size="xsmall" className="text-ui-fg-muted">
                        {cart.items_preview.join(", ")}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {formatMoney(cart.total, cart.currency_code)}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={stageInfo?.color ?? "grey"}>
                      {stageInfo?.label ?? cart.stage}
                    </StatusBadge>
                  </Table.Cell>
                  <Table.Cell>
                    {cart.failed_attempts > 0 ? (
                      <Badge size="small" color="red">
                        {cart.failed_attempts}×
                      </Badge>
                    ) : (
                      <Text size="small" className="text-ui-fg-muted">
                        —
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{formatDate(cart.updated_at)}</Text>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <SendEmailButton cart={cart} />
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
        <div className="flex items-center justify-between p-4">
          <Text size="small" className="text-ui-fg-muted">
            {abandoned
              ? `${Math.min(offset + 1, abandoned.count)}–${Math.min(
                  offset + PAGE_SIZE,
                  abandoned.count
                )} of ${abandoned.count}`
              : ""}
          </Text>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="secondary"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              size="small"
              variant="secondary"
              disabled={!abandoned || offset + PAGE_SIZE >= abandoned.count}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      </Container>

      <RecoveryEmailsSection />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Customer Insights",
  icon: ChartBar,
})

export default CustomerInsightsPage
