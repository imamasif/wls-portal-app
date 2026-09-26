import React from "react";
import {
  AppShell,
  Group,
  Title,
  Text,
  Menu,
  Avatar,
  Badge,
  ActionIcon,
  UnstyledButton,
  Indicator,
  Divider,
  Box,
} from "@mantine/core";
import { IconBell, IconPencil, IconLogout } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";

// Corrected import paths using single "../" from src/components/
import { SuperUserMenu } from "../features/menu/components/drop-main-menu/SuperUserMenu";
import { WlsAdminMenu } from "../features/menu/components/drop-main-menu/WlsAdminMenu";
import { UserMenu } from "../features/menu/components/drop-main-menu/UserMenu";

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const activeRole = (user?.role || "").toUpperCase();

  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  if (!user) {
    return <Box p="md">{children}</Box>;
  }

  return (
    <AppShell header={{ height: 110 }} footer={{ height: 60 }} padding="md">
      <AppShell.Header
        p="xs"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Group justify="space-between" align="center" px="md">
          <Group gap="sm">
            <img src="/iipc-logo.png" alt="IIPC Logo" style={{ height: 40 }} />
            <Box>
              <Title order={4} lh={1.2}>
                IIPC Learning Portal
              </Title>
              <Text size="xs" c="dimmed">
                Weekly Learning Sessions
              </Text>
            </Box>
          </Group>

          <Group gap="md">
            <Indicator label="3" size={16} color="red">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => setActiveTab("notifications")}
              >
                <IconBell size={20} />
              </ActionIcon>
            </Indicator>

            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <UnstyledButton
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Badge
                    color={
                      isSuperAdmin ? "violet" : isWlsAdmin ? "indigo" : "blue"
                    }
                    variant="light"
                  >
                    {user?.role || UserRole.USER}
                  </Badge>
                  <Avatar
                    src={user?.profilePictureUrl}
                    radius="xl"
                    color="teal"
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Box p="xs">
                  <Text size="sm" fw={500}>
                    {user.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user.email}
                  </Text>
                </Box>
                <Divider my="xs" />
                <Menu.Item
                  leftSection={<IconPencil size={16} />}
                  onClick={() => setActiveTab("edit-profile")}
                >
                  Edit Profile
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={logout}
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Box
          style={{
            borderTop: "1px solid var(--mantine-color-gray-2)",
            paddingTop: "6px",
          }}
        >
          {isSuperAdmin ? (
            <SuperUserMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          ) : isWlsAdmin ? (
            <WlsAdminMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          ) : (
            <UserMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </Box>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Footer p="sm" style={{ textAlign: "center" }}>
        <Text size="xs" c="dimmed">
          &copy; {new Date().getFullYear()} IIPC Learning Portal. All rights
          reserved.
        </Text>
      </AppShell.Footer>
    </AppShell>
  );
}

export default MainLayout;
