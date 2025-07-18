"use client";

import { Dialog, Transition } from "@headlessui/react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import Price from "components/price-new";
import { DEFAULT_OPTION } from "lib/constants";
import type { Cart } from "lib/medusa/types";
import { createUrl } from "lib/utils";
import { convertToDecimal } from "lib/medusa/helpers";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import CloseCart from "./close-cart";
import DeleteItemButton from "./delete-item-button";
import EditItemQuantityButton from "./edit-item-quantity-button";
import OpenCart from "./open-cart";
import { useCart } from "components/cart/cart-context";

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal({ cart }: { cart: Cart | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity ?? 0);

  const { suppressAutoOpen, setSuppressAutoOpen } = useCart();

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    if (cart?.totalQuantity !== quantityRef.current) {
      if (
        !isOpen &&
        !suppressAutoOpen &&
        (cart?.totalQuantity ?? 0) > 0
      ) {
        setIsOpen(true);
      }
      quantityRef.current = cart?.totalQuantity ?? 0;

      // reset suppress flag
      if (suppressAutoOpen) {
        setSuppressAutoOpen(false);
      }
    }
  }, [
    cart?.totalQuantity,
    isOpen,
    suppressAutoOpen,
    setSuppressAutoOpen,
  ]);

  const cartEmpty = !cart || !cart.lines || cart.lines.length === 0;

  return (
    <>
      <button aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={cart?.totalQuantity || 0} />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/80 p-6 text-black backdrop-blur-xl dark:border-neutral-700 dark:bg-black/80 dark:text-white md:w-[390px]">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">My Cart</p>
                <button aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>

              {cartEmpty ? (
                <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
                  <ShoppingCartIcon className="h-16" />
                  <p className="mt-6 text-center text-2xl font-bold">
                    Your cart is empty.
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden p-1">
                  <ul className="flex-grow overflow-auto py-4">
                    {cart?.lines.map((item, i) => {
                      const merchandiseSearchParams: MerchandiseSearchParams =
                        {};
                      item.merchandise.selectedOptions.forEach(
                        ({ name, value }) => {
                          if (value !== DEFAULT_OPTION) {
                            merchandiseSearchParams[
                              name.toLowerCase()
                            ] = value;
                          }
                        }
                      );

                      const merchandiseUrl = createUrl(
                        `/product/${item.merchandise.product.handle}`,
                        new URLSearchParams(merchandiseSearchParams)
                      );

                      return (
                        <li
                          key={i}
                          className="flex w-full flex-col border-b border-neutral-300 dark:border-neutral-700"
                        >
                          <div className="relative flex w-full flex-row justify-between px-1 py-4">
                            <div className="absolute z-40 -mt-2 ml-[55px]">
                              <DeleteItemButton item={item} />
                            </div>

                            <Link
                              href={merchandiseUrl}
                              onClick={closeCart}
                              className="z-30 flex flex-row space-x-4"
                            >
                              <div className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900">
                                <Image
                                  className="h-full w-full object-cover"
                                  width={64}
                                  height={64}
                                  alt={
                                    item.merchandise.product
                                      .featuredImage?.altText ||
                                    item.merchandise.product.title
                                  }
                                  src={
                                    item.merchandise.product
                                      .featuredImage?.url ||
                                    "/placeholder.png"
                                  }
                                />
                              </div>

                              <div className="flex flex-1 flex-col text-base">
                                <span className="leading-tight">
                                  {item.merchandise.product.title}
                                </span>
                                {item.merchandise.title !==
                                  DEFAULT_OPTION && (
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {item.variant_title}
                                  </p>
                                )}
                              </div>
                            </Link>

                            <div className="flex h-16 flex-col justify-between">
                              <Price
                                className="flex justify-end text-right text-sm"
                                amount={convertToDecimal(
                                  (item.unit_price ?? 0) *
                                    (item.quantity ?? 1),
                                  cart.region?.currency_code
                                ).toString()}
                                currencyCode={
                                  cart.region?.currency_code?.toUpperCase() ??
                                  "USD"
                                }
                                showCurrency={false}
                              />
                              <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                                <EditItemQuantityButton
                                  item={item}
                                  type="minus"
                                />
                                <p className="w-6 text-center">
                                  <span className="w-full text-sm">
                                    {item.quantity}
                                  </span>
                                </p>
                                <EditItemQuantityButton
                                  item={item}
                                  type="plus"
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 dark:border-neutral-700">
                      <p>Taxes</p>
                      {cart?.region?.automatic_taxes ? (
                        <p className="text-right">Included</p>
                      ) : (
                        <div className="flex justify-between items-center">
                          <Price
                            amount={convertToDecimal(
                              cart?.tax_total ?? 0,
                              cart?.region?.currency_code
                            ).toString()}
                            currencyCode={
                              cart?.region?.currency_code?.toUpperCase() ??
                              "USD"
                            }
                            showCurrency={false}
                          />
                          <span className="text-xs ml-2">
                            (
                            {cart?.region?.tax_rate !== undefined
                              ? cart.region.tax_rate
                              : cart?.tax_total && cart?.subtotal
                              ? (
                                  (cart.tax_total / cart.subtotal) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Shipping</p>
                      <p className="text-right">
                        Calculated at checkout
                      </p>
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Total</p>
                      <Price
                        amount={convertToDecimal(
                          cart?.total ?? 0,
                          cart?.region?.currency_code
                        ).toString()}
                        currencyCode={
                          cart?.region?.currency_code?.toUpperCase() ??
                          "USD"
                        }
                        showCurrency={false}
                      />
                    </div>
                  </div>

                  <a
                    href={cart?.checkoutUrl || "#"}
                    className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100"
                  >
                    Proceed to Checkout
                  </a>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
