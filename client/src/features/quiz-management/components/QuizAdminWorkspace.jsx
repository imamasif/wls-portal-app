// src/features/quiz-management/components/QuizAdminWorkspace.jsx
import React, { useState } from "react";
import {
  TextInput,
  Textarea,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Select,
  ActionIcon,
  FileButton,
  Image,
  Divider,
  Box,
  Title,
  Radio,
  Checkbox,
  Switch,
  Modal,
  Badge,
  ThemeIcon, // <-- Added ThemeIcon here
  useMantineTheme,
} from "@mantine/core";
import {
  IconTrash,
  IconUpload,
  IconX,
  IconPlus,
  IconCheck,
  IconX as IconXMark,
  IconCircleCheck,
  IconCheckbox,
  IconToggleLeft,
  IconForms,
  IconListNumbers,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

export function QuizAdminWorkspace({ initialQuizData, onSave }) {
  const theme = useMantineTheme();

  const quizObj = Array.isArray(initialQuizData)
    ? initialQuizData[0]
    : initialQuizData;
  const quizId = quizObj?._id || quizObj?.id || null;

  const [quizTitle, setQuizTitle] = useState(quizObj?.title || "");
  const [quizDescription, setQuizDescription] = useState(
    quizObj?.description || "",
  );
  const [isActive, setIsActive] = useState(quizObj?.isActive ?? true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Questions state supporting all types including SEQUENCE_ORDER
  const [questions, setQuestions] = useState(() => {
    if (quizObj?.questions && quizObj.questions.length > 0) {
      return quizObj.questions.map((q, qIndex) => {
        const qId = q._id || q.id || Date.now() + qIndex;

        const mappedOptions = (q.options || []).map((optText, optIdx) => ({
          id: `opt-${qId}-${optIdx}`,
          text: optText,
          imageUrl: q.imageUrl || null,
        }));

        // For sequence order questions
        const storedSequence = q.correctSequence || q.correctAnswers || [];
        const sequenceItems =
          q.sequenceItems && q.sequenceItems.length > 0
            ? q.sequenceItems.map((itemText, idx) => ({
                id: `seq-${qId}-${idx}`,
                text: itemText,
              }))
            : mappedOptions;

        let correctOptionId = "";
        let correctOptionIds = [];
        let sampleAnswer = q.sampleAnswer || "";

        const hasStoredCorrectAnswers =
          Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0;

        if (q.questionType === "MULTI_SELECT") {
          if (hasStoredCorrectAnswers) {
            correctOptionIds = mappedOptions
              .filter((item) => q.correctAnswers.includes(item.text))
              .map((item) => item.id);
          }
        } else if (q.questionType === "TEXT_INPUT") {
          sampleAnswer =
            q.sampleAnswer ||
            (hasStoredCorrectAnswers ? q.correctAnswers[0] : "");
        } else {
          if (hasStoredCorrectAnswers) {
            const match = mappedOptions.find((item) =>
              q.correctAnswers.includes(item.text),
            );
            if (match) correctOptionId = match.id;
          } else if (mappedOptions.length > 0) {
            correctOptionId = mappedOptions[0].id;
          }
        }

        return {
          id: qId,
          questionType: q.questionType || "SINGLE_SELECT",
          questionText: q.questionText || "",
          questionImageUrl: q.questionImageUrl || null,
          options:
            mappedOptions.length > 0
              ? mappedOptions
              : [
                  { id: `opt-${qId}-0`, text: "", imageUrl: null },
                  { id: `opt-${qId}-1`, text: "", imageUrl: null },
                ],
          sequenceItems:
            sequenceItems.length > 0
              ? sequenceItems
              : [
                  { id: `seq-${qId}-0`, text: "" },
                  { id: `seq-${qId}-1`, text: "" },
                ],
          correctOptionId,
          correctOptionIds,
          sampleAnswer,
        };
      });
    }

    return [
      {
        id: Date.now(),
        questionType: "SINGLE_SELECT",
        questionText: "",
        questionImageUrl: null,
        options: [
          { id: "opt-1", text: "", imageUrl: null },
          { id: "opt-2", text: "", imageUrl: null },
        ],
        sequenceItems: [
          { id: "seq-1", text: "" },
          { id: "seq-2", text: "" },
        ],
        correctOptionId: "opt-1",
        correctOptionIds: ["opt-1"],
        sampleAnswer: "",
      },
    ];
  });

  const handleImageChange = (
    file,
    targetType,
    questionIndex,
    optionIndex = null,
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const updatedQuestions = [...questions];
      if (targetType === "question") {
        updatedQuestions[questionIndex].questionImageUrl = base64String;
      } else if (targetType === "option") {
        updatedQuestions[questionIndex].options[optionIndex].imageUrl =
          base64String;
      }
      setQuestions(updatedQuestions);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (targetType, questionIndex, optionIndex = null) => {
    const updatedQuestions = [...questions];
    if (targetType === "question") {
      updatedQuestions[questionIndex].questionImageUrl = null;
    } else if (targetType === "option") {
      updatedQuestions[questionIndex].options[optionIndex].imageUrl = null;
    }
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newId = Date.now();
    const opt1 = `opt-${newId}-1`;
    const opt2 = `opt-${newId}-2`;
    setQuestions([
      ...questions,
      {
        id: newId,
        questionType: "SINGLE_SELECT",
        questionText: "",
        questionImageUrl: null,
        options: [
          { id: opt1, text: "", imageUrl: null },
          { id: opt2, text: "", imageUrl: null },
        ],
        sequenceItems: [
          { id: `seq-${newId}-1`, text: "" },
          { id: `seq-${newId}-2`, text: "" },
        ],
        correctOptionId: opt1,
        correctOptionIds: [opt1],
        sampleAnswer: "",
      },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionTypeChange = (index, newType) => {
    const updated = [...questions];
    updated[index].questionType = newType;

    if (newType === "TRUE_FALSE") {
      const tfId1 = `tf-${Date.now()}-true`;
      const tfId2 = `tf-${Date.now()}-false`;
      updated[index].options = [
        { id: tfId1, text: "True", imageUrl: null },
        { id: tfId2, text: "False", imageUrl: null },
      ];
      updated[index].correctOptionId = tfId1;
    }

    setQuestions(updated);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    const q = updatedQuestions[questionIndex];
    if (q.questionType === "SEQUENCE_ORDER") {
      const newSeqId = `seq-${Date.now()}-${q.sequenceItems.length + 1}`;
      q.sequenceItems.push({ id: newSeqId, text: "" });
    } else {
      const newOptionId = `opt-${Date.now()}-${q.options.length + 1}`;
      q.options.push({ id: newOptionId, text: "", imageUrl: null });
    }
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    const q = updatedQuestions[questionIndex];

    if (q.questionType === "SEQUENCE_ORDER") {
      if (q.sequenceItems.length <= 2) {
        alert("Sequence questions must have at least 2 steps.");
        return;
      }
      q.sequenceItems = q.sequenceItems.filter((_, i) => i !== optionIndex);
    } else {
      if (q.options.length <= 2) {
        alert("Each choice-based question must have at least 2 options.");
        return;
      }
      const removedOpt = q.options[optionIndex];
      q.options = q.options.filter((_, i) => i !== optionIndex);
      if (q.correctOptionId === removedOpt.id) {
        q.correctOptionId = q.options[0].id;
      }
      q.correctOptionIds = q.correctOptionIds.filter(
        (id) => id !== removedOpt.id,
      );
    }

    setQuestions(updatedQuestions);
  };

  const moveSequenceItem = (questionIndex, itemIndex, direction) => {
    const updated = [...questions];
    const items = updated[questionIndex].sequenceItems;
    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[itemIndex];
    items[itemIndex] = items[targetIndex];
    items[targetIndex] = temp;

    setQuestions(updated);
  };

  const handlePreSaveClick = () => {
    if (!quizTitle.trim()) {
      alert("Please enter a quiz title before saving.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmedSave = () => {
    setConfirmOpen(false);

    const formattedQuestions = questions.map((q) => {
      let optionTexts = [];
      let correctAnswers = [];
      let correctSequence = [];

      if (q.questionType === "SEQUENCE_ORDER") {
        correctSequence = q.sequenceItems.map((item) => item.text);
        optionTexts = correctSequence;
        correctAnswers = correctSequence;
      } else {
        optionTexts = q.options.map((item) =>
          typeof item === "object" && item !== null ? item.text : item,
        );

        if (q.questionType === "MULTI_SELECT") {
          correctAnswers = q.options
            .filter((item) => q.correctOptionIds?.includes(item.id))
            .map((item) => item.text);
        } else if (q.questionType === "TEXT_INPUT") {
          correctAnswers = [q.sampleAnswer];
        } else {
          const correctOpt = q.options.find(
            (item) => item.id === q.correctOptionId,
          );
          if (correctOpt) {
            correctAnswers = [correctOpt.text];
          }
        }
      }

      return {
        questionType: q.questionType,
        questionText: q.questionText,
        questionImageUrl: q.questionImageUrl,
        options: optionTexts,
        correctAnswers: correctAnswers,
        correctSequence: correctSequence,
        sequenceItems:
          q.questionType === "SEQUENCE_ORDER"
            ? q.sequenceItems.map((i) => i.text)
            : [],
        sampleAnswer: q.sampleAnswer,
      };
    });

    const payload = {
      ...(quizId && { id: quizId }),
      ...(quizId && { _id: quizId }),
      title: quizTitle,
      description: quizDescription,
      isActive: isActive,
      questions: formattedQuestions,
    };

    if (typeof onSave === "function") {
      onSave(payload);
    } else {
      console.error("onSave handler is missing or not a function!");
    }
  };

  return (
    <Box maw={800} mx="auto" p="md">
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="md">
          <ThemeIcon size={50} radius="md" variant="light" color="blue">
            <IconForms size={30} />
          </ThemeIcon>
          <div>
            <Title order={2}>Quiz Creator Workspace</Title>
            <Text size="sm" c="dimmed">
              Configure questionnaire items, select evaluation formats, and set
              session availability.
            </Text>
          </div>
        </Group>
        <Switch
          checked={isActive}
          onChange={(event) => setIsActive(event.currentTarget.checked)}
          color="teal"
          size="md"
          labelPosition="left"
          label={isActive ? "Live Session Active" : "Quiz Closed / Inactive"}
          thumbIcon={
            isActive ? (
              <IconCheck size={12} color={theme.colors.teal[6]} stroke={3} />
            ) : (
              <IconXMark size={12} color={theme.colors.gray[6]} stroke={3} />
            )
          }
        />
      </Group>

      <Stack gap="md" mb="xl">
        <TextInput
          label="Quiz Title"
          placeholder="e.g. Surah An-Najm Assessment"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          required
        />
        <Textarea
          label="Quiz Description"
          placeholder="Brief summary of the quiz..."
          value={quizDescription}
          onChange={(e) => setQuizDescription(e.target.value)}
        />
      </Stack>

      <Divider
        my="lg"
        label="Quiz Questions & Snapshots"
        labelPosition="center"
      />

      <Stack gap="xl">
        {questions.map((q, qIndex) => (
          <Card key={q.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Question #{qIndex + 1}</Text>
              {questions.length > 1 && (
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              )}
            </Group>

            <Stack gap="md">
              <Select
                label="Question Type"
                value={q.questionType}
                onChange={(val) => handleQuestionTypeChange(qIndex, val)}
                data={[
                  {
                    value: "SINGLE_SELECT",
                    label: "Single Choice (One right answer)",
                  },
                  {
                    value: "MULTI_SELECT",
                    label: "Multiple Choice (Multiple right answers)",
                  },
                  {
                    value: "TRUE_FALSE",
                    label: "True / False",
                  },
                  {
                    value: "SEQUENCE_ORDER",
                    label: "Drag & Drop Sequence / Reordering",
                  },
                  {
                    value: "TEXT_INPUT",
                    label: "Short Text Input (Keyword grading)",
                  },
                ]}
              />

              <Textarea
                label="Question Text / Instructions"
                placeholder="Type question or prompt here..."
                value={q.questionText}
                autosize
                onChange={(e) => {
                  const updated = [...questions];
                  updated[qIndex].questionText = e.target.value;
                  setQuestions(updated);
                }}
              />

              <Box>
                <Text size="sm" fw={500} mb={4}>
                  Question PDF Snapshot / Image
                </Text>
                {q.questionImageUrl ? (
                  <Box
                    style={{
                      position: "relative",
                      maxWidth: 300,
                      marginBottom: 8,
                    }}
                  >
                    <Image
                      src={q.questionImageUrl}
                      alt="Question Snapshot"
                      radius="md"
                      fit="contain"
                      style={{ maxHeight: 150 }}
                    />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="sm"
                      style={{ position: "absolute", top: 5, right: 5 }}
                      onClick={() => removeImage("question", qIndex)}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Box>
                ) : (
                  <FileButton
                    onChange={(file) =>
                      handleImageChange(file, "question", qIndex)
                    }
                    accept="image/png,image/jpeg"
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        size="xs"
                        leftSection={<IconUpload size={14} />}
                      >
                        Upload Snapshot
                      </Button>
                    )}
                  </FileButton>
                )}
              </Box>

              <Divider variant="dashed" my="xs" />

              {q.questionType === "TEXT_INPUT" ? (
                <TextInput
                  label="Sample Expected Answer / Keywords for Grading"
                  placeholder="e.g. Expected answer keywords"
                  value={q.sampleAnswer}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIndex].sampleAnswer = e.target.value;
                    setQuestions(updated);
                  }}
                />
              ) : q.questionType === "SEQUENCE_ORDER" ? (
                <>
                  <Text size="sm" fw={500}>
                    Define Correct Sequence (Arrange steps in correct order)
                  </Text>
                  <Stack gap="sm">
                    {q.sequenceItems.map((item, itemIdx) => (
                      <Group key={item.id} align="center" wrap="nowrap">
                        <Badge size="lg" variant="filled" color="orange">
                          {itemIdx + 1}
                        </Badge>
                        <TextInput
                          placeholder={`Step ${itemIdx + 1} text`}
                          value={item.text}
                          style={{ flex: 1 }}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].sequenceItems[itemIdx].text =
                              e.target.value;
                            setQuestions(updated);
                          }}
                        />
                        <Group gap={4}>
                          <ActionIcon
                            variant="default"
                            size="sm"
                            disabled={itemIdx === 0}
                            onClick={() =>
                              moveSequenceItem(qIndex, itemIdx, "up")
                            }
                          >
                            <IconArrowUp size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="default"
                            size="sm"
                            disabled={itemIdx === q.sequenceItems.length - 1}
                            onClick={() =>
                              moveSequenceItem(qIndex, itemIdx, "down")
                            }
                          >
                            <IconArrowDown size={14} />
                          </ActionIcon>
                        </Group>
                        {q.sequenceItems.length > 2 && (
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeOption(qIndex, itemIdx)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    ))}
                  </Stack>
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => addOption(qIndex)}
                    mt="xs"
                    w="fit-content"
                  >
                    Add Step
                  </Button>
                </>
              ) : (
                <>
                  <Text size="sm" fw={500}>
                    Answer Choices
                  </Text>
                  {q.questionType === "MULTI_SELECT" ? (
                    <Stack gap="sm">
                      {q.options.map((opt, optIndex) => (
                        <Group key={opt.id} align="center" wrap="nowrap">
                          <Checkbox
                            checked={q.correctOptionIds?.includes(opt.id)}
                            onChange={(e) => {
                              const updated = [...questions];
                              if (e.currentTarget.checked) {
                                updated[qIndex].correctOptionIds.push(opt.id);
                              } else {
                                updated[qIndex].correctOptionIds = updated[
                                  qIndex
                                ].correctOptionIds.filter(
                                  (id) => id !== opt.id,
                                );
                              }
                              setQuestions(updated);
                            }}
                          />
                          <TextInput
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt.text}
                            style={{ flex: 1 }}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].options[optIndex].text =
                                e.target.value;
                              setQuestions(updated);
                            }}
                          />
                          {q.options.length > 2 && (
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => removeOption(qIndex, optIndex)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      ))}
                    </Stack>
                  ) : (
                    <Radio.Group
                      value={q.correctOptionId}
                      onChange={(value) => {
                        const updated = [...questions];
                        updated[qIndex].correctOptionId = value;
                        setQuestions(updated);
                      }}
                    >
                      <Stack gap="sm">
                        {q.options.map((opt, optIndex) => (
                          <Group key={opt.id} align="center" wrap="nowrap">
                            <Radio value={opt.id} label="" />
                            <TextInput
                              placeholder={`Option ${optIndex + 1}`}
                              value={opt.text}
                              style={{ flex: 1 }}
                              disabled={q.questionType === "TRUE_FALSE"}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIndex].options[optIndex].text =
                                  e.target.value;
                                setQuestions(updated);
                              }}
                            />
                            {q.questionType !== "TRUE_FALSE" &&
                              q.options.length > 2 && (
                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  onClick={() => removeOption(qIndex, optIndex)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              )}
                          </Group>
                        ))}
                      </Stack>
                    </Radio.Group>
                  )}

                  {q.questionType !== "TRUE_FALSE" && (
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      onClick={() => addOption(qIndex)}
                      mt="xs"
                      w="fit-content"
                    >
                      Add Option
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addQuestion}
          leftSection={<IconPlus size={16} />}
        >
          Add New Question
        </Button>

        <Button size="md" color="blue" onClick={handlePreSaveClick} mt="xl">
          Save Changes
        </Button>
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Quiz Update"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to save changes to{" "}
            <strong>"{quizTitle || "Untitled Quiz"}"</strong>?
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleConfirmedSave}>
              Yes, Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
