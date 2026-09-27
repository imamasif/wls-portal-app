// src/features/menu/components/drop-main-menu/WlsAdminMenu.jsx
import React from "react";
import { Group, Button, Menu } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconSchool,
  IconChartBar,
  IconChevronDown,
  IconTools,
  IconClipboardCheck,
  IconPencilPlus,
  IconListDetails,
  IconShieldCheck,
  IconBrandWhatsapp,
  IconBrandTeams,
  IconBuildingBank,
} from "@tabler/icons-react";

export function WlsAdminMenu({ activeTab, setActiveTab }) {
  return (
    <Group gap="xs" px="md">
      <Button
        variant={activeTab === "dashboard" ? "filled" : "subtle"}
        color="teal"
        leftSection={<IconLayoutDashboard size={18} />}
        onClick={() => setActiveTab("dashboard")}
        size="xs"
      >
        Dashboard
      </Button>

      {/* WLS Management Dropdown */}
      <Menu shadow="md" width={240} trigger="hover">
        <Menu.Target>
          <Button
            variant="subtle"
            color="indigo"
            leftSection={<IconSchool size={18} />}
            rightSection={<IconChevronDown size={14} />}
            size="xs"
          >
            WLS Management
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => setActiveTab("wls-session")}
            leftSection={
              <IconSchool size={16} color="var(--mantine-color-teal-6)" />
            }
          >
            Active Sessions
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("wls-mgmt")}
            leftSection={
              <IconTools size={16} color="var(--mantine-color-blue-6)" />
            }
          >
            Session Builder
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("assessment")}
            leftSection={
              <IconClipboardCheck
                size={16}
                color="var(--mantine-color-orange-6)"
              />
            }
          >
            Assessments & Grading
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Administration Dropdown */}
      <Menu shadow="md" width={240} trigger="hover">
        <Menu.Target>
          <Button
            variant="subtle"
            color="green"
            leftSection={<IconShieldCheck size={18} />}
            rightSection={<IconChevronDown size={14} />}
            size="xs"
          >
            Administration
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => setActiveTab("whatsapp-groups")}
            leftSection={
              <IconBrandWhatsapp
                size={16}
                color="var(--mantine-color-teal-6)"
              />
            }
          >
            WhatsApp Groups
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("teams-groups")}
            leftSection={
              <IconBrandTeams size={16} color="var(--mantine-color-indigo-6)" />
            }
          >
            Teams Groups
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("university-portal")}
            leftSection={
              <IconBuildingBank size={16} color="var(--mantine-color-blue-6)" />
            }
          >
            University Portal
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={() => setActiveTab("reports")}
            leftSection={
              <IconChartBar size={16} color="var(--mantine-color-grape-6)" />
            }
          >
            Reports
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={() => setActiveTab("quiz-list")}
            leftSection={
              <IconListDetails size={16} color="var(--mantine-color-cyan-6)" />
            }
          >
            Quiz Management (List)
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("quiz-studio")}
            leftSection={
              <IconPencilPlus size={16} color="var(--mantine-color-pink-6)" />
            }
          >
            Quiz Studio (Create)
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("quiz-reports")}
            leftSection={
              <IconChartBar size={16} color="var(--mantine-color-grape-6)" />
            }
          >
            Quiz Reports
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
