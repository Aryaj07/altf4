// app/api/me/route.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { sdk } from "@/lib/sdk/sdk"
import { sdkServer } from "@/lib/sdk/sdk-server"

// POST: login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    // Authenticate with Medusa
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })
    if (typeof token !== "string") {
      return NextResponse.json(
        { message: "Authentication requires redirect", location: token.location },
        { status: 401 }
      )
    }
    const { customer } = await sdk.store.customer.retrieve(
      {},
      { Authorization: `Bearer ${token}` }
    )
    const response = NextResponse.json({ customer })
    response.cookies.set({
      name: "auth_token",
      value: token,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    return response
  } catch (err: any) {
    console.error("Login error:", err)
    return NextResponse.json(
      { error: err?.message || "Login failed" },
      { status: 401 }
    )
  }
}

// GET: check auth
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { customer } = await sdkServer.store.customer.retrieve(
      {},
      { Authorization: `Bearer ${token}` }
    );
    if (!customer?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ customer });
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
