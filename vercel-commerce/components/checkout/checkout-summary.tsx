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
    if (!cart) return;

    fetch(`/api/cart/retrieve-shipping_options?cart_id=${cart.id}`)
      .then((res) => res.json())
      .then((data) => {
        setShippingOptions(data.shipping_options || []);
      });
  }, [cart]);
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

  // ---- Delivery ----
  let delivery = null

  const sm = cart?.shipping_options?.[0];

  if (sm) {
    delivery = {
      selectedOption: sm.shipping_options?.id,
      name: sm.shipping_option?.name,
      price: sm.amount,
    };
  } else if (shippingOptions.length > 0) {
    // Use the first available shipping option as a fallback
    const option = shippingOptions[0];
    delivery = {
      selectedOption: option.id,
      name: option.name,
      price: option.amount,
    };
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
    // Add more mappings as needed
    return providerId;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {" "}
        {/* Increased gap for better spacing */}
        <Text fw={600} size="lg">
          Order Review
        </Text>
        {email && (
          <Group align="flex-start">
            <IconMail size={20} color="var(--mantine-color-blue-6)" /> {/* Larger, colored icon */}
            <div>
              <Text size="sm" fw={600}>
                {" "}
                {/* Bolder title */}
                Email Address
              </Text>
              <Text size="sm" c="dimmed">
                {" "}
                {/* Dimmed text for details */}
                {email}
              </Text>
            </div>
          </Group>
        )}
        {shipping && (
          <Group align="flex-start">
            <IconMapPin size={20} color="var(--mantine-color-blue-6)" style={{ marginTop: 2 }} />{" "}
            {/* Larger, colored icon */}
            <div>
              <Text size="sm" fw={600}>
                {" "}
                {/* Bolder title */}
                Shipping Address
              </Text>
              <Text size="sm" c="dimmed">
                {" "}
                {/* Dimmed text for details */}
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
                <br />
                Phone: {shipping.phone}
              </Text>
            </div>
          </Group>
        )}
        {delivery && (
          <Group justify="space-between" align="center">
            {/* This group keeps the icon and text together on the left */}
            <Group>
              <IconTruck size={20} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="sm" fw={600}>
                  Delivery Method
                </Text>
                <Text size="sm" c="dimmed">
                  {delivery.name}
                </Text>
              </div>
            </Group>

            {/* The Badge is now a direct child, pushed to the right */}
            <Badge size="sm" variant="transparent" color="white">
              <Price
                amount={delivery.price.toString()}
                currencyCode={
                  cart.region?.currency_code?.toUpperCase() || "USD"
                }
                showCurrency={false}
              />
            </Badge>
          </Group>
        )}
        {promoCode && (
          <Group align="flex-start">
            <IconGift size={20} color="var(--mantine-color-green-6)" /> {/* Green icon for discount */}
            <div>
              <Text size="sm" fw={600}>
                {" "}
                {/* Bolder title */}
                Promo Code Applied
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {" "}
                  {/* Dimmed text for details */}
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
            <IconCreditCard size={20} color="var(--mantine-color-blue-6)" /> {/* Larger, colored icon */}
            <div>
              <Text size="sm" fw={600}>
                {" "}
                {/* Bolder title */}
                Payment Method
              </Text>
              <Text size="sm" c="dimmed">
                {" "}
                {/* Dimmed text for details */}
                {getProviderDisplayName(providerId)}
              </Text>
            </div>
          </Group>
        )}
      </Stack>
    </Card>
  )
}
