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
} from "@mantine/core";
import {
  IconChartBar,
  IconUsers,
  IconAward,
  IconChecklist,
  IconFileAnalytics,
} from "@tabler/icons-react";
import { quizApi } from "../api/quizApi";

export function QuizReportDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadSubmissions(selectedQuizId);
    }
  }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const data = await quizApi.getAllQuizzes();
      setQuizzes(data);
      if (data.length > 0) {
        setSelectedQuizId(data[0].id);
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

  const quizOptions = quizzes.map((q) => ({ value: q.id, label: q.title }));

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

        {/* Stylish, extra-wide drop down to comfortably accommodate long quiz names */}
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

      {/* Summary KPI Cards with beautiful icons */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
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
              Class Average Score
            </Text>
            <ThemeIcon color="cyan" variant="light" radius="md">
              <IconChartBar size={20} />
            </ThemeIcon>
          </Group>
          <Group align="flex-end" gap="xs" mt="sm">
            <Text fw={700} size="xl">
              {averageScore}%
            </Text>
          </Group>
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

      {/* Detailed Student Submissions Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Student Submissions & Grades</Title>
          <IconChecklist size={20} color="gray" />
        </Group>
        <ScrollArea>
          <Table miw={700} verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Student Name</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Percentage</Table.Th>
                <Table.Th>Submitted At</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {submissions.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} align="center">
                    <Text c="dimmed" py="md">
                      No submissions recorded for this quiz yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                submissions.map((sub) => (
                  <Table.Tr key={sub.id}>
                    <Table.Td fw={500}>{sub.userName || "Student"}</Table.Td>
                    <Table.Td>
                      {sub.totalScore} / {sub.maxScore}
                    </Table.Td>
                    <Table.Td w={200}>
                      <Group gap="sm">
                        <Text size="sm" fw={600} w={40}>
                          {sub.percentage}%
                        </Text>
                        <Progress
                          value={sub.percentage}
                          color={sub.percentage >= 50 ? "green" : "red"}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {new Date(sub.submittedAt).toLocaleString()}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>
    </Container>
  );
}
