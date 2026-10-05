// src/features/quiz-management/components/QuizReportDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Select,
  Table,
  Group,
  Badge,
  Stack,
  SimpleGrid,
  Progress,
  ScrollArea,
  ThemeIcon,
  Modal,
  Button,
  RingProgress,
  Accordion,
} from "@mantine/core";
import {
  IconChartBar,
  IconUsers,
  IconAward,
  IconChecklist,
  IconFileAnalytics,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEye,
  IconArrowLeft,
} from "@tabler/icons-react";
import { quizApi } from "../api/quizApi";

export function QuizReportDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadSubmissions(selectedQuizId);
      const found = quizzes.find((q) => (q.id || q._id) === selectedQuizId);
      setSelectedQuiz(found || null);
    }
  }, [selectedQuizId, quizzes]);

  const loadQuizzes = async () => {
    try {
      const data = await quizApi.getAllQuizzes();
      setQuizzes(data);
      if (data.length > 0) {
        setSelectedQuizId(data[0].id || data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load quizzes", err);
    }
  };

  const loadSubmissions = async (quizId) => {
    try {
      setLoading(true);
      const data = await quizApi.getSubmissionsByQuiz(quizId);
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const totalSubmissions = submissions.length;
  const passingScoreThreshold = 50; // Pass mark percentage
  const passedCount = submissions.filter(
    (s) => s.percentage >= passingScoreThreshold,
  ).length;
  const failedCount = totalSubmissions - passedCount;

  const averageScore =
    totalSubmissions > 0
      ? Math.round(
          submissions.reduce((acc, curr) => acc + curr.percentage, 0) /
            totalSubmissions,
        )
      : 0;
  const highestScore =
    totalSubmissions > 0
      ? Math.max(...submissions.map((s) => s.percentage))
      : 0;

  const quizOptions = quizzes.map((q) => ({
    value: q.id || q._id,
    label: q.title,
  }));

  // Calculate question-level statistics across all submissions
  const questionStats = React.useMemo(() => {
    if (!selectedQuiz?.questions || submissions.length === 0) return [];

    return selectedQuiz.questions.map((q, qIndex) => {
      let correctCount = 0;
      let incorrectCount = 0;

      submissions.forEach((sub) => {
        const userAns = sub.responses?.[qIndex] ?? sub.answers?.[qIndex];
        if (userAns === undefined) {
          incorrectCount++;
          return;
        }

        // Evaluate correctness based on question type
        let isCorrect = false;
        if (
          q.questionType === "single_select" ||
          q.questionType === "true_false"
        ) {
          isCorrect = q.correctAnswers?.includes(userAns);
        } else if (q.questionType === "multi_select") {
          if (Array.isArray(userAns)) {
            const sortedCorrect = [...(q.correctAnswers || [])].sort().join();
            const sortedUser = [...userAns].sort().join();
            isCorrect = sortedCorrect === sortedUser;
          }
        } else if (q.questionType === "text_input") {
          const expected = (q.correctAnswers?.[0] || "").trim().toLowerCase();
          const given = (userAns || "").trim().toLowerCase();
          isCorrect = expected && given === expected;
        } else if (q.questionType === "sequence_order") {
          if (Array.isArray(userAns)) {
            isCorrect = q.correctAnswers?.every(
              (step, sIdx) => step === userAns[sIdx],
            );
          }
        }

        if (isCorrect) correctCount++;
        else incorrectCount++;
      });

      return {
        questionText: q.questionText || `Question #${qIndex + 1}`,
        questionType: q.questionType,
        correctCount,
        incorrectCount,
        total: totalSubmissions,
      };
    });
  }, [selectedQuiz, submissions, totalSubmissions]);

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg" align="flex-end">
        <Group gap="md">
          <ThemeIcon size={50} radius="md" variant="light" color="grape">
            <IconFileAnalytics size={30} />
          </ThemeIcon>
          <div>
            <Badge color="grape" variant="light" mb={4}>
              Assessment Analytics
            </Badge>
            <Title order={2}>Quiz Performance & Reports</Title>
          </div>
        </Group>

        <Select
          label="Select Target Quiz Report"
          placeholder="Pick a quiz"
          data={quizOptions}
          value={selectedQuizId}
          onChange={setSelectedQuizId}
          w={420}
          size="md"
          allowDeselect={false}
          styles={{
            input: { fontWeight: 600, backgroundColor: "#fcfcfc" },
          }}
        />
      </Group>

      {/* Summary KPI Cards including Pass/Fail breakdown */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mb="xl">
        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Total Submissions
            </Text>
            <ThemeIcon color="blue" variant="light" radius="md">
              <IconUsers size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {totalSubmissions}
          </Text>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Passed / Failed
            </Text>
            <ThemeIcon color="teal" variant="light" radius="md">
              <IconCircleCheck size={20} />
            </ThemeIcon>
          </Group>
          <Group gap="xs" mt="sm">
            <Badge color="teal" size="lg" variant="light">
              {passedCount} Passed
            </Badge>
            <Badge color="red" size="lg" variant="light">
              {failedCount} Failed
            </Badge>
          </Group>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Class Average
            </Text>
            <ThemeIcon color="cyan" variant="light" radius="md">
              <IconChartBar size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {averageScore}%
          </Text>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Highest Score
            </Text>
            <ThemeIcon color="green" variant="light" radius="md">
              <IconAward size={20} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" mt="sm">
            {highestScore}%
          </Text>
        </Card>
      </SimpleGrid>

      {/* Question Analytics Breakdown Card */}
      {questionStats.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Title order={4} mb="md">
            Question-by-Question Success Breakdown
          </Title>
          <Stack gap="sm">
            {questionStats.map((qStat, qIdx) => {
              const successRate =
                totalSubmissions > 0
                  ? Math.round((qStat.correctCount / totalSubmissions) * 100)
                  : 0;
              return (
                <Paper key={qIdx} p="sm" bg="gray.0" radius="sm" withBorder>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={600} style={{ flex: 1 }}>
                      Q{qIdx + 1}: {qStat.questionText}
                    </Text>
                    <Group gap="md">
                      <Badge
                        color="teal"
                        variant="light"
                        leftSection={<IconCircleCheck size={12} />}
                      >
                        {qStat.correctCount} Correct
                      </Badge>
                      <Badge
                        color="red"
                        variant="light"
                        leftSection={<IconCircleX size={12} />}
                      >
                        {qStat.incorrectCount} Failed
                      </Badge>
                    </Group>
                  </Group>
                  <Progress
                    value={successRate}
                    color={
                      successRate >= 60
                        ? "teal"
                        : successRate >= 40
                          ? "yellow"
                          : "red"
                    }
                    size="sm"
                  />
                </Paper>
              );
            })}
          </Stack>
        </Card>
      )}

      {/* Detailed Student Submissions Table with Interactive Drill-Down */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Student Submissions & Reports</Title>
          <IconChecklist size={20} color="gray" />
        </Group>
        <ScrollArea>
          <Table miw={700} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Student Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Percentage</Table.Th>
                <Table.Th>Submitted At</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {submissions.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} align="center">
                    <Text c="dimmed" py="md">
                      No submissions recorded for this quiz yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                submissions.map((sub) => {
                  const isPassed = sub.percentage >= passingScoreThreshold;
                  return (
                    <Table.Tr key={sub.id}>
                      <Table.Td fw={500}>{sub.userName || "Student"}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={isPassed ? "teal" : "red"}
                          variant="light"
                        >
                          {isPassed ? "Passed" : "Failed"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {sub.totalScore} / {sub.maxScore}
                      </Table.Td>
                      <Table.Td w={180}>
                        <Group gap="sm">
                          <Text size="sm" fw={600} w={36}>
                            {sub.percentage}%
                          </Text>
                          <Progress
                            value={sub.percentage}
                            color={isPassed ? "teal" : "red"}
                            size="sm"
                            style={{ flex: 1 }}
                          />
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {new Date(sub.submittedAt).toLocaleString()}
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="violet"
                          leftSection={<IconEye size={14} />}
                          onClick={() => setActiveSubmission(sub)}
                        >
                          View Report
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Detailed Individual Student Report Modal (Matches Reference Layout) */}
      <Modal
        opened={Boolean(activeSubmission)}
        onClose={() => setActiveSubmission(null)}
        size="lg"
        centered
        title={
          <Group gap="xs">
            <IconFileAnalytics size={20} color="#7950f2" />
            <Text fw={700}>
              Quiz Summary Report — {activeSubmission?.userName || "Student"}
            </Text>
          </Group>
        }
      >
        {activeSubmission && (
          <Stack gap="md">
            <Card p="lg" radius="md" bg="gray.0" withBorder ta="center">
              <Title order={3} c="indigo.9" mb={4}>
                {selectedQuiz?.title || "Assessment Report"}
              </Title>
              <Text size="sm" c="dimmed" mb="lg">
                Candidate:{" "}
                <Text span fw={600}>
                  {activeSubmission.userName || "Student"}
                </Text>
              </Text>

              {/* Circular Ring Progress matching reference image */}
              <Group justify="center" mb="md">
                <RingProgress
                  size={140}
                  thickness={14}
                  roundCaps
                  sections={[
                    {
                      value: activeSubmission.percentage,
                      color: activeSubmission.percentage >= 50 ? "teal" : "red",
                    },
                  ]}
                  label={
                    <Text ta="center" fw={700} size="xl">
                      {activeSubmission.percentage}%
                    </Text>
                  }
                />
              </Group>

              <Group justify="center" mb="sm">
                <Badge
                  size="lg"
                  color={activeSubmission.percentage >= 50 ? "teal" : "red"}
                  variant="filled"
                  leftSection={
                    activeSubmission.percentage >= 50 ? (
                      <IconCircleCheck size={14} />
                    ) : (
                      <IconCircleX size={14} />
                    )
                  }
                >
                  {activeSubmission.percentage >= 50 ? "Passed" : "Failed"}
                </Badge>
              </Group>

              <SimpleGrid cols={2} spacing="xs" mt="md" ta="left">
                <Text size="sm">
                  <Text span c="dimmed">
                    Earned Marks:
                  </Text>{" "}
                  <Text span fw={700}>
                    {activeSubmission.totalScore} ({activeSubmission.percentage}
                    %)
                  </Text>
                </Text>
                <Text size="sm">
                  <Text span c="dimmed">
                    Pass Marks:
                  </Text>{" "}
                  <Text span fw={700}>
                    {Math.ceil((activeSubmission.maxScore * 50) / 100)} (50%)
                  </Text>
                </Text>
                <Text size="sm">
                  <Text span c="dimmed">
                    Total Questions:
                  </Text>{" "}
                  <Text span fw={700}>
                    {selectedQuiz?.questions?.length || 0}
                  </Text>
                </Text>
                <Text size="sm">
                  <Text span c="dimmed">
                    Submitted On:
                  </Text>{" "}
                  <Text span fw={700}>
                    {new Date(
                      activeSubmission.submittedAt,
                    ).toLocaleDateString()}
                  </Text>
                </Text>
              </SimpleGrid>
            </Card>

            <Title order={5} mt="sm">
              Review Answer Breakdown
            </Title>
            <ScrollArea h={300}>
              <Stack gap="xs">
                {selectedQuiz?.questions?.map((q, idx) => {
                  const userAns =
                    activeSubmission.responses?.[idx] ??
                    activeSubmission.answers?.[idx];
                  let isCorrect = false;
                  if (
                    q.questionType === "single_select" ||
                    q.questionType === "true_false"
                  ) {
                    isCorrect = q.correctAnswers?.includes(userAns);
                  } else if (q.questionType === "multi_select") {
                    if (Array.isArray(userAns)) {
                      const sortedCorrect = [...(q.correctAnswers || [])]
                        .sort()
                        .join();
                      const sortedUser = [...userAns].sort().join();
                      isCorrect = sortedCorrect === sortedUser;
                    }
                  } else if (q.questionType === "text_input") {
                    const expected = (q.correctAnswers?.[0] || "")
                      .trim()
                      .toLowerCase();
                    const given = (userAns || "").trim().toLowerCase();
                    isCorrect = expected && given === expected;
                  }

                  return (
                    <Paper
                      key={idx}
                      p="sm"
                      bg={isCorrect ? "teal.0" : "red.0"}
                      radius="sm"
                      withBorder
                    >
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={700}>
                          Question #{idx + 1}
                        </Text>
                        <Badge
                          size="sm"
                          color={isCorrect ? "teal" : "red"}
                          variant="light"
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </Group>
                      <Text size="sm" mb={4}>
                        {q.questionText}
                      </Text>
                      <Text size="xs" c="dimmed">
                        User Answer:{" "}
                        <Text span fw={600}>
                          {Array.isArray(userAns)
                            ? userAns.join(", ")
                            : userAns || "No Answer Given"}
                        </Text>
                      </Text>
                    </Paper>
                  );
                })}
              </Stack>
            </ScrollArea>

            <Button
              fullWidth
              variant="default"
              mt="md"
              onClick={() => setActiveSubmission(null)}
            >
              Close Report
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
