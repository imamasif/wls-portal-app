import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSuperUserRole } from '../../types/user';
import styles from './MainLayout.module.css';

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, setShowAuthModal, logout } = useAuth();
  const isSuperUser = isSuperUserRole(user?.role);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
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
          <img src="/iipc-logo.png" alt="IIPC Logo" className={styles['brand-logo']} />
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
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles['bell-icon']}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className={styles['notification-badge']}>3</span>
              </button>

              {/* User Info & Dropdown Container */}
              <div className={styles['profile-dropdown-container']} ref={menuRef}>
                <div className={styles['user-info-trigger']} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <span className={`${styles['badge-role']} ${isSuperUser ? styles.superuser : styles.regular}`}>
                    {isSuperUser ? 'Super User' : 'User'}
                  </span>
                  <span className={styles['user-display-name']}>{user.name}</span>

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
                      ✏️ Edit Profile
                    </button>

                    <button 
                      className={styles['dropdown-item']}
                      onClick={() => {
                        setShowProfileMenu(false);
                        // Notifications click handler can be bound here
                      }}
                    >
                      🔔 Notifications
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
                      🚪 Sign Out
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

      {/* NAVIGATION TABS */}
      {user && (
        <nav className={styles['nav-tabs-bar']}>
          <button
            className={`${styles['nav-tab-btn']} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          
          {isSuperUser && (
            <button
              className={`${styles['nav-tab-btn']} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              User Management
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