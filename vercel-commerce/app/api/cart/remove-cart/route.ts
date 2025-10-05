import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Get the current cartId for logging purposes
    const currentCartId = cookieStore.get("cartId")?.value;
    
    console.log("Removing cart after order completion:", currentCartId);

    // Method 1: Set empty value with past expiry date (your current approach)
    cookieStore.set("cartId", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Method 2: Alternative - explicitly delete the cookie (more explicit)
    // cookieStore.delete("cartId");

    console.log("Cart cookie cleared successfully");

    return NextResponse.json({ 
      success: true,
      message: "Cart cleared after order completion",
      clearedCartId: currentCartId 
    });

  } catch (error) {
    console.error("Error clearing cart cookie:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear cart cookie",
        message: String(error)
      },
      { status: 500 }
    );
  }
}