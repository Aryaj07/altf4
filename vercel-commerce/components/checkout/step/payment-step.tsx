"use client";

import { useEffect, useState } from "react";
import { useCart } from "components/cart/cart-context";
import {
  Button,
  Stack,
  Card,
  Group,
  Text,
  Radio,
  Alert,
} from "@mantine/core";
import { IconCreditCard, IconCash, IconInfoCircle } from "@tabler/icons-react";
import Image from "next/image";

  function getProviderDisplayName(provider: { id: string; name?: string }) {
    if (provider.name) return provider.name;
    const id = provider.id.toLowerCase();
    if (id.includes("razorpay")) return "Razorpay";
    if (id.includes("system_default") || id.includes("cod")) return "Cash on Delivery";
    // Add more mappings as needed
    return provider.id;
  }

export default function PaymentStep({
  onComplete,
  disabled,
}: {
  onComplete: () => void;
  disabled?: boolean;
}) {
  const {
    cart,
    paymentProviderId,
    setPaymentProviderId,
    paymentStepLocked,
    setPaymentStepLocked,
  } = useCart();

  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line unicorn/no-null
  const [error, setError] = useState<string | null>(null);
  
  const [success, setSuccess] = useState(false);
  const [savedProvider, setSavedProvider] = useState<{
    id: string;
    is_enabled: boolean;
    name?: string;
    description?: string;
    // eslint-disable-next-line unicorn/no-null
  } | null>(null);

  // Fetch providers
  useEffect(() => {
    if (!cart?.region_id) return;

    setLoadingProviders(true);
    fetch(`/api/cart/retrieve-payment_provider?region_id=${cart.region_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.payment_providers) {
          setProviders(data.payment_providers);

          const existing = cart?.payment_collection?.payment_sessions?.[0]?.provider_id;
          if (existing) {
            setPaymentProviderId?.(existing);
            const provider = data.payment_providers.find((p: any) => p.id === existing);
            if (provider) {
              setSavedProvider({
                id: provider.id,
                is_enabled: provider.is_enabled,
                name: provider.name,
                description: provider.description,
              });
            }
            setPaymentStepLocked?.(true);
          }
        } else {
          setError(data.error || "Unknown error");
        }
      })
      .catch((Error_) => {
        console.error(Error_);
        setError("Network error");
      })
      .finally(() => setLoadingProviders(false));
  }, [
    cart?.region_id,
    setPaymentProviderId,
    setPaymentStepLocked,
    cart?.payment_collection?.payment_sessions,
  ]);

  // Restore from sessionStorage if locked
  useEffect(() => {
    const lockedFromStorage =
      sessionStorage.getItem("paymentStepLocked") === "true";
    const storedProviderId =
      sessionStorage.getItem("selectedPaymentProviderId");

    if (lockedFromStorage && storedProviderId && providers.length > 0) {
      const provider = providers.find((p) => p.id === storedProviderId);
      if (provider) {
        setSavedProvider({
          id: provider.id,
          is_enabled: provider.is_enabled,
          name: provider.name,
          description: provider.description,
        });
        setPaymentProviderId?.(storedProviderId);
        setPaymentStepLocked?.(true);
      }
    }
  }, [providers, setPaymentProviderId, setPaymentStepLocked]);

  // Keep sessionStorage in sync
  useEffect(() => {
    if (paymentProviderId) {
      sessionStorage.setItem("selectedPaymentProviderId", paymentProviderId);
    }
  }, [paymentProviderId]);

  
  const handleSelectProvider = async () => {
    if (!cart || !paymentProviderId) {
      setError("Please select a payment provider.");
      return;
    }

    setSubmitting(true);
    try {
      const selected = providers.find((p: any) => p.id === paymentProviderId);
      if (selected) {
        setSavedProvider({
          id: selected.id,
          is_enabled: selected.is_enabled,
          name: selected.name,
          description: selected.description,
        });
      }

      setPaymentStepLocked?.(true);
      setSuccess(true);
      onComplete();
    } catch (Error_) {
      console.error(Error_);
      setError("Unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setPaymentStepLocked?.(false);
    setSuccess(false);
    sessionStorage.removeItem("paymentStepLocked");
  };

  const getProviderIcon = (providerId: string) => {
    if (providerId === "pp_razorpay_razorpay") {
      return (
        <Image
          src="/static/razorpay.png"
          alt="Razorpay"
          width={80}
          height={20}
          className="h-5 w-auto"
        />
      );
    }
    if (providerId === "pp_system_default" || providerId === "cod") return <IconCash size={24} />;
    return <IconCreditCard size={24} />;
  };

  if (disabled) {
    return (
      <Stack>
        <Text c="dimmed" ta="center">
          Please complete all previous steps to select a payment method.
        </Text>
      </Stack>
    );
  }
  // Add this function at the top of your file (outside the component)
  

  return (
    <Stack>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Select your preferred payment method.
      </Alert>

      {paymentStepLocked && savedProvider ? (
        <>
          <Card withBorder radius="md" padding="md" mb="md">
            <Group justify="space-between" align="center">
              <Group>
                {getProviderIcon(savedProvider.id)}
                <div>
                  <Text fw={500}>{getProviderDisplayName(savedProvider)}</Text>
                  {savedProvider.description && (
                    <Text size="sm" c="dimmed">
                      {savedProvider.description}
                    </Text>
                  )}
                </div>
              </Group>
            </Group>
          </Card>

          <Button
            variant="subtle"
            color="blue"
            className="ml-auto"
            onClick={handleEdit}
          >
            Edit
          </Button>
        </>
      ) : (
        <>
          <Radio.Group
            value={paymentProviderId}
            onChange={(value) => setPaymentProviderId?.(value)}
          >
            <Stack gap="sm">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    borderColor:
                      paymentProviderId === provider.id
                        ? "var(--mantine-color-blue-6)"
                        : undefined,
                    backgroundColor:
                      paymentProviderId === provider.id
                        ? "var(--mantine-color-dark-6)"
                        : undefined,
                  }}
                  onClick={() => setPaymentProviderId?.(provider.id)}
                >
                  <Group justify="space-between" align="center">
                    <Group>
                      {provider.id === "pp_razorpay_razorpay" ? (
                      <>
                          <IconCreditCard size={24} style={{ marginRight: 8 }} />
                          {getProviderIcon(provider.id)}
                      </>
                      ) : (
                        // For others, just show the provider icon
                        getProviderIcon(provider.id)
                      )}
                      <div>
                        <Text fw={500}>{provider.id === "pp_razorpay_razorpay"
                        ? undefined
                        : getProviderDisplayName(provider)}</Text>
                        {provider.description && (
                          <Text size="sm" c="dimmed">
                            {provider.description}
                          </Text>
                        )}
                      </div>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Radio.Group>

          <Button
            size="md"
            onClick={handleSelectProvider}
            loading={submitting}
            disabled={!paymentProviderId}
          >
            Review Order
          </Button>
        </>
      )}

      {error && <div className="text-red-600 mt-2">{error}</div>}
    </Stack>
  );
}
