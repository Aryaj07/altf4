"use client";

import { useEffect, useState, useCallback } from "react";
import { useCart } from "components/cart/cart-context";

export default function PaymentProvidersPage() {
  const { cart, setCart } = useCart();

  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>();
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentCollectionId, setPaymentCollectionId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!cart?.region_id) return;

    setLoadingProviders(true);
    setError(null);

    fetch(`/api/cart/retrieve-payment_provider?region_id=${cart.region_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.payment_providers) {
          setProviders(data.payment_providers);
          console.log(data.payment_providers);
          const existingProviderId = cart?.payment_collection?.payment_sessions?.[0]?.provider_id;
          if (existingProviderId) {
            setSelectedProviderId(existingProviderId);
          }
        } else {
          setError(data.error || "Unknown error");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error");
      })
      .finally(() => setLoadingProviders(false));
  }, [cart?.region_id]);
  
  const handleSelectProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cart || !selectedProviderId) {
      setError("Please select a payment provider.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      /**
       * STEP 1 → CREATE PAYMENT COLLECTION
       */
      const collectionRes = await fetch("/api/cart/create-payment-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
        }),
      });

      const collectionData = await collectionRes.json();

      if (!collectionRes.ok) {
        setError(collectionData.error || "Failed to create payment collection.");
        return;
      }

      const paymentCollectionId = collectionData.payment_collection?.id;
      if (!paymentCollectionId) {
        setError("Payment collection was not created properly.");
        return;
      }

      setPaymentCollectionId(paymentCollectionId);
      /**
       * STEP 2 → CREATE PAYMENT SESSION
       */
      const sessionRes = await fetch("/api/cart/create-payment-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_collection_id: paymentCollectionId,
          provider_id: selectedProviderId,
        }),
      });

      const sessionData = await sessionRes.json();

      if (!sessionRes.ok) {
        setError(sessionData.error || "Failed to create payment session.");
        return;
      }

      const paymentSessionId = sessionData.payment_session?.id;

      if (!paymentSessionId) {
        setError("Payment session was not created.");
        return;
      }

      setPaymentSessionId(paymentSessionId);

      /**
       * STEP 3 → Refresh the Cart
       */
      const updatedCartRes = await fetch(`/api/cart/retrieve?cart_id=${cart.id}`);
      const updatedCartData = await updatedCartRes.json();

      if (!updatedCartRes.ok) {
        setError(updatedCartData.error || "Failed to retrieve updated cart.");
        return;
      }

      setCart(updatedCartData.cart);

    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentUi = useCallback(() => {
    const activePaymentSession = cart?.payment_collection?.payment_sessions?.[0];

    if (!activePaymentSession) return null;

    if (activePaymentSession.provider_id?.startsWith("pp_stripe_")) {
      return (
        <div className="mt-4 text-green-600">
          You chose Stripe!
          {/* TODO: integrate Stripe Elements */}
        </div>
      );
    } else if (activePaymentSession.provider_id?.includes("razorpay")) {
      return (
        <div className="mt-4 text-green-600">
          You chose Razorpay. Proceed to payment...
          {/* TODO: integrate Razorpay.js */}
        </div>
      );
    } else if (activePaymentSession.provider_id?.startsWith("pp_system_default")) {
      return (
        <div className="mt-4 text-green-600">
          You chose manual payment. No further action required.
        </div>
      );
    } else {
      return (
        <div className="mt-4 text-yellow-600">
          You chose <strong>{activePaymentSession.provider_id}</strong> which is under development.
        </div>
      );
    }
  }, [cart]);

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Payment Providers</h1>

      {loadingProviders && <p>Loading payment providers...</p>}

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {!loadingProviders && !error && providers.length > 0 && (
        <form onSubmit={handleSelectProvider} className="space-y-4 mt-6">
          <label className="block text-sm font-medium">
            Select Payment Provider:
          </label>
          <select
            className="w-full border p-2 rounded"
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
          >
            <option value="">-- Select Provider --</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.id} {provider.is_enabled ? "(Enabled)" : "(Disabled)"}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={submitting || !selectedProviderId}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Submit"}
          </button>
        </form>
      )}

      {!loadingProviders && !error && providers.length === 0 && (
        <p>No payment providers found for this region.</p>
      )}

      {getPaymentUi()}
    </div>
  );
}
