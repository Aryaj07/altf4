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

  if (!cart) return <div>Loading cart...</div>;

  return (
    <CartModal cart={cart} />
  );
}
