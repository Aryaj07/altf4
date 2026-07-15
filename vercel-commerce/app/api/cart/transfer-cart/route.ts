// app/api/cart/transfer/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sdkServer } from "@/lib/sdk/sdk-server" // this has jwt storage

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

    const [{ customer }, { cart: existingCart }] = await Promise.all([
      sdkServer.store.customer.retrieve({}, auth),
      sdkServer.store.cart.retrieve(cartId, {}, auth),
    ])

    // Already this customer's cart — nothing to do.
    if (existingCart.customer_id === customer.id) {
      return NextResponse.json({ transferred: false, already_owned: true })
    }

    // The cart may only be claimed if it's a guest cart: no customer, or a
    // guest-customer created by entering this same email at checkout.
    // A cart owned by a DIFFERENT customer (e.g. someone who used this
    // browser before) must never be transferred — drop the cookie instead,
    // so the previous customer's abandoned cart stays theirs.
    const claimable =
      !existingCart.customer_id ||
      (!!existingCart.email && existingCart.email === customer.email)

    if (!claimable) {
      const response = NextResponse.json({ transferred: false, cleared: true })
      response.cookies.set({ name: "cartId", value: "", path: "/", maxAge: 0 })
      return response
    }

    const { cart } = await sdkServer.store.cart.transferCart(
      cartId,
      undefined,
      auth
    )

    return NextResponse.json({ transferred: true, cart })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to transfer cart" },
      { status: 500 }
    )
  }
}
