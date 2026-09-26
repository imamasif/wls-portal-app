import React from "react";
import { Group, Button, Menu } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconSchool,
  IconChartBar,
  IconChevronDown,
  IconTools,
  IconClipboardCheck,
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
          <Menu.Item
            onClick={() => setActiveTab("reports")}
            leftSection={<IconChartBar size={16} />}
          >
            Analytics Reports
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
