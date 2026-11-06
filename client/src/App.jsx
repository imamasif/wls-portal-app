import React, { useState, useEffect, Suspense, lazy } from "react";
import { Container, Center, Loader } from "@mantine/core";
import { useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/MainLayout";
import { UserRole, AppTab } from "./types/user";
import { LoginPage } from "./features/auth/components/LoginPage";

// Code-split heavy views to ensure ultra-fast initial page loads and prevent mobile memory/parser exhaustion
const SuperUserDB = lazy(() => import("./features/menu/components/dashboard/SuperUserDB").then(m => ({ default: m.SuperUserDB })));
const WlsAdminDB = lazy(() => import("./features/menu/components/dashboard/WlsAdminDB").then(m => ({ default: m.WlsAdminDB })));
const UserDB = lazy(() => import("./features/menu/components/dashboard/UserDB").then(m => ({ default: m.UserDB })));

const UserGridView = lazy(() => import("./features/user-management/components/UserGridView").then(m => ({ default: m.UserGridView })));
const WhatsAppGroupManager = lazy(() => import("./features/group-management/WhatsAppGroupManager").then(m => ({ default: m.WhatsAppGroupManager })));
const MSTeamGroupManager = lazy(() => import("./features/group-management/MSTeamGroupManager").then(m => ({ default: m.MSTeamGroupManager })));
const UniversityPortalDashboard = lazy(() => import("./features/university/components/UniversityPortalDashboard").then(m => ({ default: m.UniversityPortalDashboard || m.default })));
const WlsStudentView = lazy(() => import("./features/wls-management/components/WlsStudentView").then(m => ({ default: m.WlsStudentView })));
const WlsManagementPanel = lazy(() => import("./features/wls-management/components/WlsManagementPanel").then(m => ({ default: m.WlsManagementPanel || m.default })));
const WlsAssessmentPanel = lazy(() => import("./features/wls-assessment/components/WlsAssessmentPanel").then(m => ({ default: m.WlsAssessmentPanel })));
const WlsReportingDashboard = lazy(() => import("./features/reporting/components/WlsReportingDashboard").then(m => ({ default: m.WlsReportingDashboard || m.default })));
const NotificationPanel = lazy(() => import("./features/notifications/components/NotificationPanel").then(m => ({ default: m.NotificationPanel || m.default })));
const EditProfileCard = lazy(() => import("./components/profile/EditProfileCard").then(m => ({ default: m.EditProfileCard })));
const WlsAttendanceMonitoringPanel = lazy(() => import("./features/wls-attendance-monitoring/components/WlsAttendanceMonitoringPanel").then(m => ({ default: m.WlsAttendanceMonitoringPanel })));
const WlsClassAttendancePanel = lazy(() => import("./features/wls-attendance-monitoring/components/WlsClassAttendancePanel").then(m => ({ default: m.WlsClassAttendancePanel })));
const StickyNotesPanel = lazy(() => import("./features/sticky-notes/components/StickyNotesPanel").then(m => ({ default: m.StickyNotesPanel })));
const QuranVerseMemorizerPanel = lazy(() => import("./features/quran-reference-memorizer/components/QuranVerseMemorizerPanel"));
const QuranStickyNotesExplorer = lazy(() => import("./features/quran-reference-memorizer/components/QuranStickyNotesExplorer").then(m => ({ default: m.QuranStickyNotesExplorer })));
const AyatManagerView = lazy(() => import("./features/quran-reference-memorizer/components/AyatManagerView").then(m => ({ default: m.AyatManagerView })));
const QuranLectureReferenceNotebook = lazy(() => import("./features/quran-reference-memorizer/components/QuranLectureReferenceNotebook").then(m => ({ default: m.QuranLectureReferenceNotebook })));
const SuperUserAssessmentOverview = lazy(() => import("./features/wls-assessment/components/SuperUserAssessmentOverview").then(m => ({ default: m.SuperUserAssessmentOverview })));

const IipcEventsSuperUserPanel = lazy(() => import("./features/iipc-events").then(m => ({ default: m.IipcEventsSuperUserPanel })));
const IipcEventsUserView = lazy(() => import("./features/iipc-events").then(m => ({ default: m.IipcEventsUserView })));
const PublicEventDonationPage = lazy(() => import("./features/iipc-events").then(m => ({ default: m.PublicEventDonationPage })));

const QuizListScreen = lazy(() => import("./features/quiz-management").then(m => ({ default: m.QuizListScreen })));
const QuizCreatorStudio = lazy(() => import("./features/quiz-management").then(m => ({ default: m.QuizCreatorStudio })));
const QuizReportDashboard = lazy(() => import("./features/quiz-management").then(m => ({ default: m.QuizReportDashboard })));
const QuizStudentView = lazy(() => import("./features/quiz-management").then(m => ({ default: m.QuizStudentView })));

const ViewLoadingFallback = () => (
  <Center py={60}>
    <Loader size="lg" color="blue" />
  </Center>
);

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user ? AppTab.DASHBOARD : AppTab.LOGIN,
  );
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState(null);

  // Check if URL has public campaign link parameter (?event=... or ?eventId=...)
  const getPublicEventIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("event") || params.get("eventId") || params.get("appeal") || null;
    } catch {
      return null;
    }
  };

  const [publicEventId, setPublicEventId] = useState(getPublicEventIdFromUrl());

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
    if (publicEventId) {
      return (
        <Suspense fallback={<ViewLoadingFallback />}>
          <PublicEventDonationPage
            eventId={publicEventId}
            onGoToLogin={() => setPublicEventId(null)}
          />
        </Suspense>
      );
    }
    return (
      <Container size="lg" py={{ base: 40, sm: 80 }}>
        <LoginPage
          onSuccess={() => setActiveTab(AppTab.DASHBOARD)}
          onSwitchToRegister={() => setActiveTab(AppTab.REGISTER)}
        />
      </Container>
    );
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Container size="xl" py={{ base: "xs", sm: "md" }} px={{ base: 4, sm: "xs", md: "md" }} style={{ maxWidth: "100%", width: "100%" }}>
        <Suspense fallback={<ViewLoadingFallback />}>
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
            <WlsAssessmentPanel
              currentAdminId={user?.id || user?._id}
              currentAdminName={user?.name}
              currentUser={user}
              activeTab={activeTab}
            />
          )}

          {activeTab === AppTab.ASSESSMENT_OVERVIEW && isSuperAdmin && (
            <SuperUserAssessmentOverview currentUser={user} />
          )}

          {activeTab === AppTab.REPORTS && (
            <WlsReportingDashboard currentUser={user} />
          )}
          {activeTab === AppTab.NOTIFICATIONS && (
            <NotificationPanel user={user} setActiveTab={setActiveTab} />
          )}
          {activeTab === AppTab.EDIT_PROFILE && (
            <EditProfileCard
              targetUser={user}
              onCancel={() => setActiveTab(AppTab.DASHBOARD)}
            />
          )}
          {activeTab === AppTab.QUIZ_LIST && isWlsAdmin && (
            <QuizListScreen
              onCreateNew={() => {
                setSelectedQuizForEdit(null);
                setActiveTab(AppTab.QUIZ_STUDIO);
              }}
              onEditQuiz={(quiz) => {
                setSelectedQuizForEdit(quiz);
                setActiveTab(AppTab.QUIZ_STUDIO);
              }}
            />
          )}

          {/* Quiz Creator Studio (Create / Edit) */}
          {activeTab === AppTab.QUIZ_STUDIO && isWlsAdmin && (
            <QuizCreatorStudio
              key={
                selectedQuizForEdit?._id ||
                selectedQuizForEdit?.id ||
                "new-quiz"
              }
              quizToEdit={selectedQuizForEdit}
              onSaveComplete={(savedQuiz) => {
                setSelectedQuizForEdit(null);
                setActiveTab(AppTab.QUIZ_LIST);
              }}
            />
          )}

          {/* Analytics & Performance Reports */}
          {activeTab === AppTab.QUIZ_REPORTS && isWlsAdmin && (
            <QuizReportDashboard />
          )}

          {/* Student-facing View to Take Active Quizzes */}
          {activeTab === AppTab.QUIZ_STUDENT && <QuizStudentView user={user} />}

          {/* Attendance & Engagement */}
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
          {activeTab === AppTab.QURAN_EXPLORER && (
            <QuranStickyNotesExplorer user={user} />
          )}
          {activeTab === AppTab.QURAN_NOTEBOOK && (
            <QuranLectureReferenceNotebook user={user} />
          )}
          {activeTab === AppTab.AYAT_MANAGER && isSuperAdmin && (
            <AyatManagerView user={user} />
          )}
          {activeTab === AppTab.IIPC_EVENTS && isSuperAdmin && (
            <IipcEventsSuperUserPanel user={user} />
          )}
          {(activeTab === AppTab.USER_EVENTS || (activeTab === AppTab.IIPC_EVENTS && !isSuperAdmin)) && (
            <IipcEventsUserView user={user} />
          )}
        </Suspense>
      </Container>
    </MainLayout>
  );
}
