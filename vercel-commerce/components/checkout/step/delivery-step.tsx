"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "components/cart/cart-context";
import {
  Button,
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Radio,
  Alert,
} from "@mantine/core";
import {
  IconPackage,
  IconRocket,
  IconTruck,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { DeliveryFormData } from "lib/checkout-schema";

interface DeliveryStepProps {
  onComplete: (values: DeliveryFormData) => void;
}

export default function DeliveryStep({ onComplete }: DeliveryStepProps) {
  const { cart, setCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<
    string | undefined
  >();
  const [calculatedPrices, setCalculatedPrices] = useState<
    Record<string, number>
  >({});

  // Load shipping options
  useEffect(() => {
    if (!cart) return;

    fetch(`/api/cart/retrieve-shipping_options?cart_id=${cart.id}`)
      .then((res) => res.json())
      .then((data) => {
        setShippingOptions(data.shipping_options || []);
      });
  }, [cart]);

  const setShipping = async () => {
    if (!cart || !selectedShippingOption) return;

    setLoading(true);

    try {
      const res = await fetch("/api/cart/shipping-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          option_id: selectedShippingOption,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        const refreshed = await fetch("/api/cart");
        if (refreshed.ok) {
          const latestCart = await refreshed.json();
          setCart(latestCart);
        } else {
          setCart(data.cart);
        }

        // ✅ Call create-payment-collection
        const createCollectionRes = await fetch(
          "/api/cart/create-payment-collection",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartId: cart.id }),
          }
        );

        const collectionData = await createCollectionRes.json();

        if (
          !createCollectionRes.ok ||
          !collectionData.payment_collection?.id
        ) {
          console.error(
            "Failed to create payment collection:",
            collectionData.error || "Unknown error"
          );
          throw new Error("Failed to create payment collection.");
        }

        const paymentCollectionId = collectionData.payment_collection.id;

        console.log(
          "✅ Payment collection created:",
          paymentCollectionId
        );

        // ✅ Store payment collection ID in session storage
        window.sessionStorage.setItem(
          "paymentCollectionId",
          paymentCollectionId
        );

        // Pass delivery data back to parent:
        onComplete({
          selectedOption: selectedShippingOption,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getShippingOptionPrice = useCallback(
    (shippingOption: any) => {
      const calculated = calculatedPrices[shippingOption.id];
      const amountToShow =
        typeof calculated === "number" ? calculated : shippingOption.amount;

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cart?.currency_code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amountToShow);
    },
    [calculatedPrices, cart?.currency_code]
  );

  if (!cart) return <span>Loading...</span>;

  return (
    <Stack>
      <Alert
        icon={<IconInfoCircle size={16} />}
        color="blue"
        variant="dark"
      >
        Select your preferred delivery option below.
      </Alert>

      <Radio.Group
        value={selectedShippingOption}
        onChange={setSelectedShippingOption}
        
      >
        <Stack gap="sm">
          {shippingOptions.map((option) => {
            const Icon =
              option.name.toLowerCase().includes("overnight")
                ? IconRocket
                : option.name.toLowerCase().includes("express")
                ? IconTruck
                : IconPackage;

            return (
              <Card
                key={option.id}
                padding="md"
                radius="md"
                withBorder
                style={{
                  cursor: "pointer",
                  borderColor:
                    selectedShippingOption === option.id
                      ? "var(--mantine-color-blue-6)"
                      : undefined,
                  backgroundColor:
                    selectedShippingOption === option.id

                      ? "var(--mantine-color-dark-6)"
                      : undefined,
                }}
                onClick={() => setSelectedShippingOption(option.id)}
              >
                <Group justify="space-between" align="flex-start">
                  <Group>
                    <Icon size={24} />
                    <div>
                      <Text fw={500}>{option.name}</Text>
                      {option.description && (
                        <Text size="sm" c="dimmed">
                          {option.description}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Badge variant="transparent" size="lg" c="white">
                    {getShippingOptionPrice(option)}
                  </Badge>
                </Group>
              </Card>
            );
          })}
        </Stack>
      </Radio.Group>

      <Button
        size="md"
        onClick={setShipping}
        loading={loading}
        disabled={!selectedShippingOption}
      >
        Continue to Payment
      </Button>
    </Stack>
  );
}