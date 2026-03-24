"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Title, Text, Loader, Stack, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

/**
 * Payment Return Page
 * 
 * Razorpay redirects users here after completing payment via redirect methods
 * (netbanking, UPI intent, etc.). This page completes the order on Medusa
 * and redirects to the confirmation page.
 * 
 * Razorpay sends: razorpay_payment_id, razorpay_order_id, razorpay_signature
 * as query params on success, or error params on failure.
 */
export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const razorpayPaymentId = searchParams.get("razorpay_payment_id");
    const razorpayOrderId = searchParams.get("razorpay_order_id");
    // const razorpaySignature = searchParams.get("razorpay_signature");

    // Check for error
    const errorCode = searchParams.get("error[code]") || searchParams.get("error_code");
    if (errorCode) {
      setStatus("error");
      setErrorMessage(
        searchParams.get("error[description]") || 
        searchParams.get("error_description") || 
        "Payment failed. Please try again."
      );
      return;
    }

    if (!razorpayPaymentId || !razorpayOrderId) {
      setStatus("error");
      setErrorMessage("Missing payment details. Please contact support.");
      return;
    }

    completeOrder();

    async function completeOrder() {
      try {
        // Get cart ID from cookie-based API
        const cartRes = await fetch("/api/cart");
        const cartData = await cartRes.json();
        const cartId = cartData?.id;

        if (!cartId) {
          setStatus("error");
          setErrorMessage("Could not find your cart. Your payment was received — please contact support with your Razorpay payment ID: " + razorpayPaymentId);
          return;
        }

        // Check for preorder items
        const items = cartData.items || [];
        const hasPreorderItems = items.some((item: any) =>
          item.variant?.preorder_variant?.status === "enabled"
        );

        // Complete the cart
        const completeEndpoint = hasPreorderItems
          ? "/api/cart/complete-preorder"
          : "/api/cart/complete-cart";

        const completeRes = await fetch(completeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartId }),
        });

        const completeData = await completeRes.json();

        if (completeRes.ok && completeData.success && completeData.order) {
          const orderId = completeData.order.id;

          // Capture payment
          try {
            const orderDetailsRes = await fetch(`/api/order?order_id=${orderId}`);
            const orderDetailsData = await orderDetailsRes.json();

            if (orderDetailsData.paymentId) {
              await fetch("/api/payment/capture-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: orderDetailsData.paymentId }),
              });
            }
          } catch (captureErr) {
            console.error("Payment capture error (non-blocking):", captureErr);
          }

          // Clean up cart
          await fetch("/api/cart/remove-cart", { method: "POST" });

          // Clear session storage
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
            keysToClear.forEach((key) => window.sessionStorage.removeItem(key));
          }

          // Redirect to confirmation
          const confirmationPage = hasPreorderItems
            ? `/preorder-confirmation?orderId=${orderId}`
            : `/order-confirmation?orderId=${orderId}`;

          router.replace(confirmationPage);
        } else {
          setStatus("error");
          setErrorMessage(
            "Your payment was received but we could not finalize the order. Please contact support with your Razorpay payment ID: " +
            razorpayPaymentId
          );
        }
      } catch (err) {
        console.error("Error completing order after redirect:", err);
        setStatus("error");
        setErrorMessage(
          "An unexpected error occurred. Your payment may have been received — please contact support with your Razorpay payment ID: " +
          razorpayPaymentId
        );
      }
    }
  }, [searchParams, router]);

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg" mt="xl">
        {status === "loading" && (
          <>
            <Loader size="lg" />
            <Title order={3}>Processing your payment...</Title>
            <Text c="dimmed" ta="center">
              Please don&apos;t close this page. We&apos;re confirming your order.
            </Text>
          </>
        )}
        {status === "error" && (
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="red"
            title="Payment Issue"
            variant="filled"
            w="100%"
          >
            <Text size="sm">{errorMessage}</Text>
            <Text size="sm" mt="sm">
              If you need help, please contact us at{" "}
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support"}.
            </Text>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
