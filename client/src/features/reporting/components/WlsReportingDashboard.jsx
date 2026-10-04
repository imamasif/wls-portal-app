import React, { useState, useEffect } from "react";
import {
  Box,
  Title,
  Text,
  Group,
  Card,
  SimpleGrid,
  Paper,
  Badge,
  Table,
  Progress,
  ThemeIcon,
  Select,
  Stack,
  Loader,
  Center,
  Alert,
  Container,
  Divider,
  ActionIcon,
  Tooltip as MantineTooltip,
} from "@mantine/core";
import {
  IconChartBar,
  IconUsers,
  IconChecklist,
  IconAward,
  IconUserCheck,
  IconAlertCircle,
  IconFileTypePdf,
} from "@tabler/icons-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { reportingApi } from "../api/reportingApi";
import "./ModernCard.css";

export function WlsReportingDashboard() {
  const [data, setData] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [viewMode, setViewMode] = useState("group");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, sessionsRes] = await Promise.all([
        reportingApi.getAnalyticsReport(),
        reportingApi.getSessions
          ? reportingApi.getSessions().catch(() => [])
          : Promise.resolve([]),
      ]);

      if (analyticsRes && analyticsRes.success) {
        setData(analyticsRes);
      } else {
        setData(analyticsRes || { assessments: [], metrics: {} });
      }

      // Handle direct array or object response for sessions
      const sessionsArray = Array.isArray(sessionsRes)
        ? sessionsRes
        : sessionsRes?.sessions || [];
      setSessionsList(sessionsArray);
    } catch (err) {
      console.error(err);
      setError("Failed to load live database analytics reports.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (loading)
    return (
      <Center py="xl" style={{ height: "400px" }}>
        <Loader size="lg" color="indigo" type="dots" />
      </Center>
    );
  if (error || !data)
    return (
      <Box p="md">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || "No data returned"}
        </Alert>
      </Box>
    );

  const {
    metrics = {},
    statusData = [],
    groupPerformanceData = [],
    assessments = [],
  } = data;

  // Build real session mapping lookup
  const sessionMap = new Map();
  sessionsList.forEach((s) => {
    const sId = s.id || s._id;
    if (sId) sessionMap.set(sId, s.topicName || "WLS Session");
  });

  // Real Database Session Options for Dropdown
  const sessionOptions = sessionsList.map((s) => ({
    value: s.id || s._id,
    label:
      s.topicName ||
      `Session on ${new Date(s.sessionDateTimeToronto || s.createdAt).toLocaleDateString()}`,
  }));

  const filteredAssessments = assessments.filter((item) => {
    const itemSessionId =
      typeof item.sessionId === "object" ? item.sessionId?._id : item.sessionId;
    if (selectedSessionId && itemSessionId !== selectedSessionId) return false;

    if (viewMode === "group") {
      if (
        selectedGroup !== "ALL" &&
        `Group ${item.groupNumber || 1}` !== selectedGroup
      )
        return false;
    } else {
      const itemUserId =
        typeof item.userId === "object" ? item.userId?._id : item.userId;
      if (selectedUser && itemUserId !== selectedUser) return false;
    }
    return true;
  });

  return (
    <Container size="xl" py="lg" mt="md">
      {/* Upper Header Banner */}
      <Paper p="xl" radius="lg" shadow="sm" withBorder mb="lg" bg="white">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="md">
            <ThemeIcon size="xl" radius="xl" color="indigo" variant="light">
              <IconChartBar size={24} />
            </ThemeIcon>
            <Box>
              <Title order={2} c="indigo.9">
                Advanced Analytics & Multi-Admin Reporting Suite
              </Title>
              <Text size="sm" c="dimmed">
                Visual performance breakdown per session, group, and individual
                admin scoring.
              </Text>
            </Box>
          </Group>
          <MantineTooltip label="Save / Open as PDF">
            <ActionIcon
              variant="light"
              color="indigo"
              size="xl"
              radius="md"
              onClick={handlePrintPdf}
              aria-label="Save / Open as PDF"
            >
              <IconFileTypePdf size={24} />
            </ActionIcon>
          </MantineTooltip>
        </Group>
      </Paper>

      {/* Top Metrics Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="lg">
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          className="modern-card"
        >
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Total Submissions
            </Text>
            <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
              <IconChecklist size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.totalSubmissions || assessments.length}
          </Text>
        </Card>
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          className="modern-card"
        >
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Multi-Admin Evaluated
            </Text>
            <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
              <IconUserCheck size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.multiAdminCount ||
              assessments.filter((a) => a.evaluations?.length > 1).length}
          </Text>
        </Card>
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          className="modern-card"
        >
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Overall Portal Avg
            </Text>
            <ThemeIcon color="indigo" variant="light" size="lg" radius="xl">
              <IconAward size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.overallAverageScore || 0}%
          </Text>
        </Card>
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          className="modern-card"
        >
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Active Groups
            </Text>
            <ThemeIcon color="cyan" variant="light" size="lg" radius="xl">
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.activeGroupsCount ||
              new Set(assessments.map((a) => a.groupNumber)).size}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Visual Charts Section */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="lg">
        <Paper
          p="lg"
          radius="md"
          shadow="sm"
          withBorder
          className="modern-card"
        >
          <Title order={4} c="dark.8" mb="sm">
            Submission Review Status
          </Title>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || "#4c6ef5"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Paper>

        <Paper
          p="lg"
          radius="md"
          shadow="sm"
          withBorder
          className="modern-card"
        >
          <Title order={4} c="dark.8" mb="sm">
            Group-Wise Average Scores
          </Title>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={groupPerformanceData}>
                <XAxis dataKey="group" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="averageScore"
                  fill="#4c6ef5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Paper>
      </SimpleGrid>

      {/* Interactive Filtering Card */}
      <Paper
        p="xl"
        radius="md"
        shadow="sm"
        withBorder
        className="modern-card mb-xl-print-hide"
        mb="xl"
      >
        <Title order={3} mb="md" c="indigo.8">
          📊 WLS Live Database Filtering Desk
        </Title>
        <Stack gap="md">
          <Group grow align="flex-end">
            <Select
              label="1. Select Real WLS Session"
              placeholder="All Database Sessions"
              data={sessionOptions}
              value={selectedSessionId}
              onChange={setSelectedSessionId}
              clearable
            />
            <Select
              label="2. Select View Mode"
              data={[
                { value: "group", label: "Group Report View" },
                {
                  value: "individual",
                  label: "Individual User Trajectory View",
                },
              ]}
              value={viewMode}
              onChange={setViewMode}
            />
          </Group>
        </Stack>
      </Paper>

      {/* Below Results Data Table Container */}
      <Paper p="xl" radius="md" shadow="sm" withBorder className="modern-card">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={4} c="dark.8">
              Managed Sessions & Submissions Audit
            </Title>
            <Text size="xs" c="dimmed">
              Live DB data rendered in a modern React card layout
            </Text>
          </div>
          <Group gap="xs">
            <div className="stamp-badge">Verified DB Record</div>
            <MantineTooltip label="Save / Open as PDF">
              <ActionIcon
                variant="light"
                color="indigo"
                size="lg"
                radius="md"
                onClick={handlePrintPdf}
                aria-label="Save / Open as PDF"
              >
                <IconFileTypePdf size={20} />
              </ActionIcon>
            </MantineTooltip>
          </Group>
        </Group>

        <Divider my="sm" variant="dashed" />

        <Table horizontalSpacing="md" verticalSpacing="sm" withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Participant & Group</Table.Th>
              <Table.Th>Session / Topic</Table.Th>
              <Table.Th>Co-Admin Markings</Table.Th>
              <Table.Th>Combined Final Score</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAssessments.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} align="center">
                  <Text c="dimmed" py="md">
                    No live records found for this query.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredAssessments.map((item) => {
                const studentName =
                  typeof item.userId === "object" && item.userId?.name
                    ? item.userId.name
                    : "Student";

                const rawSessionId =
                  typeof item.sessionId === "object"
                    ? item.sessionId?._id
                    : item.sessionId;
                const sessionTopic =
                  sessionMap.get(rawSessionId) ||
                  (typeof item.sessionId === "object" &&
                    item.sessionId?.topicName) ||
                  "Allah / Ilah (Active WLS)";

                return (
                  <Table.Tr key={item._id}>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {studentName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Group {item.groupNumber || 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {sessionTopic}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={4}>
                        {(item.evaluations || []).map((ev, idx) => (
                          <Group key={idx} gap="xs">
                            <Badge size="xs" variant="outline" color="indigo">
                              {ev.evaluatorName}
                            </Badge>
                            <Text size="xs" fw={700}>
                              {ev.score} pts
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Box style={{ width: "120px" }}>
                        <Group justify="space-between" mb={2}>
                          <Text size="xs" fw={700} c="indigo.8">
                            {item.finalScore}%
                          </Text>
                        </Group>
                        <Progress
                          value={item.finalScore}
                          color="indigo"
                          size="sm"
                          radius="xl"
                        />
                      </Box>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}

export const ReportingDashboard = WlsReportingDashboard;
export default WlsReportingDashboard;
