"use client";

import { useEffect, useState } from "react";
import { useCart } from "./cart-context";
import CartModal from "./modal";

export default function Cart() {
  const { cart, refreshCart } = useCart();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    refreshCart();
  }, [refreshCart]);

  if (!isClient) return null; // Prevent hydration mismatch

  // cart is null until the first item is added — CartModal renders the
  // empty-cart state for undefined.
  return (
    <CartModal cart={cart ?? undefined} />
  );
}
