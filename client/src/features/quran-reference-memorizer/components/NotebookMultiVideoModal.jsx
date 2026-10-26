import React from "react";
import {
  Modal,
  Group,
  Badge,
  Text,
  Stack,
  Paper,
  Button,
} from "@mantine/core";
import { Play } from "lucide-react";
import { parseVideoTimestamps } from "./notebookUtils";

export function NotebookMultiVideoModal({
  activeMultiVideoModal,
  onClose,
  onPlayVideo,
}) {
  return (
    <Modal
      opened={!!activeMultiVideoModal}
      onClose={onClose}
      title={
        activeMultiVideoModal && (
          <Group gap="xs">
            <Badge color="red" size="md" variant="filled">
              {activeMultiVideoModal.videos.length} Video Clips
            </Badge>
            <Text fw={700} size="sm">
              {activeMultiVideoModal.title}
            </Text>
          </Group>
        )
      }
      size="md"
      centered
      radius="lg"
    >
      {activeMultiVideoModal && (
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Multiple video explanations are linked for this verse. Select any clip to play:
          </Text>

          <Stack gap="xs">
            {activeMultiVideoModal.videos.map((url, idx) => {
              const timeRange = parseVideoTimestamps(url);

              return (
                <Paper
                  key={idx}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:border-red-400 hover:bg-red-50/20"
                  onClick={() => {
                    onPlayVideo(
                      `${activeMultiVideoModal.title} - Clip ${idx + 1}${timeRange ? ` (${timeRange})` : ""}`,
                      url
                    );
                    onClose();
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Group gap={6} align="center">
                          <Text size="xs" fw={700}>
                            Video Clip {idx + 1}
                          </Text>
                          {timeRange && (
                            <Badge size="xs" color="blue" variant="light">
                              ⏱ {timeRange}
                            </Badge>
                          )}
                        </Group>
                        <Text size="10px" c="dimmed" lineClamp={1}>
                          {url}
                        </Text>
                      </div>
                    </Group>

                    <Button
                      size="compact-xs"
                      color="red"
                      variant="filled"
                      leftSection={<Play size={11} fill="currentColor" />}
                    >
                      Play
                    </Button>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Modal>
  );
}
