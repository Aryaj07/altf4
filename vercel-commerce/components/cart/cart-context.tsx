"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  ReactNode,
  useEffect,
} from "react";

interface CartContextType {
  cart: any;
  refreshCart: () => Promise<void>;
  setCart: Dispatch<SetStateAction<any>>;
  suppressAutoOpen: boolean;
  setSuppressAutoOpen: Dispatch<SetStateAction<boolean>>;
  paymentProviderId?: string;
  setPaymentProviderId?: Dispatch<SetStateAction<string | undefined>>;
  paymentStepLocked?: boolean;
  setPaymentStepLocked?: Dispatch<SetStateAction<boolean>>;
}

const CartContext = createContext<CartContextType>({
  cart: undefined,
  refreshCart: async () => {},
  setCart: () => {},
  suppressAutoOpen: false,
  setSuppressAutoOpen: () => {},
  paymentProviderId: undefined,
  setPaymentProviderId: () => {},
  paymentStepLocked: false,
  setPaymentStepLocked: () => {},
});

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<any>();
  const [suppressAutoOpen, setSuppressAutoOpen] = useState<boolean>(false);

  // Load initial paymentProviderId from sessionStorage
  const [paymentProviderId, setPaymentProviderId] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("selectedPaymentProviderId") || undefined;
    }
    return undefined;
  });

  // Load initial paymentStepLocked from sessionStorage
  const [paymentStepLocked, setPaymentStepLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("paymentStepLocked") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (paymentProviderId !== undefined) {
      window.sessionStorage.setItem("selectedPaymentProviderId", paymentProviderId);
    }
  }, [paymentProviderId]);

  useEffect(() => {
    window.sessionStorage.setItem("paymentStepLocked", paymentStepLocked ? "true" : "false");
  }, [paymentStepLocked]);

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
    <CartContext.Provider
      value={{
        cart,
        refreshCart,
        setCart,
        suppressAutoOpen,
        setSuppressAutoOpen,
        paymentProviderId,
        setPaymentProviderId,
        paymentStepLocked,
        setPaymentStepLocked
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
