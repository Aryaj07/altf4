// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Remove the auth_token cookie
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set({
    name: "auth_token",
    value: "",
    path: "/",
    maxAge: 0,
  });
  // Also drop the cart cookie — the cart belongs to the customer who just
  // logged out. Leaving it meant the next person on this browser inherited
  // (and on login, hijacked) the previous customer's cart.
  response.cookies.set({
    name: "cartId",
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
