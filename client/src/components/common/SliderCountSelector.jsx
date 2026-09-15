import React from 'react';
import { Box, Group, NumberInput, Slider, Text } from '@mantine/core';

export function SliderCountSelector({ label, min = 1, max = 100, step = 1, value, onChange }) {
  return (
    <Box mb="sm">
      <Group justify="space-between" align="center" mb={5}>
        <Text size="sm" fw={500}>{label}</Text>
        <NumberInput
          value={value}
          onChange={(val) => onChange(typeof val === 'number' ? val : min)}
          min={min}
          max={max}
          step={step}
          size="xs"
          w={70}
        />
      </Group>

      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        size="sm"
        thumbSize={18}
      />
    </Box>
  );
}