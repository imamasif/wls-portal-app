// src/components/common/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

export function Header({ user, activeTab, setActiveTab, notificationCount = 3 }) {
  return (
    <header className={styles.header}>
      {/* Left Section: Enlarged Logo & Title */}
      <div className={styles.leftSection}>
        <img src="/iipc-logo.png" alt="IIPC Logo" className={styles.logo} />
        <div className={styles.titleGroup}>
          <h1 className={styles.appTitle}>IIPC Learning Portal</h1>
          <span className={styles.appSubtitle}>Weekly Learning Sessions</span>
        </div>
      </div>

      {/* Right Section: Notification & User Profile Icon */}
      <div className={styles.rightSection}>
        {/* Notification Bell Icon */}
        <button 
          className={styles.notificationBtn}
          onClick={() => setActiveTab('notifications')}
        >
          🔔
          {notificationCount > 0 && (
            <span className={styles.badge}>{notificationCount}</span>
          )}
        </button>

        {/* Role Pill */}
        <span className={styles.roleTag}>{user?.role || 'SUPER USER'}</span>

        {/* Profile Avatar (Initials inside circle if no image) */}
        <div className={styles.avatarWrapper} onClick={() => setActiveTab('dashboard')}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="User Avatar" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarCircle}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}