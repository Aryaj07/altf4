"use client"

import {
  Container,
  Paper,
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Grid,
  Card,
  Text,
  Badge,
  Tabs,
  Alert,
  Avatar,
  ActionIcon,
  Select,
  Modal,
  Divider,
  Collapse,
  Textarea,
  Switch,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { customZodResolver } from "../../lib/resolver"
import { profileSchema, addressSchema, type ProfileFormData, type AddressFormData } from "../../lib/auth-schema"
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconSettings,
  IconShoppingBag,
  IconLogout,
  IconEdit,
  IconCheck,
  IconInfoCircle,
  IconEye,
  IconTruck,
  IconPackage,
  IconHeadphones,
  IconChevronDown,
  IconChevronUp,
  IconMessageCircle,
  IconPlus,
  IconTrash,
  IconHome,
  IconBuilding,
  IconStar,
} from "@tabler/icons-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { sdk } from "lib/sdk"
import Price from "components/price-new"
import { useRouter } from "next/navigation"

const countries = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "India", label: "India" },
  { value: "Australia", label: "Australia" },
]

const addressTypes = [
  { value: "Home", label: "Home", icon: IconHome },
  { value: "Work", label: "Work", icon: IconBuilding },
  { value: "Other", label: "Other", icon: IconMapPin },
]

// Mock addresses data
const mockAddresses = [
  {
    id: "addr_1",
    label: "Home",
    firstName: "John",
    lastName: "Doe",
    company: "",
    address: "123 Main Street",
    address2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
    isDefault: true,
  },
  {
    id: "addr_2",
    label: "Work",
    firstName: "John",
    lastName: "Doe",
    company: "Tech Corp Inc.",
    address: "456 Business Ave",
    address2: "Suite 200",
    city: "New York",
    state: "NY",
    postalCode: "10002",
    country: "United States",
    phone: "+1 (555) 987-6543",
    isDefault: false,
  },
]

