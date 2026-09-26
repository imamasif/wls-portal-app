import React from "react";
import { Group, Button } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconSchool,
  IconClipboardCheck,
} from "@tabler/icons-react";

export function UserMenu({ activeTab, setActiveTab }) {
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
      <Button
        variant={activeTab === "wls-session" ? "filled" : "subtle"}
        color="indigo"
        leftSection={<IconSchool size={18} />}
        onClick={() => setActiveTab("wls-session")}
        size="xs"
      >
        My Sessions
      </Button>
      <Button
        variant={activeTab === "quiz-student" ? "filled" : "subtle"}
        color="cyan"
        leftSection={<IconClipboardCheck size={18} />}
        onClick={() => setActiveTab("quiz-student")}
        size="xs"
      >
        My Quizzes
      </Button>
    </Group>
  );
}
