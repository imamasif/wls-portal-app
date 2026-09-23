// src/App.jsx
import React, { useState, useEffect } from "react";
import { MantineProvider, Container, Paper, Text } from "@mantine/core";
import { useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { UserGridView } from "./features/user-management/components/UserGridView";
import { UserRole } from "./types/user";
import { quizApi } from "@/features/quiz-management/api/quizApi";

// Core Dashboard & Feature Imports
import { DashboardView } from "./components/dashboard/DashboardView";
import { WlsStudentView } from "./features/dashboard/components/WlsStudentView";
import { WlsManagementPanel } from "./features/wls-management/components/WlsManagementPanel";
import { WlsAssessmentPanel } from "./features/wls-assessment/components/WlsAssessmentPanel";
import { ReportingDashboard } from "./features/reporting/components/WlsReportingDashboard";
import { NotificationPanel } from "./features/notifications/components/NotificationPanel";

// Group Management Imports
import { WhatsAppGroupManager } from "./features/group-management/WhatsAppGroupManager";
import { MSTeamGroupManager } from "./features/group-management/MSTeamGroupManager";

// Full-Page Profile & Authentication Imports
import { EditProfileCard } from "./components/profile/EditProfileCard";
import { LoginPage } from "./features/auth/components/LoginPage";
import {
  QuizAdminWorkspace,
  QuizStudentView,
  QuizReportDashboard,
  QuizListScreen,
} from "./features/quiz-management";

export default function App() {
  const { user } = useAuth();

  // Default to 'login' tab if user is not authenticated, otherwise default to 'dashboard'
  const [activeTab, setActiveTab] = useState(user ? "dashboard" : "login");
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState(null);

  // Keep tab synced if auth status changes externally
  useEffect(() => {
    if (!user && activeTab !== "register") {
      setActiveTab("login");
    } else if (user && activeTab === "login") {
      setActiveTab("dashboard");
    }
  }, [user]);

  const activeRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  // If the user is not logged in, enforce showing only the professional Login / Auth screens
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

  return (
    <MantineProvider defaultColorScheme="light">
      <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <Container size="xl" py="lg" mt="md">
          {/* 1. Dashboard View */}
          {activeTab === "dashboard" && (
            <DashboardView setActiveTab={setActiveTab} user={user} />
          )}

          {/* 2. User Management Views */}
          {activeTab === "users" && isSuperAdmin && (
            <UserGridView currentUser={user} />
          )}

          {activeTab === "roles-control" && isSuperAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <Text size="lg" fw={600} mb="xs">
                Role & Access Control
              </Text>
              <Text size="sm" c="dimmed">
                Configure system roles, permissions matrix, and feature access
                boundaries.
              </Text>
            </Paper>
          )}

          {activeTab === "user-activity" && isSuperAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <Text size="lg" fw={600} mb="xs">
                User Activity Logs
              </Text>
              <Text size="sm" c="dimmed">
                Track system logins, administrative changes, and security
                events.
              </Text>
            </Paper>
          )}

          {/* 3. Group Management Views */}
          {activeTab === "whatsapp-groups" && isWlsAdmin && (
            <WhatsAppGroupManager />
          )}

          {activeTab === "teams-groups" && isWlsAdmin && <MSTeamGroupManager />}

          {activeTab === "university-portal" && isWlsAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <Text size="lg" fw={600} mb="xs">
                Online University Portals
              </Text>
              <Text size="sm" c="dimmed">
                Manage affiliated university links, partner resources, and
                external integration APIs.
              </Text>
            </Paper>
          )}

          {/* 4. WLS Management Views */}
          {(activeTab === "wls-session" || activeTab === "wls-assignment") && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <WlsStudentView user={user} />
            </Paper>
          )}

          {activeTab === "wls-mgmt" && isWlsAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <WlsManagementPanel />
            </Paper>
          )}

          {activeTab === "assessment" && isWlsAdmin && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <WlsAssessmentPanel currentUser={user} activeTab={activeTab} />
            </Paper>
          )}

          {/* 5. Reporting & Notifications */}
          {activeTab === "reports" && <ReportingDashboard />}

          {activeTab === "notifications" && (
            <Paper p="lg" radius="md" withBorder shadow="xs">
              <NotificationPanel />
            </Paper>
          )}

          {/* 6. Full-Page Profile Editing */}
          {activeTab === "edit-profile" && user && (
            <EditProfileCard
              targetUser={user}
              onCancel={() => setActiveTab("dashboard")}
              onSaveSuccess={() => setActiveTab("dashboard")}
            />
          )}

          {/* 7. Quiz Management Views */}
          {activeTab === "quiz-list" && isWlsAdmin && (
            <QuizListScreen
              onEditQuiz={(quiz) => {
                setSelectedQuizForEdit(quiz);
                setActiveTab("quiz-studio");
              }}
              onCreateNew={() => {
                setSelectedQuizForEdit(null);
                setActiveTab("quiz-studio");
              }}
            />
          )}

          {activeTab === "quiz-studio" && isWlsAdmin && (
            <QuizAdminWorkspace
              initialQuizData={selectedQuizForEdit}
              onSave={async (quizPayload) => {
                try {
                  const quizId = quizPayload.id || quizPayload._id;
                  const fullPayload = {
                    ...quizPayload,
                    createdBy: user?._id || user?.id,
                  };

                  if (quizId) {
                    // Update existing quiz
                    await quizApi.updateQuiz(quizId, fullPayload);
                  } else {
                    // Create new quiz
                    await quizApi.createQuiz(fullPayload);
                  }

                  setSelectedQuizForEdit(null);
                  setActiveTab("quiz-list");
                } catch (err) {
                  console.error("Failed to save quiz:", err);
                  alert(
                    "Failed to save quiz. Please check console for details.",
                  );
                }
              }}
            />
          )}

          {activeTab === "quiz-reports" && isWlsAdmin && (
            <QuizReportDashboard />
          )}

          {activeTab === "quiz-student" && <QuizStudentView user={user} />}
          {/* ---------------------------- */}
        </Container>
      </MainLayout>
    </MantineProvider>
  );
}
