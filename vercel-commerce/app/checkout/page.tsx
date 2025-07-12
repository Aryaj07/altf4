"use client";

import { useCart } from 'components/cart/cart-context';
import Price from 'components/price-new';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { TextInput, Select, Checkbox, Button, Group } from '@mantine/core';
import { UpdateEmail } from './update-email';
import CheckoutAddressStep from './address';

const handlePlaceOrder = (payment: string) => {
  if (payment === 'razorpay') {
    // TODO: Integrate Razorpay payment flow here
    alert('Proceeding to Razorpay payment...');
  } else if (payment === 'cod') {
    // TODO: Handle cash on delivery order placement here
    alert('Order placed with Cash on Delivery!');
  }
};

// Payment options for card radio group
const PAYMENT_OPTIONS = [
  {
    value: 'razorpay',
    title: 'Pay With Razorpay',
    subtitle: 'Credit card / Debit card / Net Banking / UPI',
  },
  {
    value: 'cod',
    title: 'Cash on delivery',
    subtitle: '',
  },
];

// Delivery options for delivery radio group
const DELIVERY_OPTIONS = [
  {
    value: 'standard',
    title: 'Standard Shipping',
    subtitle: '₹0.00 (3-7 days)',
  },
  {
    value: 'express',
    title: 'Express Shipping',
    subtitle: '₹99.00 (1-2 days)',
  },
];

