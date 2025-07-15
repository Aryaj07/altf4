"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, TextInput } from "@mantine/core";
import Price from "components/price-new";
import { useCart } from "components/cart/cart-context";

export default function CheckoutCart() {
  const { cart, refreshCart } = useCart();

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [hasRemovedPromo, setHasRemovedPromo] = useState(false);

  // ✅ Remove local cart state completely

  useEffect(() => {
    if (!cart?.id || hasRemovedPromo) return;

    async function removePromos() {
      try {
        const res = await fetch(
          `/api/cart/remove-promo?cartId=${cart.id}`,
          {
            method: "DELETE",
          }
        );
        if (res.ok) {
          console.log("Promotions removed.");
          setPromoCode("");
          setPromoApplied(false);
          setPromoError("");
          setHasRemovedPromo(true);

          await refreshCart();
        } else {
          console.error("Failed to remove promos:", await res.text());
        }
      } catch (err) {
        console.error("Failed to remove promotions:", err);
      }
    }

    removePromos();
  }, [cart?.id, hasRemovedPromo, refreshCart]);

  const handleApplyPromo = async () => {
    if (!promoCode) {
      setPromoError("Please enter a promo code.");
      return;
    }

    setApplyingPromo(true);
    setPromoError("");
    setPromoApplied(false);

    try {
      const res = await fetch("/api/cart/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          code: promoCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoError(
          data?.details ||
          data?.error ||
          "Failed to apply promo code."
        );
        return;
      }

      await refreshCart();
      setPromoApplied(true);
      setPromoError("");
    } catch (e) {
      console.error(e);
      setPromoError("An unexpected error occurred.");
    } finally {
      setApplyingPromo(false);
    }
  };

  if (!cart) return null;

  const discountLines = cart?.discounts?.filter((d: any) => d.code);

  return (
    <div>
      {/* Cart Items */}
      <div className="space-y-4 mb-4">
        {cart.lines?.map((item: any) => (
          <div key={item.id} className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
              <Image
                src={
                  item.merchandise?.product?.featuredImage?.url ||
                  "/placeholder.svg"
                }
                alt="Product thumbnail"
                width={64}
                height={64}
                className="rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {item.merchandise?.product?.title || "Product"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-300">
                Variant: {item.variant_title || "N/A"}
              </p>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-300">
                  <span>{item.quantity}x</span>
                  <Price
                    amount={(item.unit_price * item.quantity).toString()}
                    currencyCode={cart.region?.currency_code?.toUpperCase() ?? "USD"}
                    showCurrency={false}
                  />
                </div>
                <span className="font-medium text-black dark:text-white">
                  <Price
                    amount={(item.unit_price * item.quantity).toString()}
                    currencyCode={
                      cart.region?.currency_code?.toUpperCase() ?? "USD"
                    }
                    showCurrency={false}
                  />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>

      {/* Cart Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-gray-600 dark:text-neutral-300">
          <span>Discount</span>
          <span>
            <Price
              amount={cart.promotions?.[0]?.application_method?.value?.toString() ?? "0"}
              showCurrency={false}
            />
          </span>
        </div>

        {discountLines?.length > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Discounts:</span>
            <span>
              {discountLines
                .map((d: any) => d.code)
                .join(", ")}
            </span>
          </div>
        )}

        <div className="flex justify-between text-gray-600 dark:text-neutral-300">
          <span>Shipping</span>
          <span>
            <Price
              amount={cart.shipping_total?.toString() ?? "0"}
              currencyCode={cart.region?.currency_code?.toUpperCase() ?? "USD"}
              showCurrency={false}
            />
          </span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-neutral-300">
          <span>Taxes</span>
          <span>Included</span>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>

      {/* Total Section */}
      <div className="flex justify-between font-semibold text-lg text-black dark:text-white mb-4">
        <span>Total</span>
        <span>
          <Price
            amount={cart.total?.toString() ?? "0"}
            currencyCode={cart.region?.currency_code?.toUpperCase() ?? "USD"}
            showCurrency={false}
          />
        </span>
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>

      {/* Promo code section */}
      <div className="mb-2">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setPromoOpen((v) => !v)}
        >
          <span className="font-semibold text-base text-black dark:text-white">
            Add a coupon
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${
              promoOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {promoOpen && (
          <div className="mt-4 flex flex-col gap-2">
            <TextInput
              name="promoCode"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoError("");
                setPromoApplied(false);
              }}
              label="Promo code"
              placeholder="Enter coupon code"
            />
            <div className="min-h-[22px] text-xs mt-1">
              {promoError && (
                <div className="text-red-600 dark:text-red-400">
                  {promoError}
                </div>
              )}
              {promoApplied && !promoError && (
                <div className="text-green-600 dark:text-green-400">
                  Coupon applied!
                </div>
              )}
            </div>
            <Button
              className="w-full mt-2"
              onClick={handleApplyPromo}
              disabled={promoApplied || applyingPromo}
              loading={applyingPromo}
              type="button"
            >
              Apply Coupon
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>
    </div>
  );
}
