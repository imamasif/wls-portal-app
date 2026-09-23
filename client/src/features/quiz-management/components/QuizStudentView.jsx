import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Radio,
  Checkbox,
  TextInput,
  Stack,
  Group,
  ActionIcon,
  Badge,
  RingProgress,
} from "@mantine/core";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import { quizApi } from "../api/quizApi";

export function QuizStudentView({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Local state to manage student-specific reorderable items for sequence questions
  const [studentSequences, setStudentSequences] = useState({});

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await quizApi.getAllQuizzes();
        const activeQuizzes = data.filter((quiz) => quiz.isActive === true);
        setQuizzes(activeQuizzes);
      } catch (err) {
        console.error("Failed to load quizzes:", err);
      }
    };
    fetchQuizzes();
  }, []);

  // When a quiz is selected, initialize the sequence items for sequence questions
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    const initialSeqMap = {};
    quiz.questions.forEach((q, idx) => {
      if (q.questionType === "SEQUENCE_ORDER") {
        const items =
          q.sequenceItems?.length > 0 ? [...q.sequenceItems] : [...q.options];
        // Optional: Shuffle them so they aren't already in the correct order
        initialSeqMap[idx] = items.sort(() => Math.random() - 0.5);
      }
    });
    setStudentSequences(initialSeqMap);
    setAnswers({});
  };

  const handleAnswerChange = (qIndex, val) => {
    setAnswers({ ...answers, [qIndex]: val });
  };

  // Handle moving sequence items up or down
  const moveStudentSequenceItem = (qIndex, itemIndex, direction) => {
    const currentList = [...(studentSequences[qIndex] || [])];
    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[itemIndex];
    currentList[itemIndex] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    setStudentSequences({ ...studentSequences, [qIndex]: currentList });
    // Save the arranged array as the answer for this question
    handleAnswerChange(qIndex, currentList);
  };

  const handleSubmit = async () => {
    try {
      // Ensure sequence answers are included from studentSequences if not modified yet
      const finalAnswers = { ...answers };
      activeQuiz.questions.forEach((q, idx) => {
        if (q.questionType === "SEQUENCE_ORDER" && !finalAnswers[idx]) {
          finalAnswers[idx] =
            studentSequences[idx] || q.sequenceItems || q.options;
        }
      });

      const formattedAnswers = Object.keys(finalAnswers).map((k) => ({
        questionIndex: parseInt(k),
        selectedAnswer: finalAnswers[k],
      }));

      const response = await quizApi.submitQuiz({
        quizId: activeQuiz.id,
        userId: user?.id || "student-123",
        userName: user?.name || "Student",
        answers: formattedAnswers,
      });
      setResult(response);
    } catch (err) {
      alert("Error submitting quiz.");
    }
  };

  if (result) {
    return (
      <Container size="sm" py="xl">
        <Card shadow="sm" padding="lg" radius="md" withBorder ta="center">
          <Title order={2} mb="md">
            Quiz Submitted Successfully!
          </Title>
          <RingProgress
            size={160}
            roundCaps
            sections={[
              {
                value: result.percentage,
                color: result.percentage >= 50 ? "green" : "red",
              },
            ]}
            label={
              <Text ta="center" fw={700} size="xl">
                {result.percentage}%
              </Text>
            }
            mx="auto"
            mb="md"
          />
          <Text size="lg" fw={500}>
            Your Score: {result.totalScore} / {result.maxScore}
          </Text>
          <Button
            mt="lg"
            onClick={() => {
              setResult(null);
              setActiveQuiz(null);
            }}
          >
            Back to Quizzes
          </Button>
        </Card>
      </Container>
    );
  }

  if (activeQuiz) {
    return (
      <Container size="md" py="xl">
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
          <Title order={2}>{activeQuiz.title}</Title>
          <Text c="dimmed">{activeQuiz.description}</Text>
        </Card>

        <Stack gap="lg">
          {activeQuiz.questions.map((q, idx) => {
            const currentSequenceItems =
              studentSequences[idx] || q.sequenceItems || q.options || [];

            return (
              <Card key={idx} shadow="xs" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="sm">
                  Q{idx + 1}: {q.questionText} ({q.points || 1} pt)
                </Text>

                {/* 1. SINGLE_SELECT */}
                {q.questionType === "SINGLE_SELECT" && (
                  <Radio.Group
                    value={answers[idx] || ""}
                    onChange={(val) => handleAnswerChange(idx, val)}
                  >
                    <Stack gap="xs" mt="xs">
                      {q.options.map((opt, oIdx) => (
                        <Radio key={oIdx} value={opt} label={opt} />
                      ))}
                    </Stack>
                  </Radio.Group>
                )}

                {/* 2. TRUE_FALSE */}
                {q.questionType === "TRUE_FALSE" && (
                  <Radio.Group
                    value={answers[idx] || ""}
                    onChange={(val) => handleAnswerChange(idx, val)}
                  >
                    <Stack gap="xs" mt="xs">
                      {q.options.map((opt, oIdx) => (
                        <Radio key={oIdx} value={opt} label={opt} />
                      ))}
                    </Stack>
                  </Radio.Group>
                )}

                {/* 3. MULTI_SELECT */}
                {q.questionType === "MULTI_SELECT" && (
                  <Stack gap="xs" mt="xs">
                    {q.options.map((opt, oIdx) => {
                      const currentSelected = answers[idx] || [];
                      const isChecked = currentSelected.includes(opt);
                      return (
                        <Checkbox
                          key={oIdx}
                          label={opt}
                          checked={isChecked}
                          onChange={(e) => {
                            let updated;
                            if (e.currentTarget.checked) {
                              updated = [...currentSelected, opt];
                            } else {
                              updated = currentSelected.filter(
                                (item) => item !== opt,
                              );
                            }
                            handleAnswerChange(idx, updated);
                          }}
                        />
                      );
                    })}
                  </Stack>
                )}

                {/* 4. SEQUENCE_ORDER (Interactive Up/Down Sorting) */}
                {q.questionType === "SEQUENCE_ORDER" && (
                  <Stack gap="xs" mt="xs">
                    <Text size="sm" c="dimmed">
                      Use the up and down arrows to arrange the steps in the
                      correct order:
                    </Text>
                    <Stack gap="xs">
                      {currentSequenceItems.map((step, sIdx) => (
                        <Group
                          key={sIdx}
                          justify="space-between"
                          p="xs"
                          withBorder
                          style={{
                            borderRadius: 6,
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <Group gap="sm">
                            <Badge size="lg" variant="filled" color="orange">
                              {sIdx + 1}
                            </Badge>
                            <Text size="sm" fw={500}>
                              {step}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <ActionIcon
                              variant="default"
                              size="sm"
                              disabled={sIdx === 0}
                              onClick={() =>
                                moveStudentSequenceItem(idx, sIdx, "up")
                              }
                            >
                              <IconArrowUp size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="default"
                              size="sm"
                              disabled={
                                sIdx === currentSequenceItems.length - 1
                              }
                              onClick={() =>
                                moveStudentSequenceItem(idx, sIdx, "down")
                              }
                            >
                              <IconArrowDown size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Stack>
                )}

                {/* 5. TEXT_INPUT */}
                {q.questionType === "TEXT_INPUT" && (
                  <TextInput
                    placeholder="Type your answer..."
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  />
                )}
              </Card>
            );
          })}
          <Button color="green" size="md" onClick={handleSubmit}>
            Submit Quiz
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        Assigned Quizzes
      </Title>
      <Stack gap="md">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Title order={4}>{quiz.title}</Title>
                <Text size="sm" c="dimmed">
                  {quiz.description}
                </Text>
              </div>
              <Button onClick={() => handleStartQuiz(quiz)}>Start Quiz</Button>
            </Group>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
