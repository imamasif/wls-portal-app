import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Card,
  Loader,
  Alert,
  Box,
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

export function WlsClassAttendancePanel({ user }) {
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [isMarkedPresent, setIsMarkedPresent] = useState(false);
  const [message, setMessage] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    try {
      setLoading(true);
      const sessionRes = await axios.get("/api/wls-sessions");
      const sessions = sessionRes.data;
      const currentActive =
        sessions.find((s) => s.status === "ACTIVE") || sessions[0];

      if (currentActive) {
        const sId = currentActive.id || currentActive._id;
        setActiveSession(currentActive);
        const configRes = await wlsAttendanceApi.getSessionStatus(sId);
        setAttendanceConfig(configRes);

        const reportRes = await wlsAttendanceApi.getAttendanceReport(sId);
        const uId = user.id || user._id;
        const alreadyMarked = reportRes.presentMembers?.some(
          (m) =>
            (m.userId?.toString() || m.user?.id?.toString()) ===
            uId?.toString(),
        );
        if (alreadyMarked) setIsMarkedPresent(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

      await wlsAttendanceApi.markAttendance({ sessionId: sId, userId: uId });
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

  if (loading)
    return (
      <Container py="xl" style={{ textAlign: "center" }}>
        <Loader size="lg" />
      </Container>
    );
  if (!activeSession)
    return (
      <Container py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="No Active Session"
          color="blue"
        >
          No active WLS session available.
        </Alert>
      </Container>
    );

  const isOpen = attendanceConfig?.isAttendanceOpen;

  return (
    <Container size="md" py="md">
      <Paper shadow="xs" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={3}>
              {activeSession.topicName || activeSession.title}
            </Title>
            <Text size="sm" c="dimmed">
              Class Attendance Check-in
            </Text>
          </div>
          <Badge
            size="lg"
            color={isOpen ? "green" : "red"}
            leftSection={
              isOpen ? <IconLockOpen size={14} /> : <IconLock size={14} />
            }
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </Badge>
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

        <Card
          mt="lg"
          p="xl"
          withBorder
          radius="md"
          style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
        >
          <Stack align="center" gap="md">
            <Text fw={600} size="md" ta="center">
              Join the Zoom meeting and tap below to register your presence.
            </Text>

            <Box
              onClick={
                isOpen && !isMarkedPresent ? handleMarkAttendance : undefined
              }
              style={{
                cursor: isOpen && !isMarkedPresent ? "pointer" : "not-allowed",
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
                  <IconCheck size={64} color="white" />
                  <Text fw={700} c="white" size="lg" mt="xs">
                    PRESENT
                  </Text>
                </>
              ) : isOpen ? (
                <>
                  <IconFingerprint size={64} color="white" />
                  <Text
                    fw={700}
                    c="white"
                    size="md"
                    mt="xs"
                    ta="center"
                    px="md"
                  >
                    I AM ATTENDING
                  </Text>
                </>
              ) : (
                <>
                  <IconLock size={52} color="white" style={{ opacity: 0.8 }} />
                  <Text fw={600} c="white" size="sm" mt="xs">
                    CLOSED
                  </Text>
                </>
              )}
            </Box>

            <Text size="xs" c="dimmed" ta="center">
              {isMarkedPresent
                ? "Your attendance is recorded."
                : isOpen
                  ? "Tap to stamp your attendance."
                  : "Attendance window is closed."}
            </Text>
          </Stack>
        </Card>
      </Paper>
    </Container>
  );
}
