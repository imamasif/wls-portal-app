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

      {/* WLS Management Dropdown (Includes Quiz Studio with split line & colored icons) */}
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
          <Menu.Item
            onClick={() => setActiveTab("reports")}
            leftSection={
              <IconChartBar size={16} color="var(--mantine-color-grape-6)" />
            }
          >
            Analytics Reports
          </Menu.Item>

          {/* Split Line */}
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
