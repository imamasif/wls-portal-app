import React from 'react';
import { 
  AppShell, 
  Group, 
  Title, 
  Text, 
  Menu, 
  Avatar, 
  Badge, 
  ActionIcon, 
  Button, 
  UnstyledButton, 
  Indicator, 
  Divider, 
  Box 
} from '@mantine/core';
import { 
  IconLayoutDashboard, 
  IconSchool, 
  IconTools, 
  IconClipboardCheck, 
  IconCpu, 
  IconChartBar, 
  IconUsers, 
  IconChevronDown, 
  IconBell, 
  IconPencil, 
  IconLogout, 
  IconVideo 
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { isSuperUserRole } from '../../types/user';

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, setShowAuthModal, logout } = useAuth();
  const isSuperUser = isSuperUserRole(user?.role);
  const isWlsAdmin = isSuperUser || user?.role === 'WLS_ADMIN';

  // Helper to determine if any WLS sub-tab is currently active
  const isWlsActive = ['wls-mgmt', 'assessment', 'criteria', 'reports', 'wls-assignment'].includes(activeTab);

  return (
    <AppShell header={{ height: 110 }} padding="md">
      {/* HEADER SECTION */}
      <AppShell.Header p="xs" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Group justify="space-between" align="center" px="md">
          {/* Brand Logo & Title */}
          <Group gap="sm">
            <img src="/iipc-logo1.png" alt="IIPC Logo" style={{ height: 40 }} />
            <Box>
              <Title order={4} lh={1.2}>IIPC Learning Portal</Title>
              <Text size="xs" c="dimmed">Weekly Learning Sessions</Text>
            </Box>
          </Group>

          {/* Controls & Profile Dropdown */}
          <Group gap="md">
            {user ? (
              <>
                {/* Notification Bell Badge */}
                <Indicator label="3" size={16} color="red" offset={2}>
                  <ActionIcon 
                    variant="subtle" 
                    color="gray" 
                    size="lg" 
                    onClick={() => setActiveTab('notifications')}
                    aria-label="Notifications"
                  >
                    <IconBell size={20} />
                  </ActionIcon>
                </Indicator>

                {/* Profile Avatar Menu */}
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge color={isSuperUser ? 'violet' : 'blue'} variant="light">
                        {isSuperUser ? 'Super User' : user?.role || 'User'}
                      </Badge>
                      <Avatar 
                        src={user?.profilePictureUrl} 
                        alt={user?.name} 
                        radius="xl" 
                        color="teal"
                      >
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Box p="xs">
                      <Text size="sm" fw={500}>{user.name}</Text>
                      <Text size="xs" c="dimmed">{user.email}</Text>
                    </Box>
                    <Divider my="xs" />
                    <Menu.Item 
                      leftSection={<IconPencil size={16} />} 
                      onClick={() => setShowAuthModal(true)}
                    >
                      Edit Profile
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconBell size={16} />} 
                      onClick={() => setActiveTab('notifications')}
                      rightSection={<Badge size="xs" color="red">3</Badge>}
                    >
                      Notifications
                    </Menu.Item>
                    <Divider my="xs" />
                    <Menu.Item 
                      color="red" 
                      leftSection={<IconLogout size={16} />} 
                      onClick={logout}
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            ) : (
              <Button color="teal" onClick={() => setShowAuthModal(true)}>
                Sign In / Register
              </Button>
            )}
          </Group>
        </Group>

        {/* NAVIGATION TABS BAR */}
        {user && (
          <Group gap="xs" px="md" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            {/* 1. Dashboard */}
            <Button
              variant={activeTab === 'dashboard' ? 'light' : 'subtle'}
              color={activeTab === 'dashboard' ? 'teal' : 'gray'}
              leftSection={<IconLayoutDashboard size={18} />}
              onClick={() => setActiveTab('dashboard')}
              size="xs"
            >
              Dashboard
            </Button>

            {/* 2. WLS Dropdown */}
            <Menu shadow="md" width={220} trigger="hover" openDelay={100} closeDelay={150}>
              <Menu.Target>
                <Button
                  variant={isWlsActive ? 'light' : 'subtle'}
                  color={isWlsActive ? 'teal' : 'gray'}
                  leftSection={<IconSchool size={18} />}
                  rightSection={<IconChevronDown size={14} />}
                  size="xs"
                >
                  Weekly Leadership Session (WLS)
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item 
                  leftSection={<IconVideo size={16} color="var(--mantine-color-teal-6)" />}
                  onClick={() => setActiveTab('wls-assignment')}
                >
                  My WLS Assignment
                </Menu.Item>

                {isWlsAdmin && (
                  <Menu.Item 
                    leftSection={<IconTools size={16} color="var(--mantine-color-blue-6)" />}
                    onClick={() => setActiveTab('wls-mgmt')}
                  >
                    Session Builder
                  </Menu.Item>
                )}

                {isWlsAdmin && (
                  <Menu.Item 
                    leftSection={<IconClipboardCheck size={16} color="var(--mantine-color-green-6)" />}
                    onClick={() => setActiveTab('assessment')}
                  >
                    WLS Assessment
                  </Menu.Item>
                )}

                {isSuperUser && (
                  <Menu.Item 
                    leftSection={<IconCpu size={16} color="var(--mantine-color-orange-6)" />}
                    onClick={() => setActiveTab('criteria')}
                  >
                    Rule Engine
                  </Menu.Item>
                )}

                <Menu.Item 
                  leftSection={<IconChartBar size={16} color="var(--mantine-color-grape-6)" />}
                  onClick={() => setActiveTab('reports')}
                >
                  Analytics & Reports
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {/* 3. User Management */}
            {isSuperUser && (
              <Button
                variant={activeTab === 'users' ? 'light' : 'subtle'}
                color={activeTab === 'users' ? 'teal' : 'gray'}
                leftSection={<IconUsers size={18} />}
                onClick={() => setActiveTab('users')}
                size="xs"
              >
                User Management
              </Button>
            )}
          </Group>
        )}
      </AppShell.Header>

      {/* MAIN BODY CONTENT */}
      <AppShell.Main style={{ paddingTop: 120 }}>
        {children}
      </AppShell.Main>

      {/* FOOTER */}
      <Box 
        component="footer" 
        p="sm" 
        mt="xl" 
        style={{ textAlign: 'center', borderTop: '1px solid var(--mantine-color-gray-2)' }}
      >
        <Text size="xs" c="dimmed">
          &copy; {new Date().getFullYear()} IIPC Learning Portal. All rights reserved.
        </Text>
      </Box>
    </AppShell>
  );
}