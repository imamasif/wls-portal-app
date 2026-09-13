import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, setShowAuthModal, logout } = useAuth();

  const isSuperUser = user?.role === 'SUPER_USER';

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/iipc-logo.png" alt="IIPC Logo" style={{ height: '38px' }} />
          <div>
            <h2 className="portal-title" style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>IIPC Learning Portal</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Weekly Learning Sessions</span>
          </div>
        </div>

        <div className="user-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <span style={{ background: isSuperUser ? '#e0f2fe' : '#f1f5f9', color: isSuperUser ? '#0369a1' : '#475569', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                {isSuperUser ? 'Super User' : 'User'}
              </span>
              <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>{user.name}</span>
              <button
                style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                onClick={() => setShowAuthModal(true)}
              >
                ✏️ Edit My Profile
              </button>
              <button
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                onClick={logout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => setShowAuthModal(true)}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* NAVIGATION TABS */}
      {user && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: '8px' }}>
          <button
            style={{ padding: '12px 16px', border: 'none', background: 'none', borderBottom: activeTab === 'dashboard' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'dashboard' ? '#0284c7' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          
          {isSuperUser && (
            <button
              style={{ padding: '12px 16px', border: 'none', background: 'none', borderBottom: activeTab === 'users' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'users' ? '#0284c7' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => setActiveTab('users')}
            >
              User Management Grid
            </button>
          )}
        </div>
      )}

      {/* MAIN BODY */}
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}