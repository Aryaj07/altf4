"use client";

import { useEffect } from "react";
import { useCart } from "./cart-context";
import CartModal from "./modal";

export default function Cart() {
  const { cart, refreshCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  if (!cart) return <div>Loading cart...</div>;

  return (
    <CartModal cart={cart} />
  );
}
