import React from "react";
import {
  Paper,
  Stack,
  Group,
  Text,
  Grid,
  Button,
  Alert,
  Badge,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconCircleCheck,
  IconChevronRight,
} from "@tabler/icons-react";

export default function QuizControls({
  currentAyah,
  surahOptions,
  ayahNoOptions,
  selectedSurah,
  selectedAyahNo,
  surahStatus,
  ayahStatus,
  handleSelectSurah,
  handleSelectAyahNo,
  loadNextAyah,
}) {
  return (
    <Paper
      p="lg"
      radius="lg"
      withBorder
      style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
    >
      <Stack gap="xl">
        {/* STEP 1: SELECT SURAH NAME */}
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Badge circle color="dark" size="sm">
                1
              </Badge>
              <Text fw={700} size="xs" tt="uppercase" c="dimmed">
                Step 1: Identify Surah Name
              </Text>
            </Group>

            {surahStatus === "correct" && (
              <Badge color="green" leftSection={<IconCheck size={12} />}>
                Correct Surah!
              </Badge>
            )}
            {surahStatus === "wrong" && (
              <Badge color="red" leftSection={<IconX size={12} />}>
                Wrong Surah. Try again!
              </Badge>
            )}
          </Group>

          <Grid>
            {surahOptions.map((surah) => {
              const isSelected = selectedSurah?.no === surah.no;
              const isCorrectChoice = surah.no === currentAyah.surahNo;

              let variant = "outline";
              let color = "gray";

              if (isSelected) {
                variant = "light";
                color = isCorrectChoice ? "green" : "red";
              }

              return (
                <Grid.Col span={{ base: 6, sm: 3 }} key={surah.no}>
                  <Button
                    fullWidth
                    h="auto"
                    p="xs"
                    variant={variant}
                    color={color}
                    onClick={() => handleSelectSurah(surah)}
                    styles={{
                      inner: {
                        justifyContent: "flex-start",
                        textAlign: "left",
                      },
                      label: { width: "100%", display: "block" },
                    }}
                  >
                    <Group justify="space-between" align="flex-start" mb={4}>
                      <Text size="xs" c="dimmed">
                        #{surah.no}
                      </Text>
                      <Text size="xs" style={{ fontFamily: "serif" }}>
                        {surah.arabic}
                      </Text>
                    </Group>
                    <Text fw={700} size="xs" truncate>
                      {surah.name}
                    </Text>
                  </Button>
                </Grid.Col>
              );
            })}
          </Grid>
        </Stack>

        {/* STEP 2: SELECT AYAH NUMBER */}
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Badge circle color="dark" size="sm">
                2
              </Badge>
              <Text fw={700} size="xs" tt="uppercase" c="dimmed">
                Step 2: Identify Ayah (Verse) Number
              </Text>
            </Group>

            {ayahStatus === "correct" && (
              <Badge color="green" leftSection={<IconCheck size={12} />}>
                Correct Verse Number!
              </Badge>
            )}
            {ayahStatus === "wrong" && (
              <Badge color="red" leftSection={<IconX size={12} />}>
                Incorrect Verse Number
              </Badge>
            )}
          </Group>

          <Grid>
            {ayahNoOptions.map((num) => {
              const isSelected = selectedAyahNo === num;
              const isCorrectNum = num === currentAyah.ayahNo;

              let variant = "outline";
              let color = "gray";

              if (isSelected) {
                variant = "light";
                color = isCorrectNum ? "green" : "red";
              }

              return (
                <Grid.Col span={{ base: 6, sm: 3 }} key={num}>
                  <Button
                    fullWidth
                    variant={variant}
                    color={color}
                    onClick={() => handleSelectAyahNo(num)}
                  >
                    Ayah {num}
                  </Button>
                </Grid.Col>
              );
            })}
          </Grid>
        </Stack>

        {/* COMPLETION BANNER */}
        {surahStatus === "correct" && ayahStatus === "correct" && (
          <Alert
            color="green"
            title="Reference Mastered!"
            icon={<IconCircleCheck size={20} />}
          >
            <Group justify="space-between" align="center">
              <Text size="xs">
                {currentAyah.surahName} : Verse {currentAyah.ayahNo}
              </Text>
              <Button
                color="green"
                size="xs"
                rightSection={<IconChevronRight size={14} />}
                onClick={loadNextAyah}
              >
                Next Ayah
              </Button>
            </Group>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
