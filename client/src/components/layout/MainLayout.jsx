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
  IconChartBar, 
  IconUsers, 
  IconChevronDown, 
  IconBell, 
  IconPencil, 
  IconLogout, 
  IconVideo,
  IconBrandWhatsapp,
  IconBrandTeams,
  IconBuildingBank,
  IconUserCheck,
  IconShieldLock,
  IconHistory
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, setShowAuthModal, logout } = useAuth();

  const activeRole = (user?.role || '').toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  const isWlsActive = ['wls-session', 'wls-mgmt', 'assessment', 'reports', 'wls-assignment'].includes(activeTab);
  const isUserMgmtActive = ['users', 'roles-control', 'user-activity'].includes(activeTab);
  const isGroupMgmtActive = ['whatsapp-groups', 'teams-groups', 'university-portal'].includes(activeTab);

  return (
    <AppShell header={{ height: 110 }} padding="md">
      {/* HEADER SECTION */}
      <AppShell.Header p="xs" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top Header Row */}
        <Group justify="space-between" align="center" px="md">
          {/* Brand Logo & Title */}
          <Group gap="sm">
            <img src="/iipc-logo.png" alt="IIPC Logo" style={{ height: 40 }} />
            <Box>
              <Title order={4} lh={1.2}>IIPC Learning Portal</Title>
              <Text size="xs" c="dimmed">Weekly Learning Sessions</Text>
            </Box>
          </Group>

          {/* Controls & Profile Dropdown */}
          <Group gap="md">
            {user ? (
              <>
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

                <Menu shadow="md" width={220} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge 
                        color={isSuperAdmin ? 'violet' : isWlsAdmin ? 'indigo' : 'blue'} 
                        variant="light"
                      >
                        {user?.role || 'STUDENT'}
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
            
            {/* 1. Dashboard (Replaced My Profile) */}
            <Button
              variant={activeTab === 'dashboard' ? 'filled' : 'subtle'}
              color="teal"
              leftSection={<IconLayoutDashboard size={18} />}
              onClick={() => setActiveTab('dashboard')}
              size="xs"
            >
              Dashboard
            </Button>

            {/* 2. User Management Dropdown */}
            {isSuperAdmin && (
              <Menu shadow="md" width={240} trigger="hover" openDelay={100} closeDelay={150}>
                <Menu.Target>
                  <Button
                    variant={isUserMgmtActive ? 'filled' : 'subtle'}
                    color="cyan"
                    leftSection={<IconUsers size={18} />}
                    rightSection={<IconChevronDown size={14} />}
                    size="xs"
                  >
                    User Management
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>User Controls</Menu.Label>
                  <Menu.Item 
                    leftSection={<IconUserCheck size={16} color="var(--mantine-color-cyan-6)" />}
                    onClick={() => setActiveTab('users')}
                  >
                    User Directory
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconShieldLock size={16} color="var(--mantine-color-grape-6)" />}
                    onClick={() => setActiveTab('roles-control')}
                  >
                    Role & Access Control
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconHistory size={16} color="var(--mantine-color-orange-6)" />}
                    onClick={() => setActiveTab('user-activity')}
                  >
                    User Activity Logs
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}

            {/* 3. Group Management Dropdown (Social Area + University Area) */}
            {isWlsAdmin && (
              <Menu shadow="md" width={250} trigger="hover" openDelay={100} closeDelay={150}>
                <Menu.Target>
                  <Button
                    variant={isGroupMgmtActive ? 'filled' : 'subtle'}
                    color="green"
                    leftSection={<IconBrandWhatsapp size={18} />}
                    rightSection={<IconChevronDown size={14} />}
                    size="xs"
                  >
                    Group Management
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Social Area</Menu.Label>
                  <Menu.Item 
                    leftSection={<IconBrandWhatsapp size={16} color="var(--mantine-color-green-6)" />}
                    onClick={() => setActiveTab('whatsapp-groups')}
                  >
                    WhatsApp Groups
                  </Menu.Item>
                  <Menu.Item 
                    leftSection={<IconBrandTeams size={16} color="var(--mantine-color-blue-6)" />}
                    onClick={() => setActiveTab('teams-groups')}
                  >
                    Microsoft Teams Groups
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Label>University Area</Menu.Label>
                  <Menu.Item 
                    leftSection={<IconBuildingBank size={16} color="var(--mantine-color-violet-6)" />}
                    onClick={() => setActiveTab('university-portal')}
                  >
                    Online University Portals
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}

            {/* 4. WLS Management Dropdown */}
            <Menu shadow="md" width={240} trigger="hover" openDelay={100} closeDelay={150}>
              <Menu.Target>
                <Button
                  variant={isWlsActive ? 'filled' : 'subtle'}
                  color="indigo"
                  leftSection={<IconSchool size={18} />}
                  rightSection={<IconChevronDown size={14} />}
                  size="xs"
                >
                  WLS Management
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Student Area</Menu.Label>
                <Menu.Item 
                  leftSection={<IconVideo size={16} color="var(--mantine-color-teal-6)" />}
                  onClick={() => setActiveTab('wls-session')}
                >
                  Active Sessions & Resources
                </Menu.Item>
                <Menu.Item 
                  leftSection={<IconChartBar size={16} color="var(--mantine-color-grape-6)" />}
                  onClick={() => setActiveTab('reports')}
                >
                  Analytics & Reports
                </Menu.Item>

                {isWlsAdmin && (
                  <>
                    <Menu.Divider />
                    <Menu.Label>Admin Controls</Menu.Label>
                    <Menu.Item 
                      leftSection={<IconTools size={16} color="var(--mantine-color-blue-6)" />}
                      onClick={() => setActiveTab('wls-mgmt')}
                    >
                      Session Builder
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconClipboardCheck size={16} color="var(--mantine-color-orange-6)" />}
                      onClick={() => setActiveTab('assessment')}
                    >
                      Assessments & Grading
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>

          </Group>
        )}
      </AppShell.Header>

      {/* MAIN CONTENT AREA */}
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