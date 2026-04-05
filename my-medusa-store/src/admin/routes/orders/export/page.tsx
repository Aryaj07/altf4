import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Label,
  Text,
  Select,
  toast,
  Badge,
} from "@medusajs/ui"
import { ArrowDownTray } from "@medusajs/icons"
import { useState, useCallback, useMemo } from "react"

const ExportOrdersPage = () => {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [quickFilter, setQuickFilter] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(null)

  // Generate monthly filter options (last 12 months)
  const monthOptions = useMemo(() => {
    const options: { label: string; value: string }[] = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = d.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
      const from = `${year}-${String(month + 1).padStart(2, "0")}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
      options.push({ label, value: `${from}|${to}` })
    }

    return options
  }, [])

  // Financial quarter options
  const quarterOptions = useMemo(() => {
    const options: { label: string; value: string }[] = []
    const now = new Date()
    const currentYear = now.getFullYear()

    // Indian financial year quarters (Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar)
    const quarters = [
      { label: "Q1 (Apr-Jun)", startMonth: 3, endMonth: 5 },
      { label: "Q2 (Jul-Sep)", startMonth: 6, endMonth: 8 },
      { label: "Q3 (Oct-Dec)", startMonth: 9, endMonth: 11 },
      { label: "Q4 (Jan-Mar)", startMonth: 0, endMonth: 2 },
    ]

    // Current and previous financial year
    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      for (const q of quarters) {
        // For Q4 (Jan-Mar), the calendar year is +1 from the FY start
        const fyStart = currentYear - yearOffset
        const calendarYear = q.startMonth >= 3 ? fyStart : fyStart + 1

        const from = `${calendarYear}-${String(q.startMonth + 1).padStart(2, "0")}-01`
        const lastDay = new Date(calendarYear, q.endMonth + 1, 0).getDate()
        const to = `${calendarYear}-${String(q.endMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

        const fyLabel = `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`
        options.push({
          label: `${q.label} ${fyLabel}`,
          value: `${from}|${to}`,
        })
      }
    }

    return options
  }, [])

  const applyQuickFilter = useCallback(
    (value: string) => {
      setQuickFilter(value)
      if (!value) {
        setFromDate("")
        setToDate("")
        return
      }
      const [from, to] = value.split("|")
      setFromDate(from)
      setToDate(to)
    },
    []
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)

      const baseUrl = import.meta.env.VITE_BACKEND_URL || ""
      const url = `${baseUrl}/admin/export-orders${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || "Export failed")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl

      const fromLabel = fromDate || "all"
      const toLabel = toDate || "now"
      a.download = `orders-export-${fromLabel}-to-${toLabel}.csv`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      const now = new Date().toLocaleString("en-IN")
      setLastExport(now)
      toast.success("Orders exported successfully")
    } catch (err: any) {
      console.error("Export failed:", err)
      toast.error(err.message || "Failed to export orders")
    } finally {
      setIsExporting(false)
    }
  }, [fromDate, toDate])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Export Orders</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Export orders as CSV for GST filing, accounting, and record keeping.
          </Text>
        </div>
        {lastExport && (
          <Badge color="green" size="small">
            Last export: {lastExport}
          </Badge>
        )}
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Quick Filters */}
        <div className="space-y-4">
          <Heading level="h3">Quick Filters</Heading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly */}
            <div className="flex flex-col space-y-2">
              <Label size="small" weight="plus">
                Monthly
              </Label>
              <Select
                value={quickFilter}
                onValueChange={applyQuickFilter}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select month" />
                </Select.Trigger>
                <Select.Content>
                  {monthOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {/* Quarterly */}
            <div className="flex flex-col space-y-2">
              <Label size="small" weight="plus">
                Quarterly (Indian FY)
              </Label>
              <Select
                value={quickFilter}
                onValueChange={applyQuickFilter}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select quarter" />
                </Select.Trigger>
                <Select.Content>
                  {quarterOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-4">
          <Heading level="h3">Custom Date Range</Heading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label size="small" weight="plus">
                From Date
              </Label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setQuickFilter("")
                }}
                className="border border-ui-border-base rounded-md px-3 py-2 text-sm bg-ui-bg-field focus:outline-none focus:border-ui-border-interactive"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label size="small" weight="plus">
                To Date
              </Label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setQuickFilter("")
                }}
                className="border border-ui-border-base rounded-md px-3 py-2 text-sm bg-ui-bg-field focus:outline-none focus:border-ui-border-interactive"
              />
            </div>
          </div>
        </div>

        {/* Selected Range Display */}
        {(fromDate || toDate) && (
          <div className="bg-ui-bg-subtle border border-ui-border-base rounded-md p-4">
            <Text size="small" className="text-ui-fg-subtle">
              Exporting orders from{" "}
              <strong>
                {fromDate
                  ? new Date(fromDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "the beginning"}
              </strong>{" "}
              to{" "}
              <strong>
                {toDate
                  ? new Date(toDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "now"}
              </strong>
            </Text>
          </div>
        )}

        {/* CSV Contents Info */}
        <div className="bg-ui-bg-subtle border border-ui-border-base rounded-md p-4">
          <Heading level="h3" className="mb-2">
            CSV Includes
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div>
              <Text weight="plus" size="small">Order Info</Text>
              <Text size="small" className="text-ui-fg-subtle">
                Order #, Date, Status, Payment Method
              </Text>
            </div>
            <div>
              <Text weight="plus" size="small">Customer & Address</Text>
              <Text size="small" className="text-ui-fg-subtle">
                Name, Email, Phone, Billing/Shipping Address, State Code
              </Text>
            </div>
            <div>
              <Text weight="plus" size="small">GST Details</Text>
              <Text size="small" className="text-ui-fg-subtle">
                Taxable Value, Tax, Delivery Charges, Place of Supply, GSTIN
              </Text>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 items-center">
          <Button
            variant="primary"
            onClick={handleExport}
            isLoading={isExporting}
            disabled={isExporting}
          >
            <ArrowDownTray />
            Export as CSV
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              setFromDate("")
              setToDate("")
              setQuickFilter("")
            }}
          >
            Clear Filters
          </Button>

          {!fromDate && !toDate && (
            <Text size="small" className="text-ui-fg-subtle">
              No date filter — will export all orders.
            </Text>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Export Orders (GST)",
})

export default ExportOrdersPage
