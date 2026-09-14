import React, { useState, useRef, useEffect } from 'react';
import './UserAvatarMenu.css';

export function UserAvatarMenu({ user, onSignOut, onOpenProfile, onOpenNotifications }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name 
    ? user.name.slice(0, 2).toUpperCase() 
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : 'U');

  return (
    <div ref={menuRef} className="avatar-menu-container">
      <button
        onClick={() => setOpen(!open)}
        className="avatar-trigger-btn"
      >
        {user?.profilePictureUrl ? (
          <img src={user.profilePictureUrl} alt="User Avatar" className="avatar-img" />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {open && (
        <div className="avatar-dropdown-menu">
          <div className="dropdown-header">
            <p className="dropdown-user-name">{user?.name || 'User'}</p>
            <p className="dropdown-user-email">{user?.email}</p>
            <span className="dropdown-user-role">
              {user?.role || 'USER'}
            </span>
          </div>

          <button onClick={() => { setOpen(false); if (onOpenProfile) onOpenProfile(); }} className="dropdown-item-btn">
            👤 View Profile
          </button>
          <button onClick={() => { setOpen(false); if (onOpenNotifications) onOpenNotifications(); }} className="dropdown-item-btn">
            🔔 Notifications
          </button>
          
          <div className="dropdown-divider" />
          
          <button onClick={() => { setOpen(false); if (onSignOut) onSignOut(); }} className="dropdown-item-btn btn-signout">
            🚪 Sign Out
          </button>
        </div>
      )}
    </div>
  );
}