"use client";

import { useState, useEffect } from "react";
import { useCart } from "components/cart/cart-context";
import {
  Card,
  Stack,
  Group,
  Text,
  Divider,
  Badge,
  Collapse,
  TextInput,
  Button,
  Alert,
} from "@mantine/core";
import { IconGift, IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import Price from "components/price-new";

export function OrderSummary() {
  const { cart, refreshCart } = useCart();

  const [promoOpen, setPromoOpen] = useState(false);

  // Promo code logic
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  
  const [promoError, setPromoError] = useState<string | null>(null);
  
  const [discountLabel, setDiscountLabel] = useState<string | null>(null);
  const [hasRemovedPromo, setHasRemovedPromo] = useState(false);

  // Remove all promotions on mount (only once)
  useEffect(() => {
    if (!cart?.id || hasRemovedPromo) return;

    (async () => {
      try {
        await fetch(`/api/cart/remove-promo?cartId=${cart.id}`, {
          method: "DELETE",
        });
        setPromoApplied(false);
        
        setPromoError(null);
        
        setDiscountLabel(null);
        setPromoCode("");
        setHasRemovedPromo(true);
        await refreshCart();
      } catch (error) {
        console.error("Failed to remove promotions:", error);
      }
    })();
  }, [cart?.id, hasRemovedPromo, refreshCart]);

  const handleApplyPromo = async () => {
    if (!promoCode) {
      setPromoError("Please enter a promo code.");
      return;
    }

    setApplyingPromo(true);
    
    setPromoError(null);

    try {
      const res = await fetch("/api/cart/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          code: promoCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoError(data?.details || data?.error || "Failed to apply promo code.");
        return;
      }

      await refreshCart();
      setPromoApplied(true);
      setDiscountLabel(
        data?.discount?.percentage
          ? `You saved ${data.discount.percentage}% on your order.`
          : data?.discount?.amount
          ? `You saved $${data.discount.amount / 100} on your order.`
          : "Promo code applied!"
      );
    } catch (error) {
      console.error(error);
      setPromoError("An unexpected error occurred.");
    } finally {
      setApplyingPromo(false);
    }
  };

  if (!cart) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm">Loading cart...</Text>
      </Card>
    );
  }

  const cartItems = cart.lines || [];
  const subtotal = cart.subtotal ?? 0;
  const shipping = cart.shipping_total ?? 0;
  const tax = cart.tax_total ?? 0;
  const total = cart.total ?? 0;

  const discounts = cart.discounts?.filter((d: any) => d.code) || [];
  const discountPercentage = discounts[0]?.rule?.value || undefined;
  const discountAmount = cart.discount_total || 0;

  return (
    <Card
      // shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ position: "sticky", top: 20 , backgroundColor: "var(--mantine-color-dark-7)"}}
    >
      <Stack>
        <Text fw={600} size="lg">
          Order Summary
        </Text>

        <Stack gap="md">
          {cartItems.map((item: any) => (
            <Group key={item.id} align="flex-start">
              <div
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: "#000000ff",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={
                    item.merchandise?.product?.featuredImage?.url ||
                    "/placeholder.svg"
                  }
                  alt="Product thumbnail"
                  width={50}
                  height={50}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {item.merchandise?.product?.title || "Product"}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.variant_title || "N/A"}
                </Text>
                <Group justify="space-between" mt={4}>
                  <Text size="xs" c="dimmed">
                    Qty: {item.quantity}
                  </Text>
                  <Text size="sm" fw={500} component="span">
                    <Price
                      amount={(item.unit_price * item.quantity).toString()}
                      currencyCode={
                        cart.region?.currency_code?.toUpperCase() || "USD"
                      }
                      showCurrency={false}
                    />
                  </Text>
                </Group>
              </div>
            </Group>
          ))}
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Subtotal</Text>
            <Text size="sm" component="span">
              <Price
                amount={subtotal.toString()}
                currencyCode={
                  cart.region?.currency_code?.toUpperCase() || "USD"
                }
                showCurrency={false}
              />
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm">Shipping</Text>
            <Text size="sm" component="span">
              <Price
                amount={shipping.toString()}
                currencyCode={
                  cart.region?.currency_code?.toUpperCase() || "USD"
                }
                showCurrency={false}
              />
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm">Tax</Text>
            <Text size="sm" component="span">
              {tax > 0 ? (
                <Price
                  amount={tax.toString()}
                  currencyCode={
                    cart.region?.currency_code?.toUpperCase() || "USD"
                  }
                  showCurrency={false}
                />
              ) : (
                "Included"
              )}
            </Text>
          </Group>

          {discountAmount > 0 && (
            <Group justify="space-between">
              <Group gap="xs">
                <Text size="sm" component="span">
                  Discount
                </Text>
                {discountPercentage && (
                  <Badge size="xs" color="green">
                    {discountPercentage}%
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="green" component="span">
                -
                <Price
                  amount={discountAmount.toString()}
                  currencyCode={
                    cart.region?.currency_code?.toUpperCase() || "USD"
                  }
                  showCurrency={false}
                />
              </Text>
            </Group>
          )}
        </Stack>

        <Divider />

        <Group justify="space-between">
          <Text fw={600} size="lg">
            Total
          </Text>
          <Text fw={600} size="lg" component="span">
            <Price
              amount={total.toString()}
              currencyCode={
                cart.region?.currency_code?.toUpperCase() || "USD"
              }
              showCurrency={false}
            />
          </Text>
        </Group>

        {/* Promo code dropdown */}
        <Button
          variant="subtle"
          mt="sm"
          onClick={() => setPromoOpen((o) => !o)}
        >
          {promoOpen ? "Hide promo code" : "Have a promo code?"}
        </Button>

        <Collapse in={promoOpen}>
          <Stack mt="md" gap="sm">
            <Alert
              icon={<IconGift size={16} />}
              color="blue"
              variant="light"
            >
              You can apply a discount code below.
            </Alert>

            <TextInput
              label="Promo Code"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                
                setPromoError(null);
                setPromoApplied(false);
              }}
              disabled={promoApplied}
              rightSection={
                promoApplied ? (
                  <IconCheck size={16} color="green" />
                        
                ) : null
              }
            />

            {promoError && (
              <Text size="sm" c="red">
                {promoError}
              </Text>
            )}

            {promoApplied && discountLabel && (
              <Alert color="green" variant="light">
                {discountLabel}
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={handleApplyPromo}
              disabled={!promoCode || promoApplied}
              loading={applyingPromo}
            >
              Apply Code
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
