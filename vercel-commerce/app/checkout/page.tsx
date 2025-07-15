"use client";

import { useCart } from "components/cart/cart-context";
import { UpdateEmail } from "./update-email";
import CheckoutAddressStep from "./address";
import CheckoutShippingStep from "./delivery";
import CheckoutPaymentStep from "./payment";
import CheckoutCart from "./checkout-cart";
import CheckoutPlaceOrderButton from "./checkout-place-order-button";



export default function CheckoutPage() {
  const { cart } = useCart();


  if (!cart) return <div>Loading cart...</div>;

  if (!cart.lines || cart.lines.length === 0) {
    return <div>Your cart is empty.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Email Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  Email Address
                </h2>
              </div>
              <form className="space-y-6">
                <UpdateEmail />
              </form>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  Shipping Address
                </h2>
              </div>
              <CheckoutAddressStep />
            </div>

            {/* Delivery Step */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  Delivery
                </h2>
              </div>
              <CheckoutShippingStep />
            </div>

            {/* Payment Step */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  Payment Options
                </h2>
              </div>
              <CheckoutPaymentStep/>
            </div>
          </div>

          {/* Right Column - Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-black dark:text-white">
                In your Cart
              </h2>
              <CheckoutCart/>
            </div>
          </div>
        </div>
        {/* Place Order Button - Full width below both columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 mt-8">
          <div className="col-span-1 lg:col-span-3">
            <CheckoutPlaceOrderButton cart={cart} />
          </div>
        </div>
      </div>
    </div>
  );
}