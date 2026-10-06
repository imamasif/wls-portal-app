import React from "react";
import {
  Paper,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  ActionIcon,
  Button,
  Box,
} from "@mantine/core";
import {
  IconBook,
  IconGlobe,
  IconTrophy,
  IconFlame,
  IconChartBar,
  IconFilter,
} from "@tabler/icons-react";

export default function QuranHeader({
  dataSource,
  setDataSource,
  score,
  streak,
  accuracyRate,
  onOpenFilterModal,
}) {
  return (
    <Paper
      p="lg"
      radius="xl"
      style={{
        backgroundColor: "#EFECE6",
        border: "1px solid #E2DEC8",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      }}
    >
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="md">
          <ActionIcon
            size={48}
            radius="md"
            style={{ backgroundColor: "#2D6A4F", color: "#FFF" }}
          >
            <IconBook size={26} />
          </ActionIcon>
          <Stack gap={2}>
            <Title
              order={3}
              style={{
                fontFamily: "serif",
                color: "#1A1A1A",
                fontSize: "1.4rem",
              }}
            >
              آيات Reference Studio
            </Title>
            <Text size="xs" c="dimmed">
              Memorize & Test Surah & Ayah References
            </Text>
          </Stack>
        </Group>

        <Group gap="xs" wrap="wrap">
          <Button.Group>
            <Button
              size="xs"
              radius="xl"
              style={{
                backgroundColor: dataSource === "live" ? "#1B4332" : "#FFF",
                color: dataSource === "live" ? "#FFF" : "#333",
              }}
              leftSection={<IconGlobe size={14} />}
              onClick={() => setDataSource("live")}
            >
              Live Quran API
            </Button>
            <Button
              size="xs"
              radius="xl"
              style={{
                backgroundColor: dataSource === "preset" ? "#1B4332" : "#FFF",
                color: dataSource === "preset" ? "#FFF" : "#333",
              }}
              onClick={() => setDataSource("preset")}
            >
              Preset Verses
            </Button>
            <Button
              size="xs"
              radius="xl"
              style={{
                backgroundColor: dataSource === "lectures" ? "#1B4332" : "#FFF",
                color: dataSource === "lectures" ? "#FFF" : "#333",
              }}
              leftSection={<IconFilter size={14} />}
              onClick={() => {
                setDataSource("lectures");
                if (onOpenFilterModal) onOpenFilterModal();
              }}
            >
              Lecture Categories
            </Button>
          </Button.Group>

          <Badge
            variant="white"
            size="lg"
            radius="xl"
            leftSection={<IconTrophy size={14} color="#D97706" />}
            style={{ border: "1px solid #E5E7EB", textTransform: "none" }}
          >
            Points: <strong>{score}</strong>
          </Badge>

          <Badge
            variant="white"
            size="lg"
            radius="xl"
            leftSection={<IconFlame size={14} color="#EF4444" />}
            style={{ border: "1px solid #E5E7EB", textTransform: "none" }}
          >
            Streak: <strong>{streak}</strong>
          </Badge>

          <Badge
            variant="white"
            size="lg"
            radius="xl"
            leftSection={<IconChartBar size={14} color="#0D9488" />}
            style={{ border: "1px solid #E5E7EB", textTransform: "none" }}
          >
            Accuracy: <strong>{accuracyRate}%</strong>
          </Badge>
        </Group>
      </Group>
    </Paper>
  );
}
