// src/features/reporting/components/ReportingDashboard.jsx
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
  Tabs,
} from "@mantine/core";
import {
  IconChartBar,
  IconUsers,
  IconChecklist,
  IconAward,
  IconUserCheck,
  IconAlertCircle,
  IconHelpCircle,
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

export function ReportingDashboard() {
  const [data, setData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("ALL");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [wlsRes, quizRes] = await Promise.all([
        fetch("http://localhost:5000/api/reports/analytics-report"),
        fetch("http://localhost:5000/api/quiz-submissions/analytics"), // Adjust route if mounted separately
      ]);
      const wlsResult = await wlsRes.json();
      const quizResult = await quizRes.json();

      if (wlsResult.success) {
        setData(wlsResult);
      }
      if (quizResult.success) {
        setQuizData(quizResult.quizAnalytics);
      }
    } catch (err) {
      console.error(err);
      setError("Network error connecting to backend analytics API.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center py="xl" style={{ height: "400px" }}>
        <Loader size="lg" color="indigo" type="dots" />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Box p="md">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || "No reporting data available."}
        </Alert>
      </Box>
    );
  }

  const {
    metrics,
    statusData,
    groupPerformanceData,
    sessionReportData,
    frequencyReportData,
    assessments,
  } = data;
  const filteredAssessments =
    selectedGroup === "ALL"
      ? assessments
      : assessments.filter(
          (a) => `Group ${a.groupNumber || 1}` === selectedGroup,
        );

  return (
    <Container size="xl" py="lg" mt="md">
      {/* Header Banner */}
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
                Comprehensive visual breakdown per session, group, time
                frequency, and individual/aggregate admin scoring.
              </Text>
            </Box>
          </Group>
          <Select
            placeholder="Filter by Group"
            data={["ALL", ...(groupPerformanceData || []).map((g) => g.group)]}
            value={selectedGroup}
            onChange={setSelectedGroup}
            style={{ width: "180px" }}
          />
        </Group>
      </Paper>

      {/* Top Metrics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Total Submissions
            </Text>
            <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
              <IconChecklist size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.totalSubmissions}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Multi-Admin Evaluated
            </Text>
            <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
              <IconUserCheck size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.multiAdminCount}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Overall Portal Avg
            </Text>
            <ThemeIcon color="indigo" variant="light" size="lg" radius="xl">
              <IconAward size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.overallAverageScore}%
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Active Groups
            </Text>
            <ThemeIcon color="cyan" variant="light" size="lg" radius="xl">
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.activeGroupsCount}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Visual Charts Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="lg">
        {/* Status Donut Chart */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Paper>

        {/* Group Performance Bar Chart */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
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

        {/* Report per Session Topic Bar Chart */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Title order={4} c="dark.8" mb="sm">
            Performance per Session Topic
          </Title>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={sessionReportData}>
                <XAxis dataKey="topic" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="averageScore"
                  fill="#12b886"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Paper>

        {/* Time Frequency Report Bar Chart */}
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Title order={4} c="dark.8" mb="sm">
            Time Frequency Report (Monthly Submissions)
          </Title>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={frequencyReportData}>
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="submissions"
                  fill="#fd7e14"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Paper>
      </SimpleGrid>

      {/* Multi-Admin Individual vs Aggregate Audit Trail Table */}
      <Paper p="lg" radius="md" shadow="sm" withBorder mb="xl">
        <Title order={4} c="dark.8" mb="sm">
          WLS Assignment Multi-Admin Marking Audit Trail
        </Title>
        <Text size="xs" c="dimmed" mb="md">
          Shows individual grades given by multiple WLS Admins alongside
          compiled aggregate final scores.
        </Text>

        <Table
          horizontalSpacing="md"
          verticalSpacing="sm"
          striped
          highlightOnHover
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student & Group</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Individual Admin Markings & Feedback</Table.Th>
              <Table.Th>Aggregated Final Score</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAssessments.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} align="center">
                  <Text c="dimmed" py="md">
                    No records found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredAssessments.map((item) => (
                <Table.Tr key={item._id}>
                  <Table.Td>
                    <Text fw={600} size="sm">
                      {item.userId?.name || "Student"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Group {item.groupNumber || 1}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={item.status === "COMPLETED" ? "teal" : "yellow"}
                      variant="light"
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {!item.evaluations || item.evaluations.length === 0 ? (
                      <Text size="xs" c="dimmed" fs="italic">
                        Pending evaluation
                      </Text>
                    ) : (
                      <Stack gap={4}>
                        {item.evaluations.map((ev, idx) => (
                          <Group key={idx} gap="xs">
                            <Badge size="xs" variant="outline" color="indigo">
                              {ev.evaluatorName}
                            </Badge>
                            <Text size="xs" fw={500}>
                              {ev.score} pts
                            </Text>
                            <Text size="xs" c="dimmed">
                              "{ev.feedback || "No comments"}"
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Box style={{ width: "120px" }}>
                      <Group justify="space-between" mb={2}>
                        <Text size="xs" fw={700} c="indigo.8">
                          {item.finalScore}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          ({item.evaluations?.length || 0} admins)
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
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Quiz Assessments Analytics Section */}
      {quizData && quizData.length > 0 && (
        <Paper p="lg" radius="md" shadow="sm" withBorder>
          <Group gap="sm" mb="md">
            <ThemeIcon color="grape" variant="light" size="lg">
              <IconHelpCircle size={20} />
            </ThemeIcon>
            <Title order={4} c="dark.8">
              Quiz Assessment Reports & Performance
            </Title>
          </Group>
          <Table
            horizontalSpacing="md"
            verticalSpacing="sm"
            striped
            highlightOnHover
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Quiz Title</Table.Th>
                <Table.Th>Total Submissions</Table.Th>
                <Table.Th>Average Score</Table.Th>
                <Table.Th>Passed (≥60%)</Table.Th>
                <Table.Th>Needs Improvement (&lt;60%)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {quizData.map((q, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td fw={600}>{q.title}</Table.Td>
                  <Table.Td>{q.totalSubmissions}</Table.Td>
                  <Table.Td>
                    <Badge color="indigo">{q.averageScore}%</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="teal">{q.passedCount} Students</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="red">{q.failedCount} Students</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}

export default ReportingDashboard;
