// src/features/quiz-management/components/QuizListScreen.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Stack,
  SimpleGrid,
  ActionIcon,
  Switch,
  useMantineTheme,
  ThemeIcon,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX as IconXMark,
  IconClipboardList,
  IconHelpCircle,
  IconClock,
} from "@tabler/icons-react";
import { quizApi } from "@/features/quiz-management/api/quizApi";

export function QuizListScreen({ onCreateNew, onEditQuiz }) {
  const theme = useMantineTheme();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizApi.getAllQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleToggleActive = async (quiz) => {
    try {
      const updatedStatus = !quiz.isActive;
      await quizApi.updateQuiz(quiz.id || quiz._id, {
        title: quiz.title,
        description: quiz.description,
        isActive: updatedStatus,
        questions: quiz.questions,
      });
      fetchQuizzes();
    } catch (err) {
      alert("Failed to update quiz session status.");
    }
  };

  const handleDelete = async (id) => {
    modals.openConfirmModal({
      title: "Delete Quiz",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this quiz? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: "Delete Quiz", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await quizApi.deleteQuiz(id);
          fetchQuizzes();
        } catch (err) {
          console.error("Failed to delete quiz:", err);
        }
      },
    });
  };

  return (
    <Box maw={1100} mx="auto" p="md">
      <Group justify="space-between" mb="lg" align="center">
        <Group gap="md">
          <ThemeIcon size={50} radius="md" variant="light" color="indigo">
            <IconClipboardList size={30} />
          </ThemeIcon>
          <div>
            <Title order={2}>Quiz Management Dashboard</Title>
            <Text size="sm" c="dimmed">
              Manage all assessments, control live session statuses, and create
              new quizzes.
            </Text>
          </div>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          color="blue"
          onClick={onCreateNew}
          size="md"
        >
          Create New Quiz
        </Button>
      </Group>

      {loading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading quizzes...
        </Text>
      ) : quizzes.length === 0 ? (
        <Card padding="xl" radius="md" withBorder ta="center">
          <Text c="dimmed">
            No quizzes found. Click "Create New Quiz" to get started.
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {quizzes.map((quiz) => {
            const quizId = quiz.id || quiz._id;
            const isActive = quiz.isActive !== false;

            return (
              <Card
                key={quizId}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ backgroundColor: "#ffffff" }}
              >
                <Stack justify="space-between" h="100%">
                  <div>
                    <Group justify="space-between" mb="xs">
                      <Badge color={isActive ? "teal" : "red"} variant="light">
                        {isActive ? "Active / Live" : "Closed"}
                      </Badge>
                      <Group gap={4}>
                        <IconHelpCircle size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {quiz.questions?.length || 0} Questions
                        </Text>
                      </Group>
                    </Group>

                    <Group gap="sm" mb={6} align="flex-start" wrap="nowrap">
                      <ThemeIcon size="sm" variant="light" color="blue" mt={2}>
                        <IconClock size={12} />
                      </ThemeIcon>
                      <Text fw={700} size="lg" style={{ lineHeight: 1.3 }}>
                        {quiz.title}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                      {quiz.description || "No description provided."}
                    </Text>
                  </div>

                  <Stack gap="xs" mt="md">
                    <Switch
                      checked={isActive}
                      onChange={() => handleToggleActive(quiz)}
                      color="teal"
                      size="sm"
                      label={
                        isActive ? "Submissions Open" : "Submissions Closed"
                      }
                      thumbIcon={
                        isActive ? (
                          <IconCheck
                            size={10}
                            color={theme.colors.teal[6]}
                            stroke={3}
                          />
                        ) : (
                          <IconXMark
                            size={10}
                            color={theme.colors.gray[6]}
                            stroke={3}
                          />
                        )
                      }
                    />

                    <Group justify="space-between" mt="xs">
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconEdit size={14} />}
                        onClick={() => onEditQuiz(quiz)}
                      >
                        Edit
                      </Button>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => handleDelete(quizId)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
