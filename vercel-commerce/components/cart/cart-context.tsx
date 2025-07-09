"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface CartContextType {
  cart: any;
  refreshCart: () => Promise<void>;
  setCart: Dispatch<SetStateAction<any>>;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  refreshCart: async () => {},
  setCart: () => {},
});

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<any>(null);

  const refreshCart = useCallback(async () => {
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
  }, []);

  return (
    <CartContext.Provider value={{ cart, refreshCart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
