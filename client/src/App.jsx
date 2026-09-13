import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthModal } from './features/auth/components/AuthModal';
import { UserProfileDetail } from './features/user-management/components/UserProfileDetail';
import { UserGridView } from './features/user-management/components/UserGridView';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AuthModal />

      {activeTab === 'users' && user?.role === 'SUPER_USER' ? (
        /* SUPER USER: User Management Grid View */
        <UserGridView />
      ) : (
        /* DASHBOARD VIEW: User Profile Card & Weekly Sessions */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {user && <UserProfileDetail />}

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a' }}>
              Active Weekly Learning Sessions
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic' }}>
              No active sessions found. Create one using the WLS Session Builder.
            </p>
          </div>
        </div>
      )}
    </MainLayout>
  );
}