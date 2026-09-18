import React from 'react';
import { Group, Button, Menu } from '@mantine/core';
import { 
  IconLayoutDashboard, 
  IconSchool, 
  IconCalendarEvent, 
  IconChartBar, 
  IconSettings,
  IconUserCheck,
  IconUsers,
  IconBrandWhatsapp,
  IconBrandTeams // <-- Import Teams icon
} from '@tabler/icons-react';
import { UserRole } from '../../types/user';

export function NavigationMenu({ activeTab, setActiveTab, user, currentUser }) {
  const activeRole = (user?.role || currentUser?.role || '').toUpperCase();

  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  return (
    <Group gap="sm" mb="md">
      {/* 1. My Profile */}
      <Button
        variant={activeTab === 'profile' ? 'filled' : 'light'}
        color="teal"
        leftSection={<IconLayoutDashboard size={18} />}
        onClick={() => setActiveTab('profile')}
      >
        My Profile
      </Button>

      {/* 2. User Management */}
      {isSuperAdmin && (
        <Button
          variant={activeTab === 'users' ? 'filled' : 'light'}
          color="cyan"
          leftSection={<IconUsers size={18} />}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </Button>
      )}

      {/* 3. Social & University Groups Dropdown */}
      {isWlsAdmin && (
        <Menu shadow="md" width={220} trigger="hover" openDelay={100} closeDelay={150}>
          <Menu.Target>
            <Button
              variant={['whatsapp-groups', 'teams-groups'].includes(activeTab) ? 'filled' : 'light'}
              color="green"
              leftSection={<IconBrandWhatsapp size={18} />}
            >
              Social & University Groups
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Platform Groups</Menu.Label>
            <Menu.Item
              leftSection={<IconBrandWhatsapp size={16} color="var(--mantine-color-green-6)" />}
              onClick={() => setActiveTab('whatsapp-groups')}
            >
              WhatsApp Groups
            </Menu.Item>

            <Menu.Item
              leftSection={<IconBrandTeams size={16} color="var(--mantine-color-indigo-6)" />}
              onClick={() => setActiveTab('teams-groups')}
            >
              MS Teams Groups
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}

      {/* 4. Weekly Leadership Session (WLS) Dropdown */}
      <Menu shadow="md" width={260} trigger="hover" openDelay={100} closeDelay={150}>
        <Menu.Target>
          <Button
            variant={['wls-session', 'wls-mgmt', 'assessment', 'reports'].includes(activeTab) ? 'filled' : 'subtle'}
            color="indigo"
            leftSection={<IconSchool size={18} />}
          >
            Weekly Leadership Session (WLS)
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Student Area</Menu.Label>
          <Menu.Item
            leftSection={<IconCalendarEvent size={16} color="var(--mantine-color-teal-6)" />}
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
                leftSection={<IconSettings size={16} color="var(--mantine-color-blue-6)" />}
                onClick={() => setActiveTab('wls-mgmt')}
              >
                Session Builder & Management
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUserCheck size={16} color="var(--mantine-color-orange-6)" />}
                onClick={() => setActiveTab('assessment')}
              >
                Assessments & Grading
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}