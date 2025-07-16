"use client";

import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useCart } from "components/cart/cart-context";

export default function CodButton({ cart }: { cart: any }) {
  const router = useRouter();
  const { setCart } = useCart();

  const handlePlaceOrder = async () => {
    try {
      // ✅ STEP 1 → Create payment session first
      const createSessionRes = await fetch(`/api/cart/create-payment-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_collection_id:
            typeof window !== "undefined"
              ? window.sessionStorage.getItem("paymentCollectionId")
              : null,
          provider_id: "pp_system_default",
        }),
      });

      if (!createSessionRes.ok) {
        console.error("❌ Failed to create payment session for COD");
        alert("Failed to create payment session.");
        return;
      }

      const createSessionData = await createSessionRes.json();
      console.log("✅ Payment session created for COD:", createSessionData);

      // ✅ STEP 2 → Complete the cart
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

      if (completeRes.ok && completeData.success && completeData.order) {
        console.log("✅ COD order placed:", completeData.order);

        await fetch("/api/cart/remove-cart", { method: "POST" });

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

        const refreshed = await fetch(`/api/cart`);
        if (refreshed.ok) {
          const latestCart = await refreshed.json();
          setCart(latestCart);
        }

        router.push(
          `/order-confirmation?orderId=${completeData.order.id}`
        );
      } else {
        console.error("❌ Cart completion failed:", completeData);
        alert("Failed to complete your order.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while placing your order.");
    }
  };

  return (
    <Button
      fullWidth
      variant="filled"
      color="blue"
      onClick={handlePlaceOrder}
    >
      Place Order (Cash on Delivery)
    </Button>
  );
}
