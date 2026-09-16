import React, { useState } from 'react';
import { Container, Paper } from '@mantine/core';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthModal } from './features/auth/components/AuthModal';
import { UserProfileDetail } from './features/user-management/components/UserProfileDetail';
import { UserGridView } from './features/user-management/components/UserGridView';
import { isSuperUserRole } from './types/user';

// Updated import path and component name
import { WlsStudentView } from './features/dashboard/components/WlsStudentView';
import { WlsManagementPanel } from './features/wls-management/components/WlsManagementPanel';
import { WlsAssessmentPanel } from './features/wls-assessment/components/WlsAssessmentPanel';
import { CriteriaRuleEngine } from './features/criteria-engine/components/CriteriaRuleEngine';
import { ReportingManagement } from './features/reporting/components/ReportingManagement';
import { NotificationPanel } from './features/notifications/components/NotificationPanel';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('wls-session');

  const isSuperUser = isSuperUserRole(user?.role);
  const isWlsAdmin = isSuperUser || user?.role === 'WLS_ADMIN';

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AuthModal />
      <Container size="xl" py="md">
        {/* Profile Details Tab */}
        {activeTab === 'profile' && user && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <UserProfileDetail />
          </Paper>
        )}

        {/* WLS Student Portal View */}
        {(activeTab === 'wls-session' || activeTab === 'wls-assignment') && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <WlsStudentView user={user} />
          </Paper>
        )}

        {activeTab === 'users' && isSuperUser && (
          <UserGridView currentUser={user} />
        )}

        {activeTab === 'wls-mgmt' && isWlsAdmin && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <WlsManagementPanel />
          </Paper>
        )}

        {activeTab === 'assessment' && isWlsAdmin && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <WlsAssessmentPanel currentUser={user} activeTab={activeTab} />
          </Paper>
        )}

        {activeTab === 'criteria' && isSuperUser && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <CriteriaRuleEngine />
          </Paper>
        )}

        {activeTab === 'reports' && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <ReportingManagement userRole={user?.role} />
          </Paper>
        )}

        {activeTab === 'notifications' && (
          <Paper p="lg" radius="md" withBorder shadow="xs">
            <NotificationPanel />
          </Paper>
        )}
      </Container>
    </MainLayout>
  );
}