"use client";

import { useEffect, useState } from "react";
import CartModal from "./modal";

export default function Cart() {
  const [cart, setCart] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error: ${res.status} — ${text}`);
      }
      const data = await res.json();
      setCart(data);
    } catch (error) {
      console.error(error);
    }
  }

  if (!cart) return <div>Loading cart...</div>;

  return (
    <CartModal cart={cart} />
  );
}
