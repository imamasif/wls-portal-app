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
  Loader,
  Alert,
  Button,
} from "@mantine/core";
import {
  IconLockOpen,
  IconLock,
  IconAlertCircle,
  IconClock,
} from "@tabler/icons-react";
import { wlsAttendanceApi } from "../api/wlsAttendanceMonitoringApi";
import axios from "axios";

export function WlsAttendanceMonitoringPanel({ user }) {
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    fetchSessionAndReport();
  }, []);

  const fetchSessionAndReport = async () => {
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
        setReportData(reportRes);
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
          No active session found.
        </Alert>
      </Container>
    );

  const isOpen = attendanceConfig?.isAttendanceOpen;

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Paper shadow="xs" p="xl" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3}>
                Attendance Monitoring:{" "}
                {activeSession.topicName || activeSession.title}
              </Title>
              <Text size="sm" c="dimmed">
                Manage grace periods and control live class check-ins.
              </Text>
            </div>
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

          <Paper mt="md" p="md" withBorder bg="gray.0">
            <Group justify="space-between">
              <div>
                <Text fw={600}>Window Control</Text>
                <Text size="xs" c="dimmed">
                  {isOpen
                    ? "Window is open for student check-ins."
                    : "Window is locked."}
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
          </Paper>
        </Paper>

        {reportData && (
          <Paper shadow="xs" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Live Attendance Report</Title>
              <Badge color="green" size="lg">
                Total Present: {reportData.presentMembers?.length || 0}
              </Badge>
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
                {reportData.presentMembers?.length > 0 ? (
                  reportData.presentMembers.map((m, idx) => (
                    <Table.Tr key={m.id || m._id}>
                      <Table.Td
                        style={{ textAlign: "center", fontWeight: 600 }}
                      >
                        {idx + 1}
                      </Table.Td>
                      <Table.Td>
                        {m.user?.name || m.userId?.name || "N/A"}
                      </Table.Td>
                      <Table.Td>
                        {m.user?.email || m.userId?.email || "N/A"}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="green" size="sm">
                          PRESENT
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {m.markedAt
                          ? new Date(m.markedAt).toLocaleTimeString()
                          : "N/A"}
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: "center" }}>
                      No attendance marked yet.
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
