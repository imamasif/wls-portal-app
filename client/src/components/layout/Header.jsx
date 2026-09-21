// src/components/common/Header.jsx
import React from 'react';
import { Group, Box, Text, Badge, Avatar, ActionIcon, Button } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';

export function Header({ user, setActiveTab, notificationCount = 3 }) {
  return (
    <Box
      component="header"
      px="xl"
      py="md"
      bg="white"
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Left Section: Logo & Title */}
      <Group gap="md" align="center">
        <Box style={{ height: '68px', width: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img
            src="/iipc-logo1.png"
            alt="IIPC Logo"
            style={{ height: '100%', width: '100%', objectFit: 'contain', display: 'block' }}
          />
        </Box>
        <Box>
          <Text component="h1" size="lg" fw={700} c="dark.9" style={{ margin: 0, lineHeight: 1.2 }}>
            IIPC Learning Portal
          </Text>
          <Text size="xs" c="dimmed">Weekly Learning Sessions</Text>
        </Box>
      </Group>

      {/* Right Section: Conditional based on User State */}
      {user ? (
        <Group gap="lg" align="center">
          <Box style={{ position: 'relative' }}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xl"
              radius="xl"
              onClick={() => setActiveTab('notifications')}
              title="Notifications"
            >
              <IconBell size={26} />
            </ActionIcon>
            {notificationCount > 0 && (
              <Badge size="xs" color="red" variant="filled" circle style={{ position: 'absolute', top: 2, right: 2, pointerEvents: 'none' }}>
                {notificationCount}
              </Badge>
            )}
          </Badge>

          <Badge color="cyan" variant="light" size="sm" radius="xl" styles={{ root: { fontWeight: 700, textTransform: 'uppercase' } }}>
            {user?.role || 'SUPER USER'}
          </Badge>

          <Box onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {user?.avatarUrl ? (
              <Avatar src={user.avatarUrl} alt="User Avatar" size="md" radius="xl" style={{ border: '2px solid var(--mantine-color-cyan-6)' }} />
            ) : (
              <Avatar color="cyan" radius="xl" size="md" style={{ fontWeight: 700 }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </Avatar>
            )}
          </Box>
        </Group>
      ) : (
        /* Sign In & Register Buttons when Logged Out */
        <Group gap="sm">
          <Button variant="default" onClick={() => setActiveTab('login')}>
            Sign In
          </Button>
          <Button color="teal" onClick={() => setActiveTab('register')}>
            Register
          </Button>
        </Group>
      )}
    </Box>
  );
}

export default Header;