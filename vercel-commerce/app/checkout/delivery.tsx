"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "components/cart/cart-context";
import { Button } from "@mantine/core";

export default function CheckoutShippingStep() {
  const { cart, setCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string | undefined>();
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, number>>({});
  const [locked, setLocked] = useState(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("shippingStepLocked") === "true";
    }
    return false;
  });
  const [success, setSuccess] = useState(false);
  const [savedShippingOption, setSavedShippingOption] = useState<{
    id: string;
    name: string;
    amount: number;
    description?: string;
  } | null>(null);

  // Load shipping options
  useEffect(() => {
    if (!cart) return;

    fetch(`/api/cart/retrieve-shipping_options?cart_id=${cart.id}`)
      .then((res) => res.json())
      .then((data) => {
        setShippingOptions(data.shipping_options || []);
      });
  }, [cart]);

  // Load persisted selection on first mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lockedStored = window.sessionStorage.getItem("shippingStepLocked") === "true";
      if (lockedStored) {
        const storedId = window.sessionStorage.getItem("selectedShippingOptionId");
        const storedName = window.sessionStorage.getItem("selectedShippingOptionName");
        const storedAmount = window.sessionStorage.getItem("selectedShippingOptionAmount");
        const storedDescription = window.sessionStorage.getItem("selectedShippingOptionDescription");

        if (storedId && storedName && storedAmount) {
          setSelectedShippingOption(storedId);
          setSavedShippingOption({
            id: storedId,
            name: storedName,
            amount: parseFloat(storedAmount),
            description: storedDescription || "",
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("shippingStepLocked", locked ? "true" : "false");
    }
  }, [locked]);

  

  const handleSelectShippingOption = (optionId: string) => {
    setSelectedShippingOption(optionId);
  };

  const setShipping = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!cart || !selectedShippingOption) {
      return;
    }
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/cart/shipping-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          option_id: selectedShippingOption,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        const refreshed = await fetch("/api/cart", { method: "GET" });
        if (refreshed.ok) {
          const latestCart = await refreshed.json();
          setCart(latestCart);
        } else {
          setCart(data.cart);
        }

        // Save selected shipping details
        const savedOption = shippingOptions.find((o) => o.id === selectedShippingOption);
        if (savedOption) {
          setSavedShippingOption({
            id: savedOption.id,
            name: savedOption.name,
            amount: calculatedPrices[savedOption.id] ?? savedOption.amount,
            description: savedOption.description || "",
          });

          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("selectedShippingOptionId", savedOption.id);
            window.sessionStorage.setItem("selectedShippingOptionName", savedOption.name);
            window.sessionStorage.setItem(
              "selectedShippingOptionAmount",
              String(calculatedPrices[savedOption.id] ?? savedOption.amount)
            );
            window.sessionStorage.setItem("selectedShippingOptionDescription", savedOption.description || "");
          }
        }

        setLocked(true);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("shippingStepLocked", "true");
        }
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const getShippingOptionPrice = useCallback(
    (shippingOption: any) => {
      const calculated = calculatedPrices[shippingOption.id];

      const amountToShow =
        typeof calculated === "number" ? calculated : shippingOption.amount;

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cart?.currency_code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amountToShow);
    },
    [calculatedPrices, cart?.currency_code]
  );

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      {!cart && <span>Loading...</span>}
      {locked ? (
        <>
          {savedShippingOption && (
            <div className="flex justify-between border border-blue-500 bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 mb-3">
              <div>
                <span className="font-bold text-black dark:text-white">
                  {savedShippingOption.name}
                </span>
                {savedShippingOption.description && (
                  <span className="block text-xs text-gray-600 dark:text-neutral-300 mt-1">
                    {savedShippingOption.description}
                  </span>
                )}
              </div>
              <span className="font-semibold text-black dark:text-white">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: cart?.currency_code,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(savedShippingOption.amount)}
              </span>
            </div>
          )}

          <div className="flex items-center mt-2">
            {success && (
              <div className="text-green-600 dark:text-green-400 font-semibold mr-2">
                Shipping option saved!
              </div>
            )}
            <Button
              size="s"
              variant="subtle"
              color="blue"
              className="ml-auto"
              onClick={() => {
                setLocked(false);
                if (typeof window !== "undefined") {
                  window.sessionStorage.setItem("shippingStepLocked", "false");
                }
                setSuccess(false);
              }}
            >
              Edit
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset
            disabled={loading || !cart}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <legend className="mb-2 font-semibold text-gray-900 dark:text-white">
              Select a delivery method
            </legend>
            <div className="space-y-3">
              {shippingOptions.map((shippingOption) => {
                const price = getShippingOptionPrice(shippingOption);
                return (
                  <label
                    key={shippingOption.id}
                    className={[
                      "block w-full cursor-pointer group",
                      selectedShippingOption === shippingOption.id
                        ? "border-blue-500 bg-gray-100 dark:bg-neutral-800 shadow-sm border-2"
                        : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 border",
                    ].join(" ") +
                      " rounded-lg p-4 transition-colors flex items-center justify-between"}
                  >
                    <input
                      type="radio"
                      name="shippingOption"
                      value={shippingOption.id}
                      checked={selectedShippingOption === shippingOption.id}
                      onChange={() => handleSelectShippingOption(shippingOption.id)}
                      className="sr-only"
                      disabled={price === undefined}
                    />
                    <div>
                      <span className="font-bold text-black dark:text-white">
                        {shippingOption.name}
                      </span>
                      {shippingOption.description && (
                        <span className="block text-xs text-gray-600 dark:text-neutral-300 mt-1">
                          {shippingOption.description}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-black dark:text-white">
                      {price}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                size="s"
                variant="filled"
                color="blue"
                type="button"
                loading={loading}
                disabled={!selectedShippingOption || loading}
                onClick={setShipping}
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
