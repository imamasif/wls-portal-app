import React from "react";
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
  IconSchool,
  IconClipboardCheck,
  IconBellRinging,
  IconUserCircle,
} from "@tabler/icons-react";

export function UserDB({ setActiveTab }) {
  const cards = [
    {
      title: "My Sessions",
      description:
        "Access active live weekly sessions and educational materials.",
      icon: IconSchool,
      color: "teal",
      badge: "Enrolled",
      tab: "wls-session",
    },
    {
      title: "My Quizzes",
      description: "Complete assigned assessments and check your scores.",
      icon: IconClipboardCheck,
      color: "cyan",
      badge: "Interactive",
      tab: "quiz-student",
    },
    {
      title: "Notifications",
      description: "Check system announcements and important alerts.",
      icon: IconBellRinging,
      color: "red",
      badge: "Updates",
      tab: "notifications",
    },
    {
      title: "Edit Profile",
      description: "Update your personal details, photo, and preferences.",
      icon: IconUserCircle,
      color: "grape",
      badge: "Account",
      tab: "edit-profile",
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
              Welcome Back!
            </Title>
            <Text size="sm" c="dimmed">
              Access your assigned sessions, quizzes, profile, and updates.
            </Text>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
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
