import React from "react";
import { Group, Menu, Button, Text, Avatar } from "@mantine/core";
import { AppTab } from "@/types/user";
import {
  IconLayoutDashboard,
  IconChecklist,
  IconFingerprint,
  IconSchool,
  IconClipboardCheck,
  IconBellRinging,
  IconUserCircle,
  IconChevronDown,
  IconNotes,
  IconBook,
  IconSitemap,
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
            My WLS Session
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
            onClick={() => setActiveTab(AppTab.WLS_CLASS_ATTENDANCE)}
            leftSection={
              <IconFingerprint size={16} color="var(--mantine-color-red-6)" />
            }
          >
            WLS Attendance
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item
            leftSection={<IconNotes size={16} />}
            onClick={() => setActiveTab(AppTab.STICKY_NOTES)}
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
