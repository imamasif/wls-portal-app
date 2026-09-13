import React from 'react';
import { DashboardView } from '../features/dashboard/components/DashboardView';
import { SessionBuilderView } from '../features/sessions/components/SessionBuilderView';
import { UserGridView } from '../features/user-management/components/UserGridView';
import { UserProfileDetail } from '../features/user-management/components/UserProfileDetail';

export function AppRoutes({ activeTab, setActiveTab, selectedUser, setSelectedUser }) {
  if (selectedUser) {
    return (
      <UserProfileDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  switch (activeTab) {
    case 'builder':
      return <SessionBuilderView onCreated={() => setActiveTab('dashboard')} />;
    case 'users':
      return <UserGridView onSelectUser={(user) => setSelectedUser(user)} />;
    case 'dashboard':
    default:
      return <DashboardView />;
  }
}