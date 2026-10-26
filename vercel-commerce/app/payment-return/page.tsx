"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container, Title, Text, Loader, Stack, Alert, Group, Button } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCart } from "components/cart/cart-context";
import {
  cartHasPreorderItems,
  finalizeOrder,
  PENDING_ORDER_CART_KEY,
} from "lib/finalize-order";

/**
 * Payment Return Page
 * 
 * Every successful Razorpay payment ends here: the popup handler navigates
 * here directly, and redirect methods (netbanking, UPI intent, etc.) arrive
 * via /api/payment/razorpay-callback, which turns Razorpay's POST into a GET.
 * This page completes the order on Medusa and redirects to the confirmation page.
 * 
 * Query params: razorpay_payment_id, razorpay_order_id, razorpay_signature
 * on success, or error[...] params on failure.
 */
export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCart, setSuppressAutoOpen } = useCart();
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
        // Cart from the cookie; fall back to the id saved before opening Razorpay.
        const cartRes = await fetch("/api/cart");
        const cartData = await cartRes.json().catch(() => null);
        const cartId =
          cartData?.id || window.sessionStorage.getItem(PENDING_ORDER_CART_KEY);

        if (!cartId) {
          setStatus("error");
          setErrorMessage(
            "Your payment was received. If your order was placed you will get a confirmation email shortly, and it will appear under your orders. Razorpay payment ID: " +
              razorpayPaymentId
          );
          return;
        }

        const result = await finalizeOrder(cartId, cartHasPreorderItems(cartData));

        if (result.ok) {
          setSuppressAutoOpen(true);
          await refreshCart();
          setSuppressAutoOpen(false);

          router.replace(
            result.isPreorder
              ? `/preorder-confirmation?orderId=${result.orderId}`
              : `/order-confirmation?orderId=${result.orderId}`
          );
        } else {
          setStatus("error");
          setErrorMessage(
            "Your payment was received but we could not confirm the order yet. If it was placed you will get a confirmation email shortly. Otherwise please contact support with your Razorpay payment ID: " +
              razorpayPaymentId
          );
        }
      } catch (err) {
        console.error("Error completing order after payment:", err);
        setStatus("error");
        setErrorMessage(
          "An unexpected error occurred. Your payment may have been received — please contact support with your Razorpay payment ID: " +
          razorpayPaymentId
        );
      }
    }
  }, [searchParams, router, refreshCart, setSuppressAutoOpen]);

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
        {status === "error" && (
          <Group>
            <Button component={Link} href="/dashboard" variant="light">
              View my orders
            </Button>
            <Button component={Link} href="/checkout" variant="subtle">
              Back to checkout
            </Button>
          </Group>
        )}
      </Stack>
    </Container>
  );
}
