/* eslint-disable no-debugger */
import {
  Paper,
  Title,
  Stack,
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Collapse,
  Divider,
  Button,
  Alert,
  Modal,
  Image,
} from "@mantine/core";

import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconInfoCircle,
  IconTruck,
  IconMapPin,
  IconPackage,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { sdk } from "@/lib/sdk/sdk";
import Price from "components/price-new";
import { useAccount } from "@/components/account/account-context";

type OrderItem = {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  image: string;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "green";
    case "processing":
      return "yellow";
    case "shipped":
      return "blue";
    default:
      return "gray";
  }
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const { isSdkReady } = useAccount();
  useEffect(() => {
    if (isSdkReady) {
      sdk.store.order
        .list({
          fields:
            "+id,+display_id,+currency_code,+created_at,+fulfillment_status,+status,+total,+item_total,+subtotal,+shipping_total,+tax_total,+items.id,+items.title,+items.variant_title,+items.quantity,+items.unit_price,+items.thumbnail,+shipping_methods.*,+shipping_methods.name,+shipping_address.address_1,+shipping_address.city,+shipping_address.postal_code",
        })
        .then(({ orders }) => {

          const detailedOrders = orders.map((order: any) => ({
            id: order.id,
            display_id: order.display_id,
            currency: order.currency_code?.toUpperCase() || "USD",
            date: new Date(order.created_at).toLocaleDateString(),
            status: order.fulfillment_status || order.status,
            total: order.total ?? 0,
            itemtotal: order.item_total ?? 0,
            items:
              order.items?.map((item: any) => ({
                id: item.id,
                name: item.title,
                variant: item.variant_title || "",
                quantity: item.quantity ?? 0,
                price: item.unit_price ?? 0,
                image:
                  item.thumbnail || "/placeholder.svg?height=60&width=60",
              })) ?? [],
            shipping: {
              method: order.shipping_methods?.[0]?.name || "N/A",
              address: order.shipping_address
                ? `${order.shipping_address.address_1}, ${order.shipping_address.city}, ${order.shipping_address.postal_code}`
                : "N/A",
            },
            subtotal: order.subtotal ?? 0,
            shipping_cost: order.shipping_total ?? 0,
            tax: order.tax_total ?? 0,
          }));
          console.log("Detailed orders:", detailedOrders);
          setOrders(detailedOrders);
        })
        .catch((err) => {
          console.error("Failed to fetch orders:", err);
        });
    }
  }, [isSdkReady]);



  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  return (
    <>
    <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
        <Title order={3}>Order History</Title>
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
                        {order.items.map((item: OrderItem) => (
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
                                amount={order.itemtotal}
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
                        <Text size="md">Tracking: {order.shipping_methods}</Text>
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
            <Text size="sm">Contact us at our email: {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</Text>
            </div>
        </Group>
        </Alert>
    </Paper>



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
                <Text fw={500} component ="span">
                    <Price
                    amount={(item.price * item.quantity).toString()}
                    currencyCode={selectedOrder.currency}
                    showCurrency={false}
                    />
                </Text>
                </Group>
            ))}
            </Stack>
        </div>
        <Divider />
        <Group justify="flex-end" >
            <Button onClick={() => setOrderModalOpen(false)}>Close</Button>
        </Group>
        </Stack>
    )}
    </Modal>
    </>
  );
}