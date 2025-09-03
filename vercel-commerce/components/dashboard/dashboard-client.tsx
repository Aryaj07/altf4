"use client";

import {
  Container,
  Title,
  Text,
  Group,
  Grid,
  Card,
  Avatar,
  Tabs,
  Button,
  Stack,
  Alert,
  Paper,
} from "@mantine/core";
import {
  IconUser,
  IconShoppingBag,
  IconMapPin,
  IconSettings,
  IconLogout,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// 1. Import the useAccount hook to access the context
import { useAccount } from "components/account/account-context";

import ProfileInformation from "components/dashboard/dash-components/get-profileinfo";
import OrderHistory from "components/dashboard/dash-components/get-orderhistory";
import AddressManagement from "components/dashboard/dash-components/get-address";

// 2. The component no longer needs props, so DashboardProps is removed.
export function DashboardClient() {
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // NEW
  const router = useRouter();
  // 3. Get the isSdkReady state from the account context.
  const { isSdkReady } = useAccount();

  // 4. The useEffect hook now depends on isSdkReady instead of a token prop.
  useEffect(() => {
    // If the SDK isn't ready (e.g., no token), don't fetch data.
    if (!isSdkReady) {
      setIsClient(true); // Still set isClient to true to prevent hydration errors.
      setIsLoading(false); // NEW
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!mounted) return;
        if (!res.ok) {
          if (res.status === 401) {
            document.cookie = "auth_token=; Max-Age=0; path=/";
            router.push("/login");
            return;
          }
          console.error("Failed to fetch /api/me:", res.status);
          setUser(null);
          setIsLoading(false); // NEW
          return;
        }

        const data = await res.json();
        const customer = data?.customer || data;
        if (customer) {
          setUser({
            firstName: customer.first_name || "",
            lastName: customer.last_name || "",
            email: customer.email || "",
            phone: customer.phone || "",
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch customer:", err);
        setUser(null);
      } finally {
        if (mounted) {
          setIsClient(true);
          setIsLoading(false); // NEW
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSdkReady, router]); // Dependency is now isSdkReady

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      // ignore error, just redirect
    } finally {
      router.push("/login");
    }
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  if (!isClient || isLoading) return null; // Prevent hydration mismatch
  if (!user) return null; // Or render a message indicating no user is logged in

  // 5. The AccountProvider wrapper is removed from here. It will be added in the parent page component.
  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Welcome back, {user?.firstName}!</Text>
        </div>
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
              {user && <ProfileInformation user={user} onUpdate={handleUserUpdate} />}
            </Tabs.Panel>

            <Tabs.Panel value="orders" pt="md">
              <OrderHistory />
            </Tabs.Panel>

            <Tabs.Panel value="addresses" pt="md">
              <AddressManagement />
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
                  <Button variant="outline" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
                    Logout
                  </Button>
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

// 6. The getServerSideProps function is no longer needed and should be deleted.