function PaymentRadioGroup({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="space-y-3">
      {PAYMENT_OPTIONS.map((option) => {
        const checked = value === option.value;
        return (
          <label key={option.value} className="block w-full">
            <input
              type="radio"
              name="payment"
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div
              className={[
                'w-full rounded-lg border p-4 cursor-pointer transition-colors flex flex-col',
                checked
                  ? 'border-blue-500 bg-gray-100 dark:bg-neutral-800 shadow-sm'
                  : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900',
                checked ? 'ring-2 ring-blue-500' : '',
              ].join(' ')}
            >
              <span className="font-bold text-black dark:text-white">{option.title}</span>
              {option.subtitle && (
                <span className="text-xs text-gray-600 dark:text-neutral-300 mt-1">{option.subtitle}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

function DeliveryRadioGroup({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="space-y-3">
      {DELIVERY_OPTIONS.map((option) => {
        const checked = value === option.value;
        return (
          <label key={option.value} className="block w-full">
            <input
              type="radio"
              name="delivery"
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div
              className={[
                'w-full rounded-lg border p-4 cursor-pointer transition-colors flex flex-col',
                checked
                  ? 'border-blue-500 bg-gray-100 dark:bg-neutral-800 shadow-sm'
                  : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900',
                checked ? 'ring-2 ring-blue-500' : '',
              ].join(' ')}
            >
              <span className="font-bold text-black dark:text-white">{option.title}</span>
              {option.subtitle && (
                <span className="text-xs text-gray-600 dark:text-neutral-300 mt-1">{option.subtitle}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}







export default function CheckoutPage() {
  const { cart } = useCart();

  // Promocode state (for cart section)
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  // Demo: Accept 'DISCOUNT10' as a valid code
  const handleApplyPromo = () => {
    if (!promoCode) {
      setPromoError('Please enter a code.');
      setPromoApplied(false);
    } else if (promoCode.trim().toUpperCase() === 'DISCOUNT10') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid code.');
      setPromoApplied(false);
    }
  };
  const [payment, setPayment] = useState('razorpay');
  const [deliveryMethod, setDeliveryMethod] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('checkout-delivery-method');
      if (saved) return saved;
    }
    return 'standard';
  });

  // LIFTED STATE: shippingLocked
  const [shippingLocked, setShippingLocked] = useState(false);

  // Persist delivery method
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('checkout-delivery-method', deliveryMethod);
    }
  }, [deliveryMethod]);

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
            {/* Update Email */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">Email Address</h2>
              </div>
              <form className="space-y-6">
                <UpdateEmail />
              </form>
            </div>
            {/* Shipping Address */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">Shipping Address</h2>
              </div>
                <CheckoutAddressStep />
            </div>
            {/* Delivery (always visible, locked until shipping is submitted) */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 opacity-100">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center text-black dark:text-white">
                  Delivery
                </h2>
              </div>
              {shippingLocked ? (
                deliveryMethod && deliveryMethod !== '' ? (
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide mb-2">DELIVERY METHOD</h3>
                      <p className="text-gray-600 dark:text-neutral-300">
                        {DELIVERY_OPTIONS.find(opt => opt.value === deliveryMethod)?.title} {DELIVERY_OPTIONS.find(opt => opt.value === deliveryMethod)?.subtitle}
                      </p>
                    </div>
                    <Button variant="subtle" color="blue" onClick={() => setDeliveryMethod('')}>Edit</Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide mb-2">DELIVERY METHOD</h3>
                    <DeliveryRadioGroup value={deliveryMethod} onChange={setDeliveryMethod} />
                  </div>
                )
              ) : (
                <div className="text-gray-400 dark:text-neutral-500 italic">Please complete shipping address to select delivery method.</div>
              )}
            </div>

            {/* Payment (locked state like delivery) */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center text-black dark:text-white">Payment Options</h2>
              </div>
              {shippingLocked && deliveryMethod ? (
                payment ? (
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide mb-2">PAYMENT METHOD</h3>
                      <p className="text-gray-600 dark:text-neutral-300">
                        {PAYMENT_OPTIONS.find(opt => opt.value === payment)?.title} {PAYMENT_OPTIONS.find(opt => opt.value === payment)?.subtitle}
                      </p>
                    </div>
                    <Button variant="subtle" color="blue" onClick={() => setPayment('')}>Edit</Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide mb-2">PAYMENT OPTIONS</h3>
                    <PaymentRadioGroup value={payment} onChange={setPayment} />
                  </div>
                )
              ) : (
                <div className="text-gray-400 dark:text-neutral-500 italic">Please complete delivery selection to choose payment method.</div>
              )}
            </div>
          </div>

          {/* Right Column - Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-black dark:text-white">In your Cart</h2>
              {/* Cart Details Section */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                  <span>Subtotal (excl. shipping and taxes)</span>
                  <span><Price amount={cart.subtotal.toString()} currencyCode={cart.region?.currency_code?.toUpperCase() ?? 'USD'} /></span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                  <span>Shipping</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                  <span>Taxes</span>
                  <span>₹0.00</span>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>

              {/* Cart Items Section */}
              <div className="space-y-4 mb-4">
                {cart.lines.map((item: any) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      <Image
                        src={item.merchandise.product.featuredImage?.url || '/placeholder.svg'}
                        alt="Product thumbnail"
                        width={64}
                        height={64}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.merchandise.product.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-300">Variant: {item.variant_title || "N/A"}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600 dark:text-neutral-300">{item.quantity}x <Price amount={(item.unit_price * item.quantity).toString()} currencyCode={cart.region?.currency_code?.toUpperCase() ?? 'USD'} /></span>
                        <span className="font-medium text-black dark:text-white"><Price amount={(item.unit_price * item.quantity).toString()} currencyCode={cart.region?.currency_code?.toUpperCase() ?? 'USD'} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>

              {/* Total Section */}
              <div className="flex justify-between font-semibold text-lg text-black dark:text-white mb-4">
                <span>Total</span>
                <span><Price amount={cart.total.toString()} currencyCode={cart.region?.currency_code?.toUpperCase() ?? 'USD'} /></span>
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>

              {/* Promocode Card Section */}
              <div className="mb-2">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setPromoOpen((v) => !v)}>
                  <span className="font-semibold text-base text-black dark:text-white">Add a coupon</span>
                  <svg className={`w-5 h-5 transition-transform ${promoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {promoOpen && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex flex-col gap-0">
                      <TextInput
                        name="promoCode"
                        value={promoCode}
                        onChange={e => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(false); }}
                        label="Promo code"
                        placeholder="Enter coupon code"
                        error={undefined}
                        description={undefined}
                      />
                      <div className="min-h-[22px] text-xs mt-1">
                        {promoError && <div className="text-red-600 dark:text-red-400">{promoError}</div>}
                        {promoApplied && !promoError && <div className="text-green-600 dark:text-green-400">Coupon applied!</div>}
                      </div>
                      <Button
                        className="w-full mt-2 px-6 py-2 rounded bg-black dark:bg-white text-white dark:text-black font-semibold disabled:opacity-60"
                        onClick={handleApplyPromo}
                        disabled={promoApplied}
                        type="button"
                      >
                        Apply Coupon
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {/* Place Order Button */}
              <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>
              <Button
                className="w-full mt-4 px-6 py-2 rounded bg-blue-600 dark:bg-blue-500 text-white font-semibold disabled:opacity-60"
                onClick={handlePlaceOrder}
                disabled={!payment || !shippingLocked || !deliveryMethod}
                type="button"
              >
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}