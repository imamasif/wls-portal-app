import React from 'react';
import { SimpleGrid, Text, Group, ThemeIcon, Badge, Title, Box } from '@mantine/core';
import { 
  IconChartBar, 
  IconUsers, 
  IconBrandWhatsapp, 
  IconShieldCheck, 
  IconSchool, 
  IconActivity, 
  IconBellRinging, 
  IconBriefcase 
} from '@tabler/icons-react';

export function DashboardView({ setActiveTab }) {
  const cards = [
    {
      title: 'Reporting & Analytics',
      description: 'View real-time attendance, session performance, and student progress graphs.',
      icon: IconChartBar,
      color: 'blue',
      badge: 'Live Data',
      tab: 'reports',
    },
    {
      title: 'User Management',
      description: 'Manage users, assign permissions, and oversee student/admin onboarding.',
      icon: IconUsers,
      color: 'cyan',
      badge: '142 Active',
      tab: 'users',
    },
    {
      title: 'Group Monitoring',
      description: 'Monitor WhatsApp and Microsoft Teams university social channels.',
      icon: IconBrandWhatsapp,
      color: 'green',
      badge: '18 Groups',
      tab: 'whatsapp-groups',
    },
    {
      title: 'Controls & Security',
      description: 'System roles, access controls, security settings, and administrative logs.',
      icon: IconShieldCheck,
      color: 'grape',
      badge: 'Secure',
      tab: 'roles-control',
    },
    {
      title: 'WLS Sessions',
      description: 'Create, schedule, and track weekly leadership session progress.',
      icon: IconSchool,
      color: 'indigo',
      badge: '12 Classes',
      tab: 'wls-session',
    },
    {
      title: 'System Activity',
      description: 'Real-time feed of system events, logins, and profile modifications.',
      icon: IconActivity,
      color: 'orange',
      badge: 'Updated',
      tab: 'user-activity',
    },
    {
      title: 'Notifications & Alerts',
      description: 'Broadcast updates, pending review alerts, and system notices.',
      icon: IconBellRinging,
      color: 'red',
      badge: '3 Unread',
      tab: 'notifications',
    },
    {
      title: 'University Portals',
      description: 'Access university partner portals and academic resource links.',
      icon: IconBriefcase,
      color: 'teal',
      badge: 'Connected',
      tab: 'university-portal',
    },
  ];

  return (
    <Box 
      style={{ 
        backgroundColor: '#e6ecf5', 
        minHeight: 'calc(100vh - 160px)', 
        padding: '24px', 
        borderRadius: '20px' 
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
          <Title order={2} c="indigo.9">System Dashboard</Title>
          <Text size="sm" c="dimmed">Overview of management controls, analytics, and active groups</Text>
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
                <ThemeIcon color={item.color} variant="light" size="lg" radius="md">
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
  );
}