import React from "react";
import { Paper, Text, Group, Stack, Anchor, ThemeIcon } from "@mantine/core";
import { IconFileText, IconVideo } from "@tabler/icons-react";

export function SessionResources({ session }) {
  const hasPdfs =
    Array.isArray(session.pdfBookletUrls) && session.pdfBookletUrls.length > 0;
  const hasVideos =
    Array.isArray(session.quranVideoUrls) && session.quranVideoUrls.length > 0;

  if (!hasPdfs && !hasVideos) return null;

  return (
    <Paper withBorder p="md" mt="md" radius="md" bg="white" shadow="xs">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
        Session Resources & Materials
      </Text>
      <Group gap="xl">
        {hasPdfs && (
          <Stack gap={4}>
            {session.pdfBookletUrls.map((url, idx) => (
              <Anchor
                key={idx}
                href={url}
                target="_blank"
                size="sm"
                c="blue.7"
                fw={500}
              >
                <Group gap={4} wrap="nowrap">
                  <IconFileText size={16} />
                  <span>PDF Booklet #{idx + 1}</span>
                </Group>
              </Anchor>
            ))}
          </Stack>
        )}
        {hasVideos && (
          <Stack gap={4}>
            {session.quranVideoUrls.map((url, idx) => (
              <Anchor
                key={idx}
                href={url}
                target="_blank"
                size="sm"
                c="teal.7"
                fw={500}
              >
                <Group gap={4} wrap="nowrap">
                  <IconVideo size={16} />
                  <span>Quran Lecture Video #{idx + 1}</span>
                </Group>
              </Anchor>
            ))}
          </Stack>
        )}
      </Group>
    </Paper>
  );
}
