import React from 'react';
import { DashboardView } from '../features/dashboard/components/DashboardView';
import { SessionBuilderView } from '../features/sessions/components/SessionBuilderView';
import { UserGridView } from '../features/user-management/components/UserGridView';
import { UserProfileDetail } from '../features/user-management/components/UserProfileDetail';
import { WlsAssessmentPanel } from '../features/wls-assessment/components/WlsAssessmentPanel';

export function AppRoutes({ 
  activeTab, 
  setActiveTab, 
  selectedUser, 
  setSelectedUser, 
  currentUser 
}) {
  if (selectedUser) {
    return (
      <UserProfileDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  switch (activeTab) {
    case 'profile':
      return (
        <UserProfileDetail
          user={currentUser}
          onBack={() => setActiveTab('dashboard')}
        />
      );

    case 'builder':
    case 'wls-mgmt':
      return <SessionBuilderView onCreated={() => setActiveTab('dashboard')} />;

    case 'users':
      return <UserGridView onSelectUser={(user) => setSelectedUser(user)} />;

    case 'wls-session':
      return <DashboardView viewMode="active-sessions" />;

    case 'assessment':
      return <WlsAssessmentPanel currentUser={currentUser} activeTab={activeTab} />;

    case 'reports':
      return (
        <div style={{ padding: '2rem', background: '#ffffff', borderRadius: '12px', marginTop: '1rem' }}>
          <h2 style={{ margin: 0, marginBottom: '0.5rem', color: '#1e293b' }}>Analytics &amp; Reports</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Session attendance, video submission metrics, and completion reports.</p>
        </div>
      );

    case 'notifications':
      return (
        <div style={{ padding: '2rem', background: '#ffffff', borderRadius: '12px', marginTop: '1rem' }}>
          <h2 style={{ margin: 0, marginBottom: '0.5rem', color: '#1e293b' }}>Notifications Center</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Recent alerts, session updates, and submission reminders.</p>
        </div>
      );

    case 'dashboard':
    default:
      return <DashboardView />;
  }
}