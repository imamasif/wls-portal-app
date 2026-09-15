import React from 'react';
import { Group, Button, Menu } from '@mantine/core';
import { 
  IconLayoutDashboard, 
  IconSchool, 
  IconCalendarEvent, 
  IconChartBar, 
  IconSettings,
  IconUserCheck,
  IconUsers
} from '@tabler/icons-react';
import { isSuperUserRole } from '../../types/user';

export function NavigationMenu({ activeTab, setActiveTab, user }) {
  const isSuperUser = isSuperUserRole(user?.role);
  const isWlsAdmin = isSuperUser || user?.role === 'WLS_ADMIN';

  return (
    <Group gap="sm" mb="md">
      {/* Profile / Personal Dashboard Button */}
      <Button
        variant={activeTab === 'profile' ? 'filled' : 'light'}
        color="teal"
        leftSection={<IconLayoutDashboard size={18} />}
        onClick={() => setActiveTab('profile')}
      >
        My Profile
      </Button>

      {/* WLS Dropdown */}
      <Menu shadow="md" width={240} trigger="hover" openDelay={100} closeDelay={150}>
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

          {isSuperUser && (
            <Menu.Item
              leftSection={<IconUsers size={16} color="var(--mantine-color-cyan-6)" />}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}