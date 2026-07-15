// app/cart/recover/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCart } from "lib/medusa"

/**
 * GET /cart/recover/:id — target of the "Complete your order" button in
 * recovery emails. Restores the cart into this browser's cookie (works on
 * any device, no prior cookie needed) and sends the customer to checkout.
 * Invalid/completed carts fall back to the homepage.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cartId } = await params
  const home = new URL("/", req.url)

  let cart = null
  try {
    cart = await getCart(cartId)
  } catch {
    cart = null
  }

  if (!cart || (cart as any).completed_at) {
    return NextResponse.redirect(home)
  }

  const response = NextResponse.redirect(new URL("/checkout", req.url))
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)
  response.cookies.set({
    name: "cartId",
    value: cartId,
    expires: expiryDate,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })
  return response
}
