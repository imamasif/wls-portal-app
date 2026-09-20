import React, { useState, useEffect } from 'react';
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
  IconBrandTeams,
  IconShieldCheck // <-- Import this
} from '@tabler/icons-react';

// Icon mapping dictionary to link database menuKeys to Tabler icons
const ICON_MAP = {
  dashboard: <IconLayoutDashboard size={18} />,
  user_management: <IconUsers size={18} />,
  group_management: <IconUsers size={18} />,
  wls_management: <IconSchool size={18} />,
  wls_active_sessions: <IconCalendarEvent size={16} color="var(--mantine-color-teal-6)" />,
  wls_analytics_reports: <IconChartBar size={16} color="var(--mantine-color-grape-6)" />,
  wls_session_builder: <IconSettings size={16} color="var(--mantine-color-blue-6)" />,
  wls_assessments_grading: <IconUserCheck size={16} color="var(--mantine-color-orange-6)" />,
  menu_permissions_matrix: <IconShieldCheck size={16} color="var(--mantine-color-red-6)" /> // <-- Add this line
};

export function NavigationMenu({ activeTab, setActiveTab, user, currentUser }) {
  const activeRole = (user?.role || currentUser?.role || 'USER').toUpperCase();
  const [menuTree, setMenuTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch multi-level menu structure from your backend API based on active role
    fetch(`/api/menu-permissions?role=${activeRole}`)
      .then(res => res.json())
      .then(flatMenus => {
        setMenuTree(buildMenuHierarchy(flatMenus));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dynamic navigation', err);
        setLoading(false);
      });
  }, [activeRole]);

  // Helper function to structure flat database items into a parent/child tree
  const buildMenuHierarchy = (items) => {
    const map = {};
    const roots = [];

    items.forEach(item => {
      // Normalize _id or id depending on Mongoose response format
      const id = item.id || item._id;
      map[id] = { ...item, id, children: [] };
    });

    items.forEach(item => {
      const id = item.id || item._id;
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(map[id]);
      } else {
        roots.push(map[id]);
      }
    });

    roots.sort((a, b) => a.order - b.order);
    roots.forEach(root => root.children.sort((a, b) => a.order - b.order));
    return roots;
  };

  if (loading) return null; // or a simple loader skeleton

  return (
    <Group gap="sm" mb="md">
      {menuTree.map(menuItem => {
        const hasChildren = menuItem.children && menuItem.children.length > 0;
        const icon = ICON_MAP[menuItem.menuKey] || <IconLayoutDashboard size={18} />;

        // If it has children, render as a Mantine Dropdown Menu
        if (hasChildren) {
          const isChildActive = menuItem.children.some(child => child.path === activeTab || child.menuKey === activeTab);
          
          return (
            <Menu key={menuItem.id} shadow="md" width={240} trigger="hover" openDelay={100} closeDelay={150}>
              <Menu.Target>
                <Button
                  variant={isChildActive ? 'filled' : 'light'}
                  color="indigo"
                  leftSection={icon}
                >
                  {menuItem.label}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Navigation Options</Menu.Label>
                {menuItem.children.map(child => {
                  const childIcon = ICON_MAP[child.menuKey] || <IconCalendarEvent size={16} />;
                  return (
                    <Menu.Item
                      key={child.id}
                      leftSection={childIcon}
                      onClick={() => setActiveTab(child.menuKey)}
                    >
                      {child.label}
                    </Menu.Item>
                  );
                })}
              </Menu.Dropdown>
            </Menu>
          );
        }

        // Otherwise, render as a standard top-level button tab
        const isActive = activeTab === menuItem.menuKey || activeTab === menuItem.path;
        return (
          <Button
            key={menuItem.id}
            variant={isActive ? 'filled' : 'light'}
            color="teal"
            leftSection={icon}
            onClick={() => setActiveTab(menuItem.menuKey)}
          >
            {menuItem.label}
          </Button>
        );
      })}
    </Group>
  );
}