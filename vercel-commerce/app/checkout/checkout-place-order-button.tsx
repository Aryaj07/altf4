"use client";

import React, { useEffect, useState } from "react";
import RazorpayButton from "./razorpay-button";
import CodButton from "./cod-button";
import { Button } from "@mantine/core";


export default function CheckoutPlaceOrderButton({
  cart,
}: {
  cart: any;
}) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const providerId =
        window.sessionStorage.getItem("selectedPaymentProviderId");
      if (providerId) {
        setSelectedProvider(providerId);
      }
    }
  }, []);

  if (!selectedProvider) {
    return (
      <Button disabled fullWidth variant="filled" color="gray">
        Select a payment method first
      </Button>
    );
  }

  if (selectedProvider.includes("razorpay")) {
    return <RazorpayButton cart={cart} />;
  }

  if (selectedProvider.includes("system_default")) {
    return <CodButton cart={cart} />;
  }

  // Fallback for unknown providers
  return (
    <Button fullWidth disabled variant="filled" color="gray">
      Unsupported payment provider
    </Button>
  );
}
