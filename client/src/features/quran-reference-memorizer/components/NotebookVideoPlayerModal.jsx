import React from "react";
import {
  Modal,
  Group,
  Text,
  Paper,
  Button,
} from "@mantine/core";
import { IconBrandYoutube } from "@tabler/icons-react";
import { getEmbedUrl, getYouTubeWatchUrl } from "./notebookUtils";

export function NotebookVideoPlayerModal({
  activeVideoModal,
  onClose,
  isDark,
}) {
  return (
    <Modal
      opened={!!activeVideoModal}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconBrandYoutube size={20} color="red" />
          <Text fw={700} size="sm">
            {activeVideoModal?.title}
          </Text>
        </Group>
      }
      size="xl"
      centered
      radius="lg"
    >
      {activeVideoModal && (
        <div>
          {/* 16:9 Responsive Video Iframe (Natively supports ?start=...&end=... parameters) */}
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: "8px",
              backgroundColor: "#000",
            }}
          >
            <iframe
              src={getEmbedUrl(activeVideoModal.url)}
              title={activeVideoModal.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: "8px",
                border: "none",
              }}
            />
          </div>

          {/* If YouTube, provide direct fallback note and button */}
          {getEmbedUrl(activeVideoModal.url)?.includes("youtube.com") && (
            <Paper
              p="xs"
              radius="md"
              mt="sm"
              style={{
                background: isDark ? "rgba(220, 38, 38, 0.15)" : "#fef2f2",
                border: "1px solid rgba(220, 38, 38, 0.3)",
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Text size="xs" fw={700} c="red.8">
                    Playback Restricted by Video Owner?
                  </Text>
                  <Text size="11px" c="dimmed">
                    If YouTube says <i>"Playback on other websites has been disabled by the video owner"</i>, click here to watch directly on YouTube at this exact timestamp segment. (Channel owners can enable this under YouTube Studio ➔ Show more ➔ License ➔ "Allow embedding").
                  </Text>
                </div>
                <Button
                  component="a"
                  href={getYouTubeWatchUrl(activeVideoModal.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="red"
                  size="xs"
                  leftSection={<IconBrandYoutube size={15} />}
                >
                  Watch on YouTube
                </Button>
              </Group>
            </Paper>
          )}

          {/* Video Footer info and external link */}
          <Group justify="space-between" align="center" mt="md">
            <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 420 }}>
              {activeVideoModal.url}
            </Text>
            <Group gap="xs">
              <Button
                component="a"
                href={getYouTubeWatchUrl(activeVideoModal.url)}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconBrandYoutube size={14} />}
              >
                Open on YouTube
              </Button>
              <Button
                size="xs"
                color="gray"
                variant="light"
                onClick={onClose}
              >
                Close
              </Button>
            </Group>
          </Group>
        </div>
      )}
    </Modal>
  );
}
