import React from "react";
import { AppTab } from "@/types/user";
import { Group, Button, Menu } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconSchool,
  IconClipboardCheck,
  IconFingerprint,
  IconChevronDown,
  IconBook,
  IconChecklist,
} from "@tabler/icons-react";

export function UserMenu({ activeTab, setActiveTab }) {
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

      {/* Assignments Dropdown Menu for Users */}
      <Menu shadow="md" width={220} trigger="hover">
        <Menu.Target>
          <Button
            variant="subtle"
            color="indigo"
            leftSection={<IconChecklist size={18} />}
            rightSection={<IconChevronDown size={14} />}
            size="xs"
          >
            Assignments
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_SESSION)}
            leftSection={
              <IconSchool size={16} color="var(--mantine-color-indigo-6)" />
            }
          >
            Weekly Learning Sessions
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={() => setActiveTab(AppTab.QUIZ_STUDENT)}
            leftSection={
              <IconClipboardCheck
                size={16}
                color="var(--mantine-color-cyan-6)"
              />
            }
          >
            Quizzes
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={() => setActiveTab(AppTab.WLS_ATTENDANCE)}
            leftSection={
              <IconFingerprint size={16} color="var(--mantine-color-red-6)" />
            }
          >
            WLS Attendance
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
