import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Heading,
  Input,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { Clock } from "@medusajs/icons"
import { useMemo, useState } from "react"
import {
  PreorderProductRow,
  useBulkPreorder,
  usePreorderProducts,
} from "../../hooks/use-bulk-preorders"

const PAGE_SIZE = 20

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

const PreordersPage = () => {
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [availableDate, setAvailableDate] = useState("")

  const { data, isLoading } = usePreorderProducts(q, PAGE_SIZE, offset)
  const { mutate, isPending } = useBulkPreorder()

  const allVariantIds = useMemo(
    () => (data?.products ?? []).flatMap((p) => p.variants.map((v) => v.id)),
    [data]
  )
  const allSelected =
    allVariantIds.length > 0 && allVariantIds.every((id) => selected.has(id))

  const toggle = (ids: string[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        on ? next.add(id) : next.delete(id)
      }
      return next
    })
  }

  const runBulk = (action: "enable" | "disable") => {
    const variant_ids = [...selected]
    if (!variant_ids.length) {
      toast.warning("Select at least one variant first")
      return
    }
    if (action === "enable" && !availableDate) {
      toast.warning("Pick an availability date first")
      return
    }
    mutate(
      {
        variant_ids,
        action,
        available_date:
          action === "enable"
            ? new Date(`${availableDate}T00:00:00.000Z`).toISOString()
            : undefined,
      },
      {
        onSuccess: (r) => {
          if (r.failed_count > 0) {
            toast.warning(
              `${action === "enable" ? "Enabled" : "Disabled"} ${r.succeeded}, failed ${r.failed_count} (see server logs)`
            )
          } else {
            toast.success(
              `Preorder ${action === "enable" ? "enabled" : "disabled"} for ${r.succeeded} variant(s)`
            )
          }
          setSelected(new Set())
        },
        onError: (e) => toast.error(e.message || "Bulk update failed"),
      }
    )
  }

  const searchNow = () => {
    setOffset(0)
    setQ(search)
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Preorders</Heading>
            <Text size="small" className="text-ui-fg-muted">
              Select variants and enable or disable preorder in bulk
            </Text>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search products…"
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
            {selected.size} variant(s) selected
          </Text>
          <div className="flex items-center gap-2 ml-auto">
            <Text size="small" className="text-ui-fg-muted">
              Available from
            </Text>
            <Input
              type="date"
              value={availableDate}
              onChange={(e) => setAvailableDate(e.target.value)}
              className="w-40"
            />
            <Button
              isLoading={isPending}
              disabled={!selected.size}
              onClick={() => runBulk("enable")}
            >
              Enable preorder
            </Button>
            <Button
              variant="secondary"
              isLoading={isPending}
              disabled={!selected.size}
              onClick={() => runBulk("disable")}
            >
              Disable
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
                  onCheckedChange={(v) => toggle(allVariantIds, !!v)}
                />
              </Table.HeaderCell>
              <Table.HeaderCell>Product / Variant</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell>Preorder status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading && (
              <Table.Row>
                <Table.Cell {...({ colSpan: 4 } as any)}>Loading…</Table.Cell>
              </Table.Row>
            )}
            {!isLoading && !data?.products.length && (
              <Table.Row>
                <Table.Cell {...({ colSpan: 4 } as any)}>No products found.</Table.Cell>
              </Table.Row>
            )}
            {data?.products.map((p: PreorderProductRow) => {
              const pIds = p.variants.map((v) => v.id)
              const pAll = pIds.length > 0 && pIds.every((id) => selected.has(id))
              return [
                <Table.Row key={p.id} className="bg-ui-bg-subtle">
                  <Table.Cell>
                    <Checkbox
                      checked={pAll}
                      onCheckedChange={(v) => toggle(pIds, !!v)}
                    />
                  </Table.Cell>
                  <Table.Cell {...({ colSpan: 3 } as any)}>
                    <div className="flex items-center gap-3">
                      {p.thumbnail && (
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <Text size="small" weight="plus">
                        {p.title}
                      </Text>
                      <Text size="xsmall" className="text-ui-fg-muted">
                        {p.variants.length} variant(s)
                      </Text>
                    </div>
                  </Table.Cell>
                </Table.Row>,
                ...p.variants.map((v) => (
                  <Table.Row key={v.id}>
                    <Table.Cell>
                      <Checkbox
                        checked={selected.has(v.id)}
                        onCheckedChange={(val) => toggle([v.id], !!val)}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="pl-6">
                        {v.title}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-muted">
                        {v.sku ?? "—"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {v.preorder?.status === "enabled" ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge color="orange">Preorder</StatusBadge>
                          <Text size="xsmall" className="text-ui-fg-muted">
                            ships {formatDate(v.preorder.available_date)}
                          </Text>
                        </div>
                      ) : v.preorder?.status === "disabled" ? (
                        <StatusBadge color="grey">Disabled</StatusBadge>
                      ) : (
                        <Badge size="small" color="grey">
                          —
                        </Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )),
              ]
            })}
          </Table.Body>
        </Table>
        <div className="flex items-center justify-between p-4">
          <Text size="small" className="text-ui-fg-muted">
            {data
              ? `${Math.min(offset + 1, data.count)}–${Math.min(
                  offset + PAGE_SIZE,
                  data.count
                )} of ${data.count} products`
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
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Preorders",
  icon: Clock,
})

export default PreordersPage
