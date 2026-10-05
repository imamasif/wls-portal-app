import React from "react";
import { Card, Group, Text, Slider, Badge } from "@mantine/core";
import { getScoreLevel } from "../../config/constants";

export function ColorScoreSlider({ label, value = 1, onChange, max = 10 }) {
  const currentVal = Number(value) || 1;
  const scoreLevel = getScoreLevel(currentVal);

  return (
    <Card padding="md" radius="md" withBorder mb="md" shadow="xs">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600} c="dark.7" style={{ flex: 1 }}>
          {label}
        </Text>
        <Group gap="xs">
          <Badge
            color={scoreLevel.color}
            variant="light"
            size="sm"
            tt="uppercase"
            fw={700}
            style={{
              backgroundColor: `${scoreLevel.color}15`,
              color: scoreLevel.color,
              borderColor: scoreLevel.color,
            }}
          >
            {scoreLevel.label}
          </Badge>
          <Badge
            color={scoreLevel.color}
            variant="filled"
            size="sm"
            fw={700}
            style={{ backgroundColor: scoreLevel.color }}
          >
            {currentVal} / {max}
          </Badge>
        </Group>
      </Group>

      <Slider
        value={currentVal}
        onChange={onChange}
        min={1}
        max={max}
        step={1}
        color={scoreLevel.color}
        label={(val) => `${val} — ${getScoreLevel(val).label}`}
        marks={[
          { value: 1, label: "1" },
          { value: Math.round(max * 0.25), label: "25%" },
          { value: Math.round(max * 0.5), label: "50%" },
          { value: Math.round(max * 0.75), label: "75%" },
          { value: max, label: `${max}` },
        ]}
        styles={{
          markLabel: { fontSize: "10px", color: "#868e96" },
          thumb: {
            backgroundColor: scoreLevel.color,
            borderColor: scoreLevel.color,
          },
          bar: { backgroundColor: scoreLevel.color },
        }}
      />
    </Card>
  );
}
