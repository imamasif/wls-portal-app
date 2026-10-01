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
} from "@tabler/icons-react";

export default function QuranHeader({
  useLiveApi,
  setUseLiveApi,
  score,
  streak,
  accuracyRate,
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

          {/* Circular Verses Badge */}
          <Box
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              backgroundColor: "#D8F3DC",
              border: "1px solid #B7E4C7",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            <Text size="10px" fw={700} c="teal.8">
              6,236
            </Text>
            <Text size="8px" c="teal.8">
              Verses
            </Text>
          </Box>
        </Group>

        <Group gap="xs" wrap="wrap">
          <Button
            size="xs"
            radius="xl"
            style={{
              backgroundColor: useLiveApi ? "#1B4332" : "#FFF",
              color: useLiveApi ? "#FFF" : "#333",
            }}
            leftSection={<IconGlobe size={14} />}
            onClick={() => setUseLiveApi(!useLiveApi)}
          >
            {useLiveApi ? "Live Quran API (Active)" : "Preset Verses"}
          </Button>

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
