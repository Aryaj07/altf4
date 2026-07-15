// app/api/cart/restore/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * POST /api/cart/restore
 *
 * After login, asks the backend for the customer's most recent open cart
 * (saved server-side, follows the account — not the browser) and points
 * the cartId cookie at it. Enables "log in anywhere, same cart".
 */
export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const MEDUSA_API =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_API || "http://localhost:9000"
  const PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || ""

  try {
    const res = await fetch(`${MEDUSA_API}/store/customers/me/active-cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ restored: false })
    }

    const { cart } = await res.json()
    if (!cart?.id) {
      return NextResponse.json({ restored: false })
    }

    const response = NextResponse.json({ restored: true, cartId: cart.id })
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    response.cookies.set({
      name: "cartId",
      value: cart.id,
      expires: expiryDate,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
    return response
  } catch (err) {
    console.log("Failed to restore customer cart:", String(err))
    return NextResponse.json({ restored: false })
  }
}
