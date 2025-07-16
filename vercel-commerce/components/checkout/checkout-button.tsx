"use client";

import React from "react";
import RazorpayButton from "@/components/checkout/razorpay-button";
import CodButton from "@/components/checkout/cod-button";
import { Button } from "@mantine/core";
import { useCart } from "components/cart/cart-context";

export default function CheckoutPlaceOrderButton({
  cart,
}: {
  cart: any;
}) {
  const { paymentProviderId, paymentStepLocked } = useCart();

  // If no provider selected yet
  if (!paymentProviderId) {
    return (
      <Button disabled fullWidth variant="filled" color="gray">
        Select a payment method first
      </Button>
    );
  }

  // If provider is selected but NOT locked yet
  if (!paymentStepLocked) {
    return (
      <Button disabled fullWidth variant="filled" color="gray">
        Please save your payment method first
      </Button>
    );
  }

  // If locked and Razorpay
  if (paymentProviderId.includes("razorpay")) {
    return <RazorpayButton cart={cart} />;
  }

  // If locked and COD
  if (paymentProviderId.includes("system_default")) {
    return <CodButton cart={cart} />;
  }

  // Fallback
  return (
    <Button fullWidth disabled variant="filled" color="gray">
      Unsupported payment provider
    </Button>
  );
}
