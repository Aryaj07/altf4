"use client";

import { useEffect, useState } from "react";
import { useCart } from "components/cart/cart-context";
import { Button } from "@mantine/core";
import Image from "next/image";
import { CiCreditCard1 } from "react-icons/ci";
import { TbTruckDelivery } from "react-icons/tb";

export default function PaymentProvidersPage() {
  const { cart } = useCart();

  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>();
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("paymentStepLocked") === "true";
    }
    return false;
  });
  const [success, setSuccess] = useState(false);
  const [savedProvider, setSavedProvider] = useState<{
    id: string;
    is_enabled: boolean;
  } | null>(null);

  // ✅ Fetch providers from API
  useEffect(() => {
    if (!cart?.region_id) return;

    setLoadingProviders(true);
    setError(null);

    fetch(`/api/cart/retrieve-payment_provider?region_id=${cart.region_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.payment_providers) {
          setProviders(data.payment_providers);

          // Check if cart already has a provider
          const existingProviderId =
            cart?.payment_collection?.payment_sessions?.[0]?.provider_id;

          if (existingProviderId) {
            setSelectedProviderId(existingProviderId);
            const provider = data.payment_providers.find(
              (p: any) => p.id === existingProviderId
            );
            if (provider) {
              setSavedProvider({
                id: provider.id,
                is_enabled: provider.is_enabled,
              });
            }
            setLocked(true);
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("paymentStepLocked", "true");
              window.sessionStorage.setItem(
                "selectedPaymentProviderId",
                existingProviderId
              );
            }
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
  }, [cart?.region_id, cart?.payment_collection?.payment_sessions]);

  // ✅ Keep locked flag in sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("paymentStepLocked", locked ? "true" : "false");
    }
  }, [locked]);

  // ✅ Reload saved provider from sessionStorage on initial page load
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lockedFromStorage =
      window.sessionStorage.getItem("paymentStepLocked") === "true";
    const storedProviderId =
      window.sessionStorage.getItem("selectedPaymentProviderId");

    if (lockedFromStorage && storedProviderId && providers.length > 0) {
      const provider = providers.find((p) => p.id === storedProviderId);
      if (provider) {
        setSavedProvider({
          id: provider.id,
          is_enabled: provider.is_enabled,
        });
        setSelectedProviderId(storedProviderId);
        setLocked(true);
      }
    }
  }, [providers]);

  useEffect(() => {
    if (typeof window !== "undefined" && !locked) {
      const storedId = window.sessionStorage.getItem("selectedPaymentProviderId");
      if (storedId) {
        setSelectedProviderId(storedId);
      }
    }
  }, [locked]);

  const handleSelectProvider = async () => {
    if (!cart || !selectedProviderId) {
      setError("Please select a payment provider.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // ✅ Save selection in sessionStorage
      window.sessionStorage.setItem(
        "selectedPaymentProviderId",
        selectedProviderId
      );

      const provider = providers.find(
        (p: any) => p.id === selectedProviderId
      );
      if (provider) {
        setSavedProvider({
          id: provider.id,
          is_enabled: provider.is_enabled,
        });
      }

      setLocked(true);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setLocked(false);
    setSuccess(false);
  };

  const getProviderContent = (provider: any) => {
    if (provider.id.includes("razorpay")) {
      return (
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Image
              src="/static/razorpay.png"
              alt="Razorpay"
              width={80}
              height={20}
              className="h-5 w-auto"
            />
          </div>
          <CiCreditCard1 className="h-5 w-auto text-gray-700 dark:text-gray-300" />
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <p className="text-gray-900 dark:text-white font-semibold">
            Cash on Delivery
          </p>
        </div>
        <TbTruckDelivery className="h-5 w-auto text-gray-700 dark:text-gray-300" />
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      {!cart && <span>Loading...</span>}
      {loadingProviders && <span>Loading...</span>}
      {error && (
        <div className="text-red-600 dark:text-red-400 mt-2">{error}</div>
      )}

      {locked && savedProvider ? (
        <>
          <div className="flex justify-between border border-blue-500 bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 mb-3">
            {getProviderContent(savedProvider)}
          </div>

          <div className="text-green-600 dark:text-green-400 font-semibold mt-4">
            {savedProvider.id.includes("razorpay") && "Razorpay selected."}
            {savedProvider.id.includes("stripe") && "Stripe selected."}
            {savedProvider.id.includes("system_default") && "Manual payment selected."}
            {!["razorpay", "stripe", "system_default"].some(id => savedProvider.id.includes(id)) &&
              `Payment provider ${savedProvider.id} selected.`}
          </div>

          <div className="flex items-center mt-2">
            {success && (
              <div className="text-green-600 dark:text-green-400 font-semibold mr-2">
                Payment provider saved!
              </div>
            )}
            <Button
              size="s"
              variant="subtle"
              color="blue"
              className="ml-auto"
              onClick={handleEdit}
            >
              Edit
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset
            disabled={loadingProviders || !cart}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <legend className="mb-2 font-semibold text-gray-900 dark:text-white">
              Select a payment provider
            </legend>
            <div className="space-y-3">
              {providers.map((provider) => (
                <label
                  key={provider.id}
                  className={[
                    "block w-full cursor-pointer group",
                    selectedProviderId === provider.id
                      ? "border-blue-500 bg-gray-100 dark:bg-neutral-800 shadow-sm border-2"
                      : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 border",
                  ].join(" ") +
                    " rounded-lg p-4 transition-colors flex items-center justify-between"}
                >
                  <input
                    type="radio"
                    name="paymentProvider"
                    value={provider.id}
                    checked={selectedProviderId === provider.id}
                    onChange={() => setSelectedProviderId(provider.id)}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center w-full">
                    {getProviderContent(provider)}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                size="s"
                variant="filled"
                color="blue"
                type="button"
                loading={submitting}
                disabled={!selectedProviderId || submitting}
                onClick={handleSelectProvider}
                className="font-semibold"
              >
                Save
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
