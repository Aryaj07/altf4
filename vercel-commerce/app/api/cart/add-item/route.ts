import { cookies } from "next/headers";
import { addToCart, createCart, getCart } from "lib/medusa";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { variantId } = await req.json();

  const cookieStore = await cookies();
  let cartId = cookieStore.get("cartId")?.value;
  let cart;

  if (cartId) {
    cart = await getCart(cartId);
  }

  if (!cartId || !cart) {
    cart = await createCart();
    cartId = cart?.id!;
    cookieStore.set("cartId", cartId);
  }

  if (!variantId) {
    return NextResponse.json(
      { error: "Missing product variant ID" },
      { status: 400 }
    );
  }

  try {
    await addToCart(cartId!, { 
      variantId, 
      quantity: 1
    });

    // Fetch the updated cart to return fresh data
    const updatedCart = await getCart(cartId!);

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (e: any) {
    console.error(e);
    
    let errorMessage = "Error adding item to cart";
    if (e?.message) {
      if (e.message.includes("must either contain only preorder variants")) {
        errorMessage = "Cannot mix preorder and regular items in cart. Please checkout separately.";
      } else if (e.message.includes("insufficient_inventory")) {
        errorMessage = "This item is out of stock.";
      } else {
        errorMessage = e.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
