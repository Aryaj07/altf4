"use client"

import { useState, useEffect } from "react"
import { useCart } from "components/cart/cart-context"
import { TextInput, Select, Button, Checkbox, Group } from '@mantine/core'

export default function CheckoutAddressStep() {
  const { cart, setCart } = useCart()
  const [loading, setLoading] = useState(false)

  // Lock state, saved in session storage
  const [shippingLocked, setShippingLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('shippingLocked') === 'true'
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('shippingLocked', shippingLocked ? 'true' : 'false')
    }
  }, [shippingLocked])

  // Shipping state
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
  })

  // Billing state
    const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    address: '',
    company: '',
    postalCode: '',
    city: '',
    country: 'India',
    state: '',
    phone: '',
    })

  const [shippingTouched, setShippingTouched] = useState(false)
  const [billingTouched, setBillingTouched] = useState(false)

  // On cart load, sync shipping + billing from cart
  useEffect(() => {
    if (!cart) return

    const isoToDisplayName = (iso: string): string => {
      if (!cart.region?.countries) return iso
      const found = cart.region.countries.find((c: any) => c.iso_2?.toUpperCase() === iso?.toUpperCase())
      return found ? found.display_name : iso
    }

    if (cart.shipping_address) {
      const sa = cart.shipping_address
      let billingSame = true

      if (cart.billing_address) {
        const ba = cart.billing_address
        billingSame =
          sa.first_name === ba.first_name &&
          sa.last_name === ba.last_name &&
          sa.address_1 === ba.address_1 &&
          sa.company === ba.company &&
          sa.postal_code === ba.postal_code &&
          sa.city === ba.city &&
          sa.country_code === ba.country_code &&
          sa.province === ba.province
      }

      setShipping(prev => ({
        ...prev,
        firstName: sa.first_name || '',
        lastName: sa.last_name || '',
        address: sa.address_1 || '',
        company: sa.company || '',
        postalCode: sa.postal_code || '',
        city: sa.city || '',
        country: isoToDisplayName(sa.country_code) || 'India',
        state: sa.province || '',
        phone: sa.phone || '',
        email: sa.email || cart.email || '',
        billingSame,
      }))

      // Sync billing only if billingSame is false
      if (cart.billing_address && !billingSame) {
        const ba = cart.billing_address
        setBilling({
          firstName: ba.first_name || '',
          lastName: ba.last_name || '',
          address: ba.address_1 || '',
          company: ba.company || '',
          postalCode: ba.postal_code || '',
          city: ba.city || '',
          country: isoToDisplayName(ba.country_code) || 'India',
          state: ba.province || '',
          phone: ba.phone || '',
        })
      }
    }
  }, [cart])

  // India states list
  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ]

  const shippingAddress = {
    first_name: shipping.firstName,
    last_name: shipping.lastName,
    address_1: shipping.address,
    company: shipping.company,
    postal_code: shipping.postalCode,
    city: shipping.city,
    country_code: cart?.region?.countries?.find(
      (c: any) => c.display_name === shipping.country
    )?.iso_2 || 'IN',
    province: shipping.state,
    phone: shipping.phone,
  }

    const billingAddress = shipping.billingSame
    ? shippingAddress
    : {
        first_name: billing.firstName,
        last_name: billing.lastName,
        address_1: billing.address,
        company: billing.company,
        postal_code: billing.postalCode,
        city: billing.city,
        country_code: cart?.region?.countries?.find(
            (c: any) => c.display_name === billing.country
        )?.iso_2 || 'IN',
        province: billing.state,
        phone: billing.phone,
    }


  const shippingValid =
    !!shipping.firstName &&
    !!shipping.lastName &&
    !!shipping.address &&
    !!shipping.postalCode &&
    !!shipping.city &&
    !!shipping.country &&
    !!shipping.state &&
    !!shipping.phone

    const billingValid =
    !!billing.firstName &&
    !!billing.lastName &&
    !!billing.address &&
    !!billing.postalCode &&
    !!billing.city &&
    !!billing.country &&
    !!billing.state &&
    !!billing.phone


  const handleShippingCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setShipping(prev => ({ ...prev, billingSame: checked }))

    if (checked) {
      setBilling({
        firstName: '',
        lastName: '',
        address: '',
        company: '',
        postalCode: '',
        city: '',
        country: 'India',
        state: '',
        phone: '',
      })
    }
  }

  const getCountryDisplayName = (code: string) => {
    if (!cart?.region?.countries) return code
    const found = cart.region.countries.find(
      (c: any) => c.iso_2?.toUpperCase() === code?.toUpperCase() || c.display_name === code
    )
    return found ? found.display_name : code
  }

  const updateAddress = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault()
    setShippingTouched(true)
    setBillingTouched(true)

    if (!cart || !shippingValid || (!shipping.billingSame && !billingValid)) {
      console.log("Validation failed.")
      return
    }

    setLoading(true)

    try {
      await fetch("/api/cart/shipping-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          shipping_address: shippingAddress,
        }),
      })

      await fetch("/api/cart/billing-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          billing_address: billingAddress,
        }),
      })

      const res = await fetch('/api/cart', { method: 'GET' })
      if (res.ok) {
        const latestCart = await res.json()
        setCart(latestCart)
      }

      // Reset billing if billingSame
      if (shipping.billingSame) {
        setBilling({
          firstName: '',
          lastName: '',
          address: '',
          company: '',
          postalCode: '',
          city: '',
          country: 'India',
          state: '',
          phone: '',
        })
      }

      setShippingLocked(true)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('shippingLocked', 'true')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
    {shippingLocked ? (
      <>
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-neutral-700">
          <div className="flex-1 px-0 md:px-6 pb-6 md:pb-0">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Address</h3>
            <div className="text-gray-600 dark:text-neutral-300 space-y-1">
              {(shipping.firstName || shipping.lastName) && (
                <p>{shipping.firstName} {shipping.lastName}</p>
              )}
              {shipping.address && <p>{shipping.address}</p>}
              {shipping.company && <p>{shipping.company}</p>}
              {(shipping.postalCode || shipping.city) && (
                <p>{shipping.postalCode}{shipping.postalCode && shipping.city ? ', ' : ''}{shipping.city}</p>
              )}
              {(shipping.state || shipping.country) && (
                <p>{shipping.state ? `${shipping.state}, ` : ''}{getCountryDisplayName(shipping.country)}</p>
              )}
            </div>
          </div>
            <div className="flex-1 px-0 md:px-6 pb-6 md:pb-0">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contact</h3>
                <div className="text-gray-600 dark:text-neutral-300 space-y-1">
                    {shipping.email && <p><span className="font-medium">Email:</span> {shipping.email}</p>}
                    {shipping.phone && (
                    <p>
                        <span className="font-medium">Phone:</span>{' '}
                        {getCountryDisplayName(shipping.country) === 'India'
                        ? `+91 ${shipping.phone}`
                        : shipping.phone}
                    </p>
                    )}

                    {!shipping.billingSame && billing.phone && (
                    <p>
                        <span className="font-medium">Billing Phone:</span>{' '}
                        {billing.country === 'India'
                        ? `+91 ${billing.phone}`
                        : billing.phone}
                    </p>
                    )}
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
        {/* Edit button moved here */}
        <div className="flex justify-end mt-4">
          <Button
            variant="subtle"
            color="blue"
            className="ml-auto"
            onClick={() => {
              setShippingLocked(false)
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('shippingLocked', 'false')
              }
            }}
          >
            Edit
          </Button>
        </div>
      </>
      ) : (
        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="First Name" required value={shipping.firstName} onChange={e => setShipping(prev => ({ ...prev, firstName: e.target.value }))} />
            <TextInput label="Last Name" required value={shipping.lastName} onChange={e => setShipping(prev => ({ ...prev, lastName: e.target.value }))} />
            <TextInput label="Address Line" required value={shipping.address} onChange={e => setShipping(prev => ({ ...prev, address: e.target.value }))} />
            <TextInput label="Company" value={shipping.company} onChange={e => setShipping(prev => ({ ...prev, company: e.target.value }))} />
            <TextInput label="Postal Code" required value={shipping.postalCode} onChange={e => setShipping(prev => ({ ...prev, postalCode: e.target.value }))} />
            <TextInput label="City" required value={shipping.city} onChange={e => setShipping(prev => ({ ...prev, city: e.target.value }))} />
            <Select
              label="Country"
              required
              value={shipping.country || null}
              onChange={value => setShipping(prev => ({ ...prev, country: value || '' }))}
              data={cart?.region?.countries?.map((c: any) => ({
                value: c.display_name,
                label: c.display_name
              })) || []}
            />
            <Select
              label="State"
              required
              value={shipping.state || null}
              onChange={value => setShipping(prev => ({ ...prev, state: value || '' }))}
              data={INDIAN_STATES.map(state => ({ value: state, label: state }))}
            />
            <Group gap={0} align="flex-end">
                {shipping.country === 'India' ? (
                <TextInput
                    name="phone"
                    value={shipping.phone}
                    onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '')
                    setShipping(prev => ({ ...prev, phone: digitsOnly }))
                    }}
                    label="Phone"
                    required
                    leftSection={<span style={{ fontWeight: 600, fontSize: 14, marginLeft: 4 }}>+91</span>}
                    maxLength={10}
                    style={{ flex: 1 }}
                    error={
                    shippingTouched && !/^\d{10}$/.test(shipping.phone)
                        ? 'Please enter a valid 10-digit phone number'
                        : undefined
                    }
                />
                ) : (
                <TextInput
                    name="phone"
                    value={shipping.phone}
                    onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '')
                    setShipping(prev => ({ ...prev, phone: digitsOnly }))
                    }}
                    label="Phone"
                    required
                    style={{ flex: 1 }}
                    error={
                    shippingTouched && !/^\d+$/.test(shipping.phone)
                        ? 'Please enter a valid numeric phone number'
                        : undefined
                    }
                />
                )}
            </Group>
          </div>

          <Checkbox
            label="Billing address same as shipping address"
            checked={shipping.billingSame}
            onChange={handleShippingCheckboxChange}
          />

          {!shipping.billingSame && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <TextInput label="First Name" required value={billing.firstName} onChange={e => setBilling(prev => ({ ...prev, firstName: e.target.value }))} />
              <TextInput label="Last Name" required value={billing.lastName} onChange={e => setBilling(prev => ({ ...prev, lastName: e.target.value }))} />
              <TextInput label="Address Line" required value={billing.address} onChange={e => setBilling(prev => ({ ...prev, address: e.target.value }))} />
              <TextInput label="Company" value={billing.company} onChange={e => setBilling(prev => ({ ...prev, company: e.target.value }))} />
              <TextInput label="Postal Code" required value={billing.postalCode} onChange={e => setBilling(prev => ({ ...prev, postalCode: e.target.value }))} />
              <TextInput label="City" required value={billing.city} onChange={e => setBilling(prev => ({ ...prev, city: e.target.value }))} />
              <Select
                label="Country"
                required
                value={billing.country || null}
                onChange={value => setBilling(prev => ({ ...prev, country: value || '' }))}
                data={cart?.region?.countries?.map((c: any) => ({
                  value: c.display_name,
                  label: c.display_name
                })) || []}
              />
              <Select
                label="State"
                required
                value={billing.state || null}
                onChange={value => setBilling(prev => ({ ...prev, state: value || '' }))}
                data={INDIAN_STATES.map(state => ({ value: state, label: state }))}
              />
                <Group gap={0} align="flex-end">
                    {billing.country === 'India' ? (
                        <TextInput
                        name="phone"
                        value={billing.phone}
                        onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, '');
                            setBilling((prev) => ({ ...prev, phone: digitsOnly }));
                        }}
                        label="Billing Phone"
                        required
                        leftSection={
                            <span
                            style={{
                                fontWeight: 600,
                                fontSize: 14,
                                marginLeft: 4,
                            }}
                            >
                            +91
                            </span>
                        }
                        maxLength={10}
                        style={{ flex: 1 }}
                        error={
                            billingTouched && !/^\d{10}$/.test(billing.phone)
                            ? 'Please enter a valid 10-digit phone number'
                            : undefined
                        }
                        />
                    ) : (
                        <TextInput
                        name="phone"
                        value={billing.phone}
                        onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, '');
                            setBilling((prev) => ({ ...prev, phone: digitsOnly }));
                        }}
                        label="Billing Phone"
                        required
                        style={{ flex: 1 }}
                        error={
                            billingTouched && !/^\d+$/.test(billing.phone)
                            ? 'Please enter a valid numeric phone number'
                            : undefined
                        }
                        />
                    )}
                </Group>
            </div>
          )}

          <Group justify="end">
            <Button
              type="button"
              fullWidth
              color="blue"
              loading={loading}
              disabled={!shippingValid || (!shipping.billingSame && !billingValid)}
              onClick={updateAddress}
            >
              Save
            </Button>
          </Group>

          {shippingTouched && !shippingValid && (
            <div className="text-red-500 text-sm mt-2">Please fill all required shipping fields.</div>
          )}
        </form>
      )}
    </div>
  )
}