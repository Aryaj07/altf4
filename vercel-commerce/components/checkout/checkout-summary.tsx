"use client"

import { Card, Stack, Group, Text, Badge } from "@mantine/core"
import { IconMail, IconMapPin, IconTruck, IconGift, IconCreditCard } from "@tabler/icons-react"
import { useCart } from "components/cart/cart-context"
import Price from "components/price-new"
import { useEffect, useState } from "react" 

export function CheckoutSummary() {
  const { cart } = useCart()
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  
  useEffect(() => {
    if (!cart?.id) return;

    fetch(`/api/cart/retrieve-shipping_options?cart_id=${cart.id}`)
      .then((res) => res.json())
      .then((data) => {
        // Fix: Access the nested shipping_options array
        setShippingOptions(data?.shipping_options || []);
      })
      .catch((error) => {
        console.error('Failed to fetch shipping options:', error);
      });
  }, [cart?.id]);

  if (!cart) return null

  // ---- Email ----
  const email = cart?.email || ""

  // ---- Shipping ----
  const sa = cart?.shipping_address
  const shipping = sa
    ? {
        firstName: sa.first_name,
        lastName: sa.last_name,
        address: sa.address_1,
        address2: sa.address_2,
        city: sa.city,
        postalCode: sa.postal_code,
        country: sa.country_code,
        phone: sa.phone,
      }
    : null

  // ---- Delivery ---- (Fixed to use correct data structure)
  let delivery = null

  // First, check if cart has shipping methods selected
  const selectedShippingMethod = cart?.shipping_methods?.[0]
  
  if (selectedShippingMethod) {
    // Try to find the shipping option details from the fetched options
    const matchingOption = shippingOptions.find(
      option => option.id === selectedShippingMethod.shipping_option_id
    );
    
    const shippingName = 
      matchingOption?.name ||
      selectedShippingMethod.shipping_option?.name ||
      selectedShippingMethod.name ||
      'Selected Shipping Method';

    delivery = {
      selectedOption: selectedShippingMethod.shipping_option_id,
      name: shippingName,
      price: selectedShippingMethod.amount || matchingOption?.amount || 0,
      description: matchingOption?.requirements?.join(', ') || ''
    }
  } 
  // Fallback to first available shipping option
  else if (shippingOptions.length > 0) {
    const option = shippingOptions[0]
    
    delivery = {
      selectedOption: option.id,
      name: option.name || 'Standard Shipping',
      price: option.amount || 0,
      description: option.requirements?.join(', ') || ''
    }
  }
  // ---- Promo ----
  const promoCode = cart?.discounts?.find((d: any) => d.code)?.code || null

  // ---- Payment ----
  const providerId =
    cart?.payment_collection?.payment_sessions?.[0]?.provider_id ||
    (typeof window !== "undefined" ? sessionStorage.getItem("selectedPaymentProviderId") : null)

  function getProviderDisplayName(providerId?: string) {
    if (!providerId) return "";
    const id = providerId.toLowerCase();
    if (id.includes("razorpay")) return "Razorpay";
    if (id.includes("system_default") || id.includes("cod")) return "Cash on Delivery";
    return providerId;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Text fw={600} size="lg">
          Order Review
        </Text>
        
        {email && (
          <Group align="flex-start">
            <IconMail size={20} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="sm" fw={600}>
                Email Address
              </Text>
              <Text size="sm" c="dimmed">
                {email}
              </Text>
            </div>
          </Group>
        )}

        {shipping && (
          <Group align="flex-start">
            <IconMapPin size={20} color="var(--mantine-color-blue-6)" style={{ marginTop: 2 }} />
            <div>
              <Text size="sm" fw={600}>
                Shipping Address
              </Text>
              <Text size="sm" c="dimmed">
                {shipping.firstName} {shipping.lastName}
                <br />
                {shipping.address}
                {shipping.address2 && (
                  <>
                    <br />
                    {shipping.address2}
                  </>
                )}
                <br />
                {shipping.city}, {shipping.postalCode}
                <br />
                {shipping.country}
                {shipping.phone && (
                  <>
                    <br />
                    Phone: {shipping.phone}
                  </>
                )}
              </Text>
            </div>
          </Group>
        )}

        {delivery && (
          <Group align="flex-start">
            <IconTruck size={20} color="var(--mantine-color-blue-6)" />
            <div style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" fw={600}>
                    Delivery Method
                  </Text>
                  <Text size="sm" c="dimmed">
                    {delivery.name}
                  </Text>
                  {delivery.description && (
                    <Text size="xs" c="dimmed" mt={2}>
                      {delivery.description}
                    </Text>
                  )}
                </div>
                <Badge size="sm" variant="light" color="blue">
                  <Price
                    amount={delivery.price.toString()}
                    currencyCode={cart.region?.currency_code?.toUpperCase() || "USD"}
                    showCurrency={false}
                  />
                </Badge>
              </Group>
            </div>
          </Group>
        )}

        {promoCode && (
          <Group align="flex-start">
            <IconGift size={20} color="var(--mantine-color-green-6)" />
            <div>
              <Text size="sm" fw={600}>
                Promo Code Applied
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {promoCode}
                </Text>
                <Badge size="xs" color="green">
                  Applied
                </Badge>
              </Group>
            </div>
          </Group>
        )}

        {providerId && (
          <Group align="flex-start">
            <IconCreditCard size={20} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="sm" fw={600}>
                Payment Method
              </Text>
              <Text size="sm" c="dimmed">
                {getProviderDisplayName(providerId)}
              </Text>
            </div>
          </Group>
        )}
      </Stack>
    </Card>
  )
}