"use client";

import { useCart } from 'components/cart/cart-context';
import Price from 'components/price-new';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';


// List of Indian states and union territories
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

type ShippingType = {
  firstName: string;
  lastName: string;
  address: string;
  company: string;
  postalCode: string;
  city: string;
  country: string;
  state: string;
  billingSame: boolean;
  email: string;
  phone: string;
};
type BillingType = {
  firstName: string;
  lastName: string;
  address: string;
  company: string;
  postalCode: string;
  city: string;
  country: string;
  state: string;
};


export default function CheckoutPage() {
  const { cart } = useCart();

  // Promocode state (for cart section)
  const [promoOpen, setPromoOpen] = useState(true);
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
  const [shipping, setShipping] = useState<ShippingType>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('checkout-shipping');
      if (saved) return JSON.parse(saved);
    }
    return {
      firstName: '',
      lastName: '',
      address: '',
      company: '',
      postalCode: '',
      city: '',
      country: 'India',
      state: '',
      billingSame: true,
      email: '',
      phone: '',
    };
  });
  const [billing, setBilling] = useState<BillingType>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('checkout-billing');
      if (saved) return JSON.parse(saved);
    }
    return {
      firstName: '',
      lastName: '',
      address: '',
      company: '',
      postalCode: '',
      city: '',
      country: 'India',
      state: '',
    };
  });
  const [shippingTouched, setShippingTouched] = useState(false);
  const [billingTouched, setBillingTouched] = useState(false);
  const [step, setStep] = useState<'shipping' | 'delivery' | 'payment'>('shipping');
  const [shippingLocked, setShippingLocked] = useState(false);

  // Persist shipping and billing to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('checkout-shipping', JSON.stringify(shipping));
    }
  }, [shipping]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('checkout-billing', JSON.stringify(billing));
    }
  }, [billing]);

  // Persist delivery method
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('checkout-delivery-method', deliveryMethod);
    }
  }, [deliveryMethod]);

  // Separate handlers for MUI TextField (input/select) and checkbox
  const handleShippingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && shipping.country === 'India') {
      let clean = value.replace(/\D/g, '');
      if (clean.startsWith('91')) {
        clean = clean.slice(2);
      }
      setShipping((prev: ShippingType) => ({ ...prev, phone: clean }));
    } else {
      setShipping((prev: ShippingType) => ({ ...prev, [name]: value }));
    }
  };
  const handleShippingSelectChange = (e: ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setShipping((prev: ShippingType) => ({ ...prev, [name]: value }));
  };
  const handleShippingCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setShipping((prev: ShippingType) => ({ ...prev, billingSame: e.target.checked }));
  };

  const handleBillingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBilling((prev: BillingType) => ({ ...prev, [name]: value }));
    setBillingTouched(true);
  };
  const handleBillingSelectChange = (e: ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setBilling((prev: BillingType) => ({ ...prev, [name]: value }));
    setBillingTouched(true);
  };

  const shippingValid =
    shipping.firstName &&
    shipping.lastName &&
    shipping.address &&
    shipping.postalCode &&
    shipping.city &&
    shipping.country &&
    shipping.email;

  const billingValid =
    billing.firstName &&
    billing.lastName &&
    billing.address &&
    billing.postalCode &&
    billing.city &&
    billing.country;

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
            {/* Shipping Address */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-black dark:text-white">Shipping Address <span className="inline-block align-middle text-xs">●</span></h2>
                {shippingLocked ? (
                  <button className="text-blue-600 hover:underline ml-2" onClick={() => setShippingLocked(false)}>Edit</button>
                ) : null}
              </div>
              {shippingLocked ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
                    <div className="text-gray-600 dark:text-neutral-300 space-y-1">
                      <p>{shipping.firstName} {shipping.lastName}</p>
                      <p>{shipping.address}</p>
                      {shipping.company && <p>{shipping.company}</p>}
                      <p>{shipping.postalCode}, {shipping.city}</p>
                      <p>{shipping.state && `${shipping.state}, `}{shipping.country}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h3>
                    <div className="text-gray-600 dark:text-neutral-300 space-y-1">
                      <p>{shipping.country === 'India' ? `+91 ${shipping.phone}` : shipping.phone}</p>
                      <p>{shipping.email}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Billing Address</h3>
                    <p className="text-gray-600 dark:text-neutral-300">
                      {shipping.billingSame
                        ? 'Billing- and delivery address are the same.'
                        : billing.firstName
                          ? `${billing.firstName} ${billing.lastName}, ${billing.address}${billing.company ? ', ' + billing.company : ''}, ${billing.postalCode}, ${billing.city}, ${billing.state ? billing.state + ', ' : ''}${billing.country}`
                          : 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={e => { e.preventDefault(); setShippingTouched(true); if (shippingValid && (shipping.billingSame || billingValid)) { setShippingLocked(true); setStep('delivery'); } }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField name="firstName" value={shipping.firstName} onChange={handleShippingInputChange} required label="First name" variant="outlined" fullWidth margin="dense" />
                    <TextField name="lastName" value={shipping.lastName} onChange={handleShippingInputChange} required label="Last name" variant="outlined" fullWidth margin="dense" />
                    <TextField name="address" value={shipping.address} onChange={handleShippingInputChange} required label="Address" variant="outlined" fullWidth margin="dense" />
                    <TextField name="company" value={shipping.company} onChange={handleShippingInputChange} label="Company" variant="outlined" fullWidth margin="dense" />
                    <TextField name="postalCode" value={shipping.postalCode} onChange={handleShippingInputChange} required label="Postal code" variant="outlined" fullWidth margin="dense" />
                    <TextField name="city" value={shipping.city} onChange={handleShippingInputChange} required label="City" variant="outlined" fullWidth margin="dense" />
                    <TextField select name="country" value={shipping.country} onChange={handleShippingSelectChange} label="Country" variant="outlined" fullWidth margin="dense">
                      <MenuItem value="India">India</MenuItem>
                    </TextField>
                    <TextField select name="state" value={shipping.state} onChange={handleShippingSelectChange} required label="State" variant="outlined" fullWidth margin="dense">
                      <MenuItem value="">Select a state</MenuItem>
                      {INDIAN_STATES.map((state) => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </TextField>
                  </div>
                  <div className="flex items-center mt-2">
                    <input type="checkbox" name="billingSame" checked={shipping.billingSame} onChange={handleShippingCheckboxChange} className="mr-2" />
                    <label htmlFor="billingSame" className="text-black dark:text-white">Billing address same as shipping address</label>
                  </div>
                  {!shipping.billingSame && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Billing Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField name="firstName" value={billing.firstName} onChange={handleBillingInputChange} required label="First name" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.firstName} />
                        <TextField name="lastName" value={billing.lastName} onChange={handleBillingInputChange} required label="Last name" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.lastName} />
                        <TextField name="address" value={billing.address} onChange={handleBillingInputChange} required label="Address" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.address} />
                        <TextField name="company" value={billing.company} onChange={handleBillingInputChange} label="Company" variant="outlined" fullWidth margin="dense" />
                        <TextField name="postalCode" value={billing.postalCode} onChange={handleBillingInputChange} required label="Postal code" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.postalCode} />
                        <TextField name="city" value={billing.city} onChange={handleBillingInputChange} required label="City" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.city} />
                        <TextField select name="country" value={billing.country} onChange={handleBillingSelectChange} label="Country" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.country}>
                          <MenuItem value="India">India</MenuItem>
                        </TextField>
                        <TextField select name="state" value={billing.state} onChange={handleBillingSelectChange} required label="State" variant="outlined" fullWidth margin="dense" error={billingTouched && !billing.state}>
                          <MenuItem value="">Select a state</MenuItem>
                          {INDIAN_STATES.map((state) => (
                            <MenuItem key={state} value={state}>{state}</MenuItem>
                          ))}
                        </TextField>
                      </div>
                      {billingTouched && !billingValid && <div className="text-red-500 text-sm mt-2">Please fill all required billing fields.</div>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField name="email" value={shipping.email} onChange={handleShippingInputChange} required label="Email" variant="outlined" fullWidth margin="dense" />
                    <TextField
                      name="phone"
                      value={shipping.phone}
                      onChange={handleShippingInputChange}
                      label="Phone"
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      autoComplete="off"
                      type="tel"
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                      InputProps={
                        shipping.country === 'India'
                          ? { startAdornment: <InputAdornment position="start">+91</InputAdornment> }
                          : undefined
                      }
                    />
                  </div>
                  <button type="submit" className="mt-4 px-6 py-2 rounded bg-black dark:bg-white text-white dark:text-black font-semibold disabled:opacity-60" disabled={!shippingValid || (!shipping.billingSame && !billingValid)}>Continue to delivery</button>
                  {shippingTouched && !shippingValid && <div className="text-red-500 text-sm mt-2">Please fill all required shipping fields.</div>}
                </form>
              )}
            </div>
            {/* Delivery (always visible, locked until shipping is submitted) */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 opacity-100">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center text-black dark:text-white">
                  Delivery
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                </h2>
              </div>
              {shippingLocked ? (
                <>
                  {deliveryMethod && deliveryMethod !== '' ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide mb-2">DELIVERY METHOD</h3>
                          <p className="text-gray-600 dark:text-neutral-300">
                            {deliveryMethod === 'standard'
                              ? 'Standard Shipping ₹0.00 (3-7 days)'
                              : 'Express Shipping ₹99.00 (1-2 days)'}
                          </p>
                        </div>
                        <button className="text-blue-600 hover:underline ml-2" onClick={() => setDeliveryMethod('')}>Edit</button>
                      </div>
                      <button className="mt-6 px-6 py-2 rounded bg-black dark:bg-white text-white dark:text-black font-semibold" onClick={() => setStep('payment')}>Continue to payment</button>
                    </>
                  ) : (
                    <form onSubmit={e => { e.preventDefault(); if (deliveryMethod) setDeliveryMethod(deliveryMethod); }}>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide mb-2">DELIVERY METHOD</h3>
                        <div className="space-y-3">
                          {[
                            {
                              id: 'standard',
                              title: 'Standard Shipping',
                              subtitle: '₹0.00 (3-7 days)',
                              value: 'standard',
                            },
                            {
                              id: 'express',
                              title: 'Express Shipping',
                              subtitle: '₹99.00 (1-2 days)',
                              value: 'express',
                            },
                          ].map((option) => (
                            <label
                              key={option.id}
                              className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                                deliveryMethod === option.value
                                  ? 'border-gray-300 bg-gray-50 dark:bg-neutral-900'
                                  : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex items-center h-5">
                                  <input
                                    type="radio"
                                    name="deliveryMethod"
                                    value={option.value}
                                    checked={deliveryMethod === option.value}
                                    onChange={(e) => setDeliveryMethod(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{option.title}</div>
                                  {option.subtitle && <div className="text-sm text-gray-600 dark:text-neutral-300 mt-1">{option.subtitle}</div>}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <button type="submit" className="mt-6 px-6 py-2 rounded bg-black dark:bg-white text-white dark:text-black font-semibold" disabled={!deliveryMethod}>Continue to payment</button>
                    </form>
                  )}
                </>
              ) : (
                <div className="text-gray-400 dark:text-neutral-500 italic">Please complete shipping address to select delivery method.</div>
              )}
            </div>

            {/* Payment (always visible, locked until delivery is complete) */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 text-black dark:text-white">Payment</h2>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide">PAYMENT OPTIONS</h3>
                <div className="space-y-3">
                  {[
                    {
                      id: 'razorpay',
                      title: 'Pay With Razorpay',
                      subtitle: 'Credit card / Debit card / Net Banking / UPI',
                      value: 'razorpay',
                    },
                    {
                      id: 'cod',
                      title: 'Cash on delivery',
                      value: 'cod',
                    },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                        payment === option.value
                          ? 'border-gray-300 bg-gray-50 dark:bg-neutral-900'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                      } ${!shippingLocked || !deliveryMethod ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                          <input
                            type="radio"
                            name="payment"
                            value={option.value}
                            checked={payment === option.value}
                            onChange={(e) => setPayment(e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            disabled={!shippingLocked || !deliveryMethod}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{option.title}</div>
                          {option.subtitle && <div className="text-sm text-gray-600 dark:text-neutral-300 mt-1">{option.subtitle}</div>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <button className="w-full bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-600 rounded py-2 font-semibold mt-6" disabled={!payment || !shippingLocked || !deliveryMethod}>Continue to review</button>
            </div>

            {/* Review */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-400 dark:text-neutral-500">Review</h2>
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
                      <p className="text-sm text-gray-600 dark:text-neutral-300">Variant: {item.merchandise.title}</p>
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
                  <svg className={`w-5 h-5 transition-transform ${promoOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {promoOpen && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex gap-2 items-stretch">
                      <TextField
                        name="promoCode"
                        value={promoCode}
                        onChange={e => { setPromoCode(e.target.value); setPromoError(''); setPromoApplied(false); }}
                        required
                        label="Promo code"
                        variant="outlined"
                        fullWidth
                        margin="none"
                        size="small"
                        error={!!promoError}
                        helperText={promoError || (promoApplied ? 'Coupon applied!' : '')}
                        InputProps={{
                          style: { height: 40, alignItems: 'center' },
                        }}
                        FormHelperTextProps={{ style: { marginLeft: 0 } }}
                      />
                      <button
                        className={`px-6 rounded bg-black text-white font-bold text-base transition-colors flex items-center justify-center ${promoApplied ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-900'}`}
                        style={{ minWidth: 100, height: 40, marginTop: 0 }}
                        onClick={handleApplyPromo}
                        disabled={promoApplied}
                        type="button"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}