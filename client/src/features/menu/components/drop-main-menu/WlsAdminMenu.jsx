import React from "react";
import { AppTab } from "@/types/user";
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
  IconUsers,
  IconFingerprint,
} from "@tabler/icons-react";

export function WlsAdminMenu({ activeTab, setActiveTab }) {
  return (
    <Group gap="xs" px="md">
      <Button
        variant={activeTab === AppTab.DASHBOARD ? "filled" : "subtle"}
        color="teal"
        leftSection={<IconLayoutDashboard size={18} />}
        onClick={() => setActiveTab(AppTab.DASHBOARD)}
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
          {/* Point Active Sessions to wls-mgmt */}
          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_SESSION)}
            leftSection={
              <IconSchool size={16} color="var(--mantine-color-teal-6)" />
            }
          >
            Active Sessions
          </Menu.Item>

          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_ATTENDANCE_MONITORING)}
            leftSection={
              <IconUsers size={16} color="var(--mantine-color-teal-6)" />
            }
          >
            Attendance Monitoring
          </Menu.Item>

          {/* Added Class Attendance for Admins */}
          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_CLASS_ATTENDANCE)}
            leftSection={
              <IconFingerprint size={16} color="var(--mantine-color-red-6)" />
            }
          >
            Class Attendance
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_MGMT)}
            leftSection={
              <IconTools size={16} color="var(--mantine-color-blue-6)" />
            }
          >
            Session Builder
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onClick={() => setActiveTab(AppTab.ASSESSMENT)}
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
            onClick={() => setActiveTab(AppTab.WHATSAPP_GROUPS)}
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
            onClick={() => setActiveTab(AppTab.TEAMS_GROUPS)}
            leftSection={
              <IconBrandTeams size={16} color="var(--mantine-color-indigo-6)" />
            }
          >
            Teams Groups
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab(AppTab.UNIVERSITY_PORTAL)}
            leftSection={
              <IconBuildingBank size={16} color="var(--mantine-color-blue-6)" />
            }
          >
            University Portal
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={() => setActiveTab(AppTab.REPORTS)}
            leftSection={
              <IconChartBar size={16} color="var(--mantine-color-grape-6)" />
            }
          >
            Reports
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={() => setActiveTab(AppTab.QUIZ_LIST)}
            leftSection={
              <IconListDetails size={16} color="var(--mantine-color-cyan-6)" />
            }
          >
            Quiz Management (List)
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab(AppTab.QUIZ_STUDIO)}
            leftSection={
              <IconPencilPlus size={16} color="var(--mantine-color-pink-6)" />
            }
          >
            Quiz Studio (Create)
          </Menu.Item>
          <Menu.Item
            onClick={() => setActiveTab(AppTab.QUIZ_REPORTS)}
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
