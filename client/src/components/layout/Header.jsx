import React from 'react';
import './Header.css';

export function Header({ currentUser, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <h2>WLS Portal</h2>
          <span className="header-badge">{currentUser?.role || 'Guest'}</span>
        </div>
        {currentUser && (
          <div className="header-user">
            <span className="header-username">Welcome, {currentUser.name}</span>
            {onLogout && (
              <button onClick={onLogout} className="header-logout-btn">
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}