import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set("cartId", "", {
    path: "/",
    expires: new Date(0),
  });

  return NextResponse.json({ success: true });
}