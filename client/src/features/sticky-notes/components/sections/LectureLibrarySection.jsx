import React from "react";
import { Text, Card, Group } from "@mantine/core";
import { IconCalendar } from "@tabler/icons-react";

export function LectureLibrarySection({ searchQuery }) {
  const isMatch = (text) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  const libraryLink = "https://iipccanada.com/lecture-library-year-wise/";
  const matchesSearch =
    !searchQuery ||
    isMatch("Lecture Library Year-Wise") ||
    isMatch(libraryLink);

  if (!matchesSearch && searchQuery) {
    return (
      <Text c="dimmed" ta="center" py="xl" size="sm">
        No matching lecture library entries found for "{searchQuery}".
      </Text>
    );
  }

  return (
    <>
      <Card withBorder padding="lg" radius="md" shadow="xs" mb="md">
        <Group gap="sm" mb={8}>
          <IconCalendar size={20} color="var(--mantine-color-indigo-6)" />
          <Text fw={700} size="sm" c="dark.8">
            6. Year-Wise Lecture Archive Index
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mb={12}>
          Access structured chronological archives, lecture records,
          transcripts, audio, and video resources organized year-by-year.
        </Text>
        <a
          href={libraryLink}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13,
            color: "#2563eb",
            fontWeight: 600,
            wordBreak: "break-all",
          }}
        >
          {libraryLink}
        </a>
      </Card>
    </>
  );
}
