"use client";

import { Button, Loader } from "@mantine/core";
import React, { useCallback, useState } from "react";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import { CurrencyCode } from "react-razorpay/dist/constants/currency";
import { useRouter } from "next/navigation";
import { useCart } from "components/cart/cart-context";

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
  const { refreshCart, setSuppressAutoOpen } = useCart();

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
        name: process.env.COMPANY_NAME ?? "Your Company Name",
        description: `Order #${razorpayOrder.id}`,
        callback_url: `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/razorpay/hooks`,
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
        handler: async function () {
          console.log("✅ Payment success!");

          try {
            const completeRes = await fetch("/api/cart/complete-cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cart_id: cart.id,
              }),
            });

            const completeData = await completeRes.json();
            const orderId = completeData.order?.id;

            if (completeRes.ok && completeData.success && completeData.order) {
              console.log("✅ Order placed:", completeData.order);

              const orderDetailsRes = await fetch(`/api/order?order_id=${orderId}`);
              const orderDetailsData = await orderDetailsRes.json();

              if (orderDetailsRes.ok) {
                console.log("✅ Full order details:", orderDetailsData.order);
                console.log("💳 Payment ID:", orderDetailsData.paymentId)
              }

              const capturedPayment = await fetch("/api/payment/capture-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentId: orderDetailsData.paymentId,
                }),
              })
              
              await capturedPayment.json();
              await fetch("/api/cart/remove-cart", { method: "POST" });

              setSuppressAutoOpen(true);

              if (typeof window !== "undefined") {
                const keysToClear = [
                  "paymentCollectionId",
                  "paymentStepLocked",
                  "selectedPaymentProviderId",
                  "selectedShippingOptionAmount",
                  "selectedShippingOptionDescription",
                  "selectedShippingOptionId",
                  "selectedShippingOptionName",
                  "shippingLocked",
                  "shippingStepLocked",
                  "updateEmailLocked",
                  "cart",
                ];

                keysToClear.forEach((key) => {
                  window.sessionStorage.removeItem(key);
                });
              }

              await refreshCart();
              setSuppressAutoOpen(false);

              router.push(`/order-confirmation?orderId=${completeData.order.id}`);
            } else {
              console.error("❌ Cart completion failed:", completeData);
              alert("Failed to complete your order.");
            }
          } catch (err) {
            console.error("❌ Error completing cart:", err);
            alert("Unexpected error completing order.");
          }

          setSubmitting(false);
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.open();

      razorpay.on("payment.failed", function (response: any) {
        setErrorMessage(JSON.stringify(response.error));
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
    refreshCart,
    setSuppressAutoOpen,
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
