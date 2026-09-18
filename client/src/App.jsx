// src/App.jsx
import React, { useState } from 'react';
import { MantineProvider, Container, Paper, Text } from '@mantine/core';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthModal } from './features/auth/components/AuthModal';
import { UserProfileDetail } from './features/user-management/components/UserProfileDetail';
import { UserGridView } from './features/user-management/components/UserGridView';
import { UserRole } from './types/user';

// Core Dashboard & Feature Imports
import { DashboardView } from './components/dashboard/DashboardView';
import { WlsStudentView } from './features/dashboard/components/WlsStudentView';
import { WlsManagementPanel } from './features/wls-management/components/WlsManagementPanel';
import { WlsAssessmentPanel } from './features/wls-assessment/components/WlsAssessmentPanel';
import { ReportingDashboard } from './features/reporting/components/WlsReportingDashboard'; // <-- Live DB Reporting Dashboard
import { NotificationPanel } from './features/notifications/components/NotificationPanel';

// Group Management Imports
import { WhatsAppGroupManager } from './features/group-management/WhatsAppGroupManager';
import { MSTeamGroupManager } from './features/group-management/MSTeamGroupManager';

export default function App() {
  const { user } = useAuth();
  
  // Set initial active tab to 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard');

  const activeRole = (user?.role || '').toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  return (
    <MantineProvider defaultColorScheme="light">
      <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <AuthModal />
        
<Container size="xl" py="lg" mt="md">          {/* 1. Dashboard View */}
          {activeTab === 'dashboard' && (
            <DashboardView setActiveTab={setActiveTab} />
          )}

          {/* 2. User Management Views */}
          {activeTab === 'users' && isSuperAdmin && (
            <UserGridView currentUser={user} />
          )}

          {activeTab === 'roles-control' && isSuperAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <Text size="lg" fw={600} mb="xs">Role & Access Control</Text>
              <Text size="sm" c="dimmed">Configure system roles, permissions matrix, and feature access boundaries.</Text>
            </Paper>
          )}

          {activeTab === 'user-activity' && isSuperAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <Text size="lg" fw={600} mb="xs">User Activity Logs</Text>
              <Text size="sm" c="dimmed">Track system logins, administrative changes, and security events.</Text>
            </Paper>
          )}

          {/* 3. Group Management Views */}
          {activeTab === 'whatsapp-groups' && isWlsAdmin && (
            <WhatsAppGroupManager />
          )}

          {activeTab === 'teams-groups' && isWlsAdmin && (
            <MSTeamGroupManager />
          )}

          {activeTab === 'university-portal' && isWlsAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <Text size="lg" fw={600} mb="xs">Online University Portals</Text>
              <Text size="sm" c="dimmed">Manage affiliated university links, partner resources, and external integration APIs.</Text>
            </Paper>
          )}

          {/* 4. WLS Management Views */}
          {(activeTab === 'wls-session' || activeTab === 'wls-assignment') && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <WlsStudentView user={user} />
            </Paper>
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

          {/* 5. Reporting & Notifications */}
          {activeTab === 'reports' && (
            <ReportingDashboard />
          )}

          {activeTab === 'notifications' && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <NotificationPanel />
            </Paper>
          )}

          {/* Fallback for profile editing triggered from header profile dropdown */}
          {activeTab === 'profile' && user && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <UserProfileDetail />
            </Paper>
          )}
        </Container>
      </MainLayout>
    </MantineProvider>
  );
}