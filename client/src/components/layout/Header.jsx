// src/components/layout/Header.jsx
import React from "react";
import {
  Group,
  Box,
  Text,
  Badge,
  Avatar,
  ActionIcon,
  Button,
  Menu,
  Divider,
} from "@mantine/core";
import { IconBell, IconPencil, IconLogout } from "@tabler/icons-react";

export function Header({ user, setActiveTab, logout, notificationCount = 3 }) {
  return (
    <Box
      component="header"
      px={{ base: "md", sm: "xl" }}
      py={6} // Reduced vertical padding to close the gap between header and navigation
      bg="white"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        flexWrap: "wrap",
        gap: "12px",
        borderBottom: "1px solid var(--mantine-color-gray-2)",
      }}
    >
      {/* Left Section: Logo & Uniform Bold Title with Canada Flag Touch */}
      <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
        <Box
          style={{
            height: "54px", // Compacted logo container slightly to match leaner header
            width: "54px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid var(--mantine-color-gray-2)",
            boxShadow:
              "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
            flexShrink: 0,
            padding: "3px",
          }}
        >
          <img
            src="/iipc-logo1.png"
            alt="IIPC Logo"
            style={{
              height: "100%",
              width: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Box>
        <Box style={{ minWidth: 0 }}>
          {/* Main Title Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            <Text
              component="h1"
              size="md"
              fw={700}
              c="dark.9"
              style={{ margin: 0, lineHeight: 1.2 }}
            >
              IIPC
            </Text>

            {/* CANADA word with flag positioned absolutely on its top-right corner */}
            <Text
              component="span"
              size="md"
              fw={700}
              c="dark.9"
              style={{
                position: "relative",
                display: "inline-block",
                margin: 0,
                lineHeight: 1.2,
                paddingRight: "4px",
              }}
            >
              CANADA
              <span
                style={{
                  position: "absolute",
                  top: "-7px",
                  right: "-10px",
                  width: "16px",
                  height: "11px",
                  display: "inline-block",
                  borderRadius: "1px",
                  overflow: "hidden",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 900 450"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                >
                  <rect width="900" height="450" fill="#fff" />
                  <rect width="225" height="450" fill="#ff0000" />
                  <rect x="675" width="225" height="450" fill="#ff0000" />
                  <path
                    fill="#ff0000"
                    d="M450,75 l20,55 l45,-20 l-10,45 l40,15 l-30,30 l25,35 l-45,-5 l-15,40 l-30,-35 l-30,35 l-15,-40 l-45,5 l25,-35 l-30,-30 l40,-15 l-10,-45 l45,20 z"
                  />
                </svg>
              </span>
            </Text>

            <Text
              component="span"
              size="md"
              fw={700}
              c="dark.9"
              style={{ margin: 0, lineHeight: 1.2, paddingLeft: "4px" }}
            >
              Learning Portal
            </Text>
          </div>

          <Text
            size="xs"
            fw={600}
            style={{
              background: "linear-gradient(45deg, #12b886, #228be6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.5px",
            }}
          >
            Weekly Learning Sessions
          </Text>
        </Box>
      </Group>

      {/* Right Section: Conditional User Controls */}
      {user ? (
        <Group gap="sm" align="center" wrap="nowrap">
          <Box
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              radius="xl"
              onClick={() => setActiveTab("notifications")}
              title="Notifications"
              style={{ width: "36px", height: "36px" }}
            >
              <IconBell size={20} />
            </ActionIcon>
            {notificationCount > 0 && (
              <Badge
                size="xs"
                color="red"
                variant="filled"
                circle
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  pointerEvents: "none",
                  minWidth: "16px",
                  height: "16px",
                  fontSize: "9px",
                }}
              >
                {notificationCount}
              </Badge>
            )}
          </Box>

          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <Group gap="xs" style={{ cursor: "pointer" }}>
                <Badge
                  color="cyan"
                  variant="light"
                  size="sm"
                  radius="xl"
                  styles={{
                    root: {
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "6px 10px",
                    },
                  }}
                >
                  {user?.role || "SUPER USER"}
                </Badge>
                <Avatar
                  src={user?.avatarUrl}
                  alt="User Avatar"
                  size="sm"
                  radius="xl"
                  color="teal"
                  style={{ border: "2px solid var(--mantine-color-cyan-6)" }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                </Avatar>
              </Group>
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
              {logout && (
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={logout}
                >
                  Sign Out
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      ) : (
        <Group gap="sm">
          <Button
            variant="default"
            size="xs"
            onClick={() => setActiveTab("login")}
          >
            Sign In
          </Button>
          <Button
            color="teal"
            size="xs"
            onClick={() => setActiveTab("register")}
          >
            Register
          </Button>
        </Group>
      )}
    </Box>
  );
}

export default Header;
