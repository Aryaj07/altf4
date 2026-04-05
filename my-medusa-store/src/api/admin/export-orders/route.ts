import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/export-orders?from=2025-04-01&to=2025-04-30
 *
 * Exports orders as CSV with GST-relevant fields:
 * - Order #, Date, Customer Name, Email, Phone
 * - Billing Address, City, State, State Code, Pincode
 * - Product Details (Name, SKU, Qty, Unit Price, Line Total)
 * - Subtotal (Taxable Value), CGST, SGST, IGST, Tax Total
 * - Delivery Charges, Discount, Grand Total
 * - Payment Status, Fulfillment Status
 * - Customer GSTIN (if B2B)
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const from = req.query.from as string | undefined
  const to = req.query.to as string | undefined

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Build filters
    const filters: any = {}
    if (from || to) {
      filters.created_at = {}
      if (from) filters.created_at.$gte = new Date(from).toISOString()
      if (to) {
        // Set to end of the day
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        filters.created_at.$lte = toDate.toISOString()
      }
    }

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "email",
        "currency_code",
        "status",
        "fulfillment_status",
        // Totals (computed fields)
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "item_total",
        "item_subtotal",
        "item_tax_total",
        "shipping_subtotal",
        "shipping_tax_total",
        // Items - use wildcard to get all fields including computed totals
        "items.*",
        // Shipping address
        "shipping_address.*",
        // Billing address
        "billing_address.*",
        // Customer
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "customer.phone",
        "customer.metadata",
        // Payment
        "payment_collections.status",
        "payment_collections.payments.amount",
        "payment_collections.payments.provider_id",
      ],
      filters,
      pagination: {
        take: 9999, // Get all orders
      },
    })

    // Indian state code mapping (first 2 digits of GSTIN or from province)
    const stateCodeMap: Record<string, string> = {
      "andhra pradesh": "37", "arunachal pradesh": "12", "assam": "18",
      "bihar": "10", "chhattisgarh": "22", "goa": "30", "gujarat": "24",
      "haryana": "06", "himachal pradesh": "02", "jharkhand": "20",
      "karnataka": "29", "kerala": "32", "madhya pradesh": "23",
      "maharashtra": "27", "manipur": "14", "meghalaya": "17",
      "mizoram": "15", "nagaland": "13", "odisha": "21", "punjab": "03",
      "rajasthan": "08", "sikkim": "11", "tamil nadu": "33",
      "telangana": "36", "tripura": "16", "uttar pradesh": "09",
      "uttarakhand": "05", "west bengal": "19",
      "andaman and nicobar islands": "35", "chandigarh": "04",
      "dadra and nagar haveli and daman and diu": "26",
      "delhi": "07", "jammu and kashmir": "01", "ladakh": "38",
      "lakshadweep": "31", "puducherry": "34",
    }

    // Reverse map: code -> state name
    const codeToStateMap: Record<string, string> = {}
    for (const [name, code] of Object.entries(stateCodeMap)) {
      codeToStateMap[code] = name
    }

    function getStateInfo(province: string | undefined): { name: string; code: string } {
      if (!province) return { name: "", code: "" }
      const trimmed = province.trim()
      const lower = trimmed.toLowerCase()

      // Check if it's already a state code (e.g. "27", "24")
      if (codeToStateMap[trimmed]) {
        // Capitalize the state name
        const name = codeToStateMap[trimmed]
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
        return { name, code: trimmed }
      }

      // Check if it's a state name
      if (stateCodeMap[lower]) {
        return { name: trimmed, code: stateCodeMap[lower] }
      }

      // Unknown — return as-is with no code
      return { name: trimmed, code: "" }
    }

    // Format currency — Medusa v2 stores amounts in smallest unit (paisa for INR)
    // so we need to divide by 100 for display
    function fmt(amount: any): string {
      if (amount == null || amount === "") return "0.00"
      const num = typeof amount === "number" ? amount : Number(amount)
      if (isNaN(num)) return "0.00"
      return num.toFixed(2)
    }

    // Get line item totals — use computed values if available, otherwise calculate
    function getItemSubtotal(item: any): number {
      // item.subtotal is the computed taxable value
      if (item.subtotal && Number(item.subtotal) !== 0) return Number(item.subtotal)
      // Fallback: unit_price * quantity
      return (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
    }

    function getItemTax(item: any): number {
      if (item.tax_total && Number(item.tax_total) !== 0) return Number(item.tax_total)
      return 0
    }

    function getItemTotal(item: any): number {
      if (item.total && Number(item.total) !== 0) return Number(item.total)
      return getItemSubtotal(item) + getItemTax(item)
    }

    // CSV header
    const headers = [
      "Order #",
      "Order Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Billing Address",
      "Billing City",
      "Billing State",
      "Billing State Code",
      "Billing Pincode",
      "Shipping Address",
      "Shipping City",
      "Shipping State",
      "Shipping State Code",
      "Shipping Pincode",
      "Place of Supply (State)",
      "Product Name",
      "SKU",
      "Variant",
      "Quantity",
      "Unit Price",
      "Line Subtotal (Taxable Value)",
      "Line Tax",
      "Line Total",
      "Order Subtotal (Taxable Value)",
      "Delivery Charges",
      "Discount",
      "Tax Total",
      "Grand Total",
      "Currency",
      "Payment Status",
      "Payment Method",
      "Fulfillment Status",
      "Customer GSTIN",
    ]

    const rows: string[][] = []

    for (const order of orders as any[]) {
      const billing = order.billing_address || order.shipping_address || {}
      const shipping = order.shipping_address || {}
      const customer = order.customer || {}
      const items = order.items || []

      const customerName = [
        customer.first_name || billing.first_name || "",
        customer.last_name || billing.last_name || "",
      ].filter(Boolean).join(" ")

      const customerEmail = order.email || customer.email || ""
      const customerPhone = customer.phone || billing.phone || shipping.phone || ""

      const billingAddr = [billing.address_1, billing.address_2].filter(Boolean).join(", ")
      const billingInfo = getStateInfo(billing.province)

      const shippingAddr = [shipping.address_1, shipping.address_2].filter(Boolean).join(", ")
      const shippingInfo = getStateInfo(shipping.province)

      // Place of Supply is the shipping state (where goods are delivered)
      const placeOfSupply = shippingInfo.name || billingInfo.name || ""

      // Payment info
      const paymentStatus = order.payment_collections?.[0]?.status || ""
      const paymentProvider = order.payment_collections?.[0]?.payments?.[0]?.provider_id || ""
      const paymentMethod = paymentProvider.includes("razorpay")
        ? "Razorpay"
        : paymentProvider.includes("cod") || paymentProvider.includes("system_default")
          ? "COD"
          : paymentProvider || "N/A"

      // Customer GSTIN from metadata (if stored)
      const customerGstin =
        billing.metadata?.gstin ||
        customer.metadata?.gstin ||
        ""

      const currency = (order.currency_code || "INR").toUpperCase()

      if (items.length === 0) {
        // Order with no items (shouldn't happen, but handle gracefully)
        rows.push([
          String(order.display_id || ""),
          new Date(order.created_at).toLocaleDateString("en-IN"),
          customerName,
          customerEmail,
          customerPhone,
          billingAddr,
          billing.city || "",
          billingInfo.name,
          billingInfo.code,
          billing.postal_code || "",
          shippingAddr,
          shipping.city || "",
          shippingInfo.name,
          shippingInfo.code,
          shipping.postal_code || "",
          placeOfSupply,
          "", // product
          "", // sku
          "", // variant
          "", // qty
          "", // unit price
          "", // line subtotal
          "", // line tax
          "", // line total
          fmt(order.subtotal),
          fmt(order.shipping_total),
          fmt(order.discount_total),
          fmt(order.tax_total),
          fmt(order.total),
          currency,
          paymentStatus,
          paymentMethod,
          order.fulfillment_status || "",
          customerGstin,
        ])
      } else {
        // One row per item (standard for GST B2C/B2B reports)
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          rows.push([
            String(order.display_id || ""),
            new Date(order.created_at).toLocaleDateString("en-IN"),
            customerName,
            customerEmail,
            customerPhone,
            billingAddr,
            billing.city || "",
            billingInfo.name,
            billingInfo.code,
            billing.postal_code || "",
            shippingAddr,
            shipping.city || "",
            shippingInfo.name,
            shippingInfo.code,
            shipping.postal_code || "",
            placeOfSupply,
            item.title || "",
            item.variant_sku || "",
            item.variant_title || "",
            String(item.quantity || 0),
            fmt(item.unit_price),
            fmt(getItemSubtotal(item)),
            fmt(getItemTax(item)),
            fmt(getItemTotal(item)),
            // Order-level totals only on first row
            i === 0 ? fmt(order.subtotal) : "",
            i === 0 ? fmt(order.shipping_total) : "",
            i === 0 ? fmt(order.discount_total) : "",
            i === 0 ? fmt(order.tax_total) : "",
            i === 0 ? fmt(order.total) : "",
            i === 0 ? currency : "",
            i === 0 ? paymentStatus : "",
            i === 0 ? paymentMethod : "",
            i === 0 ? (order.fulfillment_status || "") : "",
            i === 0 ? customerGstin : "",
          ])
        }
      }
    }

    // Build CSV
    function escapeCsv(val: string): string {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n")

    const fromLabel = from || "all"
    const toLabel = to || "now"
    const filename = `orders-export-${fromLabel}-to-${toLabel}.csv`

    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": Buffer.byteLength(csvContent, "utf-8"),
    })

    res.send(csvContent)
  } catch (error: any) {
    console.error("Error exporting orders:", error)
    res.status(500).json({
      error: "Failed to export orders",
      details: error.message,
    })
  }
}
