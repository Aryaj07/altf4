"use client"

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
import { GetServerSideProps } from "next";
import { AccountProvider } from "components/account/account-context";
import { sdk } from "@/lib/sdk/sdk";

import ProfileInformation from "components/dashboard/dash-components/get-profileinfo";
import OrderHistory from "components/dashboard/dash-components/get-orderhistory";
import AddressManagement from "components/dashboard/dash-components/get-address";

type DashboardProps = {
  token: string;
};

export  function DashboardClient({ token }: DashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    sdk.store.customer.retrieve()
      .then(({ customer }) => {
        setUser({
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch customer:", err);
      });
  }, []);

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

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <AccountProvider token={token}>
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
    </AccountProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context: any) => {
  const token = context.req.cookies.auth_token || '';
  return {
    props: { token },
  };
};