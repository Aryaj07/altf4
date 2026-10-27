// Turns a paid cart into an order. Used after an online payment succeeds,
// both from the Razorpay popup handler and the redirect/callback flow.
//
// Completing a cart is idempotent on the backend (an already-completed cart
// returns its existing order), so we retry instead of failing. Retrying
// matters because the Razorpay webhook can complete the same cart at the
// same moment (the backend then answers 409 / lock errors), and right after
// payment Razorpay may briefly report the payment as not yet settled
// (Medusa answers 200 with `type: "cart"` instead of an order).
//
// The payment is captured by Razorpay (automatic capture) and marked captured
// in Medusa by the Razorpay webhook, so nothing is captured from the browser.

export const PENDING_ORDER_CART_KEY = "pendingOrderCartId";

export const CHECKOUT_SESSION_KEYS = [
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
  PENDING_ORDER_CART_KEY,
];

const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function cartHasPreorderItems(cart: any): boolean {
  return (cart?.items || []).some(
    (item: any) => item.variant?.preorder_variant?.status === "enabled"
  );
}

export type FinalizeOrderResult =
  | { ok: true; orderId: string; isPreorder: boolean }
  | { ok: false; error: string };

export async function finalizeOrder(
  cartId: string,
  isPreorder: boolean
): Promise<FinalizeOrderResult> {
  const endpoint = isPreorder
    ? "/api/cart/complete-preorder"
    : "/api/cart/complete-cart";

  let lastError = "Failed to complete your order.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.order?.id) {
        await fetch("/api/cart/remove-cart", { method: "POST" }).catch(() => {});
        clearCheckoutSession();
        return { ok: true, orderId: data.order.id, isPreorder };
      }

      lastError = data.error || data.cart?.error?.message || data.error?.message || lastError;
      console.warn(`Order completion attempt ${attempt} failed:`, lastError);
    } catch (err) {
      console.warn(`Order completion attempt ${attempt} errored:`, err);
    }

    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }

  return { ok: false, error: lastError };
}

export function clearCheckoutSession() {
  if (typeof window === "undefined") return;
  CHECKOUT_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
}
