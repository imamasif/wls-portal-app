import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Table,
  Card,
  Loader,
  Alert,
  Box,
  Button,
} from "@mantine/core";
import {
  IconCheck,
  IconLockOpen,
  IconLock,
  IconAlertCircle,
  IconFingerprint,
  IconClock,
} from "@tabler/icons-react";
import { wlsAttendanceApi } from "../api/wlsAttendanceMonitoringApi";
import axios from "axios";

export function WlsAttendancePanel({ user }) {
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [isMarkedPresent, setIsMarkedPresent] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const isAdmin = user.role === "SUPER_USER" || user.role === "WLS_ADMIN";

  useEffect(() => {
    fetchActiveSessionAndAttendance();
  }, []);

  // Timer to track how long attendance has been open (for grace period monitoring)
  useEffect(() => {
    let interval;
    if (attendanceConfig?.isAttendanceOpen && attendanceConfig?.openedAt) {
      const updateTimer = () => {
        const openedTime = new Date(attendanceConfig.openedAt).getTime();
        const now = new Date().getTime();
        const diffMins = Math.floor((now - openedTime) / 60000);
        setElapsedMinutes(diffMins);
      };
      updateTimer();
      interval = setInterval(updateTimer, 10000); // update every 10 secs
    }
    return () => clearInterval(interval);
  }, [attendanceConfig]);

  const fetchActiveSessionAndAttendance = async () => {
    try {
      setLoading(true);
      // Cleaned hardcoded localhost:5000 to relative path
      const sessionRes = await axios.get("/api/wls-sessions");
      const sessions = sessionRes.data;
      const currentActive =
        sessions.find((s) => s.status === "ACTIVE") || sessions[0];

      if (currentActive) {
        const sId = currentActive.id || currentActive._id;
        setActiveSession(currentActive);

        const configRes = await wlsAttendanceApi.getSessionStatus(sId);
        setAttendanceConfig(configRes);

        if (isAdmin) {
          const reportRes = await wlsAttendanceApi.getAttendanceReport(sId);
          setReportData(reportRes);
        } else {
          const reportRes = await wlsAttendanceApi.getAttendanceReport(sId);
          const uId = user.id || user._id;
          const alreadyMarked = reportRes.presentMembers?.some(
            (m) =>
              (m.userId?.toString() || m.user?.id?.toString()) ===
              uId?.toString(),
          );
          if (alreadyMarked) setIsMarkedPresent(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async () => {
    if (!activeSession) return;
    try {
      setToggling(true);
      const sId = activeSession.id || activeSession._id;
      const newState = !attendanceConfig?.isAttendanceOpen;

      await wlsAttendanceApi.toggleAttendance({
        sessionId: sId,
        isAttendanceOpen: newState,
        adminId: user.id || user._id,
      });

      const updatedConfig = await wlsAttendanceApi.getSessionStatus(sId);
      setAttendanceConfig(updatedConfig);

      const reportRes = await wlsAttendanceApi.getAttendanceReport(sId);
      setReportData(reportRes);
      setMessage({
        type: "success",
        text: `Attendance window successfully ${newState ? "opened" : "closed"}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setToggling(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (
      !activeSession ||
      !attendanceConfig?.isAttendanceOpen ||
      isMarkedPresent
    )
      return;
    try {
      setMarking(true);
      const sId = activeSession.id || activeSession._id;
      const uId = user.id || user._id;

      await wlsAttendanceApi.markAttendance({
        sessionId: sId,
        userId: uId,
      });

      setIsMarkedPresent(true);
      setMessage({
        type: "success",
        text: "Attendance marked successfully! Welcome to the session.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <Container py="xl" style={{ textAlign: "center" }}>
        <Loader size="lg" />
      </Container>
    );
  }

  if (!activeSession) {
    return (
      <Container py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="No Active Session"
          color="blue"
        >
          There are currently no active WLS sessions available for attendance.
        </Alert>
      </Container>
    );
  }

  const isOpen = attendanceConfig?.isAttendanceOpen;

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Paper shadow="xs" p="xl" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3}>
                {activeSession.topicName || activeSession.title}
              </Title>
              <Text size="sm" c="dimmed">
                Zoom Meeting Attendance & Grace Period Monitoring
              </Text>
            </div>
            <Group gap="xs">
              {isOpen && (
                <Badge
                  size="lg"
                  variant="light"
                  color="orange"
                  leftSection={<IconClock size={14} />}
                >
                  Open for {elapsedMinutes} min (Grace Period)
                </Badge>
              )}
              <Badge
                size="lg"
                color={isOpen ? "green" : "red"}
                leftSection={
                  isOpen ? <IconLockOpen size={14} /> : <IconLock size={14} />
                }
              >
                {isOpen ? "Attendance OPEN" : "Attendance CLOSED"}
              </Badge>
            </Group>
          </Group>

          {message && (
            <Alert
              mt="md"
              color={message.type === "success" ? "teal" : "red"}
              onClose={() => setMessage(null)}
              withCloseButton
            >
              {message.text}
            </Alert>
          )}

          {/* Student Tactile Button View */}
          {!isAdmin && (
            <Card
              mt="lg"
              p="xl"
              withBorder
              radius="md"
              style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
            >
              <Stack align="center" gap="md">
                <Text fw={600} size="md" ta="center">
                  Join the Zoom meeting within the first 20 minutes and tap
                  below to register your presence.
                </Text>

                <Box
                  onClick={
                    isOpen && !isMarkedPresent
                      ? handleMarkAttendance
                      : undefined
                  }
                  style={{
                    cursor:
                      isOpen && !isMarkedPresent ? "pointer" : "not-allowed",
                    width: "220px",
                    height: "220px",
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isMarkedPresent
                      ? "linear-gradient(145deg, #2b8a3e, #2f9e44)"
                      : isOpen
                        ? "linear-gradient(145deg, #e03131, #c92a2a)"
                        : "linear-gradient(145deg, #868e96, #495057)",
                    boxShadow:
                      isMarkedPresent || !isOpen
                        ? "inset 0 4px 8px rgba(0,0,0,0.3)"
                        : "0 12px 25px rgba(220, 53, 69, 0.4), inset 0 3px 6px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.4)",
                    transform: isMarkedPresent ? "scale(0.96)" : "scale(1)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: "6px solid rgba(255, 255, 255, 0.2)",
                    userSelect: "none",
                  }}
                >
                  {marking ? (
                    <Loader color="white" size="md" />
                  ) : isMarkedPresent ? (
                    <>
                      <IconCheck
                        size={64}
                        color="white"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                        }}
                      />
                      <Text
                        fw={700}
                        c="white"
                        size="lg"
                        mt="xs"
                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                      >
                        PRESENT
                      </Text>
                    </>
                  ) : isOpen ? (
                    <>
                      <IconFingerprint
                        size={64}
                        color="white"
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                        }}
                      />
                      <Text
                        fw={700}
                        c="white"
                        size="md"
                        mt="xs"
                        ta="center"
                        px="md"
                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                      >
                        I AM ATTENDING
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconLock
                        size={52}
                        color="white"
                        style={{ opacity: 0.8 }}
                      />
                      <Text
                        fw={600}
                        c="white"
                        size="sm"
                        mt="xs"
                        ta="center"
                        px="sm"
                      >
                        CLOSED
                      </Text>
                    </>
                  )}
                </Box>

                <Text size="xs" c="dimmed" ta="center">
                  {isMarkedPresent
                    ? "Your attendance has been recorded successfully for this session."
                    : isOpen
                      ? "Tap the badge above to stamp your attendance before the 20-minute window expires."
                      : "The 20-minute grace period has passed and attendance is closed."}
                </Text>
              </Stack>
            </Card>
          )}

          {/* Admin Control Panel */}
          {isAdmin && (
            <Card mt="md" p="md" withBorder bg="gray.0">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>Admin Attendance Window Control</Text>
                  <Text size="xs" c="dimmed">
                    {isOpen
                      ? `Window has been open for ${elapsedMinutes} minutes. Click close once the 20-minute grace period is over.`
                      : "Window is locked. Students cannot mark attendance."}
                  </Text>
                </div>
                <Button
                  color={isOpen ? "red" : "teal"}
                  size="md"
                  leftSection={
                    isOpen ? <IconLock size={16} /> : <IconLockOpen size={16} />
                  }
                  loading={toggling}
                  onClick={handleToggleAttendance}
                >
                  {isOpen ? "Close Attendance Now" : "Open Attendance Window"}
                </Button>
              </Group>
            </Card>
          )}
        </Paper>

        {/* Admin Attendance Report Breakdown */}
        {isAdmin && reportData && (
          <Paper shadow="xs" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Live Attendance Report</Title>
              <Group gap="xs">
                <Badge color="green" size="lg">
                  Total Present: {reportData.presentMembers?.length || 0}
                </Badge>
              </Group>
            </Group>

            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: "60px", textAlign: "center" }}>
                    #
                  </Table.Th>
                  <Table.Th>Student Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Marked At</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reportData.presentMembers &&
                reportData.presentMembers.length > 0 ? (
                  reportData.presentMembers.map((member, index) => (
                    <Table.Tr key={member.id || member._id || member.userId}>
                      <Table.Td
                        style={{ textAlign: "center", fontWeight: 600 }}
                      >
                        {index + 1}
                      </Table.Td>
                      <Table.Td>
                        {member.user?.name || member.userId?.name || "N/A"}
                      </Table.Td>
                      <Table.Td>
                        {member.user?.email || member.userId?.email || "N/A"}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="green" size="sm">
                          PRESENT
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {member.markedAt
                          ? new Date(member.markedAt).toLocaleTimeString()
                          : "N/A"}
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td
                      colSpan={5}
                      style={{ textAlign: "center", color: "dimmed" }}
                    >
                      No attendance marked yet for this session.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
