import React, { useMemo } from "react";
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Loader,
  Alert,
  Box,
  Paper,
} from "@mantine/core";
import {
  IconVolume,
  IconVolumeOff,
  IconSparkles,
  IconHelpCircle,
} from "@tabler/icons-react";

const TAPE_COLORS = [
  "#FEF08A",
  "#93C5FD",
  "#FCA5A5",
  "#86EFAC",
  "#D8B4FE",
  "#99F6E4",
  "#374151",
  "#FDBA74",
];

export default function VerseCard({
  currentAyah,
  isLoading,
  isPlayingAudio,
  toggleAudio,
  showHint,
  setShowHint,
  surahStatus,
  ayahStatus,
}) {
  const isCompleted = surahStatus === "correct" && ayahStatus === "correct";

  const { leftTapeColor, rightTapeColor } = useMemo(() => {
    const leftIdx = Math.floor(Math.random() * TAPE_COLORS.length);
    let rightIdx = Math.floor(Math.random() * TAPE_COLORS.length);
    if (leftIdx === rightIdx) rightIdx = (rightIdx + 1) % TAPE_COLORS.length;
    return {
      leftTapeColor: TAPE_COLORS[leftIdx],
      rightTapeColor: TAPE_COLORS[rightIdx],
    };
  }, [currentAyah?.globalId]);

  return (
    <Box style={{ position: "relative", width: "100%", margin: "15px 0" }}>
      <Box
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#EFECE6",
          borderRadius: "24px",
          transform: "rotate(1.2deg)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
          zIndex: 0,
        }}
      />
      <Box
        style={{
          position: "absolute",
          top: -12,
          left: 45,
          width: 65,
          height: 24,
          backgroundColor: leftTapeColor,
          opacity: 0.85,
          transform: "rotate(-6deg)",
          zIndex: 10,
          borderRadius: "2px",
        }}
      />
      <Box
        style={{
          position: "absolute",
          top: -12,
          right: 45,
          width: 65,
          height: 24,
          backgroundColor: rightTapeColor,
          opacity: 0.85,
          transform: "rotate(5deg)",
          zIndex: 10,
          borderRadius: "2px",
        }}
      />

      <Card
        shadow="md"
        padding="xl"
        radius="xl"
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "#FFFFFF",
          border: isCompleted ? "2px solid #2B8A3E" : "1px solid #EAE6DF",
          transform: "rotate(-1.2deg)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
        }}
      >
        {isLoading ? (
          <Stack align="center" py="xl" gap="sm">
            <Loader color="teal" type="dots" />
            <Text size="sm" c="dimmed" fs="italic">
              Loading Verse...
            </Text>
          </Stack>
        ) : currentAyah ? (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Badge color="gray" variant="light" radius="sm" size="xs">
                  AYAH #{currentAyah.globalId || currentAyah.ayahNo}
                </Badge>
                {currentAyah.juz && (
                  <Badge color="yellow" variant="light" radius="sm" size="xs">
                    Juz {currentAyah.juz}
                  </Badge>
                )}
              </Group>

              {currentAyah.audioUrl && (
                <Button
                  size="xs"
                  radius="xl"
                  variant="subtle"
                  style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
                  leftSection={
                    isPlayingAudio ? (
                      <IconVolumeOff size={14} />
                    ) : (
                      <IconVolume size={14} />
                    )
                  }
                  onClick={toggleAudio}
                >
                  {isPlayingAudio ? "Pause Recitation" : "Listen Recitation"}
                </Button>
              )}
            </Group>

            <Text
              ta="center"
              size="2rem"
              fw={500}
              py="md"
              style={{
                fontFamily: "'Amiri', 'Traditional Arabic', serif",
                lineHeight: 2.2,
                color: "#111827",
              }}
            >
              {currentAyah.arabic}
            </Text>

            {/* Translations Stack: English, Urdu, Hindi */}
            <Stack gap="xs">
              {currentAyah.translation && (
                <Paper
                  p="sm"
                  radius="md"
                  style={{
                    backgroundColor: "#FAF9F5",
                    border: "1px dashed #E5E7EB",
                  }}
                >
                  <Badge color="yellow" size="xs" variant="light" mb={4}>
                    ENGLISH TRANSLATION
                  </Badge>
                  <Text
                    size="sm"
                    fs="italic"
                    c="dimmed"
                    style={{ fontFamily: "serif" }}
                  >
                    "{currentAyah.translation}"
                  </Text>
                </Paper>
              )}

              {currentAyah.translationUrdu && (
                <Paper
                  p="sm"
                  radius="md"
                  style={{
                    backgroundColor: "#F0FDF4",
                    border: "1px dashed #BBF7D0",
                  }}
                >
                  <Badge color="green" size="xs" variant="light" mb={4}>
                    URDU (اردو)
                  </Badge>
                  <Text size="sm" dir="rtl" style={{ fontFamily: "serif" }}>
                    {currentAyah.translationUrdu}
                  </Text>
                </Paper>
              )}

              {currentAyah.translationHindi && (
                <Paper
                  p="sm"
                  radius="md"
                  style={{
                    backgroundColor: "#EFF6FF",
                    border: "1px dashed #BFDBFE",
                  }}
                >
                  <Badge color="blue" size="xs" variant="light" mb={4}>
                    HINDI (हिंदी)
                  </Badge>
                  <Text size="sm">{currentAyah.translationHindi}</Text>
                </Paper>
              )}
            </Stack>

            {showHint && (
              <Alert
                icon={<IconSparkles size={16} />}
                title="Reference Hint"
                color="yellow"
                radius="md"
              >
                {currentAyah.notes ||
                  `Surah contains total ${currentAyah.totalAyahsInSurah || "N/A"} verses.`}
              </Alert>
            )}

            <Group justify="space-between" align="center" pt="xs">
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconHelpCircle size={14} />}
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
              <Text size="xs" c="dimmed" fs="italic">
                Select correct Surah & Verse Number below
              </Text>
            </Group>
          </Stack>
        ) : null}
      </Card>
    </Box>
  );
}
