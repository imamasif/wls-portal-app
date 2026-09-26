import React, { useState, useEffect } from "react";
import { MantineProvider, Container } from "@mantine/core";
import { useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/MainLayout";
import { UserRole } from "./types/user";

// Dashboards inside drop-main-menu folder
import { SuperUserDB } from "./features/menu/components/dashboard/SuperUserDB";
import { WlsAdminDB } from "./features/menu/components/dashboard/WlsAdminDB";
import { UserDB } from "./features/menu/components/dashboard/UserDB";

import { UserGridView } from "./features/user-management/components/UserGridView";
import { WhatsAppGroupManager } from "./features/group-management/WhatsAppGroupManager";
import { MSTeamGroupManager } from "./features/group-management/MSTeamGroupManager";
import { UniversityPortalDashboard } from "./features/university/components/UniversityPortalDashboard";
import { WlsStudentView } from "./features/dashboard/components/WlsStudentView";
import { WlsManagementPanel } from "./features/wls-management/components/WlsManagementPanel";
import { WlsAssessmentPanel } from "./features/wls-assessment/components/WlsAssessmentPanel";
import { ReportingDashboard } from "./features/reporting/components/WlsReportingDashboard";
import { NotificationPanel } from "./features/notifications/components/NotificationPanel";
import { EditProfileCard } from "./components/profile/EditProfileCard";
import { LoginPage } from "./features/auth/components/LoginPage";
import {
  QuizListScreen,
  QuizAdminWorkspace,
  QuizReportDashboard,
  QuizStudentView,
} from "./features/quiz-management";

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user ? "dashboard" : "login");
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState(null);

  useEffect(() => {
    if (!user) setActiveTab("login");
    else if (user && activeTab === "login") setActiveTab("dashboard");
  }, [user]);

  if (!user) {
    return (
      <MantineProvider defaultColorScheme="light">
        <Container size="lg" py={80}>
          <LoginPage
            onSuccess={() => setActiveTab("dashboard")}
            onSwitchToRegister={() => setActiveTab("register")}
          />
        </Container>
      </MantineProvider>
    );
  }

  const activeRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  const renderDashboard = () => {
    if (isSuperAdmin) return <SuperUserDB setActiveTab={setActiveTab} />;
    if (isWlsAdmin) return <WlsAdminDB setActiveTab={setActiveTab} />;
    return <UserDB setActiveTab={setActiveTab} />;
  };

  return (
    <MantineProvider defaultColorScheme="light">
      <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Container size="xl" py="lg" mt="md">
          {activeTab === "dashboard" && renderDashboard()}

          {activeTab === "users" && isSuperAdmin && (
            <UserGridView currentUser={user} />
          )}
          {activeTab === "whatsapp-groups" && isWlsAdmin && (
            <WhatsAppGroupManager user={user} />
          )}
          {activeTab === "teams-groups" && isWlsAdmin && (
            <MSTeamGroupManager user={user} />
          )}
          {activeTab === "university-portal" && isWlsAdmin && (
            <UniversityPortalDashboard user={user} />
          )}

          {(activeTab === "wls-session" || activeTab === "wls-assignment") && (
            <WlsStudentView user={user} />
          )}
          {(activeTab === "wls-mgmt" || activeTab === "wls_admin") &&
            isWlsAdmin && <WlsManagementPanel user={user} />}
          {activeTab === "assessment" && isWlsAdmin && (
            <WlsAssessmentPanel currentUser={user} activeTab={activeTab} />
          )}

          {activeTab === "reports" && <ReportingDashboard />}
          {activeTab === "notifications" && <NotificationPanel user={user} />}
          {activeTab === "edit-profile" && (
            <EditProfileCard
              targetUser={user}
              onCancel={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "quiz-list" && isWlsAdmin && (
            <QuizListScreen
              onEditQuiz={(q) => {
                setSelectedQuizForEdit(q);
                setActiveTab("quiz-studio");
              }}
            />
          )}
          {activeTab === "quiz-studio" && isWlsAdmin && (
            <QuizAdminWorkspace
              initialQuizData={selectedQuizForEdit}
              onSave={() => setActiveTab("quiz-list")}
            />
          )}
          {activeTab === "quiz-reports" && isWlsAdmin && (
            <QuizReportDashboard user={user} />
          )}
          {activeTab === "quiz-student" && <QuizStudentView user={user} />}
        </Container>
      </MainLayout>
    </MantineProvider>
  );
}
