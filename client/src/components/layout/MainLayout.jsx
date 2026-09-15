import React, { useState, useRef, useEffect } from 'react';
import { Menu, Button, UnstyledButton } from '@mantine/core';
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
  IconLogout 
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { isSuperUserRole } from '../../types/user';
import styles from './MainLayout.module.css';

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, setShowAuthModal, logout } = useAuth();
  const isSuperUser = isSuperUserRole(user?.role);
  const isWlsAdmin = isSuperUser || user?.role === 'WLS_ADMIN';

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Helper to determine if any WLS sub-tab is currently active
  const isWlsActive = ['wls-mgmt', 'assessment', 'criteria', 'reports'].includes(activeTab);

  // Close profile dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles['main-layout-wrapper']}>
      {/* HEADER */}
      <header className={styles['portal-header']}>
        <div className={styles['brand-section']}>
          <img src="/iipc-logo1.png" alt="IIPC Logo" className={styles['brand-logo']} />
          <div className={styles['brand-text']}>
            <h2 className={styles['portal-title']}>IIPC Learning Portal</h2>
            <span className={styles['portal-subtitle']}>Weekly Learning Sessions</span>
          </div>
        </div>

        <div className={styles['user-controls']}>
          {user ? (
            <>
              {/* Notification Bell Icon */}
              <button 
                className={styles['notification-btn']} 
                title="Notifications"
                aria-label="Notifications"
                onClick={() => setActiveTab('notifications')}
              >
                <IconBell size={18} className={styles['bell-icon']} />
                <span className={styles['notification-badge']}>3</span>
              </button>

              {/* User Info & Dropdown Container */}
              <div className={styles['profile-dropdown-container']} ref={menuRef}>
                <div className={styles['user-info-trigger']} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <span className={`${styles['badge-role']} ${isSuperUser ? styles.superuser : styles.regular}`}>
                    {isSuperUser ? 'Super User' : user?.role || 'User'}
                  </span>

                  {/* Profile Avatar Trigger */}
                  <button
                    className={styles['avatar-btn']}
                    aria-label="User Profile Menu"
                  >
                    {user.profilePictureUrl ? (
                      <img src={user.profilePictureUrl} alt={user.name} className={styles['avatar-img']} />
                    ) : (
                      <div className={styles['avatar-fallback']}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className={styles['dropdown-menu']}>
                    <div className={styles['dropdown-header']}>
                      <div className={styles['dropdown-user-name']}>{user.name}</div>
                      <div className={styles['dropdown-user-email']}>{user.email}</div>
                    </div>
                    
                    <button 
                      className={styles['dropdown-item']}
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowAuthModal(true);
                      }}
                    >
                      <IconPencil size={16} /> Edit Profile
                    </button>

                    <button 
                      className={styles['dropdown-item']}
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('notifications');
                      }}
                    >
                      <IconBell size={16} /> Notifications
                      <span className={styles['dropdown-badge']}>3</span>
                    </button>

                    <div className={styles['dropdown-divider']} />

                    <button 
                      className={`${styles['dropdown-item']} ${styles['danger']}`}
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                    >
                      <IconLogout size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className={styles['btn-auth-signin']} onClick={() => setShowAuthModal(true)}>
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* NAVIGATION TABS BAR WITH WLS DROPDOWN */}
{user && (
  <nav className={styles['nav-tabs-bar']}>
    {/* 1. Dashboard */}
    <button
      className={`${styles['nav-tab-btn']} ${activeTab === 'dashboard' ? styles.active : ''}`}
      onClick={() => setActiveTab('dashboard')}
    >
      <IconLayoutDashboard size={18} color={activeTab === 'dashboard' ? '#0ca678' : '#687588'} />
      <span>Dashboard</span>
    </button>

    {/* 2. Unified WLS Parent Dropdown Menu */}
    <Menu shadow="md" width={220} trigger="hover" openDelay={100} closeDelay={150}>
      <Menu.Target>
        <button className={`${styles['nav-tab-btn']} ${isWlsActive ? styles.active : ''}`}>
          <IconSchool size={18} color={isWlsActive ? '#0ca678' : '#0ca678'} />
          <span>Weekly Leadership Session (WLS)</span>
          <IconChevronDown size={14} style={{ marginLeft: 2 }} />
        </button>
      </Menu.Target>

      <Menu.Dropdown>
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
      <button
        className={`${styles['nav-tab-btn']} ${activeTab === 'users' ? styles.active : ''}`}
        onClick={() => setActiveTab('users')}
      >
        <IconUsers size={18} color={activeTab === 'users' ? '#0ca678' : '#228be6'} />
        <span>User Management</span>
      </button>
    )}
  </nav>
)}

      {/* MAIN BODY */}
      <main className={styles['main-content']}>
        {children}
      </main>

      {/* FOOTER */}
      <footer className={styles['portal-footer']}>
        &copy; {new Date().getFullYear()} IIPC Learning Portal. All rights reserved.
      </footer>
    </div>
  );
}