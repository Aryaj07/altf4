"use client";

import { Button, Loader } from "@mantine/core";
import React, { useCallback, useState } from "react";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import { CurrencyCode } from "react-razorpay/dist/constants/currency";
import { useRouter } from "next/navigation";
import { PENDING_ORDER_CART_KEY } from "lib/finalize-order";

interface RazorpayButtonProps {
  cart: {
    id: string;
    email?: string;
    currency_code: string;
    billing_address?: { first_name?: string; last_name?: string };
    shipping_address?: { phone?: string };
    total?: number;
  };
  notReady?: boolean;
}

const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  cart,
  notReady,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const { Razorpay } = useRazorpay();

  const router = useRouter();

  const handlePayment = useCallback(async () => {
    setSubmitting(true);
    setErrorMessage(undefined);

    try {
      const paymentCollectionId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("paymentCollectionId")
          : null;

      if (!paymentCollectionId) {
        setErrorMessage("Missing payment collection. Please select shipping again.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/cart/create-payment-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_collection_id: paymentCollectionId,
          provider_id: "pp_razorpay_razorpay",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.payment_session?.data?.razorpayOrder?.id) {
        setErrorMessage(data.error || "Failed to create Razorpay session.");
        setSubmitting(false);
        return;
      }

      const razorpayOrder = data.payment_session.data.razorpayOrder;

      const options: RazorpayOrderOptions = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ??
          process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID ??
          "your_key_id",
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: cart.currency_code.toUpperCase() as CurrencyCode,
        name: process.env.COMPANY_NAME || 'Altf4',
        description: `Order #${razorpayOrder.id}`,
        callback_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/payment/razorpay-callback`,
        image: "https://example.com/your_logo",
        prefill: {
          name: `${cart.billing_address?.first_name ?? ""} ${cart.billing_address?.last_name ?? ""}`,
          email: cart.email,
          contact: cart.shipping_address?.phone ?? "",
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setErrorMessage("Payment cancelled.");
          },
        },
        // Popup flow: Razorpay calls this after a successful payment. Both this
        // and the redirect flow (callback_url) finish on /payment-return, which
        // completes the cart and shows the confirmation page.
        handler: function (response: any) {
          const params = new URLSearchParams({
            razorpay_payment_id: response?.razorpay_payment_id ?? "",
            razorpay_order_id: response?.razorpay_order_id ?? razorpayOrder.id,
          });
          router.replace(`/payment-return?${params.toString()}`);
        },
      };

      // Lets /payment-return find the cart even if the cart cookie is missing.
      window.sessionStorage.setItem(PENDING_ORDER_CART_KEY, cart.id);

      const razorpay = new Razorpay(options);
      razorpay.open();

      razorpay.on("payment.failed", function (response: any) {
        setErrorMessage(response?.error?.description || "Payment failed. Please try again.");
        setSubmitting(false);
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage("An error occurred, please try again.");
      setSubmitting(false);
    }
  }, [
    Razorpay,
    cart.billing_address?.first_name,
    cart.billing_address?.last_name,
    cart.currency_code,
    cart.email,
    cart.shipping_address?.phone,
    cart.id,
    router,
  ]);

  return (
    <>
      <Button
        fullWidth
        loading={submitting}
        disabled={submitting || notReady}
        onClick={handlePayment}
        leftSection={submitting ? <Loader size="xs" color="white" /> : null}
      >
        Pay with Razorpay
      </Button>
      {errorMessage && (
        <div className="text-red-500 text-small-regular mt-2">
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default RazorpayButton;
