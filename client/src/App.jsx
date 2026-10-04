import React, { useState, useEffect } from "react";
import { MantineProvider, Container } from "@mantine/core";
import { useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/MainLayout";
import { UserRole, AppTab } from "./types/user";

// Dashboards inside drop-main-menu folder
import { SuperUserDB } from "./features/menu/components/dashboard/SuperUserDB";
import { WlsAdminDB } from "./features/menu/components/dashboard/WlsAdminDB";
import { UserDB } from "./features/menu/components/dashboard/UserDB";

import { UserGridView } from "./features/user-management/components/UserGridView";
import { WhatsAppGroupManager } from "./features/group-management/WhatsAppGroupManager";
import { MSTeamGroupManager } from "./features/group-management/MSTeamGroupManager";
import { UniversityPortalDashboard } from "./features/university/components/UniversityPortalDashboard";
import { WlsStudentView } from "./features/wls-management/components/WlsStudentView";
import { WlsManagementPanel } from "./features/wls-management/components/WlsManagementPanel";
import { WlsAssessmentPanel } from "./features/wls-assessment/components/WlsAssessmentPanel";
import { WlsReportingDashboard } from "./features/reporting/components/WlsReportingDashboard";
import { NotificationPanel } from "./features/notifications/components/NotificationPanel";
import { EditProfileCard } from "./components/profile/EditProfileCard";
import { LoginPage } from "./features/auth/components/LoginPage";
import { WlsAttendanceMonitoringPanel } from "./features/wls-attendance-monitoring/components/WlsAttendanceMonitoringPanel";
import { WlsClassAttendancePanel } from "./features/wls-attendance-monitoring/components/WlsClassAttendancePanel";
import { StickyNotesPanel } from "./features/sticky-notes/components/StickyNotesPanel";
import QuranVerseMemorizerPanel from "./features/quran-reference-memorizer/components/QuranVerseMemorizerPanel";

import {
  QuizListScreen,
  QuizAdminWorkspace,
  QuizReportDashboard,
  QuizStudentView,
} from "./features/quiz-management";

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user ? AppTab.DASHBOARD : AppTab.LOGIN,
  );
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState(null);

  useEffect(() => {
    if (!user) setActiveTab(AppTab.LOGIN);
    else if (user && activeTab === AppTab.LOGIN) setActiveTab(AppTab.DASHBOARD);
  }, [user]);

  // Define role variables and renderDashboard helper BEFORE conditional checks
  const activeRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  const renderDashboard = () => {
    if (isSuperAdmin) return <SuperUserDB setActiveTab={setActiveTab} />;
    if (isWlsAdmin) return <WlsAdminDB setActiveTab={setActiveTab} />;
    return <UserDB setActiveTab={setActiveTab} />;
  };

  if (!user) {
    return (
      <MantineProvider defaultColorScheme="light">
        <Container size="lg" py={80}>
          <LoginPage
            onSuccess={() => setActiveTab(AppTab.DASHBOARD)}
            onSwitchToRegister={() => setActiveTab(AppTab.REGISTER)}
          />
        </Container>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider defaultColorScheme="light">
      <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Container size="xl" py="md">
          {activeTab === AppTab.DASHBOARD && renderDashboard()}
          {activeTab === AppTab.USERS && isSuperAdmin && (
            <UserGridView currentUser={user} />
          )}
          {activeTab === AppTab.WHATSAPP_GROUPS && isWlsAdmin && (
            <WhatsAppGroupManager user={user} />
          )}
          {activeTab === AppTab.TEAMS_GROUPS && isWlsAdmin && (
            <MSTeamGroupManager user={user} />
          )}
          {activeTab === AppTab.UNIVERSITY_PORTAL && isWlsAdmin && (
            <UniversityPortalDashboard user={user} />
          )}
          {(activeTab === AppTab.WLS_SESSION ||
            activeTab === AppTab.WLS_ASSIGNMENT) && (
            <WlsStudentView user={user} currentUser={user} />
          )}
          {(activeTab === AppTab.WLS_MGMT || activeTab === AppTab.WLS_ADMIN) &&
            isWlsAdmin && <WlsManagementPanel user={user} />}
          {activeTab === AppTab.ASSESSMENT && isWlsAdmin && (
            <WlsAssessmentPanel currentUser={user} activeTab={activeTab} />
          )}
          {activeTab === AppTab.REPORTS && <WlsReportingDashboard />}
          {activeTab === AppTab.NOTIFICATIONS && (
            <NotificationPanel user={user} />
          )}
          {activeTab === AppTab.EDIT_PROFILE && (
            <EditProfileCard
              targetUser={user}
              onCancel={() => setActiveTab(AppTab.DASHBOARD)}
            />
          )}
          {activeTab === AppTab.QUIZ_LIST && isWlsAdmin && (
            <QuizListScreen
              onEditQuiz={(q) => {
                setSelectedQuizForEdit(q);
                setActiveTab(AppTab.QUIZ_STUDIO);
              }}
            />
          )}
          {activeTab === AppTab.QUIZ_STUDIO && isWlsAdmin && (
            <QuizAdminWorkspace
              initialQuizData={selectedQuizForEdit}
              onSave={() => setActiveTab(AppTab.QUIZ_LIST)}
            />
          )}
          {activeTab === AppTab.QUIZ_REPORTS && isWlsAdmin && (
            <QuizReportDashboard user={user} />
          )}
          {activeTab === AppTab.QUIZ_STUDENT && <QuizStudentView user={user} />}
          {activeTab === AppTab.WLS_ATTENDANCE_MONITORING && isWlsAdmin && (
            <WlsAttendanceMonitoringPanel user={user} />
          )}
          {activeTab === AppTab.WLS_CLASS_ATTENDANCE && (
            <WlsClassAttendancePanel user={user} />
          )}
          {activeTab === AppTab.STICKY_NOTES && (
            <StickyNotesPanel user={user} />
          )}
          {activeTab === AppTab.QURAN_MEMORIZER && (
            <QuranVerseMemorizerPanel user={user} />
          )}
        </Container>
      </MainLayout>
    </MantineProvider>
  );
}
