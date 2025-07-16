"use client"

import { Card, Stack, Group, Text, Badge } from "@mantine/core"
import { IconMail, IconMapPin, IconTruck, IconGift, IconCreditCard } from "@tabler/icons-react"
import { useCart } from "components/cart/cart-context"

const paymentProviders: Record<string, string> = {
  razorpay: "Razorpay",
  cod: "Cash on Delivery",
  system_default: "Cash on Delivery", // in case of your old implementation
}

export function CheckoutSummary() {
  const { cart } = useCart()

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
  const sm = cart?.shipping_methods?.[0]
  if (sm) {
    delivery = {
      selectedOption: sm.shipping_option?.id || sm.id,
      name: sm.shipping_option?.name || sm.name,
      price: sm.amount, // assuming your backend returns cents
    }
  } else {
    // try session storage fallback if no method exists yet
    const storedId = typeof window !== "undefined" ? sessionStorage.getItem("selectedShippingOptionId") : null
    const storedName = typeof window !== "undefined" ? sessionStorage.getItem("selectedShippingOptionName") : null
    const storedAmount = typeof window !== "undefined" ? sessionStorage.getItem("selectedShippingOptionAmount") : null
    if (storedId && storedName && storedAmount) {
      delivery = {
        selectedOption: storedId,
        name: storedName,
        price: Number.parseFloat(storedAmount),
      }
    }
  }

  // ---- Promo ----
  const promoCode = cart?.discounts?.find((d: any) => d.code)?.code || null

  // ---- Payment ----
  const providerId =
    cart?.payment_collection?.payment_sessions?.[0]?.provider_id ||
    (typeof window !== "undefined" ? sessionStorage.getItem("selectedPaymentProviderId") : null)

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
          <Group align="flex-start">
            <IconTruck size={20} color="var(--mantine-color-blue-6)" /> {/* Larger, colored icon */}
            <div>
              <Text size="sm" fw={600}>
                {" "}
                {/* Bolder title */}
                Delivery Method
              </Text>
              <Text size="sm" c="dimmed">
                {" "}
                {/* Dimmed text for details */}
                {delivery.name}
              </Text>
              <Badge size="sm" variant="light" color="green">
                {" "}
                {/* Badge for price */}${delivery.price.toFixed(2)}
              </Badge>
            </div>
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
                {paymentProviders[providerId as keyof typeof paymentProviders] || providerId}
              </Text>
            </div>
          </Group>
        )}
      </Stack>
    </Card>
  )
}
