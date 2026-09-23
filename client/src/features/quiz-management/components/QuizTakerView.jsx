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
  RingProgress,
} from "@mantine/core";
import { quizApi } from "../api/quizApi";

export function QuizStudentView({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await quizApi.getAllQuizzes();
        console.log("Quizzes received in student view:", data);

        // Filter the data so regular users only see active quizzes
        const activeQuizzes = data.filter((quiz) => quiz.isActive === true);

        setQuizzes(activeQuizzes);
      } catch (err) {
        console.error("Failed to load quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  const handleAnswerChange = (qIndex, val) => {
    setAnswers({ ...answers, [qIndex]: val });
  };

  const handleSubmit = async () => {
    try {
      const formattedAnswers = Object.keys(answers).map((k) => ({
        questionIndex: parseInt(k),
        selectedAnswer: answers[k],
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
          {activeQuiz.questions.map((q, idx) => (
            <Card key={idx} shadow="xs" padding="lg" radius="md" withBorder>
              <Text fw={600} mb="sm">
                Q{idx + 1}: {q.questionText} ({q.points || 1} pt)
              </Text>

              {/* SINGLE_SELECT or TRUE_FALSE */}
              {(q.questionType === "SINGLE_SELECT" ||
                q.questionType === "TRUE_FALSE") && (
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

              {/* MULTI_SELECT */}
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

              {/* SEQUENCE_ORDER */}
              {q.questionType === "SEQUENCE_ORDER" && (
                <Stack gap="xs" mt="xs">
                  <Text size="sm" c="dimmed">
                    Steps to arrange:
                  </Text>
                  {(q.sequenceItems?.length > 0
                    ? q.sequenceItems
                    : q.options
                  ).map((step, sIdx) => (
                    <Group
                      key={sIdx}
                      justify="space-between"
                      p="xs"
                      withBorder
                      style={{ borderRadius: 4 }}
                    >
                      <Text size="sm">
                        {sIdx + 1}. {step}
                      </Text>
                    </Group>
                  ))}
                  <TextInput
                    placeholder="Enter your sequence order (comma-separated)"
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    mt="xs"
                  />
                </Stack>
              )}

              {/* TEXT_INPUT */}
              {q.questionType === "TEXT_INPUT" && (
                <TextInput
                  placeholder="Type your answer..."
                  value={answers[idx] || ""}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                />
              )}
            </Card>
          ))}
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
              <Button onClick={() => setActiveQuiz(quiz)}>Start Quiz</Button>
            </Group>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
