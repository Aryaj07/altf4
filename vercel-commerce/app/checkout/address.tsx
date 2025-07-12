"use client" // include with Next.js 13+

import { useState } from "react"
import { useCart } from "components/cart/cart-context"
import { TextInput, Select, Button, Checkbox, Group } from '@mantine/core';


export default function CheckoutAddressStep() {
    const { cart, setCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [locked, setLocked] = useState(false)
    const [shippingLocked, setShippingLocked] = useState(false);
    const [billingTouched, setBillingTouched] = useState(false);
    const [shippingTouched, setShippingTouched] = useState(false);
    
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

    const updateAddress = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log("Updating address with cart:", cart);
        setShippingTouched(true);
        // if (!cart || !shippingValid || (!shipping.billingSame && !billingValid)) return;
        if (!cart) {
            return
        }


        e.preventDefault()
        setLoading(true)


        // Update shipping address
        fetch("/api/cart/shipping-address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cartId: cart.id,
                shipping_address: shippingAddress,
            }),
        })
            .then(async (res) => {
                let data = null;
                try { data = await res.json(); } catch (err) { }
                if (res.ok && data && data.cart) {
                    setCart(data.cart);
                }
                // Update billing address
                return fetch("/api/cart/billing-address", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cartId: cart.id,
                        billing_address: billingAddress,
                    }),
                });
            })
            .then(async (res) => {
                if (!res) return;
                let data = null;
                try { data = await res.json(); } catch (err) { }
                if (res.ok && data && data.cart) {
                    setCart(data.cart);
                }
            })
            .finally(async () => {
                // Fetch latest cart to refresh state
                try {
                    const res = await fetch('/api/cart', { method: 'GET' });
                    if (res.ok) {
                        const latestCart = await res.json();
                        setCart(latestCart);
                    }
                } catch (err) { }
                setLoading(false);
                setLocked(true);
            });
            if (!cart || !shippingValid || (!shipping.billingSame && !billingValid)) return;

    }
    
    const [shipping, setShipping] = useState({
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
    });

    const shippingAddress = {
        first_name: shipping.firstName,
        last_name: shipping.lastName,
        address_1: shipping.address,
        company: shipping.company,
        postal_code: shipping.postalCode,
        city: shipping.city,
        country_code: cart.region?.countries?.[0].iso_2 ?? 'IN',
        province: shipping.state,
        phone: shipping.phone,
    };

    const [billing, setBilling] = useState({
        firstName: '',
        lastName: '',
        address: '',
        company: '',
        postalCode: '',
        city: '',
        country: 'India',
        state: '',
    });

    const billingAddress = shipping.billingSame
        ? shippingAddress
        : {
            first_name: billing.firstName,
            last_name: billing.lastName,
            address_1: billing.address,
            company: billing.company,
            postal_code: billing.postalCode,
            city: billing.city,
            country_code: cart.region?.countries?.[0].iso_2 ?? 'IN',
            province: billing.state,
        };

    const shippingValid =
        !!shipping.firstName &&
        !!shipping.lastName &&
        !!shipping.address &&
        !!shipping.postalCode &&
        !!shipping.city &&
        !!shipping.country;

    const billingValid =
        !!billing.firstName &&
        !!billing.lastName &&
        !!billing.address &&
        !!billing.postalCode &&
        !!billing.city;

    const handleShippingCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShipping((prev) => ({ ...prev, billingSame: e.target.checked }));
    };


    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                {shippingLocked ? (
                    <Button variant="subtle" color="blue" className="ml-2" onClick={() => setShippingLocked(false)}>
                        Edit
                    </Button>
                ) : null}
            </div>

            {shippingLocked ? (
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-neutral-700">
                    <div className="flex-1 px-0 md:px-6 pb-6 md:pb-0">
                        <div className="text-gray-600 dark:text-neutral-300 space-y-1">
                            <p>{shipping.firstName} {shipping.lastName}</p>
                            <p>{shipping.address}</p>
                            {shipping.company && <p>{shipping.company}</p>}
                            <p>{shipping.postalCode}, {shipping.city}</p>
                            <p>{shipping.state && `${shipping.state}, `}{shipping.country}</p>
                        </div>
                    </div>
                    <div className="flex-1 px-0 md:px-6 pb-6 md:pb-0">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h3>
                        <div className="text-gray-600 dark:text-neutral-300 space-y-1">
                            <p>{shipping.country === 'India' ? `+91 ${shipping.phone}` : shipping.phone}</p>
                            <p>{shipping.email}</p>
                        </div>
                    </div>
                    <div className="flex-1 px-0 md:px-6">
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
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="First Name" placeholder="First Name" value={shipping.firstName} onChange={(e) => setShipping(prev => ({ ...prev, firstName: e.target.value }))} required />
                        <TextInput label="Last Name" placeholder="Last Name" value={shipping.lastName} onChange={(e) => setShipping(prev => ({ ...prev, lastName: e.target.value }))} required />
                        <TextInput label="Address Line" placeholder="Address Line" value={shipping.address} onChange={(e) => setShipping(prev => ({ ...prev, address: e.target.value }))} required />
                        <TextInput label="Company" placeholder="Company" value={shipping.company} onChange={(e) => setShipping(prev => ({ ...prev, company: e.target.value }))} />
                        <TextInput label="Postal Code" placeholder="Postal Code" value={shipping.postalCode} onChange={(e) => setShipping(prev => ({ ...prev, postalCode: e.target.value }))} required />
                        <TextInput label="City" placeholder="City" value={shipping.city} onChange={(e) => setShipping(prev => ({ ...prev, city: e.target.value }))} required />
                        <Select label="Country" placeholder="Select country" value={shipping.country} onChange={(value) => setShipping(prev => ({ ...prev, country: value || "" }))} data={cart?.region?.countries?.map((country: any) => ({ value: country.display_name, label: country.display_name })) || []} required />
                        <Select label="State"  placeholder="Select a state" value={shipping.state || null} onChange={(value) => setShipping(prev => ({ ...prev, state: value || "" }))} data={INDIAN_STATES.map(state => ({ value: state, label: state, }))} required error={shippingTouched && !shipping.state  ? "State is required"  : undefined} /> 
                    </div>

                    <Checkbox label="Billing address same as shipping address" name="billingSame" checked={shipping.billingSame} onChange={handleShippingCheckboxChange} />

                    {!shipping.billingSame && (
                        <div className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput label="First Name" placeholder="First Name" value={billing.firstName} onChange={e => setBilling(prev => ({ ...prev, firstName: e.target.value }))} required />
                                <TextInput label="Last Name" placeholder="Last Name" value={billing.lastName} onChange={e => setBilling(prev => ({ ...prev, lastName: e.target.value }))} required />
                                <TextInput label="Address Line" placeholder="Address Line" value={billing.address} onChange={e => setBilling(prev => ({ ...prev, address: e.target.value }))} required />
                                <TextInput label="Company" placeholder="Company" value={billing.company} onChange={e => setBilling(prev => ({ ...prev, company: e.target.value }))} />
                                <TextInput label="Postal Code" placeholder="Postal Code" value={billing.postalCode} onChange={e => setBilling(prev => ({ ...prev, postalCode: e.target.value }))} required />
                                <TextInput label="City" placeholder="City" value={billing.city} onChange={e => setBilling(prev => ({ ...prev, city: e.target.value }))} required />
                                <Select label="Country" placeholder="Select country" value={billing.country || null} onChange={value => setBilling(prev => ({ ...prev, country: value || "" }))} data={cart?.region?.countries?.map((country: any) => ({ value: country.display_name, label: country.display_name })) || []} required />
                                <Select label="State" placeholder="Select a state" value={billing.state || null} onChange={value => setBilling(prev => ({ ...prev, state: value || "" }))} data={INDIAN_STATES.map(state => ({ value: state, label: state }))} required error={billingTouched && !billing.state ? "State is required" : undefined} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Group gap={0} align="flex-end">
                            {shipping.country === 'India' ? (
                                <TextInput
                                    name="phone"
                                    value={shipping.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShipping(prev => ({ ...prev, phone: e.target.value }))}
                                    label="Phone"
                                    required
                                    leftSection={<span style={{ fontWeight: 600, fontSize: 14, marginLeft: 4 }}>+91</span>}
                                    maxLength={10}
                                    style={{ flex: 1 }}
                                    error={shippingTouched && !shipping.phone ? 'Phone is required' : undefined}
                                />
                            ) : (
                                <TextInput
                                    name="phone"
                                    value={shipping.phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShipping(prev => ({ ...prev, phone: e.target.value }))}
                                    label="Phone"
                                    required
                                    style={{ flex: 1 }}
                                    error={shippingTouched && !shipping.phone ? 'Phone is required' : undefined}
                                />
                            )}
                        </Group>
                    </div>
                        <Button
                            fullWidth
                            color="blue"
                            className="mt-4 px-6 py-2 rounded font-semibold"
                            loading={loading}
                            disabled={!shippingValid || (!shipping.billingSame && !billingValid)}
                            onClick={updateAddress}
                        >
                            Save
                        </Button>
                        {shippingTouched && !shippingValid && (<div className="text-red-500 text-sm mt-2">Please fill all required shipping fields.</div>)}
                </div>
                </form>
            )}
        </div>
    );
}