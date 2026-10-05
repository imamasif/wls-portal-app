import React from "react";
import {
  Box,
  Text,
  Stack,
  Group,
  Badge,
  TextInput,
  ActionIcon,
  Button,
} from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";

export function SequenceOrderEditor({ currentQ, onUpdateQuestion }) {
  const updateStepText = (sIndex, text) => {
    const opts = [...currentQ.options];
    opts[sIndex] = text;
    onUpdateQuestion({ options: opts, correctAnswers: [...opts] });
  };

  const moveStep = (sIndex, direction) => {
    const opts = [...currentQ.options];
    const targetIdx = direction === "up" ? sIndex - 1 : sIndex + 1;
    const temp = opts[sIndex];
    opts[sIndex] = opts[targetIdx];
    opts[targetIdx] = temp;
    onUpdateQuestion({ options: opts, correctAnswers: [...opts] });
  };

  const addStep = () => {
    const opts = [...currentQ.options, ""];
    onUpdateQuestion({ options: opts, correctAnswers: [...opts] });
  };

  const removeStep = (sIndex) => {
    const opts = currentQ.options.filter((_, i) => i !== sIndex);
    onUpdateQuestion({ options: opts, correctAnswers: [...opts] });
  };

  return (
    <Box mt="md">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
        Define Correct Sequence (Arrange steps in proper order)
      </Text>
      <Stack gap="xs">
        {currentQ.options.map((stepText, sIndex) => (
          <Group
            key={sIndex}
            p="xs"
            bg="gray.0"
            style={{
              border: "1px solid var(--mantine-color-gray-3)",
              borderRadius: "8px",
              alignItems: "center",
            }}
          >
            <Badge circle size="lg" color="orange">
              {sIndex + 1}
            </Badge>
            <TextInput
              variant="unstyled"
              placeholder={`Step ${sIndex + 1} text`}
              style={{ flex: 1 }}
              value={stepText}
              onChange={(e) => updateStepText(sIndex, e.target.value)}
            />
            <Group gap={4}>
              <ActionIcon
                size="sm"
                variant="subtle"
                disabled={sIndex === 0}
                onClick={() => moveStep(sIndex, "up")}
              >
                ↑
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="subtle"
                disabled={sIndex === currentQ.options.length - 1}
                onClick={() => moveStep(sIndex, "down")}
              >
                ↓
              </ActionIcon>
              {currentQ.options.length > 2 && (
                <ActionIcon
                  color="red"
                  size="sm"
                  variant="subtle"
                  onClick={() => removeStep(sIndex)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </Group>
          </Group>
        ))}
        <Button
          variant="light"
          color="orange"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={addStep}
          mt="xs"
          w="fit-content"
        >
          Add Step
        </Button>
      </Stack>
    </Box>
  );
}
