// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Remove the auth_token cookie
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set({
    name: "auth_token",
    value: "",
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });
  return response;
}
