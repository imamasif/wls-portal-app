// src/features/wls-assessment/components/SuperUserAssessmentOverview.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Button,
  Progress,
  Group,
  Text,
  Title,
  Box,
  Select,
  Paper,
  Stack,
  Grid,
  ThemeIcon,
  Tooltip,
  Modal,
  Popover,
} from "@mantine/core";
import {
  IconCheck,
  IconCalendarEvent,
  IconChevronDown,
  IconExternalLink,
  IconUserCheck,
  IconVideo,
  IconProgressCheck,
  IconShieldCheck,
  IconAlertCircle,
  IconMessageReport,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react";

// Imported directly from client/src/config/constants.js
import { ASSESSMENT_STATUSES } from "../../../config/constants";

// Helper function to safely extract string IDs whether they are populated objects or raw strings
const getCleanId = (field) => {
  if (!field) return "";
  if (typeof field === "object") return String(field.id || field._id || field);
  return String(field);
};

export function SuperUserAssessmentOverview({ currentUser }) {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State to replace browser native alert()
  const [errorModalState, setErrorModalState] = useState({
    opened: false,
    title: "",
    message: "",
  });

  const loadData = async (targetSessionId = null) => {
    try {
      setLoading(true);
      const [resSessions, resAssessments, resUsers] = await Promise.all([
        fetch("/api/wls-sessions"),
        fetch("/api/assessments"),
        fetch("/api/users"),
      ]);

      const sessionsData = resSessions.ok ? await resSessions.json() : [];
      const assessmentsData = resAssessments.ok
        ? await resAssessments.json()
        : [];
      const usersData = resUsers.ok ? await resUsers.json() : [];

      setAllSessions(sessionsData);
      setAssessments(assessmentsData);
      setAllUsers(usersData);

      const activeSession = targetSessionId
        ? sessionsData.find((s) => (s.id || s._id) === targetSessionId)
        : sessionsData.find((s) => s.status === "ACTIVE") || sessionsData[0];

      if (activeSession) {
        const sId = activeSession.id || activeSession._id;
        setSelectedSessionId(sId);
        setSelectedSession(activeSession);
      }
    } catch (err) {
      console.error("Error loading overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSessionChange = (sessionId) => {
    if (!sessionId) return;
    setSelectedSessionId(sessionId);
    const sessionObj = allSessions.find((s) => (s.id || s._id) === sessionId);
    setSelectedSession(sessionObj || null);
  };

  const handleFinalizeTask = async (assessmentId) => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/finalize`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserRole: currentUser?.role || "SUPER_USER",
        }),
      });

      if (res.ok) {
        await loadData(selectedSessionId);
      } else {
        const err = await res.json();
        setErrorModalState({
          opened: true,
          title: "Assessment Finalization Error",
          message:
            err.error ||
            err.message ||
            "Failed to finalize the assessment task.",
        });
      }
    } catch (err) {
      console.error("Failed to finalize assessment:", err);
      setErrorModalState({
        opened: true,
        title: "Server Communication Error",
        message:
          "An unexpected error occurred while communicating with the server.",
      });
    }
  };

  if (loading) {
    return (
      <Text ta="center" py="xl" c="dimmed" fw={600}>
        Loading Super User Marking Overview...
      </Text>
    );
  }

  // Extract group submitters, group numbers, and assigned admins
  const groupAssignments = selectedSession?.groupAssignments || {};
  const assignmentsMap =
    groupAssignments instanceof Map
      ? Object.fromEntries(groupAssignments)
      : groupAssignments;

  const assignedSubmitters = new Set();
  const studentGroupMap = {};
  const assignedAdminsPerStudent = {};

  Object.entries(assignmentsMap).forEach(([groupKey, group]) => {
    const groupNum = group.groupNumber || groupKey.replace(/\D/g, "") || 1;
    const userIds = group.userIds || [];

    // Extract admin IDs from either adminIds array or nested admins objects
    let rawAdminIds = group.adminIds || [];
    if (
      (!rawAdminIds || rawAdminIds.length === 0) &&
      Array.isArray(group.admins)
    ) {
      rawAdminIds = group.admins.map((adm) => adm.id || adm._id || adm);
    }

    userIds.forEach((uId) => {
      assignedSubmitters.add(uId);
      studentGroupMap[uId] = groupNum;

      if (!assignedAdminsPerStudent[uId]) {
        assignedAdminsPerStudent[uId] = new Set();
      }
      rawAdminIds.forEach((aId) => {
        const cleanAId =
          typeof aId === "object"
            ? String(aId.id || aId._id || "")
            : String(aId);
        if (cleanAId) assignedAdminsPerStudent[uId].add(cleanAId);
      });
    });
  });

  const userMap = new Map(allUsers.map((u) => [u.id || u._id, u]));

  return (
    <Card
      shadow="lg"
      padding="xl"
      radius="lg"
      withBorder
      style={{
        width: "100%",
        backgroundColor: "#f8fafc",
        borderColor: "#cbd5e1",
      }}
    >
      {/* 3D Styled Header Bar */}
      <Card
        mb="xl"
        p="md"
        radius="md"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "#ffffff",
          boxShadow:
            "0 10px 20px -5px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon size={44} radius="md" color="teal" variant="filled">
              <IconShieldCheck size={26} />
            </ThemeIcon>
            <Box>
              <Title
                order={3}
                style={{ color: "#ffffff", letterSpacing: -0.5 }}
              >
                Super User Assessment Overview & Finalization
              </Title>
              <Text size="xs" c="gray.4">
                Hover over student rows or admin progress bars to view full
                group and admin review breakdowns.
              </Text>
            </Box>
          </Group>

          <Select
            label={
              <Text size="xs" fw={700} c="gray.3">
                Active WLS Session
              </Text>
            }
            placeholder="Pick a session..."
            leftSection={<IconCalendarEvent size={18} color="#38bdf8" />}
            rightSection={<IconChevronDown size={16} color="#94a3b8" />}
            data={allSessions.map((s) => ({
              value: s.id || s._id,
              label: `${s.topicName || s.topic || "Session"} (${s.status || "NEW"})`,
            }))}
            value={selectedSessionId}
            onChange={handleSessionChange}
            style={{ width: "320px" }}
            styles={{
              input: {
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                fontWeight: 700,
                color: "#0f172a",
              },
            }}
          />
        </Group>
      </Card>

      {/* Grid Table Headers */}
      <Paper
        p="md"
        radius="md"
        mb="md"
        style={{
          backgroundColor: "#e2e8f0",
          borderColor: "#94a3b8",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <Grid align="center" gutter="md">
          <Grid.Col span={3}>
            <Group gap="xs">
              <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                <IconUserCheck size={14} />
              </ThemeIcon>
              <Text fw={800} size="sm" c="dark">
                Student & Group
              </Text>
            </Group>
          </Grid.Col>

          <Grid.Col span={2}>
            <Group gap="xs">
              <ThemeIcon size="sm" radius="xl" color="indigo" variant="light">
                <IconVideo size={14} />
              </ThemeIcon>
              <Text fw={800} size="sm" c="dark">
                Video Stream
              </Text>
            </Group>
          </Grid.Col>

          <Grid.Col span={3}>
            <Group gap="xs">
              <ThemeIcon size="sm" radius="xl" color="orange" variant="light">
                <IconProgressCheck size={14} />
              </ThemeIcon>
              <Text fw={800} size="sm" c="dark">
                Admin Reviews Progress
              </Text>
            </Group>
          </Grid.Col>

          <Grid.Col span={2}>
            <Group gap="xs">
              <ThemeIcon size="sm" radius="xl" color="teal" variant="light">
                <IconMessageReport size={14} />
              </ThemeIcon>
              <Text fw={800} size="sm" c="dark">
                Overall Status
              </Text>
            </Group>
          </Grid.Col>

          <Grid.Col span={2} style={{ textAlign: "center" }}>
            <Group gap="xs" justify="center">
              <ThemeIcon size="sm" radius="xl" color="green" variant="light">
                <IconShieldCheck size={14} />
              </ThemeIcon>
              <Text fw={800} size="sm" c="dark">
                Action
              </Text>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Grid Rows */}
      {assignedSubmitters.size === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No students assigned to groups in this session.
        </Text>
      ) : (
        <Stack gap="sm">
          {Array.from(assignedSubmitters).map((studentId) => {
            const studentObj = userMap.get(studentId) || {};

            // Fixed: Use getCleanId to safely match populated or unpopulated IDs
            const assessmentRecord = assessments.find((a) => {
              const aSessionId = getCleanId(a.sessionId);
              const aUserId = getCleanId(a.userId);
              return (
                aSessionId === String(selectedSessionId) &&
                aUserId === String(studentId)
              );
            });

            const groupNum =
              assessmentRecord?.groupNumber || studentGroupMap[studentId] || 1;

            const assignedAdminIds = Array.from(
              assignedAdminsPerStudent[studentId] || [],
            );
            const evaluations = assessmentRecord?.evaluations || [];

            // If no explicit admins are assigned in group config, pull evaluators from the assessment record
            const finalAdminIds =
              assignedAdminIds.length === 0 && evaluations.length > 0
                ? evaluations
                    .map((e) => getCleanId(e.evaluatorId))
                    .filter(Boolean)
                : assignedAdminIds;

            const totalAssignedAdminsCount = finalAdminIds.length;

            // Map full evaluation status for every assigned admin
            const adminReviewBreakdown = finalAdminIds.map((aId) => {
              const adminUser = userMap.get(aId) || {};

              // Safely check evaluatorId matching or fall back to default admin reviews
              const evalObj = evaluations.find((e) => {
                const evalId = getCleanId(e.evaluatorId);
                return evalId === String(aId) || evalId === "admin-default";
              });

              const name =
                adminUser.name ||
                evalObj?.evaluatorName ||
                `Admin (${aId.slice(-4)})`;
              const status = evalObj?.status || ASSESSMENT_STATUSES.PENDING;

              return {
                adminId: aId,
                name,
                status,
                feedback: evalObj?.feedback || "",
              };
            });

            const reviewedAdminsCount = adminReviewBreakdown.filter(
              (a) =>
                a.status === ASSESSMENT_STATUSES.REVIEWED ||
                a.status === ASSESSMENT_STATUSES.COMPLETED,
            ).length;

            const isCompleted =
              assessmentRecord?.status === ASSESSMENT_STATUSES.COMPLETED;
            const videoUrl =
              assessmentRecord?.submissionUrl ||
              assessmentRecord?.submissionUrls?.[0] ||
              "";

            return (
              <Paper
                key={studentId}
                p="md"
                radius="md"
                withBorder
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <Grid align="center" gutter="md">
                  {/* Column 1: Student Details & Group Tooltip */}
                  <Grid.Col span={3}>
                    <Tooltip
                      label={`Group ${groupNum} | Assigned Admins: ${adminReviewBreakdown.map((a) => a.name).join(", ") || "None"}`}
                      withArrow
                      position="top-start"
                    >
                      <Box style={{ cursor: "pointer" }}>
                        <Group gap="xs" mb={2}>
                          <Text fw={800} size="md" c="slate.9">
                            {studentObj.name ||
                              `Student (${studentId.slice(-4)})`}
                          </Text>
                          <Badge size="xs" color="blue" variant="light">
                            Group {groupNum}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {studentObj.email || "No email"}
                        </Text>
                      </Box>
                    </Tooltip>
                  </Grid.Col>

                  {/* Column 2: Video Stream Link */}
                  <Grid.Col span={2}>
                    {videoUrl ? (
                      <Button
                        component="a"
                        href={videoUrl}
                        target="_blank"
                        size="xs"
                        variant="gradient"
                        gradient={{ from: "blue", to: "cyan" }}
                        leftSection={<IconExternalLink size={14} />}
                        radius="md"
                      >
                        Watch Stream
                      </Button>
                    ) : (
                      <Badge
                        color="red"
                        variant="light"
                        leftSection={<IconAlertCircle size={12} />}
                      >
                        No Video
                      </Badge>
                    )}
                  </Grid.Col>

                  {/* Column 3: Detailed Hoverable Admin Review Breakdown */}
                  <Grid.Col span={3}>
                    <Popover width={320} position="top" withArrow shadow="md">
                      <Popover.Target>
                        <Box style={{ cursor: "pointer" }}>
                          <Group justify="space-between" mb={4}>
                            <Text size="xs" fw={700} c="dark">
                              {reviewedAdminsCount} / {totalAssignedAdminsCount}{" "}
                              Admins Reviewed
                            </Text>
                            <ThemeIcon size="xs" color="blue" variant="subtle">
                              <IconInfoCircle size={14} />
                            </ThemeIcon>
                          </Group>
                          <Progress
                            value={
                              totalAssignedAdminsCount > 0
                                ? (reviewedAdminsCount /
                                    totalAssignedAdminsCount) *
                                  100
                                : 0
                            }
                            color={
                              reviewedAdminsCount > 0 ? "indigo" : "orange"
                            }
                            size="sm"
                            animated={!isCompleted && reviewedAdminsCount > 0}
                            radius="xl"
                          />

                          {/* Quick Admin Badge Bar */}
                          <Group gap={4} mt={6} style={{ flexWrap: "wrap" }}>
                            {adminReviewBreakdown.map((a, idx) => (
                              <Badge
                                key={idx}
                                size="xs"
                                variant="filled"
                                color={
                                  a.status === ASSESSMENT_STATUSES.REVIEWED ||
                                  a.status === ASSESSMENT_STATUSES.COMPLETED
                                    ? "indigo"
                                    : a.status ===
                                        ASSESSMENT_STATUSES.PARTIAL_SAVED
                                      ? "orange"
                                      : "red"
                                }
                              >
                                {a.name}: {a.status}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      </Popover.Target>

                      {/* Hover / Click Popover Pop-up Breakdown */}
                      <Popover.Dropdown>
                        <Stack gap="xs">
                          <Text size="xs" fw={800} c="dark">
                            Detailed Admin Review Breakdown:
                          </Text>
                          {adminReviewBreakdown.map((a, idx) => (
                            <Paper
                              key={idx}
                              p="xs"
                              radius="xs"
                              bg="gray.0"
                              withBorder
                            >
                              <Group justify="space-between" mb={2}>
                                <Text size="xs" fw={700} c="blue.9">
                                  {a.name}
                                </Text>
                                <Badge
                                  size="xs"
                                  color={
                                    a.status === ASSESSMENT_STATUSES.REVIEWED ||
                                    a.status === ASSESSMENT_STATUSES.COMPLETED
                                      ? "indigo"
                                      : a.status ===
                                          ASSESSMENT_STATUSES.PARTIAL_SAVED
                                        ? "orange"
                                        : "red"
                                  }
                                >
                                  {a.status}
                                </Badge>
                              </Group>
                              {a.feedback ? (
                                <Text size="11px" c="gray.7" fs="italic">
                                  "{a.feedback}"
                                </Text>
                              ) : (
                                <Text size="11px" c="dimmed">
                                  No feedback provided yet.
                                </Text>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                  </Grid.Col>

                  {/* Column 4: Overall Status */}
                  <Grid.Col span={2}>
                    <Badge
                      size="md"
                      variant="filled"
                      color={
                        isCompleted
                          ? "teal"
                          : assessmentRecord?.status ===
                              ASSESSMENT_STATUSES.REVIEWED
                            ? "indigo"
                            : assessmentRecord?.status ===
                                ASSESSMENT_STATUSES.PARTIAL_SAVED
                              ? "orange"
                              : "blue"
                      }
                    >
                      {assessmentRecord?.status || ASSESSMENT_STATUSES.PENDING}
                    </Badge>
                  </Grid.Col>

                  {/* Column 5: Super User Action Button */}
                  <Grid.Col span={2} style={{ textAlign: "center" }}>
                    {isCompleted ? (
                      <Badge
                        color="teal"
                        variant="outline"
                        size="lg"
                        leftSection={<IconCheck size={14} />}
                      >
                        Finalized
                      </Badge>
                    ) : (
                      <Button
                        size="xs"
                        color="teal"
                        variant="filled"
                        leftSection={<IconCheck size={14} />}
                        onClick={() =>
                          handleFinalizeTask(
                            assessmentRecord?.id || assessmentRecord?._id,
                          )
                        }
                        disabled={!assessmentRecord}
                        radius="md"
                        style={{
                          boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)",
                        }}
                      >
                        Mark Completed
                      </Button>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Styled Mantine Error Modal Dialog */}
      <Modal
        opened={errorModalState.opened}
        onClose={() =>
          setErrorModalState({ opened: false, title: "", message: "" })
        }
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" radius="xl" size="md">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
            <Text fw={700} c="red.8">
              {errorModalState.title}
            </Text>
          </Group>
        }
        centered
        radius="md"
        padding="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="gray.7">
            {errorModalState.message}
          </Text>
          <Button
            color="red"
            variant="light"
            fullWidth
            onClick={() =>
              setErrorModalState({ opened: false, title: "", message: "" })
            }
          >
            Acknowledge & Close
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
}
