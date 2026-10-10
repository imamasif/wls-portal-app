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
  IconNotes,
  IconFingerprint,
  IconBook,
  IconSitemap,
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
          {/* Point to wls-mgmt */}
          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_SESSION)}
            leftSection={
              <IconSchool size={16} color="var(--mantine-color-teal-6)" />
            }
          >
            My WLS Session
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
          <Menu.Divider />
          <Menu.Item
            onClick={() => setActiveTab(AppTab.REPORTS)}
            leftSection={
              <IconChartBar
                size={16}
                color="var(--mantine-color-grape-6)"
              />
            }
          >
            WLS Analytics & Reports
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Administration Dropdown */}
      <Menu shadow="md" width={260} trigger="hover">
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
          {/* ... other admin links ... */}

          <Menu.Item
            onClick={() => setActiveTab(AppTab.STICKY_NOTES)}
            leftSection={
              <IconNotes size={16} color="var(--mantine-color-yellow-6)" />
            }
          >
            Sticky Notes
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onClick={() => setActiveTab(AppTab.QURAN_MEMORIZER)}
            leftSection={
              <IconBook size={16} color="var(--mantine-color-teal-6)" />
            }
          >
            Quran Reference Memorizer
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onClick={() => setActiveTab(AppTab.QURAN_TREE)}
            leftSection={
              <IconSitemap size={16} color="var(--mantine-color-emerald-6)" />
            }
          >
            Quran Morphology Tree
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
