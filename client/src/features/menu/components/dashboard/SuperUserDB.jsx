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
  IconChartBar,
  IconUsers,
  IconShieldCheck,
  IconActivity,
  IconBrandWhatsapp,
  IconBrandTeams,
  IconBuildingBank,
  IconSchool,
} from "@tabler/icons-react";

export function SuperUserDB({ setActiveTab }) {
  const cards = [
    {
      title: "User Directory",
      description: "Manage directory, accounts, and user permissions.",
      icon: IconUsers,
      color: "cyan",
      badge: "Active",
      tab: "users",
    },
    {
      title: "Role & Access Control",
      description: "Configure security settings and access matrices.",
      icon: IconShieldCheck,
      color: "grape",
      badge: "Secure",
      tab: "roles-control",
    },
    {
      title: "Activity Logs",
      description: "Review real-time system events and logins.",
      icon: IconActivity,
      color: "orange",
      badge: "Live Feed",
      tab: "user-activity",
    },
    {
      title: "Analytics Reports",
      description: "Global attendance, session performance, and metrics.",
      icon: IconChartBar,
      color: "blue",
      badge: "Metrics",
      tab: "reports",
    },
    {
      title: "WhatsApp Groups",
      description: "Monitor WhatsApp university social channels.",
      icon: IconBrandWhatsapp,
      color: "green",
      badge: "Groups",
      tab: "whatsapp-groups",
    },
    {
      title: "Teams Groups",
      description: "Manage Microsoft Teams collaborative spaces.",
      icon: IconBrandTeams,
      color: "indigo",
      badge: "Teams",
      tab: "teams-groups",
    },
    {
      title: "University Portal",
      description: "Access university partner portals and course audits.",
      icon: IconBuildingBank,
      color: "teal",
      badge: "Portal",
      tab: "university-portal",
    },
    {
      title: "Course Audit",
      description: "Review weekly learning sessions and metrics.",
      icon: IconSchool,
      color: "violet",
      badge: "Audit",
      tab: "wls_admin",
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
