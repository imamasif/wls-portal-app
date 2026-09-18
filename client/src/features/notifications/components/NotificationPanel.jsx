// src/features/notifications/components/NotificationPanel.jsx
import React, { useState } from 'react';
import { 
  Box, Title, Text, Group, Card, Badge, Button, ActionIcon, 
  TextInput, Stack, ThemeIcon, Paper, Image, SimpleGrid 
} from '@mantine/core';
import { 
  IconBell, IconSearch, IconExternalLink, IconPin, IconTrash, 
  IconInfoCircle, IconAlertTriangle, IconCircleCheck, IconBook 
} from '@tabler/icons-react';

export function NotificationPanel({ notifications = [] }) {
  const defaultNotifications = [
    {
      id: 1,
      title: 'New WLS Tafseer Session Published',
      message: 'Tafseer & Recitation Session #1 has been published by the admin. Access the full curriculum booklet and video lectures.',
      date: '2026-09-14 10:30 AM',
      type: 'RESOURCE',
      badge: 'Study Material',
      link: 'https://drive.google.com',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      pinned: true
    },
    {
      id: 2,
      title: 'Submission Assessment Pending',
      message: 'You have 3 new user submissions waiting for criteria evaluation in Group 1. Review student video submissions promptly.',
      date: '2026-09-14 09:15 AM',
      type: 'WARNING',
      badge: 'Action Required',
      link: null,
      image: null,
      pinned: false
    },
    {
      id: 3,
      title: 'Group Assignment Updated',
      message: 'You were assigned as WLS-Admin for Group 2 for the upcoming module. Check assigned ayats and participant lists.',
      date: '2026-09-13 04:00 PM',
      type: 'SUCCESS',
      badge: 'Assignment',
      link: 'https://zoom.us',
      image: null,
      pinned: false
    }
  ];

  const [items, setItems] = useState(notifications.length > 0 ? notifications : defaultNotifications);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTogglePin = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
    );
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredItems = items.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const getTypeConfig = (type) => {
    switch (type) {
      case 'WARNING':
        return { color: 'orange', icon: IconAlertTriangle };
      case 'SUCCESS':
        return { color: 'teal', icon: IconCircleCheck };
      case 'RESOURCE':
        return { color: 'indigo', icon: IconBook };
      default:
        return { color: 'blue', icon: IconInfoCircle };
    }
  };

  return (
    <Box mt="md" px="xs">
      {/* Header & Search Bar */}
      <Paper p="xl" radius="lg" shadow="sm" withBorder mb="lg" bg="white">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="md">
            <ThemeIcon size="xl" radius="xl" color="indigo" variant="light">
              <IconBell size={24} />
            </ThemeIcon>
            <Box>
              <Title order={2} c="indigo.9">Notifications Directory</Title>
              <Text size="sm" c="dimmed">
                Announcements, downloadable resources, study snaps, and direct action links ({sortedItems.length} active)
              </Text>
            </Box>
          </Group>
          <TextInput
            placeholder="Search notifications..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '300px' }}
            radius="md"
          />
        </Group>
      </Paper>

      {/* Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {sortedItems.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="xl" gridColumn="1 / -1">
            No notifications found matching your search.
          </Text>
        ) : (
          sortedItems.map((n) => {
            const config = getTypeConfig(n.type);
            const IconComponent = config.icon;

            return (
              <Card
                key={n.id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderColor: n.pinned ? 'var(--mantine-color-indigo-4)' : 'var(--mantine-color-gray-3)',
                  backgroundColor: n.pinned ? 'var(--mantine-color-indigo-0)' : '#ffffff',
                }}
              >
                <Stack gap="sm">
                  {n.image && (
                    <Image
                      src={n.image}
                      height={140}
                      radius="sm"
                      alt={n.title}
                    />
                  )}

                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <ThemeIcon color={config.color} variant="light" size="md" radius="xl">
                        <IconComponent size={16} />
                      </ThemeIcon>
                      <Badge color={config.color} variant="light" size="sm">
                        {n.badge || n.type}
                      </Badge>
                    </Group>
                    <Group gap={4}>
                      <ActionIcon
                        variant={n.pinned ? 'filled' : 'subtle'}
                        color="indigo"
                        size="sm"
                        radius="xl"
                        onClick={() => handleTogglePin(n.id)}
                        title={n.pinned ? 'Unpin' : 'Pin to Top'}
                      >
                        <IconPin size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        radius="xl"
                        onClick={() => handleDelete(n.id)}
                        title="Dismiss"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Text fw={700} size="md" c="dark.8">
                    {n.title}
                  </Text>

                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                    {n.message}
                  </Text>
                </Stack>

                <Group justify="space-between" align="center" mt="md" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="xs" c="dimmed">
                    {n.date}
                  </Text>
                  {n.link && (
                    <Button
                      component="a"
                      href={n.link}
                      target="_blank"
                      size="xs"
                      variant="light"
                      color="indigo"
                      rightSection={<IconExternalLink size={12} />}
                    >
                      Open Resource
                    </Button>
                  )}
                </Group>
              </Card>
            );
          })
        )}
      </SimpleGrid>
    </Box>
  );
}

export default NotificationPanel;