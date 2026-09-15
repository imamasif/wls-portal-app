import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthModal } from './features/auth/components/AuthModal';
import { UserProfileDetail } from './features/user-management/components/UserProfileDetail';
import { UserGridView } from './features/user-management/components/UserGridView';
import { isSuperUserRole } from './types/user';

// Import actual feature components
import { WlsManagementPanel } from './features/wls-management/components/WlsManagementPanel';
import { WlsAssessmentPanel } from './features/wls-assessment/components/WlsAssessmentPanel';
import { CriteriaRuleEngine } from './features/criteria-engine/components/CriteriaRuleEngine';
import { ReportingManagement } from './features/reporting/components/ReportingManagement';
import { NotificationPanel } from './features/notifications/components/NotificationPanel';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const isSuperUser = isSuperUserRole(user?.role);
  const isWlsAdmin = isSuperUser || user?.role === 'WLS_ADMIN';

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AuthModal />

      {/* 1. Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {user && <UserProfileDetail />}
        </div>
      )}

      {/* 2. User Management Tab (Super User Only) */}
      {activeTab === 'users' && isSuperUser && (
        <UserGridView currentUser={user} />
      )}

      {/* 3. WLS Session Builder (Admins Only) */}
      {activeTab === 'wls-mgmt' && isWlsAdmin && (
        <WlsManagementPanel />
      )}

      {/* 4. WLS Assessment & Grading (Admins Only) */}
      {activeTab === 'assessment' && isWlsAdmin && (
        <WlsAssessmentPanel />
      )}

      {/* 5. Criteria Rule Engine (Super Admin Only) */}
      {activeTab === 'criteria' && isSuperUser && (
        <CriteriaRuleEngine />
      )}

      {/* 6. Reports & Analytics */}
      {activeTab === 'reports' && (
        <ReportingManagement userRole={user?.role} />
      )}

      {/* 7. Notifications Directory */}
      {activeTab === 'notifications' && (
        <NotificationPanel />
      )}
    </MainLayout>
  );
}