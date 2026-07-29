import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  StatusBadge,
  Switch,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { Envelope } from "@medusajs/icons"
import { useMemo, useState } from "react"
import {
  OrderPickerRow,
  useOrderPickerList,
  useOrderUpdateHistory,
  useSendOrderUpdateEmail,
} from "../../hooks/use-order-updates"

const PAGE_SIZE = 20

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

type BatchGroup = {
  batch_id: string
  subject: string
  order_count: number
  created_at: string
}

const OrderUpdatesPage = () => {
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [preorderOnly, setPreorderOnly] = useState(true)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const { data, isLoading } = useOrderPickerList(q, preorderOnly, PAGE_SIZE, offset)
  const { data: history } = useOrderUpdateHistory(100, 0)
  const { mutate, isPending } = useSendOrderUpdateEmail()

  const allOrderIds = useMemo(
    () => (data?.orders ?? []).map((o) => o.id),
    [data]
  )
  const allSelected =
    allOrderIds.length > 0 && allOrderIds.every((id) => selected.has(id))

  const toggle = (ids: string[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        on ? next.add(id) : next.delete(id)
      }
      return next
    })
  }

  const searchNow = () => {
    setOffset(0)
    setQ(search)
  }

  const openCompose = () => {
    if (!selected.size) {
      toast.warning("Select at least one order first")
      return
    }
    setDrawerOpen(true)
  }

  const send = () => {
    if (!subject.trim() || !message.trim()) {
      toast.warning("Subject and message are both required")
      return
    }
    mutate(
      { order_ids: [...selected], subject: subject.trim(), message: message.trim() },
      {
        onSuccess: (r) => {
          if (r.failed_count > 0) {
            toast.warning(
              `Sent to ${r.succeeded}, failed ${r.failed_count} (see server logs)`
            )
          } else {
            toast.success(`Update email sent to ${r.succeeded} order(s)`)
          }
          setSelected(new Set())
          setSubject("")
          setMessage("")
          setDrawerOpen(false)
        },
        onError: (e) => toast.error(e.message || "Send failed"),
      }
    )
  }

  const batches: BatchGroup[] = useMemo(() => {
    const byBatch = new Map<string, BatchGroup>()
    for (const row of history?.order_update_emails ?? []) {
      const existing = byBatch.get(row.batch_id)
      if (existing) {
        existing.order_count += 1
        if (row.created_at > existing.created_at) {
          existing.created_at = row.created_at
        }
      } else {
        byBatch.set(row.batch_id, {
          batch_id: row.batch_id,
          subject: row.subject,
          order_count: 1,
          created_at: row.created_at,
        })
      }
    }
    return [...byBatch.values()].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1
    )
  }, [history])

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Order Updates</Heading>
            <Text size="small" className="text-ui-fg-muted">
              Select orders and send a shared status update to their customers
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={preorderOnly}
                onCheckedChange={(v) => {
                  setPreorderOnly(!!v)
                  setOffset(0)
                }}
              />
              <Text size="small" className="text-ui-fg-subtle">
                Pending preorders only
              </Text>
            </div>
            <Input
              placeholder="Search order # or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchNow()}
              className="w-56"
            />
            <Button variant="secondary" onClick={searchNow}>
              Search
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-4">
          <Text size="small" className="text-ui-fg-subtle">
            {selected.size} order(s) selected
          </Text>
          <div className="ml-auto">
            <Button
              isLoading={isPending}
              disabled={!selected.size}
              onClick={openCompose}
            >
              Compose update
            </Button>
          </div>
        </div>
      </Container>

      <Container className="p-0">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-8">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggle(allOrderIds, !!v)}
                />
              </Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Preorder</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Placed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading && (
              <Table.Row>
                <Table.Cell {...({ colSpan: 6 } as any)}>Loading…</Table.Cell>
              </Table.Row>
            )}
            {!isLoading && !data?.orders.length && (
              <Table.Row>
                <Table.Cell {...({ colSpan: 6 } as any)}>No orders found.</Table.Cell>
              </Table.Row>
            )}
            {data?.orders.map((o: OrderPickerRow) => (
              <Table.Row key={o.id}>
                <Table.Cell>
                  <Checkbox
                    checked={selected.has(o.id)}
                    onCheckedChange={(v) => toggle([o.id], !!v)}
                  />
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    #{o.display_id}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{o.customer_name || "—"}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {o.email}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  {o.preorder_status ? (
                    <StatusBadge
                      color={
                        o.preorder_status === "pending"
                          ? "orange"
                          : o.preorder_status === "fulfilled"
                          ? "green"
                          : "grey"
                      }
                    >
                      {o.preorder_status}
                    </StatusBadge>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-muted">
                    {o.items_preview.join(", ")}
                    {o.items_count > o.items_preview.length ? "…" : ""}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-muted">
                    {formatDate(o.created_at)}
                  </Text>
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
                )} of ${data.count} orders`
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
      </Container>

      <Container className="p-6 flex flex-col gap-3">
        <Heading level="h2">Recent sends</Heading>
        {!batches.length && (
          <Text size="small" className="text-ui-fg-muted">
            No update emails sent yet.
          </Text>
        )}
        {!!batches.length && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Orders</Table.HeaderCell>
                <Table.HeaderCell>Sent</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {batches.map((b) => (
                <Table.Row key={b.batch_id}>
                  <Table.Cell>
                    <Text size="small">{b.subject}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{b.order_count}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-muted">
                      {formatDate(b.created_at)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              Send update to {selected.size} customer(s)
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label size="small">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your order is running a little late"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label size="small">Message</Label>
              <Textarea
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, we wanted to let you know your order has been delayed…"
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                Each customer also gets their order number and item list automatically.
              </Text>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isPending} onClick={send}>
              Send to {selected.size} customer(s)
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Order Updates",
  icon: Envelope,
})

export default OrderUpdatesPage
