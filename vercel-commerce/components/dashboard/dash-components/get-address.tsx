import {
  Paper,
  Title,
  Button,
  Group,
  Stack,
  Card,
  Text,
  Badge,
  ActionIcon,
  Alert,
  Modal,
  Select,
  TextInput,
  Grid,
  Switch,
} from "@mantine/core";

import { useForm } from "@mantine/form";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconStar,
  IconInfoCircle,
  IconHome,
  IconBuilding,
  IconMapPin,
} from "@tabler/icons-react";

import { useState, useEffect, useCallback  } from "react";
import { customZodResolver } from "lib/resolver";
import { addressSchema, type AddressFormData } from "lib/auth-schema";
import { sdk } from "@/lib/sdk/sdk";
import { useAccount } from "@/components/account/account-context";

const addressTypes = [
  { value: "Home", label: "Home", icon: IconHome },
  { value: "Work", label: "Work", icon: IconBuilding },
  { value: "Other", label: "Other", icon: IconMapPin },
];

export default function AddressManagement() {
  const [addresses, setAddresses] = useState<AddressFormData[]>([]);
  const [countries, setCountries] = useState<{ value: string; label: string }[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressFormData | null>(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const { isSdkReady } = useAccount();

  // Fetch countries independently of cart
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // Get all regions and their countries
        const { regions } = await sdk.store.region.list();
        
        if (regions && regions.length > 0) {
          // Take the first region or find your default region
          const defaultRegion = regions[0]; // or find by specific criteria
          
          if (defaultRegion?.countries) {
            const countryOptions = defaultRegion.countries.map((c: any) => ({
              value: c.iso_2,
              label: c.display_name || c.name || c.iso_2.toUpperCase(),
            }));
            setCountries(countryOptions);
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch countries:", error);
      }
    };

    if (isSdkReady) {
      fetchCountries();
    }
  }, [isSdkReady]);

  // Fetch addresses with proper mapping
  const fetchAddresses = useCallback(async () => {
    try {
      
      const { addresses } = await sdk.store.customer.listAddress();
      
      if (addresses) {
        // Log each raw address before mapping
        addresses.forEach((addr: any) => {
          ({
            id: addr.id,
            metadata: addr.metadata,
            first_name: addr.first_name,
            last_name: addr.last_name,
            company: addr.company,
            address_1: addr.address_1,
            address_2: addr.address_2,
            city: addr.city,
            province: addr.province,
            postal_code: addr.postal_code,
            country_code: addr.country_code,
            country: addr.country,
            phone: addr.phone,
            is_default_shipping: addr.is_default_shipping,
          });
        });
        
        const mappedAddresses = addresses.map((addr: any) => {
          const mapped = {
            id: addr.id || "",
            label: addr.metadata?.label || "",
            firstName: addr.first_name || "",
            lastName: addr.last_name || "",
            company: addr.company || "",
            address: addr.address_1 || "",
            address_2: addr.address_2 || "",
            city: addr.city || "",
            state: addr.province || "",
            postalCode: addr.postal_code || "",
            country: addr.country_code || "",
            phone: addr.phone || "",
            // Read the default status directly from the address object.
            isDefault: !!addr.is_default_shipping,
          };
          
          
          return mapped;
        });
        
        setAddresses(mappedAddresses);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch address data:", err);
      console.error("❌ Error details:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
      });
    }
  }, []);

  // Fetch addresses when SDK is ready
  useEffect(() => {
    if (isSdkReady) {
      fetchAddresses();
    }
  }, [isSdkReady, fetchAddresses]);

  // Debug component state
  useEffect(() => {
  }, [isSdkReady, countries.length, addresses.length]);

  const addressForm = useForm<AddressFormData>({
    validate: customZodResolver(addressSchema),
    initialValues: {
      id: "",
      label: "",
      firstName: "",
      lastName: "",
      company: "",
      address: "",
      address_2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phone: "",
      isDefault: false,
    },
    validateInputOnChange: true,
  });

  const openAddressModal = (address?: any) => {
    if (address) {
      setEditingAddress(address)
      addressForm.setValues(address)
    } else {
      setEditingAddress(null)
      addressForm.reset()
    }
    setAddressModalOpen(true)
  }
  
  // Set default address with proper API calls
  const handleSetDefaultAddress = async (newDefaultAddressId: string) => {
    try {
      const updates: Promise<any>[] = [];
      const currentDefault = addresses.find((addr) => addr.isDefault);

      // Add a check to ensure 'currentDefault.id' exists before using it.
      if (currentDefault && currentDefault.id && currentDefault.id !== newDefaultAddressId) {
        // If there's an existing default address, create an update call to unset it.
        updates.push(
          sdk.store.customer.updateAddress(currentDefault.id, {
            is_default_shipping: false,
          })
        );
      }

      // Create an update call to set the new address as default.
      updates.push(
        sdk.store.customer.updateAddress(newDefaultAddressId, {
          is_default_shipping: true,
        })
      );

      // Run both updates concurrently.
      await Promise.all(updates);
      await fetchAddresses(); // Re-fetch to update the UI.
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };
    
  // Save address (create or update)
  const handleSaveAddress = async (values: AddressFormData) => {
    setAddressSubmitting(true);
    try {
      let addressId = editingAddress?.id;
      // The payload no longer needs the is_default_shipping flag here.
      // We will handle that with the dedicated function.
      const addressPayload = {
        first_name: values.firstName,
        last_name: values.lastName,
        company: values.company,
        address_1: values.address,
        address_2: values.address_2 || "",
        city: values.city,
        province: values.state,
        postal_code: values.postalCode,
        phone: values.phone,
        country_code: values.country,
        metadata: { label: values.label },
      };

      if (editingAddress && addressId) {
        await sdk.store.customer.updateAddress(addressId, addressPayload);
      } else {
        const { customer } = await sdk.store.customer.createAddress(addressPayload);
        const newAddress = customer.addresses[customer.addresses.length - 1];
        if (newAddress) {
          addressId = newAddress.id;
        }
      }

      // If "Set as default" was checked, call our new function.
      if (values.isDefault && addressId) {
        await handleSetDefaultAddress(addressId);
      } else {
        // Otherwise, just refresh the address list.
        await fetchAddresses();
      }

      setAddressModalOpen(false);
      addressForm.reset();
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await sdk.store.customer.deleteAddress(addressId);
        await fetchAddresses();
      } catch (error) {
        console.error("Error deleting address:", error);
      }
    }
  };

  const getAddressIcon = (label: string) => {
    const addressType = addressTypes.find((type) => type.value === label)
    return addressType ? addressType.icon : IconMapPin
  }

  return (
    <>
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Manage Addresses</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={() => openAddressModal()}>
            Add New Address
          </Button>
        </Group>
        <Stack>
          {addresses.map((address) => {
            const AddressIcon = getAddressIcon(address.label)
            return (
              <Card key={address.id} padding="md" radius="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start">
                    <AddressIcon size={24} color="var(--mantine-color-blue-6)" />
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={500}>{address.label}</Text>
                        {address.isDefault && (
                          <Badge leftSection={<IconStar size={12} />} color="yellow" size="sm">
                            Default
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" fw={500}>
                        {address.firstName} {address.lastName}
                      </Text>
                      {address.company && (
                        <Text size="sm" c="dimmed">
                          {address.company}
                        </Text>
                      )}
                      <Text size="sm" c="dimmed">
                        {address.address}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {address.city}, {address.state} {address.postalCode}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {address.country}
                      </Text>
                      {address.phone && (
                        <Text size="sm" c="dimmed">
                          Phone: {address.phone}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Group gap="xs">
                    {!address.isDefault && address.id && (
                      <Button variant="subtle" size="xs" onClick={() => handleSetDefaultAddress(address.id!)}>
                        Set as Default
                      </Button>
                    )}
                    <ActionIcon variant="outline" size="sm" onClick={() => openAddressModal(address)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    {address.id && (
                      <ActionIcon
                        variant="outline"
                        size="sm"
                        color="red"
                        onClick={() => handleDeleteAddress(address.id!)}
                        disabled={address.isDefault}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              </Card>
            )
          })}
          {addresses.length === 0 && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={500} size="sm">
                    No addresses found
                  </Text>
                  <Text size="sm">Add your first address to get started with faster checkout</Text>
                </div>
                <Button size="sm" onClick={() => openAddressModal()}>
                  Add Address
                </Button>
              </Group>
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Address Modal */}
      <Modal
        opened={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={editingAddress ? "Edit Address" : "Add New Address"}
        size="lg"
        centered
      >
        <form onSubmit={addressForm.onSubmit(handleSaveAddress)}>
          <Stack>
            <Select
              label="Address Type"
              placeholder="Select address type"
              data={addressTypes.map((type) => ({ value: type.value, label: type.label }))}
              required
              {...addressForm.getInputProps("label")}
            />
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="First Name"
                  placeholder="Enter first name"
                  required
                  {...addressForm.getInputProps("firstName")}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                  {...addressForm.getInputProps("lastName")}
                />
              </Grid.Col>
            </Grid>
            <TextInput
              label="Company (Optional)"
              placeholder="Enter company name"
              {...addressForm.getInputProps("company")}
            />
            <TextInput
              label="Address Line 1"
              placeholder="Enter street address"
              required
              {...addressForm.getInputProps("address")}
            />
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="City" placeholder="Enter city" required {...addressForm.getInputProps("city")} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="State/Province" placeholder="Enter state" {...addressForm.getInputProps("state")} />
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Postal Code"
                  placeholder="Enter postal code"
                  required
                  {...addressForm.getInputProps("postalCode")}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Country"
                  placeholder="Select country"
                  data={countries}
                  required
                  searchable
                  {...addressForm.getInputProps("country")}
                />
              </Grid.Col>
            </Grid>
            <TextInput
              label="Phone Number (Optional)"
              placeholder="Enter phone number"
              {...addressForm.getInputProps("phone")}
            />
            <Switch
              label="Set as default address"
              description="Use this address as your default shipping address"
              {...addressForm.getInputProps("isDefault", { type: "checkbox" })}
            />
            <Group justify="space-between" mt="md">
              <Button variant="outline" onClick={() => setAddressModalOpen(false)}>
                Cancel
              </Button>
              
              <Button type="submit" loading={addressSubmitting} disabled={!addressForm.isValid()}>
                {editingAddress ? "Update Address" : "Add Address"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}