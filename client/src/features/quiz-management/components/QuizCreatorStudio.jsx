// src/features/quiz-management/components/QuizCreatorStudio.jsx
import React, { useState, useEffect } from "react";
import {
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Text,
  NumberInput,
  Box,
  Image,
  Badge,
  SimpleGrid,
  Stack,
  Tabs,
  Card,
  Radio,
  Checkbox,
  Modal,
  FileButton,
  ActionIcon,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconCheck,
  IconEye,
  IconEdit,
  IconArrowRight,
  IconArrowLeft,
  IconRefresh,
  IconZoomIn,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { quizApi } from "../api/quizApi";
import { QUESTION_TYPES, QTYPES } from "../../../config/constants";
import { SingleMultiSelectEditor } from "./question-types/SingleMultiSelectEditor";
import { TextInputEditor } from "./question-types/TextInputEditor";
import { SequenceOrderEditor } from "./question-types/SequenceOrderEditor";

export function QuizCreatorStudio({
  quizToEdit,
  initialQuizData,
  existingQuiz,
  quiz,
  onQuizCreated,
}) {
  const [activeTab, setActiveTab] = useState("edit");

  const activeQuizSource =
    quizToEdit || initialQuizData || existingQuiz || quiz;

  const [quizId, setQuizId] = useState(
    activeQuizSource?._id || activeQuizSource?.id || null,
  );
  const [title, setTitle] = useState(
    activeQuizSource?.title || "New Weekly Assessment",
  );
  const [description, setDescription] = useState(
    activeQuizSource?.description || "",
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const normalizeQuestions = (rawQuestions) => {
    if (
      !rawQuestions ||
      !Array.isArray(rawQuestions) ||
      rawQuestions.length === 0
    ) {
      return [
        {
          questionText: "",
          questionType: QTYPES.SINGLE_SELECT,
          imageUrl: "",
          questionImageUrl: "",
          options: ["", "", "", ""],
          optionImages: ["", "", "", ""],
          correctAnswers: [],
          points: 5,
        },
      ];
    }
    return rawQuestions.map((q, idx) => ({
      ...q,
      questionType: q.questionType || QTYPES.SINGLE_SELECT,
      imageUrl: q.imageUrl || q.questionImageUrl || q.questionImage || "",
      options: q.options?.length > 0 ? q.options : ["", "", "", ""],
      optionImages:
        q.optionImages || new Array(q.options?.length || 4).fill(""),
      correctAnswers: q.correctAnswers || [],
      points: Number(q.points) || 5,
      orderIndex: q.orderIndex !== undefined ? q.orderIndex : idx,
    }));
  };

  const [questions, setQuestions] = useState(
    normalizeQuestions(activeQuizSource?.questions),
  );

  useEffect(() => {
    const targetQuiz = quizToEdit || initialQuizData || existingQuiz || quiz;
    if (targetQuiz) {
      setQuizId(targetQuiz._id || targetQuiz.id || null);
      setTitle(targetQuiz.title || "New Weekly Assessment");
      setDescription(targetQuiz.description || "");
      if (targetQuiz.questions) {
        setQuestions(normalizeQuestions(targetQuiz.questions));
      }
      setActiveQuestionIndex(0);
    } else {
      setQuizId(null);
      setTitle("New Weekly Assessment");
      setDescription("");
      setQuestions(normalizeQuestions([]));
      setActiveQuestionIndex(0);
    }
  }, [quizToEdit, initialQuizData, existingQuiz, quiz]);

  const [previewIndex, setPreviewIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [submittedPreview, setSubmittedPreview] = useState(false);
  const [previewScore, setPreviewScore] = useState(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const currentQ = questions[activeQuestionIndex] || questions[0];

  const handleFileProcess = (file, callback) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageCapture = (e, callback) => {
    const file =
      e.target.files?.[0] || Array.from(e.clipboardData?.files || [])[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const updateCurrentQuestion = (field, value) => {
    const updated = [...questions];
    updated[activeQuestionIndex] = {
      ...updated[activeQuestionIndex],
      [field]: value,
      ...(field === "imageUrl"
        ? { questionImageUrl: value, questionImage: value }
        : {}),
    };
    if (field === "questionType") {
      updated[activeQuestionIndex].correctAnswers = [];
      if (value === QTYPES.TRUE_FALSE) {
        updated[activeQuestionIndex].options = ["True", "False"];
        updated[activeQuestionIndex].optionImages = ["", ""];
      } else if (value === QTYPES.SEQUENCE_ORDER) {
        updated[activeQuestionIndex].options = ["Step 1", "Step 2", "Step 3"];
        updated[activeQuestionIndex].correctAnswers = [
          "Step 1",
          "Step 2",
          "Step 3",
        ];
      }
    }
    setQuestions(updated);
  };

  const mergeCurrentQuestionUpdates = (partialFields) => {
    const updated = [...questions];
    updated[activeQuestionIndex] = {
      ...updated[activeQuestionIndex],
      ...partialFields,
    };
    setQuestions(updated);
  };

  const handleSaveCurrentQuestionLocally = () => {
    if (!currentQ.questionText.trim() && !currentQ.imageUrl) {
      setError(
        "Please provide either question text or a question image snapshot.",
      );
      return;
    }
    setError(null);
    const updated = [...questions];
    updated[activeQuestionIndex] = {
      ...currentQ,
      orderIndex: activeQuestionIndex,
    };
    setQuestions(updated);
    setSuccessMsg(
      `Question #${activeQuestionIndex + 1} successfully saved to queue!`,
    );
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const addQuestion = () => {
    const updated = [...questions];
    updated[activeQuestionIndex] = { ...currentQ };
    const newQuestions = [
      ...updated,
      {
        questionText: "",
        questionType: QTYPES.SINGLE_SELECT,
        imageUrl: "",
        options: ["", "", "", ""],
        optionImages: ["", "", "", ""],
        correctAnswers: [],
        points: 5,
        orderIndex: updated.length,
      },
    ];
    setQuestions(newQuestions);
    setActiveQuestionIndex(newQuestions.length - 1);
  };

  const removeCurrentQuestion = () => {
    if (questions.length === 1) {
      setError("You must keep at least one question in the quiz.");
      return;
    }
    const updated = questions.filter((_, i) => i !== activeQuestionIndex);
    setQuestions(updated);
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const finalizedQuestions = [...questions];
      finalizedQuestions[activeQuestionIndex] = { ...currentQ };

      const validQuestions = finalizedQuestions.filter(
        (q) =>
          (q.questionText && q.questionText.trim().length > 0) || q.imageUrl,
      );

      if (validQuestions.length === 0) {
        throw new Error(
          "Please provide at least one valid question with text or an image.",
        );
      }

      const payload = {
        title,
        description,
        isPublished: true,
        isActive: true,
        createdBy: "super_user",
        questions: validQuestions.map((q, idx) => ({
          ...q,
          questionType: q.questionType || QTYPES.SINGLE_SELECT,
          points: Number(q.points) || 5,
          orderIndex: idx,
          questionImageUrl: q.imageUrl || "",
          questionImage: q.imageUrl || "",
        })),
      };

      let savedQuiz;
      if (quizId) {
        if (typeof quizApi.updateQuiz === "function") {
          savedQuiz = await quizApi.updateQuiz(quizId, payload);
        } else {
          savedQuiz = await quizApi.createQuiz({ ...payload, id: quizId });
        }
        setSuccessMsg("Quiz successfully updated!");
      } else {
        savedQuiz = await quizApi.createQuiz(payload);
        const newId = savedQuiz?._id || savedQuiz?.id;
        if (newId) setQuizId(newId);
        setSuccessMsg("Quiz successfully created and published!");
      }

      if (onQuizCreated) onQuizCreated(savedQuiz);
    } catch (err) {
      setError(err.message || "Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  const calculatePreviewScore = () => {
    let totalScore = 0;
    let maxPossible = 0;

    questions.forEach((q, idx) => {
      const pts = Number(q.points) || 5;
      maxPossible += pts;
      const userAns = userResponses[idx];

      if (!userAns) return;

      if (
        q.questionType === QTYPES.SINGLE_SELECT ||
        q.questionType === QTYPES.TRUE_FALSE
      ) {
        if (q.correctAnswers.includes(userAns)) {
          totalScore += pts;
        }
      } else if (q.questionType === QTYPES.MULTI_SELECT) {
        if (Array.isArray(userAns)) {
          const sortedCorrect = [...q.correctAnswers].sort().join();
          const sortedUser = [...userAns].sort().join();
          if (sortedCorrect === sortedUser) totalScore += pts;
        }
      } else if (q.questionType === QTYPES.TEXT_INPUT) {
        const expected = (q.correctAnswers[0] || "").trim().toLowerCase();
        const given = (userAns || "").trim().toLowerCase();
        if (expected && given === expected) totalScore += pts;
      } else if (q.questionType === QTYPES.SEQUENCE_ORDER) {
        if (Array.isArray(userAns)) {
          const isCorrect = q.correctAnswers.every(
            (step, sIdx) => step === userAns[sIdx],
          );
          if (isCorrect) totalScore += pts;
        }
      }
    });

    setPreviewScore({ score: totalScore, max: maxPossible });
    setSubmittedPreview(true);
  };

  const previewQ = questions[previewIndex] || questions[0];

  return (
    <Box
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "85vh",
        padding: "16px",
        borderRadius: "16px",
      }}
    >
      {error && (
        <Paper p="sm" bg="red.0" c="red.8" radius="md" mb="md" withBorder>
          <Text size="sm">⚠️ {error}</Text>
        </Paper>
      )}

      {successMsg && (
        <Paper p="sm" bg="teal.0" c="teal.8" radius="md" mb="md" withBorder>
          <Text size="sm">✅ {successMsg}</Text>
        </Paper>
      )}

      <Group justify="space-between" mb="md" align="center">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="edit" leftSection={<IconEdit size={16} />}>
              Studio Editor
            </Tabs.Tab>
            <Tabs.Tab value="preview" leftSection={<IconEye size={16} />}>
              User End Preview
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {activeTab === "edit" && (
          <Button
            color="violet"
            size="sm"
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSubmit}
          >
            {quizId ? "Save Changes" : "Publish New Quiz"}
          </Button>
        )}
      </Group>

      {activeTab === "edit" ? (
        <>
          <Paper p="md" radius="md" shadow="xs" withBorder mb="lg">
            <Group justify="space-between" align="center" mb="sm">
              <Box style={{ flex: 1, maxWidth: "400px" }}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Quiz Title
                </Text>
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="md"
                  required
                />
              </Box>
              <Badge variant="light" color="violet" size="lg">
                Editing Q{activeQuestionIndex + 1} of {questions.length}
              </Badge>
            </Group>

            <Group gap="xs" mt="md">
              {questions.map((_, idx) => (
                <Button
                  key={idx}
                  size="compact-sm"
                  variant={activeQuestionIndex === idx ? "filled" : "light"}
                  color={activeQuestionIndex === idx ? "violet" : "gray"}
                  onClick={() => {
                    const updated = [...questions];
                    updated[activeQuestionIndex] = { ...currentQ };
                    setQuestions(updated);
                    setActiveQuestionIndex(idx);
                  }}
                  radius="xl"
                >
                  Q{idx + 1}
                </Button>
              ))}
              <Button
                size="compact-sm"
                variant="subtle"
                color="violet"
                leftSection={<IconPlus size={14} />}
                onClick={addQuestion}
              >
                Add Question
              </Button>
            </Group>
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Paper
              p="md"
              radius="md"
              shadow="xs"
              withBorder
              style={{ height: "fit-content" }}
            >
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Question Config
              </Text>
              <Stack gap="sm">
                <Select
                  label="Question Type"
                  data={QUESTION_TYPES}
                  value={currentQ.questionType}
                  onChange={(val) => updateCurrentQuestion("questionType", val)}
                />
                <NumberInput
                  label="Points"
                  min={1}
                  value={currentQ.points}
                  onChange={(val) => updateCurrentQuestion("points", val)}
                />
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={removeCurrentQuestion}
                  disabled={questions.length <= 1}
                  mt="md"
                >
                  Delete Question
                </Button>
              </Stack>
            </Paper>

            <Paper
              p="xl"
              radius="md"
              shadow="xs"
              withBorder
              style={{ gridColumn: "span 2" }}
            >
              <Group justify="space-between" mb="md">
                <Text fw={700} size="md" c="indigo.9">
                  Question #{activeQuestionIndex + 1} Details
                </Text>
                <Button
                  size="xs"
                  color="teal"
                  variant="light"
                  leftSection={<IconCheck size={14} />}
                  onClick={handleSaveCurrentQuestionLocally}
                >
                  Save Question to Queue
                </Button>
              </Group>

              <Textarea
                label="Question Text"
                placeholder="Type your question here..."
                autosize
                minRows={2}
                value={currentQ.questionText || ""}
                onChange={(e) =>
                  updateCurrentQuestion("questionText", e.target.value)
                }
                onPaste={(e) =>
                  handleImageCapture(e, (img) =>
                    updateCurrentQuestion("imageUrl", img),
                  )
                }
                mb="sm"
              />

              <Group justify="space-between" align="center" mb="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Question Image (Optional)
                </Text>
                <FileButton
                  onChange={(file) =>
                    handleFileProcess(file, (imgData) =>
                      updateCurrentQuestion("imageUrl", imgData),
                    )
                  }
                  accept="image/*"
                >
                  {(props) => (
                    <Button
                      {...props}
                      size="xs"
                      variant="light"
                      color="violet"
                      leftSection={<IconPhoto size={14} />}
                    >
                      Upload Question Image
                    </Button>
                  )}
                </FileButton>
              </Group>

              {currentQ.imageUrl && (
                <Box
                  pos="relative"
                  p={2}
                  bg="white"
                  w="fit-content"
                  mb="md"
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                  }}
                >
                  <Image
                    src={currentQ.imageUrl}
                    h={120}
                    w={160}
                    radius="sm"
                    fit="contain"
                    style={{ cursor: "pointer" }}
                    onClick={() => setZoomedImageUrl(currentQ.imageUrl)}
                  />
                  <ActionIcon
                    size="xs"
                    color="violet"
                    variant="filled"
                    pos="absolute"
                    bottom={4}
                    left={4}
                    onClick={() => setZoomedImageUrl(currentQ.imageUrl)}
                  >
                    <IconZoomIn size={12} />
                  </ActionIcon>
                  <ActionIcon
                    size="xs"
                    color="red"
                    variant="filled"
                    pos="absolute"
                    top={-6}
                    right={-6}
                    onClick={() => updateCurrentQuestion("imageUrl", "")}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Box>
              )}

              {(currentQ.questionType === QTYPES.SINGLE_SELECT ||
                currentQ.questionType === QTYPES.MULTI_SELECT ||
                currentQ.questionType === QTYPES.TRUE_FALSE) && (
                <SingleMultiSelectEditor
                  currentQ={currentQ}
                  onUpdateQuestion={mergeCurrentQuestionUpdates}
                  onFileProcess={handleFileProcess}
                  onZoomImage={setZoomedImageUrl}
                />
              )}

              {currentQ.questionType === QTYPES.TEXT_INPUT && (
                <TextInputEditor
                  currentQ={currentQ}
                  onUpdateQuestion={mergeCurrentQuestionUpdates}
                />
              )}

              {currentQ.questionType === QTYPES.SEQUENCE_ORDER && (
                <SequenceOrderEditor
                  currentQ={currentQ}
                  onUpdateQuestion={mergeCurrentQuestionUpdates}
                />
              )}
            </Paper>
          </SimpleGrid>
        </>
      ) : (
        <Card
          p="xl"
          radius="md"
          shadow="sm"
          withBorder
          style={{ maxWidth: "800px", margin: "0 auto" }}
        >
          <Group justify="space-between" mb="md">
            <Box>
              <Text size="xl" fw={700} c="indigo.9">
                {title}
              </Text>
              <Text size="sm" c="dimmed">
                {description || "Complete the assessment questions below."}
              </Text>
            </Box>
            <Badge size="lg" color="violet">
              Question {previewIndex + 1} of {questions.length}
            </Badge>
          </Group>

          {submittedPreview ? (
            <Paper p="xl" bg="teal.0" radius="md" ta="center" withBorder>
              <Text size="xl" fw={700} c="teal.9" mb="xs">
                Assessment Submitted!
              </Text>
              <Text size="lg" fw={500} mb="md">
                Your Score: {previewScore.score} / {previewScore.max} (
                {Math.round((previewScore.score / previewScore.max) * 100)}%)
              </Text>
              <Button
                color="violet"
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => {
                  setSubmittedPreview(false);
                  setUserResponses({});
                  setPreviewIndex(0);
                }}
              >
                Retake Preview
              </Button>
            </Paper>
          ) : (
            <>
              <Paper p="md" bg="gray.0" radius="md" mb="md" withBorder>
                <Text size="md" fw={600} mb="xs">
                  {previewQ.questionText || "Untitled Question"}
                </Text>
                {previewQ.imageUrl && (
                  <Image
                    src={previewQ.imageUrl}
                    h={180}
                    fit="contain"
                    mb="sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => setZoomedImageUrl(previewQ.imageUrl)}
                  />
                )}

                {/* Render Interactive Options for Preview */}
                {(previewQ.questionType === QTYPES.SINGLE_SELECT ||
                  previewQ.questionType === QTYPES.TRUE_FALSE) && (
                  <Stack gap="xs" mt="sm">
                    {previewQ.options.map((opt, oIdx) => {
                      const optImg = previewQ.optionImages?.[oIdx];
                      const val = opt || optImg;
                      const isSelected = userResponses[previewIndex] === val;

                      return (
                        <Group
                          key={oIdx}
                          p="sm"
                          bg={isSelected ? "violet.1" : "white"}
                          style={{
                            border: `1px solid ${isSelected ? "var(--mantine-color-violet-5)" : "#e2e8f0"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setUserResponses({
                              ...userResponses,
                              [previewIndex]: val,
                            })
                          }
                        >
                          <Radio checked={isSelected} onChange={() => {}} />
                          {opt && <Text size="sm">{opt}</Text>}
                          {optImg && (
                            <Image src={optImg} h={60} w={60} fit="contain" />
                          )}
                        </Group>
                      );
                    })}
                  </Stack>
                )}

                {previewQ.questionType === QTYPES.MULTI_SELECT && (
                  <Stack gap="xs" mt="sm">
                    {previewQ.options.map((opt, oIdx) => {
                      const optImg = previewQ.optionImages?.[oIdx];
                      const val = opt || optImg;
                      const currentSelected = userResponses[previewIndex] || [];
                      const isChecked = currentSelected.includes(val);

                      return (
                        <Group
                          key={oIdx}
                          p="sm"
                          bg={isChecked ? "violet.1" : "white"}
                          style={{
                            border: `1px solid ${isChecked ? "var(--mantine-color-violet-5)" : "#e2e8f0"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            let updated = [...currentSelected];
                            if (isChecked) {
                              updated = updated.filter((item) => item !== val);
                            } else {
                              updated.push(val);
                            }
                            setUserResponses({
                              ...userResponses,
                              [previewIndex]: updated,
                            });
                          }}
                        >
                          <Checkbox checked={isChecked} onChange={() => {}} />
                          {opt && <Text size="sm">{opt}</Text>}
                          {optImg && (
                            <Image src={optImg} h={60} w={60} fit="contain" />
                          )}
                        </Group>
                      );
                    })}
                  </Stack>
                )}

                {previewQ.questionType === QTYPES.TEXT_INPUT && (
                  <TextInput
                    placeholder="Type your answer here..."
                    value={userResponses[previewIndex] || ""}
                    onChange={(e) =>
                      setUserResponses({
                        ...userResponses,
                        [previewIndex]: e.target.value,
                      })
                    }
                    mt="md"
                  />
                )}

                {previewQ.questionType === QTYPES.SEQUENCE_ORDER && (
                  <Stack gap="xs" mt="sm">
                    <Text size="xs" c="dimmed">
                      Click up/down arrows to arrange sequence:
                    </Text>
                    {(userResponses[previewIndex] || previewQ.options).map(
                      (step, sIdx, arr) => (
                        <Group
                          key={sIdx}
                          p="xs"
                          bg="white"
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                          }}
                          justify="space-between"
                        >
                          <Text size="sm">
                            {sIdx + 1}. {step}
                          </Text>
                          <Group gap={4}>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              disabled={sIdx === 0}
                              onClick={() => {
                                const newArr = [...arr];
                                const temp = newArr[sIdx];
                                newArr[sIdx] = newArr[sIdx - 1];
                                newArr[sIdx - 1] = temp;
                                setUserResponses({
                                  ...userResponses,
                                  [previewIndex]: newArr,
                                });
                              }}
                            >
                              ↑
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              disabled={sIdx === arr.length - 1}
                              onClick={() => {
                                const newArr = [...arr];
                                const temp = newArr[sIdx];
                                newArr[sIdx] = newArr[sIdx + 1];
                                newArr[sIdx + 1] = temp;
                                setUserResponses({
                                  ...userResponses,
                                  [previewIndex]: newArr,
                                });
                              }}
                            >
                              ↓
                            </Button>
                          </Group>
                        </Group>
                      ),
                    )}
                  </Stack>
                )}
              </Paper>

              <Group justify="space-between" mt="lg">
                <Button
                  variant="default"
                  disabled={previewIndex === 0}
                  onClick={() =>
                    setPreviewIndex((prev) => Math.max(0, prev - 1))
                  }
                  leftSection={<IconArrowLeft size={16} />}
                >
                  Previous
                </Button>

                {previewIndex < questions.length - 1 ? (
                  <Button
                    color="violet"
                    onClick={() =>
                      setPreviewIndex((prev) =>
                        Math.min(questions.length - 1, prev + 1),
                      )
                    }
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    color="teal"
                    onClick={calculatePreviewScore}
                    leftSection={<IconCheck size={16} />}
                  >
                    Submit Assessment
                  </Button>
                )}
              </Group>
            </>
          )}
        </Card>
      )}

      <Modal
        opened={Boolean(zoomedImageUrl)}
        onClose={() => setZoomedImageUrl(null)}
        size="auto"
        centered
        title="Image Inspector"
      >
        {zoomedImageUrl && (
          <Box ta="center" p="md">
            <Image
              src={zoomedImageUrl}
              fit="contain"
              style={{ maxHeight: "80vh", maxWidth: "90vw" }}
            />
          </Box>
        )}
      </Modal>
    </Box>
  );
}
