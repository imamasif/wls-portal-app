import React from 'react';
import { Card, Group, Stack, Text, Badge, ThemeIcon, UnstyledButton, Paper, Box } from '@mantine/core';
import { IconUsers, IconUser } from '@tabler/icons-react';

export function WlsAssignedMembers({ assignedUsers, selectedUserId, onUserSelect }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge size="xs" color="green" variant="filled">COMPLETED</Badge>;
      case 'PARTIAL_SAVED':
        return <Badge size="xs" color="blue" variant="filled">PARTIAL SAVED</Badge>;
      case 'SUBMITTED':
        return <Badge size="xs" color="cyan" variant="light">SUBMITTED</Badge>;
      default:
        return <Badge size="xs" color="red" variant="light">MISSING</Badge>;
    }
  };

  return (
    <Card shadow="xs" padding="lg" radius="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
            <IconUsers size={20} />
          </ThemeIcon>
          <Text fw={800} size="md" c="dark">
            Assigned Members
          </Text>
        </Group>
        <Badge color="blue" variant="filled" radius="sm">
          {assignedUsers.length}
        </Badge>
      </Group>

      <Stack gap="xs">
        {assignedUsers.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="md">
            No members assigned to you for this session.
          </Text>
        ) : (
          assignedUsers.map((item) => {
            const isSelected = selectedUserId === item.id;

            return (
              <Paper
                key={item.id}
                component={UnstyledButton}
                onClick={() => onUserSelect(item)}
                p="sm"
                radius="md"
                withBorder
                style={{
                  display: 'block',
                  width: '100%',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : '#ffffff',
                  borderColor: isSelected ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-3)',
                  borderWidth: isSelected ? 2 : 1,
                  boxShadow: isSelected ? '0 2px 8px rgba(28, 126, 214, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="center">
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={isSelected ? 'blue' : 'gray'}
                      variant={isSelected ? 'filled' : 'light'}
                    >
                      <IconUser size={16} />
                    </ThemeIcon>

                    <Box>
                      <Text fw={700} size="sm" c="dark">
                        {item.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Group {item.groupNumber}
                      </Text>
                    </Box>
                  </Group>

                  {getStatusBadge(item.status)}
                </Group>
              </Paper>
            );
          })
        )}
      </Stack>
    </Card>
  );
}