export default function DashboardPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<string[]>([])
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    orderId: "",
  })
  const [contactSubmitting, setContactSubmitting] = useState(false)

  // Address management state
  const [addresses, setAddresses] = useState(mockAddresses)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressFormData | null>(null)
  const [addressSubmitting, setAddressSubmitting] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter();

  useEffect(() => {
    sdk.store.order.list()
      .then(async ({ orders }) => {
        const detailedOrders = await Promise.all(
          orders.map(async (orderSummary: any) => {
            const { order } = await sdk.store.order.retrieve(orderSummary.id)
            return {
              id: order.id,
              display_id: order.display_id,
              currency: order.currency_code?.toUpperCase() || "USD",
              date: new Date(order.created_at).toLocaleDateString(),
              status: order.fulfillment_status || order.status,
              total: (order.total ?? 0),
              itemtotal: order.item_total,
              items: order.items?.map((item: any) => ({
                id: item.id,
                name: item.title,
                variant: item.variant_title || "",
                quantity: item.quantity ?? 0,
                price: (item.unit_price ?? 0),
                image: item.thumbnail || "/placeholder.svg?height=60&width=60",
              })) ?? [],
              shipping: {
                method: order.shipping_methods?.[0]?.name || "N/A",
                address: order.shipping_address
                  ? `${order.shipping_address.address_1}, ${order.shipping_address.city}, ${order.shipping_address.postal_code}`
                  : "N/A",
                trackingNumber: order.shipping_methods?.[0]?.tracking_numbers?.[0] || "",
              },
              subtotal: (order.subtotal ?? 0),
              shipping_cost: (order.shipping_total ?? 0),
              tax: (order.tax_total ?? 0),
            }
          })
        )
        setOrders(detailedOrders)
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err)
      })
  }, [])

  useEffect(() => {
    sdk.store.customer.retrieve()
      .then(({ customer }) => {
        setUser({
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        })
      })
      .catch((err) => {
        console.error("Failed to fetch customer:", err)
      })
  }, [])

  const form = useForm<ProfileFormData>({
    validate: customZodResolver(profileSchema),
    initialValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
    validateInputOnChange: true,
  })

  const addressForm = useForm<AddressFormData>({
    validate: customZodResolver(addressSchema),
    initialValues: {
      id: "",
      label: "",
      firstName: "",
      lastName: "",
      company: "",
      address: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phone: "",
      isDefault: false,
    },
    validateInputOnChange: true,
  })

  const handleSaveProfile = async (values: ProfileFormData) => {
    setIsLoading(true)
    setSuccess(false)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Error updating profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      // ignore error, just redirect
    } finally {
      router.push("/login");
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "green"
      case "processing":
        return "yellow"
      case "shipped":
        return "blue"
      default:
        return "gray"
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  const handleContactSubmit = async () => {
    setContactSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert("Your message has been sent! We'll get back to you within 24 hours.")
      setContactForm({ subject: "", message: "", orderId: "" })
      setContactModalOpen(false)
    } catch (error) {
      console.error("Error submitting contact form:", error)
    } finally {
      setContactSubmitting(false)
    }
  }

  const openContactModal = (orderId?: string) => {
    setContactForm((prev) => ({ ...prev, orderId: orderId || "" }))
    setContactModalOpen(true)
  }

  // Address management functions
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

  const handleSaveAddress = async (values: AddressFormData) => {
    setAddressSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (editingAddress) {
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingAddress.id ? { ...values, id: addr.id } : addr))
        )
      } else {
        const newAddress = { ...values, id: `addr_${Date.now()}` }
        setAddresses((prev) => [...prev, newAddress])
      }
      if (values.isDefault) {
        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: addr.id === (editingAddress?.id || `addr_${Date.now()}`),
          }))
        )
      }
      setAddressModalOpen(false)
      setEditingAddress(null)
      addressForm.reset()
    } catch (error) {
      console.error("Error saving address:", error)
    } finally {
      setAddressSubmitting(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
      } catch (error) {
        console.error("Error deleting address:", error)
      }
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setAddresses((prev) => prev.map((addr) => ({ ...addr, isDefault: addr.id === addressId })))
    } catch (error) {
      console.error("Error setting default address:", error)
    }
  }

  const getAddressIcon = (label: string) => {
    const addressType = addressTypes.find((type) => type.value === label)
    return addressType ? addressType.icon : IconMapPin
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setOrderModalOpen(true)
  }

  return (
    <>
      <Container size="xl" py="xl">
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1}>Dashboard</Title>
            <Text c="dimmed">Welcome back, {user?.firstName}!</Text>
          </div>
          <Button variant="outline" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
            Logout
          </Button>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack align="center">
                <Avatar size={80} radius="xl">
                  {user?.firstName?.[0] || ""}
                  {user?.lastName?.[0] || ""}
                </Avatar>
                <div style={{ textAlign: "center" }}>
                  <Text fw={500} size="lg">
                    {user?.firstName || ""} {user?.lastName || ""}
                  </Text>
                </div>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Tabs defaultValue="profile">
              <Tabs.List>
                <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
                  Profile
                </Tabs.Tab>
                <Tabs.Tab value="orders" leftSection={<IconShoppingBag size={16} />}>
                  Orders
                </Tabs.Tab>
                <Tabs.Tab value="addresses" leftSection={<IconMapPin size={16} />}>
                  Manage Address
                </Tabs.Tab>
                <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                  Settings
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="profile" pt="md">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Profile Information</Title>
                    <ActionIcon variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Group>
                  {success && (
                    <Alert icon={<IconCheck size={16} />} color="green" variant="light" mb="md">
                      Profile updated successfully!
                    </Alert>
                  )}
                  <form onSubmit={form.onSubmit(handleSaveProfile)}>
                    <Stack>
                      <Grid>
                        <Grid.Col span={6}>
                          <TextInput
                            label="First Name"
                            leftSection={<IconUser size={16} />}
                            required
                            disabled={!isEditing}
                            {...form.getInputProps("firstName")}
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <TextInput
                            label="Last Name"
                            leftSection={<IconUser size={16} />}
                            required
                            disabled={!isEditing}
                            {...form.getInputProps("lastName")}
                          />
                        </Grid.Col>
                      </Grid>
                      <TextInput
                        label="Email Address"
                        leftSection={<IconMail size={16} />}
                        required
                        disabled={!isEditing}
                        {...form.getInputProps("email")}
                      />
                      <TextInput
                        label="Phone Number"
                        leftSection={<IconPhone size={16} />}
                        required
                        disabled={!isEditing}
                        {...form.getInputProps("phone")}
                      />
                      {isEditing && (
                        <Group justify="flex-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false)
                              form.reset()
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" loading={isLoading} disabled={!form.isValid()}>
                            Save Changes
                          </Button>
                        </Group>
                      )}
                    </Stack>
                  </form>
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="orders" pt="md">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Order History</Title>
                    <Button
                      variant="outline"
                      size="sm"
                      leftSection={<IconHeadphones size={16} />}
                      onClick={() => openContactModal()}
                    >
                      Need Help?
                    </Button>
                  </Group>
                  <Stack>
                    {orders.map((order) => (
                      <Card key={order.id} padding="md" radius="md" withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <div>
                              <Group gap="xs" mb="xs">
                                <Text fw={500}>Order {order.display_id}</Text>
                                <Badge color={getStatusColor(order.status)} size="sm">
                                  {order.status}
                                </Badge>
                              </Group>
                              <Text size="sm" c="dimmed">
                                {order.date} • {order.items.length} items
                              </Text>
                            </div>
                            <Group gap="xs">
                              <Text fw={500} size="lg" component="span">
                                <Price
                                  amount={order.total}
                                  currencyCode={order.currency}
                                  showCurrency={false}
                                />
                              </Text>
                              <ActionIcon variant="outline" size="sm" onClick={() => toggleOrderExpansion(order.id)}>
                                {expandedOrders.includes(order.id) ? (
                                  <IconChevronUp size={16} />
                                ) : (
                                  <IconChevronDown size={16} />
                                )}
                              </ActionIcon>
                            </Group>
                          </Group>
                          <Collapse in={expandedOrders.includes(order.id)}>
                            <Divider mb="md" />
                            <Stack gap="md">
                              <div>
                                <Text fw={500} size="sm" mb="xs">
                                  Items Ordered:
                                </Text>
                                <Stack gap="xs">
                                  {order.items.map((item) => (
                                    <Group key={item.id} gap="sm">
                                      <Image
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.name}
                                        width={40}
                                        height={40}
                                        style={{ borderRadius: 4 }}
                                      />
                                      <div style={{ flex: 1 }}>
                                        <Text size="sm" fw={500}>
                                          {item.name}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                          {item.variant} • Qty: {item.quantity}
                                        </Text>
                                      </div>
                                      <Text fw={500} size="lg" component="span">
                                        <Price
                                          amount={item.price * item.quantity}
                                          currencyCode={order.currency}
                                          showCurrency={false}
                                        />
                                      </Text>
                                    </Group>
                                  ))}
                                </Stack>
                              </div>
                              <div>
                                <Text fw={500} size="md" mb="xs">
                                  Shipping Details:
                                </Text>
                                <Group gap="xs" mb="xs">
                                  <IconTruck size={16} />
                                  <Text size="md">{order.shipping.method}</Text>
                                </Group>
                                <Group gap="xs" mb="xs">
                                  <IconMapPin size={16} />
                                  <Text size="md">{order.shipping.address}</Text>
                                </Group>
                                {order.shipping.trackingNumber && (
                                  <Group gap="xs">
                                    <IconPackage size={16} />
                                    <Text size="md">Tracking: {order.shipping.trackingNumber}</Text>
                                  </Group>
                                )}
                              </div>
                              <div>
                                <Text fw={500} size="md" mb="xs">
                                  Order Summary:
                                </Text>
                                <Stack gap={4}>
                                  <Group justify="space-between">
                                    <Text size="md">Subtotal:</Text>
                                    <Text fw={500} size="lg" component="span">
                                      <Price amount={order.subtotal ?? 0} currencyCode={order.currency} showCurrency={false} />
                                    </Text>
                                  </Group>
                                  <Group justify="space-between">
                                    <Text size="md">Shipping:</Text>
                                    <Text fw={500} size="lg" component="span">
                                      <Price amount={order.shipping_cost ?? 0} currencyCode={order.currency} showCurrency={false} />
                                    </Text>
                                  </Group>
                                  <Group justify="space-between">
                                    <Text size="md">Tax:</Text>
                                    <Text fw={500} size="lg" component="span">
                                      <Price amount={order.tax ?? 0} currencyCode={order.currency} showCurrency={false} />
                                    </Text>
                                  </Group>
                                  <Divider />
                                  <Group justify="space-between">
                                    <Text fw={500}>Total:</Text>
                                    <Text fw={500} size="lg" component="span">
                                      <Price amount={order.total ?? 0} currencyCode={order.currency} showCurrency={false} />
                                    </Text>
                                  </Group>
                                </Stack>
                              </div>
                              <Group gap="xs">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => handleViewOrder(order)}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftSection={<IconMessageCircle size={14} />}
                                  onClick={() => openContactModal(order.id)}
                                >
                                  Report Issue
                                </Button>
                              </Group>
                            </Stack>
                          </Collapse>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                  <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="md">
                    <Group justify="space-between" align="center">
                      <div>
                        <Text fw={500} size="sm">
                          Having issues with your order?
                        </Text>
                        <Text size="sm">Our support team is here to help you 24/7</Text>
                      </div>
                      <Button size="sm" onClick={() => openContactModal()}>
                        Contact Us
                      </Button>
                    </Group>
                  </Alert>
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="addresses" pt="md">
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
                                  {address.address2 && `, ${address.address2}`}
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
                              {!address.isDefault && (
                                <Button variant="subtle" size="xs" onClick={() => handleSetDefaultAddress(address.id)}>
                                  Set as Default
                                </Button>
                              )}
                              <ActionIcon variant="outline" size="sm" onClick={() => openAddressModal(address)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="outline"
                                size="sm"
                                color="red"
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={address.isDefault}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
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
              </Tabs.Panel>

              <Tabs.Panel value="settings" pt="md">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Title order={3} mb="md">
                    Account Settings
                  </Title>
                  <Stack>
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                      Additional settings and preferences will be available here.
                    </Alert>
                    <Button variant="outline" color="red">
                      Delete Account
                    </Button>
                  </Stack>
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Order Details Modal */}
      <Modal
        opened={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={`Order Details - ${selectedOrder?.display_id}`}
        size="lg"
        centered
      >
        {selectedOrder && (
          <Stack>
            <Group justify="space-between">
              <Badge color={getStatusColor(selectedOrder.status)} size="lg">
                {selectedOrder.status}
              </Badge>
              <Text c="dimmed">Ordered on {selectedOrder.date}</Text>
            </Group>
            <Divider />
            <div>
              <Text fw={500} mb="md">
                Items ({selectedOrder.items.length})
              </Text>
              <Stack gap="md">
                {selectedOrder.items.map((item: any) => (
                  <Group key={item.id} gap="md">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={60}
                      height={60}
                      style={{ borderRadius: 8 }}
                    />
                    <div style={{ flex: 1 }}>
                      <Text fw={500}>{item.name}</Text>
                      <Text size="sm" c="dimmed">
                        {item.variant}
                      </Text>
                      <Text size="sm">Quantity: {item.quantity}</Text>
                    </div>
                    <Text fw={500}>
                      <Price
                        amount={item.item_total}
                        currencyCode={selectedOrder.currency}
                        showCurrency={false}
                      />
                    </Text>
                  </Group>
                ))}
              </Stack>
            </div>
            <Divider />
            <Group justify="space-between">
              <Button variant="outline" onClick={() => openContactModal(selectedOrder.id)}>
                Report Issue
              </Button>
              <Button onClick={() => setOrderModalOpen(false)}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Contact Support Modal */}
      <Modal
        opened={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Contact Support"
        size="md"
        centered
      >
        <Stack>
          <Alert icon={<IconHeadphones size={16} />} color="blue" variant="light">
            Our support team typically responds within 24 hours. Please provide as much detail as possible.
          </Alert>
          {contactForm.orderId && (
            <TextInput
              label="Order ID"
              value={contactForm.orderId}
              disabled
              leftSection={<IconShoppingBag size={16} />}
            />
          )}
          <Select
            label="Subject"
            placeholder="Select a topic"
            data={[
              "Order Issue",
              "Shipping Problem",
              "Product Quality",
              "Refund Request",
              "Account Issue",
              "Other",
            ]}
            value={contactForm.subject}
            onChange={(value) => setContactForm((prev) => ({ ...prev, subject: value || "" }))}
            required
          />
          <Textarea
            label="Message"
            placeholder="Please describe your issue in detail..."
            minRows={4}
            value={contactForm.message}
            onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
            required
          />
          <Group justify="space-between">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleContactSubmit}
              loading={contactSubmitting}
              disabled={!contactForm.subject || !contactForm.message}
            >
              Send Message
            </Button>
          </Group>
        </Stack>
      </Modal>

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
            <TextInput
              label="Address Line 2 (Optional)"
              placeholder="Apartment, suite, etc."
              {...addressForm.getInputProps("address2")}
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
  )
}