import React from "react";
import {
  Box,
  Text,
  Stack,
  Group,
  Radio,
  Checkbox,
  TextInput,
  FileButton,
  ActionIcon,
  Image,
  Button,
} from "@mantine/core";
import {
  IconPhoto,
  IconZoomIn,
  IconX,
  IconCheck,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import { QTYPES } from "../../../../config/constants";

export function SingleMultiSelectEditor({
  currentQ,
  onUpdateQuestion,
  onFileProcess,
  onZoomImage,
}) {
  const isMulti = currentQ.questionType === QTYPES.MULTI_SELECT;
  const isTrueFalse = currentQ.questionType === QTYPES.TRUE_FALSE;

  const updateOptionText = (oIndex, text) => {
    const options = [...currentQ.options];
    const oldOptVal = options[oIndex];
    options[oIndex] = text;

    let correctAnswers = [...currentQ.correctAnswers];
    if (correctAnswers.includes(oldOptVal)) {
      correctAnswers = correctAnswers.map((a) => (a === oldOptVal ? text : a));
    }
    onUpdateQuestion({ options, correctAnswers });
  };

  const handleCorrectToggle = (identifier) => {
    if (!identifier) return;
    let correctAnswers = [...currentQ.correctAnswers];

    if (!isMulti || isTrueFalse) {
      correctAnswers = [identifier];
    } else {
      if (correctAnswers.includes(identifier)) {
        correctAnswers = correctAnswers.filter((a) => a !== identifier);
      } else {
        correctAnswers = [...correctAnswers, identifier];
      }
    }
    onUpdateQuestion({ correctAnswers });
  };

  const addOption = () => {
    onUpdateQuestion({
      options: [...currentQ.options, ""],
      optionImages: [...currentQ.optionImages, ""],
    });
  };

  const removeOption = (oIndex) => {
    const optionValToRemove = currentQ.options[oIndex];
    const optionImgToRemove = currentQ.optionImages[oIndex];

    const options = currentQ.options.filter((_, i) => i !== oIndex);
    const optionImages = currentQ.optionImages.filter((_, i) => i !== oIndex);
    const correctAnswers = currentQ.correctAnswers.filter(
      (ans) => ans !== optionValToRemove && ans !== optionImgToRemove,
    );

    onUpdateQuestion({ options, optionImages, correctAnswers });
  };

  return (
    <Box mt="md">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
        {isTrueFalse
          ? "True / False Correct Answer Selection"
          : "Answer Choices (Text or Image-only; click indicator to mark correct)"}
      </Text>
      <Stack gap="xs">
        {currentQ.options.map((opt, oIndex) => {
          const optImg = currentQ.optionImages?.[oIndex] || "";
          const identifier = opt || optImg;
          const isCorrect =
            currentQ.correctAnswers.includes(identifier) && Boolean(identifier);

          return (
            <Group
              key={oIndex}
              p="xs"
              bg={isCorrect ? "teal.0" : "gray.0"}
              style={{
                border: `1px solid ${isCorrect ? "var(--mantine-color-teal-4)" : "var(--mantine-color-gray-3)"}`,
                borderRadius: "8px",
                alignItems: "center",
              }}
            >
              {isMulti ? (
                <Checkbox
                  checked={isCorrect}
                  onChange={() => handleCorrectToggle(identifier)}
                />
              ) : (
                <Radio
                  checked={isCorrect}
                  name="correct-radio"
                  onChange={() => handleCorrectToggle(identifier)}
                />
              )}

              <TextInput
                variant="unstyled"
                placeholder={`Option ${oIndex + 1} text`}
                style={{ flex: 1 }}
                value={opt}
                disabled={isTrueFalse}
                onChange={(e) => updateOptionText(oIndex, e.target.value)}
              />

              {!isTrueFalse && (
                <>
                  <FileButton
                    onChange={(file) =>
                      onFileProcess(file, (imgData) => {
                        const optionImages = [...currentQ.optionImages];
                        optionImages[oIndex] = imgData;
                        onUpdateQuestion({ optionImages });
                      })
                    }
                    accept="image/*"
                  >
                    {(props) => (
                      <ActionIcon
                        {...props}
                        size="sm"
                        variant="subtle"
                        color="violet"
                        title="Upload Option Image"
                      >
                        <IconPhoto size={16} />
                      </ActionIcon>
                    )}
                  </FileButton>

                  {optImg && (
                    <Box
                      pos="relative"
                      p={2}
                      bg="white"
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                      }}
                    >
                      <Image
                        src={optImg}
                        h={90}
                        w={90}
                        radius="sm"
                        fit="contain"
                        style={{ cursor: "pointer" }}
                        onClick={() => onZoomImage(optImg)}
                      />
                      <ActionIcon
                        size="xs"
                        color="violet"
                        variant="filled"
                        pos="absolute"
                        bottom={2}
                        left={2}
                        onClick={() => onZoomImage(optImg)}
                      >
                        <IconZoomIn size={10} />
                      </ActionIcon>
                      <ActionIcon
                        size="xs"
                        color="red"
                        variant="filled"
                        pos="absolute"
                        top={-6}
                        right={-6}
                        onClick={() => {
                          const optionImages = [...currentQ.optionImages];
                          const oldIdentifier =
                            currentQ.options[oIndex] || optionImages[oIndex];
                          optionImages[oIndex] = "";
                          const correctAnswers = currentQ.correctAnswers.filter(
                            (a) => a !== oldIdentifier,
                          );
                          onUpdateQuestion({ optionImages, correctAnswers });
                        }}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    </Box>
                  )}
                </>
              )}

              {isCorrect && <IconCheck size={18} color="teal" />}

              {!isTrueFalse && currentQ.options.length > 2 && (
                <ActionIcon
                  color="red"
                  variant="subtle"
                  size="sm"
                  onClick={() => removeOption(oIndex)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </Group>
          );
        })}

        {!isTrueFalse && (
          <Button
            variant="light"
            color="violet"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={addOption}
            mt="xs"
            w="fit-content"
          >
            Add Option Choice
          </Button>
        )}
      </Stack>
    </Box>
  );
}
