import React from "react";
import { AppTab } from "@/types/user";
import {
  SimpleGrid,
  Text,
  Group,
  ThemeIcon,
  Badge,
  Title,
  Box,
  Container,
} from "@mantine/core";
import {
  IconUsers,
  IconSchool,
  IconClipboardCheck,
  IconNotes,
  IconBook,
  IconFileCertificate,
  IconTools,
} from "@tabler/icons-react";

export function SuperUserDB({ setActiveTab }) {
  const cards = [
    {
      title: "User Directory",
      description: "Manage directory, accounts, and user permissions.",
      icon: IconUsers,
      color: "cyan",
      badge: "Active",
      tab: AppTab.USERS,
    },
    {
      title: "Quiz Management",
      description: "Create, edit, and review student quiz assessments.",
      icon: IconClipboardCheck,
      color: "cyan",
      badge: "Quizzes",
      tab: AppTab.QUIZ_LIST,
    },
    {
      title: "Course Audit",
      description: "Review weekly learning sessions and metrics.",
      icon: IconSchool,
      color: "violet",
      badge: "Audit",
      tab: AppTab.WLS_ADMIN,
    },
    {
      title: "Letterhead & Doc Studio",
      description: "Generate IIPC/BP letterheads, merge docs, and sign documents.",
      icon: IconFileCertificate,
      color: "teal",
      badge: "Doc Studio",
      tab: AppTab.LETTERHEADS,
    },
    {
      title: "Sticky Notes",
      description: "Create quick reminders, personal notes, and pin ideas.",
      icon: IconNotes,
      color: "yellow",
      badge: "Quick Notes",
      tab: AppTab.STICKY_NOTES,
    },
    {
      title: "Quran Ayat Memorizer",
      description:
        "Memorize, practice, and test Quranic surah & ayah references.",
      icon: IconBook,
      color: "teal",
      badge: "Memorizer",
      tab: AppTab.QURAN_MEMORIZER,
    },
  ];

  return (
    <Container size="xl" py="lg" mt="md">
      <Box
        mt="md"
        style={{
          backgroundColor: "#e6ecf5",
          minHeight: "calc(100vh - 160px)",
          padding: "24px",
          borderRadius: "20px",
        }}
      >
        <style>{`
          .neumorphic-card {
            background: #e6ecf5;
            border-radius: 16px;
            padding: 24px;
            transition: all 0.25s ease-in-out;
            cursor: pointer;
            user-select: none;
            box-shadow: 8px 8px 16px #c5d0e0, -8px -8px 16px #ffffff;
          }
          .neumorphic-card:hover {
            transform: translateY(-2px);
            box-shadow: 10px 10px 20px rgba(190, 40, 218, 0.18), -10px -10px 20px #ffffff;
          }
          .neumorphic-card:active {
            transform: translateY(0) scale(0.98);
            box-shadow: inset 5px 5px 10px #c5d0e0, inset -5px -5px 10px #ffffff;
          }
        `}</style>

        <Group justify="space-between" mb="xl">
          <Box>
            <Title order={2} c="indigo.9">
              Super User Command Center
            </Title>
            <Text size="sm" c="dimmed">
              Full administrative privileges across user controls, security, and
              university portals.
            </Text>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          {cards.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="neumorphic-card"
                onClick={() => setActiveTab(item.tab)}
              >
                <Group justify="space-between" mb="xs">
                  <ThemeIcon
                    color={item.color}
                    variant="light"
                    size="lg"
                    radius="md"
                  >
                    <IconComponent size={22} />
                  </ThemeIcon>
                  <Badge color={item.color} variant="light" size="sm">
                    {item.badge}
                  </Badge>
                </Group>
                <Text fw={600} size="md" mt="sm" c="gray.8">
                  {item.title}
                </Text>
                <Text size="xs" c="dimmed" mt={4} style={{ lineHeight: 1.4 }}>
                  {item.description}
                </Text>
              </div>
            );
          })}
        </SimpleGrid>
      </Box>
    </Container>
  );
}
