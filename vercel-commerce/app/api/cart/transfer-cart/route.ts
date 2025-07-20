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

  try {
    const { cart } = await sdkServer.store.cart.transferCart(cartId, undefined, {
      Authorization: `Bearer ${token}`,
    })

    return NextResponse.json({ cart })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to transfer cart" },
      { status: 500 }
    )
  }
}
