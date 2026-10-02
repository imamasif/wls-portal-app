import React, { useState, useEffect } from "react";
import {
  Text,
  Badge,
  Group,
  Stack,
  Paper,
  Divider,
  SimpleGrid,
  ThemeIcon,
  NumberInput,
  Button,
  Loader,
  Center,
  Image,
  Box,
} from "@mantine/core";
import { IconBook, IconSearch, IconPhotoOff } from "@tabler/icons-react";
import {
  fetchVerseDictionaryData,
  fetchRootOccurrences,
} from "../api/quranDictionaryApi";

export const WordSketchBook = () => {
  const [chapter, setChapter] = useState(21);
  const [verse, setVerse] = useState(18);
  const [loading, setLoading] = useState(false);
  const [verseData, setVerseData] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [occurrencesLoading, setOccurrencesLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoadVerse = async () => {
    setLoading(true);
    try {
      const data = await fetchVerseDictionaryData(chapter, verse);
      setVerseData(data);
      if (data.words && data.words.length > 0) {
        handleSelectWord(data.words[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLoadVerse();
  }, []);

  const handleSelectWord = async (word) => {
    setSelectedWord(word);
    setImageError(false);
    if (word.root) {
      setOccurrencesLoading(true);
      const occurrencesData = await fetchRootOccurrences(word.root);
      setOccurrences(occurrencesData);
      setOccurrencesLoading(false);
    } else {
      setOccurrences([]);
    }
  };

  return (
    <Stack align="center" w="100%" style={{ maxWidth: 800 }} mx="auto" py="md">
      {/* Search Bar / Input Controls */}
      <Paper p="sm" radius="md" withBorder w="100%" bg="gray.0">
        <Group justify="space-between" align="flex-end">
          <Group gap="xs">
            <NumberInput
              label="Surah (1-114)"
              value={chapter}
              onChange={(val) => setChapter(val || 1)}
              min={1}
              max={114}
              w={120}
              size="xs"
            />
            <NumberInput
              label="Ayah"
              value={verse}
              onChange={(val) => setVerse(val || 1)}
              min={1}
              max={286}
              w={100}
              size="xs"
            />
            <Button
              size="xs"
              color="teal"
              leftSection={<IconSearch size={14} />}
              onClick={handleLoadVerse}
              loading={loading}
              mt={20}
            >
              Load Verse
            </Button>
          </Group>

          <Group gap={6}>
            <ThemeIcon color="teal" variant="light" size="sm">
              <IconBook size={16} />
            </ThemeIcon>
            <Text size="xs" fw={700} c="teal.9">
              Clear Quran Visual Dictionary
            </Text>
          </Group>
        </Group>
      </Paper>

      {loading ? (
        <Center py="xl">
          <Loader color="teal" type="dots" />
        </Center>
      ) : verseData ? (
        <Paper
          shadow="md"
          radius="lg"
          p="xl"
          withBorder
          w="100%"
          style={{
            backgroundColor: "#fdfbf7",
            borderColor: "#e3decb",
          }}
        >
          <Stack gap="md">
            {/* Interactive Word Selector Header */}
            <div>
              <Text size="xs" c="dimmed" fw={600} mb={6}>
                Select any word below to view dictionary entry:
              </Text>

              <Group gap="xs" dir="rtl" justify="center" wrap="wrap">
                {verseData.words.map((w) => {
                  const isSelected = selectedWord?.id === w.id;
                  return (
                    <Button
                      key={w.id}
                      variant={isSelected ? "filled" : "outline"}
                      color={isSelected ? "teal" : "gray"}
                      size="md"
                      onClick={() => handleSelectWord(w)}
                      style={{
                        fontFamily: "serif",
                        fontSize: "1.2rem",
                        height: "auto",
                        padding: "6px 12px",
                      }}
                    >
                      {w.arabicText}
                    </Button>
                  );
                })}
              </Group>
            </div>

            <Divider my="2" color="gray.3" />

            {/* Selected Word Details Grid */}
            {selectedWord && (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="xs">
                {/* Left: Dynamic API Image Rendering */}
                <Paper
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    backgroundColor: "#f5f0e6",
                    borderColor: "#d8cfbc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 200,
                  }}
                >
                  {selectedWord.imageUrl && !imageError ? (
                    <Stack align="center" gap="xs">
                      <Image
                        src={selectedWord.imageUrl}
                        alt={selectedWord.transliteration}
                        h={100}
                        fit="contain"
                        onError={() => setImageError(true)}
                      />
                      <Text size="xs" c="dimmed" fw={600}>
                        Dynamic API Render ({selectedWord.location})
                      </Text>
                    </Stack>
                  ) : (
                    <Stack align="center" gap="xs">
                      <Box
                        style={{
                          width: 90,
                          height: 90,
                          borderRadius: "50%",
                          border: "2px dashed #0d9488",
                          backgroundColor: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          fw={900}
                          size="1.8rem"
                          c="teal.8"
                          style={{ fontFamily: "serif" }}
                        >
                          {selectedWord.arabicText}
                        </Text>
                      </Box>
                      <Text size="xs" fw={700} c="dimmed" ta="center">
                        {selectedWord.root
                          ? `Root Entry: [${selectedWord.root}]`
                          : "Grammatical Particle"}
                      </Text>
                    </Stack>
                  )}
                </Paper>

                {/* Right: Khattab Translation & Root Info */}
                <Stack justify="center" gap="xs">
                  <Group justify="space-between">
                    <Badge color="amber" variant="filled" size="md">
                      Root: {selectedWord.root || "N/A"}
                    </Badge>
                    <Badge color="teal" variant="light" size="sm">
                      Location: {selectedWord.location}
                    </Badge>
                  </Group>

                  <Text
                    fw={800}
                    size="2xl"
                    dir="rtl"
                    c="teal.9"
                    style={{ fontFamily: "serif" }}
                  >
                    {selectedWord.arabicText}
                  </Text>

                  <Text size="sm" fw={700} c="dark.7" fs="italic">
                    {selectedWord.transliteration}
                  </Text>

                  <Text size="sm" c="gray.8">
                    <Text span fw={700} c="teal.8">
                      Meaning (Khattab):{" "}
                    </Text>
                    "{selectedWord.translationKhattab}"
                  </Text>
                </Stack>
              </SimpleGrid>
            )}

            <Divider
              my="xs"
              label="Relevant Root Occurrences in Quran"
              labelPosition="center"
              color="gray.3"
            />

            {/* Bottom: Live Occurrences in the Quran */}
            {occurrencesLoading ? (
              <Center py="sm">
                <Loader color="teal" size="sm" />
              </Center>
            ) : occurrences.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                {occurrences.map((occ, i) => (
                  <Paper
                    key={i}
                    p="xs"
                    radius="md"
                    withBorder
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <Stack gap={4}>
                      <Badge
                        size="xs"
                        color="teal"
                        variant="outline"
                        w="fit-content"
                      >
                        Ayah {occ.key}
                      </Badge>
                      <Text
                        size="sm"
                        dir="rtl"
                        fw={700}
                        c="teal.9"
                        style={{ fontFamily: "serif" }}
                        ta="right"
                      >
                        {occ.text}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            ) : (
              <Text size="xs" c="dimmed" ta="center">
                No extra occurrences found or particle/pronoun without a root.
              </Text>
            )}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
};

export default WordSketchBook;
