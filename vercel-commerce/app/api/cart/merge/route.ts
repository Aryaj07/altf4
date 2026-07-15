// app/api/cart/merge/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sdkServer } from "@/lib/sdk/sdk-server"

const MEDUSA_API =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || ""

const storeHeaders = { "x-publishable-api-key": PUBLISHABLE_KEY }

function cookieOpts() {
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  return {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  }
}

/**
 * POST /api/cart/merge  body: { cartId }  (the local/guest cart)
 *
 * Login handoff when the local cart has items:
 * - customer also has a saved open cart (different id, with items)
 *   → copy the local items into the saved cart, empty the local one,
 *     and point the cookie at the saved cart (merged: true)
 * - no saved cart → claim the local cart via transfer, same ownership
 *   rules as /api/cart/transfer-cart (transferred: true)
 */
export async function POST(req: NextRequest) {
  const { cartId } = await req.json()
  const token = (await cookies()).get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!cartId) {
    return NextResponse.json({ error: "Missing cartId" }, { status: 400 })
  }

  try {
    const auth = { Authorization: `Bearer ${token}` }

    // Current customer, their saved cart, and the local cart's raw items
    const [meRes, savedRes, localRes] = await Promise.all([
      sdkServer.store.customer.retrieve({}, auth),
      fetch(`${MEDUSA_API}/store/customers/me/active-cart`, {
        headers: { ...auth, ...storeHeaders },
        cache: "no-store",
      }),
      fetch(`${MEDUSA_API}/store/carts/${cartId}`, {
        headers: storeHeaders,
        cache: "no-store",
      }),
    ])

    const customer = meRes.customer
    const saved = savedRes.ok ? (await savedRes.json())?.cart : null
    const localCart = localRes.ok ? (await localRes.json())?.cart : null

    if (!localCart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    // Same ownership rule as transfer-cart: a cart owned by a different
    // customer is never claimed or merged — drop the cookie instead.
    const claimable =
      !localCart.customer_id ||
      localCart.customer_id === customer.id ||
      (!!localCart.email && localCart.email === customer.email)

    if (!claimable) {
      const response = NextResponse.json({ merged: false, cleared: true })
      response.cookies.set({ name: "cartId", value: "", path: "/", maxAge: 0 })
      return response
    }

    const localItems: { id: string; variant_id: string; quantity: number }[] =
      (localCart.items ?? []).filter((it: any) => it.variant_id)

    // No saved cart elsewhere (or it's this very cart): plain transfer.
    if (!saved?.id || saved.id === cartId || localItems.length === 0) {
      if (localCart.customer_id !== customer.id) {
        await sdkServer.store.cart.transferCart(cartId, undefined, auth)
      }
      return NextResponse.json({ merged: false, transferred: true, cartId })
    }

    // Merge: copy local items into the saved cart (Medusa combines
    // duplicate variants by adding quantities), then empty the local cart
    // so it doesn't linger as a duplicate "abandoned" cart.
    let moved = 0
    let skipped = 0
    for (const item of localItems) {
      const addRes = await fetch(
        `${MEDUSA_API}/store/carts/${saved.id}/line-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...storeHeaders },
          body: JSON.stringify({
            variant_id: item.variant_id,
            quantity: item.quantity,
          }),
        }
      )
      if (addRes.ok) {
        moved++
        await fetch(
          `${MEDUSA_API}/store/carts/${cartId}/line-items/${item.id}`,
          { method: "DELETE", headers: storeHeaders }
        )
      } else {
        // e.g. variant went out of stock — don't block login over it
        skipped++
        console.log(
          "merge: could not move item",
          item.variant_id,
          await addRes.text().catch(() => "")
        )
      }
    }

    const response = NextResponse.json({
      merged: true,
      cartId: saved.id,
      moved,
      skipped,
    })
    response.cookies.set({ name: "cartId", value: saved.id, ...cookieOpts() })
    return response
  } catch (error) {
    console.log("merge: failed:", String(error))
    return NextResponse.json({ error: "Failed to merge carts" }, { status: 500 })
  }
}
