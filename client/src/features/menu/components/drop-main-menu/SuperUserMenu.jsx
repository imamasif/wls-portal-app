import React from "react";
import { Group, Button, Menu } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconUsers,
  IconShieldCheck,
  IconSchool,
  IconChevronDown,
  IconChartBar,
  IconBrandWhatsapp,
  IconBrandTeams,
  IconBuildingBank,
  IconTools,
  IconClipboardCheck,
} from "@tabler/icons-react";

export function SuperUserMenu({ activeTab, setActiveTab }) {
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

      <Menu shadow="md" width={220} trigger="hover">
        <Menu.Target>
          <Button
            variant="subtle"
            color="cyan"
            leftSection={<IconUsers size={18} />}
            rightSection={<IconChevronDown size={14} />}
            size="xs"
          >
            User Controls
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => setActiveTab("users")}>
            User Directory
          </Menu.Item>
          <Menu.Item onClick={() => setActiveTab("roles-control")}>
            Role & Access Control
          </Menu.Item>
          <Menu.Item onClick={() => setActiveTab("user-activity")}>
            Activity Logs
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Added WLS Management Dropdown for Super Users */}
      <Menu shadow="md" width={220} trigger="hover">
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
            leftSection={<IconSchool size={16} />}
          >
            Active Sessions
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("wls-mgmt")}
            leftSection={<IconTools size={16} />}
          >
            Session Builder
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("assessment")}
            leftSection={<IconClipboardCheck size={16} />}
          >
            Assessments & Grading
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Menu shadow="md" width={220} trigger="hover">
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
            onClick={() => setActiveTab("menu-permissions")}
            leftSection={<IconShieldCheck size={16} />}
          >
            Menu Permissions
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("whatsapp-groups")}
            leftSection={<IconBrandWhatsapp size={16} />}
          >
            WhatsApp Groups
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("teams-groups")}
            leftSection={<IconBrandTeams size={16} />}
          >
            Teams Groups
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("university-portal")}
            leftSection={<IconBuildingBank size={16} />}
          >
            University Portal
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab("wls-mgmt")}
            leftSection={<IconSchool size={16} />}
          >
            Course Audit
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Button
        variant={activeTab === "reports" ? "filled" : "subtle"}
        color="grape"
        leftSection={<IconChartBar size={18} />}
        onClick={() => setActiveTab("reports")}
        size="xs"
      >
        Reports
      </Button>
    </Group>
  );
}
