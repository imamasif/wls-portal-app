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
  IconTools,
  IconClipboardCheck,
  IconChartBar,
  IconBrandWhatsapp,
  IconBriefcase,
} from "@tabler/icons-react";

export function WlsAdminDB({ setActiveTab }) {
  const cards = [
    {
      title: "Active Sessions",
      description: "Monitor ongoing weekly leadership sessions and attendance.",
      icon: IconSchool,
      color: "teal",
      badge: "Live",
      tab: "wls-session",
    },
    {
      title: "Session Builder",
      description: "Configure session schedules, modules, and content.",
      icon: IconTools,
      color: "blue",
      badge: "Management",
      tab: "wls-mgmt",
    },
    {
      title: "Grading & Tests",
      description: "Review student quizzes, assignments, and test scores.",
      icon: IconClipboardCheck,
      color: "orange",
      badge: "Assessments",
      tab: "assessment",
    },
    {
      title: "Analytics Reports",
      description: "View participation graphs and student performance metrics.",
      icon: IconChartBar,
      color: "grape",
      badge: "Reports",
      tab: "reports",
    },
    {
      title: "WhatsApp Groups",
      description: "Manage university student social communication groups.",
      icon: IconBrandWhatsapp,
      color: "green",
      badge: "Social",
      tab: "whatsapp-groups",
    },
    {
      title: "University Portal",
      description: "Access partner portals and academic student files.",
      icon: IconBriefcase,
      color: "indigo",
      badge: "Portal",
      tab: "university-portal",
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
              WLS Admin Dashboard
            </Title>
            <Text size="sm" c="dimmed">
              Manage active weekly sessions, course builders, and assessments.
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
