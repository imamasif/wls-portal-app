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
  Tooltip,
  Tabs,
  TextInput,
  Button,
  Modal,
  Avatar,
  Collapse,
} from "@mantine/core";
import {
  IconChartBar,
  IconUsers,
  IconChecklist,
  IconAward,
  IconUserCheck,
  IconAlertCircle,
  IconFileTypePdf,
  IconVideo,
  IconSchool,
  IconSearch,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconPlayerPlay,
  IconExternalLink,
  IconCheck,
  IconX,
  IconNotes,
  IconShirt,
  IconCamera,
  IconClock,
  IconFlame,
  IconUser,
  IconBook,
  IconSparkles,
} from "@tabler/icons-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "../../../context/AuthContext";
import { UserRole } from "../../../types/user";
import { reportingApi } from "../api/reportingApi";
import "./ModernCard.css";

// Helper to pick color for criteria score progress bar
const getScoreColor = (percentage) => {
  if (percentage >= 80) return "teal";
  if (percentage >= 60) return "blue";
  if (percentage >= 40) return "yellow";
  return "red";
};

// Helper for Google Drive embed
const getEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("drive.google.com") && url.includes("/view")) {
    return url.replace("/view", "/preview");
  }
  return url;
};

// Helper icon for criteria keys
const getCriterionIcon = (key) => {
  const k = String(key).toLowerCase();
  if (k.includes("arabic") || k.includes("recit") || k.includes("read")) {
    return <IconBook size={16} />;
  }
  if (k.includes("attire") || k.includes("dress")) {
    return <IconShirt size={16} />;
  }
  if (k.includes("present") || k.includes("camera") || k.includes("video")) {
    return <IconCamera size={16} />;
  }
  if (k.includes("time") || k.includes("delivery")) {
    return <IconClock size={16} />;
  }
  if (k.includes("spirit")) {
    return <IconFlame size={16} />;
  }
  if (k.includes("body") || k.includes("language")) {
    return <IconUser size={16} />;
  }
  return <IconSparkles size={16} />;
};

