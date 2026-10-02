import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Title,
  Paper,
  Loader,
  Alert,
  Select,
  ThemeIcon,
  Box,
  SimpleGrid,
} from "@mantine/core";
import {
  IconSitemap,
  IconAlertCircle,
  IconLeaf,
  IconTree,
  IconPlant,
} from "@tabler/icons-react";
import { fetchVerseMorphology } from "../api/quranApi";

const SURAHS = Array.from({ length: 114 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}. Surah ${i + 1}`,
}));

export const QuranTree = () => {
  const [chapter, setChapter] = useState("21");
  const [verse, setVerse] = useState("7");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchVerseMorphology(Number(chapter), Number(verse))
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load morphology details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chapter, verse]);

  // Color mapper for POS Badges
  const getPosColor = (pos) => {
    switch (pos) {
      case "Verb":
        return "red";
      case "Preposition":
        return "indigo";
      case "Particle":
        return "grape";
      case "Pronoun":
        return "cyan";
      case "Conjunction":
        return "orange";
      default:
        return "teal"; // Noun
    }
  };

  return (
    <Stack gap="lg" w="100%">
      <Card shadow="sm" padding="lg" radius="md" withBorder bg="teal.9">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon color="teal.3" variant="light" size="xl" radius="md">
              <IconSitemap size={24} />
            </ThemeIcon>
            <div>
              <Title order={3} c="white">
                Quranic Word Morphology Tree
              </Title>
              <Text size="xs" c="teal.1">
                Grammatically accurate roots, POS tags, and derivatives
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Select
              label="Surah"
              size="xs"
              w={140}
              searchable
              data={SURAHS}
              value={chapter}
              onChange={(val) => setChapter(val || "21")}
            />
            <Select
              label="Ayah"
              size="xs"
              w={90}
              data={Array.from({ length: 100 }, (_, i) => String(i + 1))}
              value={verse}
              onChange={(val) => setVerse(val || "7")}
            />
          </Group>
        </Group>
      </Card>

      {loading && (
        <Group justify="center" py="xl">
          <Loader color="teal" type="dots" size="lg" />
          <Text size="sm" c="dimmed">
            Analyzing morphology for Surah {chapter}:{verse}...
          </Text>
        </Group>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      )}

      {!loading && !error && data && (
        <Stack align="center" gap="0" w="100%">
          {/* Canopy Leaves */}
          <Paper p="md" radius="lg" withBorder bg="gray.0" w="100%">
            <Group justify="center" gap="xs" mb="md">
              <IconLeaf size={20} color="var(--mantine-color-teal-7)" />
              <Text fw={700} size="md" c="teal.9">
                Grammatical Breakdown ({data.totalWords} Words)
              </Text>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {data.branches.map((item) => (
                <Card
                  key={item.id}
                  shadow="xs"
                  padding="sm"
                  radius="md"
                  withBorder
                  bg="white"
                >
                  <Group justify="space-between" mb="xs">
                    <Badge
                      size="xs"
                      color={getPosColor(item.pos)}
                      variant="filled"
                    >
                      {item.pos}
                    </Badge>
                    <Group gap={4}>
                      <Badge
                        size="xs"
                        color={item.gender === "M" ? "blue" : "pink"}
                        variant="light"
                      >
                        {item.gender === "M" ? "مذكر" : "مؤنث"}
                      </Badge>
                      <Badge size="xs" color="orange" variant="outline">
                        {item.number === "S" ? "مفرد" : "جمع"}
                      </Badge>
                    </Group>
                  </Group>

                  <Stack gap={2} align="center" my="xs">
                    <Text
                      fw={700}
                      size="xl"
                      style={{ fontFamily: "serif" }}
                      c="dark.8"
                    >
                      {item.wordArabic}
                    </Text>
                    <Text size="xs" fw={600} c="teal.8">
                      {item.transliteration}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      {item.translation}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Paper>

          {/* Connectors */}
          <Box
            w={6}
            h={28}
            bg="amber.7"
            my="xs"
            style={{ borderRadius: "3px" }}
          />

          {/* Trunk */}
          <Card shadow="xs" padding="sm" radius="xl" withBorder bg="amber.1">
            <Group gap="xs">
              <IconTree size={18} color="var(--mantine-color-amber-8)" />
              <Text fw={700} size="sm" c="amber.9">
                Surah {chapter}, Ayah {verse}
              </Text>
            </Group>
          </Card>

          <Box
            w={6}
            h={28}
            bg="amber.9"
            my="xs"
            style={{ borderRadius: "3px" }}
          />

          {/* Root Soil */}
          {/* Full Verse Soil Node */}
          <Paper
            p="lg"
            radius="lg"
            withBorder
            style={{
              backgroundColor: "var(--mantine-color-gray-0)", // Light background
              borderColor: "var(--mantine-color-gray-3)",
            }}
            w="100%"
          >
            <Stack align="center" gap="xs">
              <Group gap="xs">
                <IconPlant size={20} color="var(--mantine-color-teal-7)" />
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" lts={0.5}>
                  Full Verse Text (Ayah Node)
                </Text>
              </Group>

              <Text
                fw={700}
                size="2xl"
                dir="rtl"
                ta="center"
                style={{
                  fontFamily: "serif",
                  lineHeight: 1.8,
                  color: "var(--mantine-color-dark-8)", // Dark crisp text for light background
                }}
              >
                {data.fullVerseArabic}
              </Text>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
};

export default QuranTree;
