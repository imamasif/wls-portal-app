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
  Button,
  UnstyledButton,
  Indicator,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconLayoutDashboard,
  IconSchool,
  IconTools,
  IconClipboardCheck,
  IconChartBar,
  IconUsers,
  IconChevronDown,
  IconBell,
  IconPencil,
  IconLogout,
  IconVideo,
  IconBrandWhatsapp,
  IconBrandTeams,
  IconBuildingBank,
  IconUserCheck,
  IconShieldLock,
  IconHistory,
  IconShieldCheck,
  IconListDetails,
} from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/user";

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const activeRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  // Active state trackers for top-level navigation dropdown highlights
  const isWlsActive = [
    "wls-session",
    "wls-mgmt",
    "assessment",
    "reports",
    "wls-assignment",
    "quiz-studio",
    "quiz-reports",
    "quiz-list",
    "quiz-student",
    "university-portal",
    "wls_admin",
    "student_course",
  ].includes(activeTab);
  const isUserMgmtActive = ["users", "roles-control", "user-activity"].includes(
    activeTab,
  );
  const isGroupMgmtActive = [
    "whatsapp-groups",
    "teams-groups",
    "university-portal",
    "menu-permissions",
  ].includes(activeTab);

  // ==========================================
  // SECTION 1: LOGGED-OUT LAYOUT (Authentication View)
  // ==========================================
  if (!user) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8fafc",
        }}
      >
        <Box
          component="header"
          px="md"
          h={70}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--mantine-color-gray-2)",
            backgroundColor: "#ffffff",
          }}
        >
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
          <Button
            variant="filled"
            color="teal"
            onClick={() => setActiveTab("login")}
            style={{
              fontWeight: 600,
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            Sign In
          </Button>
        </Box>

        <Box
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            width: "100%",
          }}
        >
          <Box style={{ width: "100%", maxWidth: "1100px" }}>{children}</Box>
        </Box>

        <Box
          component="footer"
          p="sm"
          style={{
            textAlign: "center",
            borderTop: "1px solid var(--mantine-color-gray-2)",
            backgroundColor: "#ffffff",
          }}
        >
          <Text size="xs" c="dimmed">
            &copy; {new Date().getFullYear()} IIPC Learning Portal. All rights
            reserved.
          </Text>
        </Box>
      </Box>
    );
  }

  // ==========================================
  // SECTION 2: LOGGED-IN APP SHELL LAYOUT
  // ==========================================
  return (
    <AppShell header={{ height: 110 }} footer={{ height: 60 }} padding="md">
      {/* HEADER SECTION */}
      <AppShell.Header
        p="xs"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top Header Row */}
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
            <Indicator label="3" size={16} color="red" offset={2}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => setActiveTab("notifications")}
                aria-label="Notifications"
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
                    alt={user?.name}
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
                  leftSection={<IconBell size={16} />}
                  onClick={() => setActiveTab("notifications")}
                  rightSection={
                    <Badge size="xs" color="red">
                      3
                    </Badge>
                  }
                >
                  Notifications
                </Menu.Item>
                <Divider my="xs" />
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

        {/* NAVIGATION TABS BAR */}
        <Group
          gap="xs"
          px="md"
          pt="xs"
          style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Button
            variant={activeTab === "dashboard" ? "filled" : "subtle"}
            color="teal"
            leftSection={<IconLayoutDashboard size={18} />}
            onClick={() => setActiveTab("dashboard")}
            size="xs"
          >
            Dashboard
          </Button>

          {/* User Management Dropdown (Super Admin Only) */}
          {isSuperAdmin && (
            <Menu
              shadow="md"
              width={240}
              trigger="hover"
              openDelay={100}
              closeDelay={150}
            >
              <Menu.Target>
                <Button
                  variant={isUserMgmtActive ? "filled" : "subtle"}
                  color="cyan"
                  leftSection={<IconUsers size={18} />}
                  rightSection={<IconChevronDown size={14} />}
                  size="xs"
                >
                  User Management
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>User Controls</Menu.Label>
                <Menu.Item
                  leftSection={
                    <IconUserCheck
                      size={16}
                      color="var(--mantine-color-cyan-6)"
                    />
                  }
                  onClick={() => setActiveTab("users")}
                >
                  User Directory
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconShieldLock
                      size={16}
                      color="var(--mantine-color-grape-6)"
                    />
                  }
                  onClick={() => setActiveTab("roles-control")}
                >
                  Role & Access Control
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconHistory
                      size={16}
                      color="var(--mantine-color-orange-6)"
                    />
                  }
                  onClick={() => setActiveTab("user-activity")}
                >
                  User Activity Logs
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          {/* Group Management Dropdown (WLS Admin & Super Admin) */}
          {isWlsAdmin && (
            <Menu
              shadow="md"
              width={250}
              trigger="hover"
              openDelay={100}
              closeDelay={150}
            >
              <Menu.Target>
                <Button
                  variant={isGroupMgmtActive ? "filled" : "subtle"}
                  color="green"
                  leftSection={<IconBrandWhatsapp size={18} />}
                  rightSection={<IconChevronDown size={14} />}
                  size="xs"
                >
                  Group Management
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Access Controls</Menu.Label>
                <Menu.Item
                  leftSection={
                    <IconShieldCheck
                      size={16}
                      color="var(--mantine-color-red-6)"
                    />
                  }
                  onClick={() => setActiveTab("menu-permissions")}
                >
                  Menu Items & Permissions
                </Menu.Item>

                <Menu.Divider />
                <Menu.Label>Social Area</Menu.Label>
                <Menu.Item
                  leftSection={
                    <IconBrandWhatsapp
                      size={16}
                      color="var(--mantine-color-green-6)"
                    />
                  }
                  onClick={() => setActiveTab("whatsapp-groups")}
                >
                  WhatsApp Groups
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconBrandTeams
                      size={16}
                      color="var(--mantine-color-blue-6)"
                    />
                  }
                  onClick={() => setActiveTab("teams-groups")}
                >
                  Microsoft Teams Groups
                </Menu.Item>

                <Menu.Divider />
                <Menu.Label>University Area</Menu.Label>
                <Menu.Item
                  leftSection={
                    <IconBuildingBank
                      size={16}
                      color="var(--mantine-color-violet-6)"
                    />
                  }
                  onClick={() => setActiveTab("university-portal")}
                >
                  Online University Portals
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconShieldCheck
                      size={16}
                      color="var(--mantine-color-indigo-6)"
                    />
                  }
                  onClick={() => setActiveTab("wls_admin")}
                >
                  Course Audit (WLS Admin)
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconSchool size={16} color="var(--mantine-color-teal-6)" />
                  }
                  onClick={() => setActiveTab("student_course")}
                >
                  Student Course Portal
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          {/* WLS Management & Quizzes Dropdown */}
          <Menu
            shadow="md"
            width={240}
            trigger="hover"
            openDelay={100}
            closeDelay={150}
          >
            <Menu.Target>
              <Button
                variant={isWlsActive ? "filled" : "subtle"}
                color="indigo"
                leftSection={<IconSchool size={18} />}
                rightSection={<IconChevronDown size={14} />}
                size="xs"
              >
                WLS Management
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Participant Area</Menu.Label>
              <Menu.Item
                leftSection={
                  <IconVideo size={16} color="var(--mantine-color-teal-6)" />
                }
                onClick={() => setActiveTab("wls-session")}
              >
                Active Sessions & Resources
              </Menu.Item>
              <Menu.Item
                leftSection={
                  <IconChartBar
                    size={16}
                    color="var(--mantine-color-grape-6)"
                  />
                }
                onClick={() => setActiveTab("reports")}
              >
                Analytics & Reports
              </Menu.Item>
              <Menu.Item
                leftSection={
                  <IconClipboardCheck
                    size={16}
                    color="var(--mantine-color-cyan-6)"
                  />
                }
                onClick={() => setActiveTab("quiz-student")}
              >
                Assigned Quizzes
              </Menu.Item>

              {isWlsAdmin && (
                <>
                  <Menu.Divider />
                  <Menu.Label>Admin Controls</Menu.Label>
                  <Menu.Item
                    leftSection={
                      <IconTools
                        size={16}
                        color="var(--mantine-color-blue-6)"
                      />
                    }
                    onClick={() => setActiveTab("wls-mgmt")}
                  >
                    Session Builder
                  </Menu.Item>
                  <Menu.Item
                    leftSection={
                      <IconClipboardCheck
                        size={16}
                        color="var(--mantine-color-orange-6)"
                      />
                    }
                    onClick={() => setActiveTab("assessment")}
                  >
                    Assessments & Grading
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Label>Quizzes & Assessments</Menu.Label>
                  <Menu.Item
                    leftSection={
                      <IconListDetails
                        size={16}
                        color="var(--mantine-color-teal-6)"
                      />
                    }
                    onClick={() => setActiveTab("quiz-list")}
                  >
                    Manage Existing Quizzes
                  </Menu.Item>
                  <Menu.Item
                    leftSection={
                      <IconTools
                        size={16}
                        color="var(--mantine-color-blue-6)"
                      />
                    }
                    onClick={() => setActiveTab("quiz-studio")}
                  >
                    Quiz Creator Studio
                  </Menu.Item>
                  <Menu.Item
                    leftSection={
                      <IconChartBar
                        size={16}
                        color="var(--mantine-color-grape-6)"
                      />
                    }
                    onClick={() => setActiveTab("quiz-reports")}
                  >
                    Quiz Reports & Analytics
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Footer
        p="sm"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Text size="xs" c="dimmed">
          &copy; {new Date().getFullYear()} IIPC Learning Portal. All rights
          reserved.
        </Text>
      </AppShell.Footer>
    </AppShell>
  );
}

export default MainLayout;