export function WlsReportingDashboard({ currentUser }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;

  const isSuperAdmin = user?.role === UserRole.SUPER_USER;
  const isWlsAdmin = user?.role === UserRole.WLS_ADMIN || isSuperAdmin;
  const isStudent = !isWlsAdmin;

  const [data, setData] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSessionId, setSelectedSessionId] = useState("ALL");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("overview");

  // Expandable student scorecard state
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Video preview modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState("");
  const [videoModalTitle, setVideoModalTitle] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSessionId, selectedGroup, user?.role, user?._id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        role: user?.role,
        userId: isStudent ? user?.id || user?._id : undefined,
        sessionId: selectedSessionId !== "ALL" ? selectedSessionId : undefined,
        groupNumber: selectedGroup !== "ALL" ? selectedGroup : undefined,
      };

      const res = await reportingApi.getAnalyticsReport(params);
      if (res && res.success) {
        setData(res);
        if (Array.isArray(res.sessions)) {
          setSessionsList(res.sessions);
        }
      } else {
        setData(res || { assessments: [], metrics: {} });
      }
    } catch (err) {
      console.error("Failed to load WLS reporting data:", err);
      setError("Failed to load live database analytics reports.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleOpenVideo = (url, title) => {
    setActiveVideoUrl(url);
    setVideoModalTitle(title || "WLS Student Video Submission");
    setVideoModalOpen(true);
  };

  if (loading && !data) {
    return (
      <Center py="xl" style={{ height: "450px" }}>
        <Stack align="center" gap="sm">
          <Loader size="lg" color="indigo" type="dots" />
          <Text size="sm" c="dimmed">
            Loading live WLS assessment and criteria reports...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error && !data) {
    return (
      <Container size="xl" py="lg">
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Reporting Error"
          color="red"
          variant="filled"
          radius="md"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const {
    metrics = {},
    statusData = [],
    groupPerformanceData = [],
    criteriaPerformanceData = [],
    criteriaConfig = [],
    assessments = [],
    studentSummary = null,
  } = data || {};

  // Session options for dropdown
  const sessionOptions = [
    { value: "ALL", label: "🌟 All WLS Sessions (Global Aggregate)" },
    ...sessionsList.map((s) => ({
      value: s._id || s.id,
      label: `${s.topicName || "WLS Session"} (${new Date(
        s.sessionDateTimeToronto || s.createdAt,
      ).toLocaleDateString()})`,
    })),
  ];

  // Group options
  const groupNumbers = Array.from(
    new Set(
      assessments
        .map((a) => a.groupNumber)
        .filter((g) => g !== undefined && g !== null),
    ),
  ).sort((a, b) => a - b);

  const groupOptions = [
    { value: "ALL", label: "All Groups" },
    ...groupNumbers.map((g) => ({
      value: String(g),
      label: `Group ${g}`,
    })),
  ];

  // Filter assessments locally for instant search & status refinement
  const filteredAssessments = assessments.filter((item) => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = item.studentName?.toLowerCase().includes(q);
      const matchEmail = item.studentEmail?.toLowerCase().includes(q);
      const matchTopic = item.sessionTopic?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchTopic) return false;
    }

    if (statusFilter !== "ALL") {
      const s = String(item.status).toUpperCase();
      if (statusFilter === "COMPLETED" && s !== "COMPLETED" && s !== "REVIEWED") {
        return false;
      }
      if (
        statusFilter === "UNDER_REVIEW" &&
        s !== "UNDER_REVIEW" &&
        s !== "PARTIAL_SAVED"
      ) {
        return false;
      }
      if (statusFilter === "SUBMITTED" && s !== "SUBMITTED") {
        return false;
      }
      if (statusFilter === "PENDING" && s !== "PENDING") {
        return false;
      }
    }

    return true;
  });

  // ==========================================
  // RENDER STUDENT VIEW (Role: USER)
  // ==========================================
  if (isStudent) {
    return (
      <Container size="xl" py="lg" mt="sm">
        {/* Student Banner */}
        <Paper
          p="xl"
          radius="lg"
          shadow="sm"
          withBorder
          mb="lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(76, 110, 245, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)",
            borderColor: "#c7d2fe",
          }}
        >
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="md">
              <Avatar
                src={user?.profilePictureUrl}
                size="xl"
                radius="xl"
                color="indigo"
              >
                {user?.name ? user.name.charAt(0) : "S"}
              </Avatar>
              <Box>
                <Title order={2} c="indigo.9">
                  My WLS Performance & Evaluation Report
                </Title>
                <Text size="sm" c="dimmed">
                  Official academic progress, rubrics breakdown, and coach
                  evaluations for {user?.name || "Student"} ({user?.email})
                </Text>
              </Box>
            </Group>
            <Tooltip label="Save / Print Report as PDF">
              <ActionIcon
                variant="light"
                color="indigo"
                size="xl"
                radius="md"
                onClick={handlePrintPdf}
                aria-label="Save / Print Report as PDF"
              >
                <IconFileTypePdf size={24} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>

        {/* Student KPI Summary Cards */}
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
                Sessions Enrolled
              </Text>
              <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
                <IconSchool size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" mt="sm">
              {studentSummary?.totalSessionsAttended || assessments.length}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Enrolled weekly assignments
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
                Cumulative Grade Average
              </Text>
              <ThemeIcon color="indigo" variant="light" size="lg" radius="xl">
                <IconAward size={20} />
              </ThemeIcon>
            </Group>
            <Group align="baseline" gap="xs" mt="sm">
              <Text fw={700} size="xl">
                {metrics.overallAverageScore || 0}%
              </Text>
              <Badge
                color={getScoreColor(metrics.overallAverageScore || 0)}
                variant="light"
              >
                {metrics.overallAverageScore >= 70
                  ? "Passed"
                  : metrics.overallAverageScore > 0
                  ? "Needs Improvement"
                  : "Pending"}
              </Badge>
            </Group>
            <Progress
              value={metrics.overallAverageScore || 0}
              color={getScoreColor(metrics.overallAverageScore || 0)}
              size="sm"
              radius="xl"
              mt="xs"
            />
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
                Sessions Evaluated
              </Text>
              <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
                <IconUserCheck size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" mt="sm">
              {metrics.evaluatedCount || 0} / {assessments.length}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Evaluated by WLS instructors
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
                Pass Rate
              </Text>
              <ThemeIcon color="cyan" variant="light" size="lg" radius="xl">
                <IconChecklist size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" mt="sm">
              {metrics.passRate || 0}%
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Scores meeting 70% threshold
            </Text>
          </Card>
        </SimpleGrid>

        {/* Student Criteria Breakdown Chart */}
        {criteriaPerformanceData.length > 0 && (
          <Paper
            p="xl"
            radius="md"
            shadow="sm"
            withBorder
            className="modern-card"
            mb="xl"
          >
            <Title order={3} c="indigo.9" mb="xs">
              📊 My Criteria-by-Criteria Performance Breakdown
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Visual score averages achieved across each assessed rubric category
              (Arabic Recitation, Attire, Presentation, Memorization, etc.)
            </Text>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={criteriaPerformanceData}>
                  <XAxis
                    dataKey="criterion"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 10]} />
                  <RechartsTooltip
                    formatter={(val) => [`${val} / 10 marks`, "Score"]}
                  />
                  <Bar
                    dataKey="averageScore"
                    fill="#4c6ef5"
                    radius={[6, 6, 0, 0]}
                  >
                    {criteriaPerformanceData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.color || "#4c6ef5"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        )}

        {/* Student Detailed Session Scorecards */}
        <Paper
          p="xl"
          radius="md"
          shadow="sm"
          withBorder
          className="modern-card"
        >
          <Group justify="space-between" mb="md" wrap="wrap">
            <Box>
              <Title order={3} c="indigo.9">
                📝 Session Scorecards & Coach Feedback
              </Title>
              <Text size="sm" c="dimmed">
                Complete evaluation details and section markings for each WLS
                session
              </Text>
            </Box>
            {sessionsList.length > 1 && (
              <Select
                placeholder="Filter by session"
                data={sessionOptions}
                value={selectedSessionId}
                onChange={setSelectedSessionId}
                style={{ width: "260px" }}
              />
            )}
          </Group>

          <Divider my="md" />

          {assessments.length === 0 ? (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="No records found"
              color="blue"
              variant="light"
            >
              You do not have any WLS session assessment records registered in
              the system yet. Once your session begins and is evaluated, your
              full report will appear here.
            </Alert>
          ) : (
            <Stack gap="lg">
              {assessments.map((item) => (
                <Paper
                  key={item._id}
                  p="lg"
                  radius="md"
                  withBorder
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <Group justify="space-between" wrap="wrap" mb="sm">
                    <Box>
                      <Group gap="xs">
                        <Title order={4} c="indigo.8">
                          {item.sessionTopic}
                        </Title>
                        <Badge color="indigo" variant="light">
                          Group {item.groupNumber}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        Session Date:{" "}
                        {new Date(item.sessionDate).toLocaleDateString()}
                      </Text>
                    </Box>

                    <Group gap="xs">
                      <Badge
                        size="lg"
                        color={getScoreColor(item.finalScore)}
                        variant="filled"
                      >
                        Final Grade: {item.finalScore}%
                      </Badge>
                      <Badge
                        size="lg"
                        color={
                          item.conclusionStatus === "PASSED"
                            ? "teal"
                            : item.conclusionStatus === "FAILED"
                            ? "red"
                            : "gray"
                        }
                      >
                        {item.conclusionStatus}
                      </Badge>
                    </Group>
                  </Group>

                  {/* Video submission link */}
                  {item.submissionUrl && (
                    <Group gap="xs" mb="md">
                      <Button
                        size="xs"
                        variant="light"
                        color="indigo"
                        leftSection={<IconPlayerPlay size={14} />}
                        onClick={() =>
                          handleOpenVideo(
                            item.submissionUrl,
                            `${item.sessionTopic} - Video Submission`,
                          )
                        }
                      >
                        Watch Submitted Video
                      </Button>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="indigo"
                        component="a"
                        href={item.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in new tab"
                      >
                        <IconExternalLink size={14} />
                      </ActionIcon>
                    </Group>
                  )}

                  <Divider my="sm" />

                  {/* Section Breakdown Grid */}
                  <Title order={5} c="dark.7" mb="xs">
                    Rubric Criteria Markings:
                  </Title>
                  <SimpleGrid
                    cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    spacing="sm"
                    mb="md"
                  >
                    {Object.values(item.criteriaScores || {}).map((crit) => (
                      <Paper
                        key={crit.key}
                        p="xs"
                        radius="sm"
                        withBorder
                        bg="white"
                      >
                        <Group justify="space-between" mb={4}>
                          <Group gap={6}>
                            <ThemeIcon
                              size="sm"
                              radius="xl"
                              variant="light"
                              color="indigo"
                            >
                              {getCriterionIcon(crit.key)}
                            </ThemeIcon>
                            <Text size="xs" fw={600} lineClamp={1}>
                              {crit.label}
                            </Text>
                          </Group>
                          <Text
                            size="xs"
                            fw={700}
                            c={getScoreColor(crit.percentage)}
                          >
                            {crit.hasScore
                              ? `${crit.score} / ${crit.maxScore}`
                              : "N/A"}
                          </Text>
                        </Group>
                        <Progress
                          value={crit.percentage}
                          color={getScoreColor(crit.percentage)}
                          size="xs"
                          radius="xl"
                        />
                      </Paper>
                    ))}
                  </SimpleGrid>

                  {/* Evaluator Notes */}
                  {Array.isArray(item.evaluations) &&
                    item.evaluations.length > 0 && (
                      <Box mt="sm">
                        <Title order={5} c="dark.7" mb="xs">
                          Instructor & Coach Feedback:
                        </Title>
                        <Stack gap="xs">
                          {item.evaluations.map((ev, eIdx) => (
                            <Paper
                              key={eIdx}
                              p="sm"
                              radius="sm"
                              withBorder
                              bg="white"
                            >
                              <Group justify="space-between" mb={4}>
                                <Text size="xs" fw={700} c="indigo.8">
                                  Evaluator: {ev.evaluatorName}
                                </Text>
                                {ev.evaluatedAt && (
                                  <Text size="xs" c="dimmed">
                                    {new Date(
                                      ev.evaluatedAt,
                                    ).toLocaleDateString()}
                                  </Text>
                                )}
                              </Group>
                              <Text size="sm" c="dark.8">
                                {ev.feedback ||
                                  "No written remarks left for this evaluation."}
                              </Text>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Video Preview Modal */}
        <Modal
          opened={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          title={videoModalTitle}
          size="xl"
          centered
        >
          {activeVideoUrl ? (
            <Box style={{ width: "100%", height: "450px" }}>
              <iframe
                src={getEmbedUrl(activeVideoUrl)}
                title="WLS Video"
                width="100%"
                height="100%"
                style={{ border: "none", borderRadius: "8px" }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </Box>
          ) : (
            <Text c="dimmed">No valid video URL available to preview.</Text>
          )}
        </Modal>
      </Container>
    );
  }

  // ==========================================
  // RENDER ADMIN / SUPER USER VIEW
  // ==========================================
  return (
    <Container size="xl" py="lg" mt="sm">
      {/* Header Banner */}
      <Paper p="xl" radius="lg" shadow="sm" withBorder mb="lg" bg="white">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="md">
            <ThemeIcon size="xl" radius="xl" color="indigo" variant="light">
              <IconChartBar size={26} />
            </ThemeIcon>
            <Box>
              <Title order={2} c="indigo.9">
                WLS Performance Intelligence & Multi-Admin Reporting Suite
              </Title>
              <Text size="sm" c="dimmed">
                Live performance analytics, group comparative insights, and
                criteria-level audit per WLS session.
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
            <Badge size="lg" color="indigo" variant="light">
              {isSuperAdmin ? "SUPER USER PORTAL" : "WLS ADMIN PORTAL"}
            </Badge>
            <Tooltip label="Save / Print Report as PDF">
              <ActionIcon
                variant="light"
                color="indigo"
                size="xl"
                radius="md"
                onClick={handlePrintPdf}
                aria-label="Save / Print Report as PDF"
              >
                <IconFileTypePdf size={24} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      {/* Session & Global Filter Card */}
      <Paper
        p="lg"
        radius="md"
        shadow="sm"
        withBorder
        className="modern-card mb-xl-print-hide"
        mb="lg"
      >
        <Title order={4} c="indigo.8" mb="sm">
          🔍 Real-Time Session & Group Filter Control
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Select
            label="1. Select WLS Session"
            description="Choose session or view global aggregate"
            data={sessionOptions}
            value={selectedSessionId}
            onChange={(val) => setSelectedSessionId(val || "ALL")}
            searchable
          />
          <Select
            label="2. Filter by Group"
            description="Scope metrics to a specific group"
            data={groupOptions}
            value={selectedGroup}
            onChange={(val) => setSelectedGroup(val || "ALL")}
          />
          <Select
            label="3. Review Status Filter"
            description="Filter by submission review state"
            data={[
              { value: "ALL", label: "All Review Statuses" },
              { value: "COMPLETED", label: "Completed / Graded" },
              { value: "UNDER_REVIEW", label: "Under Review / In Progress" },
              { value: "SUBMITTED", label: "Submitted (Awaiting Grading)" },
              { value: "PENDING", label: "Pending Video Submission" },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || "ALL")}
          />
        </SimpleGrid>
      </Paper>

      {/* Top Metrics KPI Cards */}
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
              Total Enrolled Students
            </Text>
            <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.totalStudents || assessments.length}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {metrics.totalSubmissions || 0} submitted assignments
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
              Evaluated Students
            </Text>
            <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
              <IconUserCheck size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.evaluatedCount || 0} /{" "}
            {metrics.totalStudents || assessments.length}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {metrics.multiAdminCount || 0} multi-admin evaluated
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
              Class Average Score
            </Text>
            <ThemeIcon color="indigo" variant="light" size="lg" radius="xl">
              <IconAward size={20} />
            </ThemeIcon>
          </Group>
          <Group align="baseline" gap="xs" mt="sm">
            <Text fw={700} size="xl">
              {metrics.overallAverageScore || 0}%
            </Text>
            <Badge
              color={getScoreColor(metrics.overallAverageScore || 0)}
              variant="light"
            >
              {metrics.overallAverageScore >= 70 ? "Passing" : "Attention"}
            </Badge>
          </Group>
          <Progress
            value={metrics.overallAverageScore || 0}
            color={getScoreColor(metrics.overallAverageScore || 0)}
            size="sm"
            radius="xl"
            mt="xs"
          />
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
              Pass Rate (≥70%)
            </Text>
            <ThemeIcon color="cyan" variant="light" size="lg" radius="xl">
              <IconChecklist size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {metrics.passRate || 0}%
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {metrics.activeGroupsCount || 0} active study groups
          </Text>
        </Card>
      </SimpleGrid>

      {/* Main Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        color="indigo"
        variant="pills"
        mb="lg"
      >
        <Tabs.List>
          <Tabs.Tab
            value="overview"
            leftSection={<IconChartBar size={16} />}
          >
            Overview & Visual Analytics
          </Tabs.Tab>
          <Tabs.Tab
            value="groups"
            leftSection={<IconUsers size={16} />}
          >
            Group-Wise Performance Reports
          </Tabs.Tab>
          <Tabs.Tab
            value="students"
            leftSection={<IconChecklist size={16} />}
          >
            Individual Student Scorecards ({filteredAssessments.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* TAB 1: OVERVIEW & CHARTS */}
        <Tabs.Panel value="overview" pt="md">
          {/* Visual Charts Grid */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="lg">
            {/* Status Pie Chart */}
            <Paper
              p="lg"
              radius="md"
              shadow="sm"
              withBorder
              className="modern-card"
            >
              <Title order={4} c="dark.8" mb="xs">
                Submission & Review Status
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Distribution of student submissions across review stages
              </Text>
              <div style={{ width: "100%", height: 260 }}>
                {statusData.length === 0 ? (
                  <Center h="100%">
                    <Text c="dimmed">No submission status records</Text>
                  </Center>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || "#4c6ef5"}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Paper>

            {/* Group Performance Bar Chart */}
            <Paper
              p="lg"
              radius="md"
              shadow="sm"
              withBorder
              className="modern-card"
            >
              <Title order={4} c="dark.8" mb="xs">
                Group-Wise Average Scores
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Side-by-side comparative final score average by study group
              </Text>
              <div style={{ width: "100%", height: 260 }}>
                {groupPerformanceData.length === 0 ? (
                  <Center h="100%">
                    <Text c="dimmed">No group evaluation data available</Text>
                  </Center>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupPerformanceData}>
                      <XAxis dataKey="group" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip
                        formatter={(val) => [`${val}%`, "Average Score"]}
                      />
                      <Bar
                        dataKey="averageScore"
                        fill="#4c6ef5"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Paper>
          </SimpleGrid>

          {/* Criteria Breakdown Across Whole Session */}
          <Paper
            p="xl"
            radius="md"
            shadow="sm"
            withBorder
            className="modern-card"
            mb="lg"
          >
            <Title order={4} c="indigo.9" mb="xs">
              📊 Class-Wide Criteria Performance Breakdown
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Average marks obtained across all evaluation rubric sections
              (Arabic Recitation, Dress Code, Camera Position & Quality,
              Memorization, Delivery, Spirit, Body Language)
            </Text>
            <div style={{ width: "100%", height: 320 }}>
              {criteriaPerformanceData.length === 0 ? (
                <Center h="100%">
                  <Text c="dimmed">No criteria evaluations recorded yet</Text>
                </Center>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={criteriaPerformanceData}>
                    <XAxis
                      dataKey="criterion"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis domain={[0, 10]} />
                    <RechartsTooltip
                      formatter={(val, name, item) => [
                        `${val} / ${item.payload.maxScore} marks (${item.payload.percentage}%)`,
                        "Class Average",
                      ]}
                    />
                    <Bar
                      dataKey="averageScore"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    >
                      {criteriaPerformanceData.map((entry, index) => (
                        <Cell
                          key={`cell-crit-${index}`}
                          fill={entry.color || "#3b82f6"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Paper>
        </Tabs.Panel>

        {/* TAB 2: GROUP-WISE REPORTS */}
        <Tabs.Panel value="groups" pt="md">
          <Stack gap="lg">
            {groupPerformanceData.length === 0 ? (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="No Groups Registered"
                color="blue"
              >
                No group assignments or assessment records found for this
                selection.
              </Alert>
            ) : (
              groupPerformanceData.map((grp) => (
                <Paper
                  key={grp.group}
                  p="xl"
                  radius="md"
                  shadow="sm"
                  withBorder
                  className="modern-card"
                >
                  <Group justify="space-between" mb="md" wrap="wrap">
                    <Box>
                      <Group gap="xs">
                        <Title order={3} c="indigo.9">
                          {grp.group}
                        </Title>
                        <Badge color="indigo" variant="light" size="lg">
                          {grp.totalStudents} Students
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {grp.submittedCount} Submitted | {grp.evaluatedCount}{" "}
                        Evaluated
                      </Text>
                    </Box>

                    <Group gap="md">
                      <Box style={{ textAlign: "right" }}>
                        <Text size="xs" c="dimmed">
                          Group Average Score
                        </Text>
                        <Text
                          size="xl"
                          fw={700}
                          c={getScoreColor(grp.averageScore)}
                        >
                          {grp.averageScore}%
                        </Text>
                      </Box>
                      <Box style={{ textAlign: "right" }}>
                        <Text size="xs" c="dimmed">
                          Pass Rate
                        </Text>
                        <Text size="xl" fw={700} c="cyan.8">
                          {grp.passRate}%
                        </Text>
                      </Box>
                    </Group>
                  </Group>

                  <Divider my="sm" />

                  {/* Group criteria averages */}
                  <Title order={5} c="dark.7" mb="xs">
                    Group Section Averages:
                  </Title>
                  <SimpleGrid
                    cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    spacing="sm"
                  >
                    {criteriaConfig.map((cfg) => {
                      const avg = grp.criteriaAverages?.[cfg.key] || 0;
                      const pct = Math.round((avg / cfg.maxScore) * 100);
                      return (
                        <Paper
                          key={cfg.key}
                          p="sm"
                          radius="sm"
                          withBorder
                          bg="white"
                        >
                          <Group justify="space-between" mb={4}>
                            <Group gap={6}>
                              <ThemeIcon
                                size="sm"
                                radius="xl"
                                variant="light"
                                color="indigo"
                              >
                                {getCriterionIcon(cfg.key)}
                              </ThemeIcon>
                              <Text size="xs" fw={600} lineClamp={1}>
                                {cfg.label}
                              </Text>
                            </Group>
                            <Text size="xs" fw={700} c={getScoreColor(pct)}>
                              {avg} / {cfg.maxScore}
                            </Text>
                          </Group>
                          <Progress
                            value={pct}
                            color={getScoreColor(pct)}
                            size="xs"
                            radius="xl"
                          />
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                </Paper>
              ))
            )}
          </Stack>
        </Tabs.Panel>

        {/* TAB 3: INDIVIDUAL STUDENT SCORECARDS */}
        <Tabs.Panel value="students" pt="md">
          <Paper
            p="lg"
            radius="md"
            shadow="sm"
            withBorder
            className="modern-card"
            mb="md"
          >
            <Group justify="space-between" wrap="wrap" gap="md">
              <TextInput
                placeholder="Search by student name, email, or topic..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                style={{ flex: 1, minWidth: "260px" }}
              />
              <Text size="sm" c="dimmed">
                Showing {filteredAssessments.length} student records
              </Text>
            </Group>
          </Paper>

          {filteredAssessments.length === 0 ? (
            <Paper p="xl" radius="md" withBorder ta="center">
              <Text c="dimmed">
                No matching student records found for the active filter.
              </Text>
            </Paper>
          ) : (
            <Stack gap="md">
              {filteredAssessments.map((student) => {
                const isExpanded = expandedStudentId === student._id;

                return (
                  <Paper
                    key={student._id}
                    p="lg"
                    radius="md"
                    shadow="xs"
                    withBorder
                    className="modern-card"
                  >
                    <Group justify="space-between" wrap="wrap" mb="xs">
                      <Group gap="md">
                        <Avatar
                          src={student.studentAvatar}
                          radius="xl"
                          size="md"
                          color="indigo"
                        >
                          {student.studentName
                            ? student.studentName.charAt(0)
                            : "S"}
                        </Avatar>
                        <Box>
                          <Group gap="xs">
                            <Text fw={700} size="md">
                              {student.studentName}
                            </Text>
                            <Badge color="indigo" variant="light" size="sm">
                              Group {student.groupNumber}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {student.studentEmail} • {student.sessionTopic}
                          </Text>
                        </Box>
                      </Group>

                      <Group gap="md">
                        <Badge
                          size="lg"
                          color={getScoreColor(student.finalScore)}
                          variant="filled"
                        >
                          Score: {student.finalScore}%
                        </Badge>
                        <Badge
                          size="lg"
                          color={
                            student.conclusionStatus === "PASSED"
                              ? "teal"
                              : student.conclusionStatus === "FAILED"
                              ? "red"
                              : "gray"
                          }
                        >
                          {student.conclusionStatus}
                        </Badge>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="indigo"
                          rightSection={
                            isExpanded ? (
                              <IconChevronUp size={14} />
                            ) : (
                              <IconChevronDown size={14} />
                            )
                          }
                          onClick={() =>
                            setExpandedStudentId(
                              isExpanded ? null : student._id,
                            )
                          }
                        >
                          {isExpanded ? "Hide Details" : "View Rubric"}
                        </Button>
                      </Group>
                    </Group>

                    {/* Quick action bar */}
                    <Group justify="space-between" mt="xs">
                      <Group gap="xs">
                        {student.submissionUrl ? (
                          <Button
                            size="xs"
                            variant="light"
                            color="indigo"
                            leftSection={<IconPlayerPlay size={14} />}
                            onClick={() =>
                              handleOpenVideo(
                                student.submissionUrl,
                                `${student.studentName} - Video Submission`,
                              )
                            }
                          >
                            Watch Video
                          </Button>
                        ) : (
                          <Badge color="gray" variant="dot">
                            No Video Submission
                          </Badge>
                        )}
                      </Group>

                      <Text size="xs" c="dimmed">
                        {student.evaluations?.length || 0} Evaluator(s) Marked
                      </Text>
                    </Group>

                    {/* Collapsible Detailed Rubric & Evaluator Marks */}
                    <Collapse in={isExpanded}>
                      <Divider my="md" />

                      {/* Criteria Score Grid */}
                      <Title order={5} c="dark.7" mb="xs">
                        Rubric Sections Breakdown:
                      </Title>
                      <SimpleGrid
                        cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                        spacing="sm"
                        mb="md"
                      >
                        {Object.values(student.criteriaScores || {}).map(
                          (crit) => (
                            <Paper
                              key={crit.key}
                              p="xs"
                              radius="sm"
                              withBorder
                              bg="#f8fafc"
                            >
                              <Group justify="space-between" mb={4}>
                                <Group gap={6}>
                                  <ThemeIcon
                                    size="sm"
                                    radius="xl"
                                    variant="light"
                                    color="indigo"
                                  >
                                    {getCriterionIcon(crit.key)}
                                  </ThemeIcon>
                                  <Text size="xs" fw={600} lineClamp={1}>
                                    {crit.label}
                                  </Text>
                                </Group>
                                <Text
                                  size="xs"
                                  fw={700}
                                  c={getScoreColor(crit.percentage)}
                                >
                                  {crit.hasScore
                                    ? `${crit.score} / ${crit.maxScore}`
                                    : "N/A"}
                                </Text>
                              </Group>
                              <Progress
                                value={crit.percentage}
                                color={getScoreColor(crit.percentage)}
                                size="xs"
                                radius="xl"
                              />
                            </Paper>
                          ),
                        )}
                      </SimpleGrid>

                      {/* Evaluator Notes & Feedback */}
                      {Array.isArray(student.evaluations) &&
                      student.evaluations.length > 0 ? (
                        <Box>
                          <Title order={5} c="dark.7" mb="xs">
                            Co-Admin Evaluator Marks & Feedback:
                          </Title>
                          <Stack gap="xs">
                            {student.evaluations.map((ev, eIdx) => (
                              <Paper
                                key={eIdx}
                                p="sm"
                                radius="sm"
                                withBorder
                                bg="#f8fafc"
                              >
                                <Group justify="space-between" mb={4}>
                                  <Text size="xs" fw={700} c="indigo.8">
                                    Evaluator: {ev.evaluatorName}
                                  </Text>
                                  {ev.evaluatedAt && (
                                    <Text size="xs" c="dimmed">
                                      {new Date(
                                        ev.evaluatedAt,
                                      ).toLocaleDateString()}
                                    </Text>
                                  )}
                                </Group>
                                <Text size="sm" c="dark.8">
                                  {ev.feedback ||
                                    "No written remarks left for this evaluation."}
                                </Text>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      ) : (
                        <Text size="xs" c="dimmed">
                          No evaluator reviews completed yet for this student.
                        </Text>
                      )}
                    </Collapse>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Video Modal */}
      <Modal
        opened={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        title={videoModalTitle}
        size="xl"
        centered
      >
        {activeVideoUrl ? (
          <Box style={{ width: "100%", height: "450px" }}>
            <iframe
              src={getEmbedUrl(activeVideoUrl)}
              title="WLS Student Video"
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "8px" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </Box>
        ) : (
          <Text c="dimmed">No valid video URL available to preview.</Text>
        )}
      </Modal>
    </Container>
  );
}

export const ReportingDashboard = WlsReportingDashboard;
export default WlsReportingDashboard;
