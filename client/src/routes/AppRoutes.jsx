import React from 'react';
import { Paper, Title, Text } from '@mantine/core';
import { DashboardView } from '../features/dashboard/components/WlsStudentView';
import { SessionBuilderView } from '../features/sessions/components/SessionBuilderView';
import { UserGridView } from '../features/user-management/components/UserGridView';
import { UserProfileDetail } from '../features/user-management/components/UserProfileDetail';
import { WlsAssessmentPanel } from '../features/wls-assessment/components/WlsAssessmentPanel';
import { SocialGroupsManagement } from '../features/user-management/components/SocialGroupsManagement';
import { isSuperUserRole } from '../types/user';

export function AppRoutes({ 
  activeTab, 
  setActiveTab, 
  selectedUser, 
  setSelectedUser, 
  currentUser 
}) {
  const isSuperUser = isSuperUserRole(currentUser?.role);
  const isWlsAdmin = isSuperUser || currentUser?.role === 'WLS_ADMIN';

  if (selectedUser) {
    return (
      <UserProfileDetail
        user={selectedUser}
        currentUser={currentUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  switch (activeTab) {
    case 'profile':
      return (
        <UserProfileDetail
          user={currentUser}
          currentUser={currentUser}
          onBack={() => setActiveTab('dashboard')}
        />
      );

    case 'builder':
    case 'wls-mgmt':
      return <SessionBuilderView onCreated={() => setActiveTab('dashboard')} />;

    case 'users':
      return <UserGridView onSelectUser={(user) => setSelectedUser(user)} />;

    case 'social-groups':
      if (!isWlsAdmin) {
        return <DashboardView user={currentUser} />;
      }
      return <SocialGroupsManagement currentUser={currentUser} />;

    /* Added 'wls-assignment' to route WLS student view correctly */
    case 'wls-assignment':
    case 'wls-session':
      return <DashboardView user={currentUser} viewMode="active-sessions" />;

    case 'assessment':
      return <WlsAssessmentPanel currentUser={currentUser} activeTab={activeTab} />;

    case 'criteria':
      return (
        <Paper p="xl" radius="md" mt="md" bg="white">
          <Title order={2} c="dark.8">Rule Engine &amp; Criteria</Title>
          <Text c="dimmed">Configure evaluation rules and assessment criteria.</Text>
        </Paper>
      );

    case 'reports':
      return (
        <Paper p="xl" radius="md" mt="md" bg="white">
          <Title order={2} c="dark.8">Analytics &amp; Reports</Title>
          <Text c="dimmed">Session attendance, video submission metrics, and completion reports.</Text>
        </Paper>
      );

    case 'notifications':
      return (
        <Paper p="xl" radius="md" mt="md" bg="white">
          <Title order={2} c="dark.8">Notifications Center</Title>
          <Text c="dimmed">Recent alerts, session updates, and submission reminders.</Text>
        </Paper>
      );

    case 'dashboard':
    default:
      return <DashboardView user={currentUser} />;
  }
}