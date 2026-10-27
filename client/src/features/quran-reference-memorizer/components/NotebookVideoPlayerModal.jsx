import React from "react";
import {
  Modal,
  Group,
  Text,
  Paper,
  Button,
  Badge,
} from "@mantine/core";
import { IconBrandYoutube, IconExternalLink, IconPlayerPlay } from "@tabler/icons-react";
import { getEmbedUrl, getYouTubeWatchUrl } from "./notebookUtils";

export function NotebookVideoPlayerModal({
  activeVideoModal,
  onClose,
  isDark,
}) {
  const url = activeVideoModal?.url || "";
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isIipcTv = url.includes("iipctvstream.com");
  const isDirectVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  return (
    <Modal
      opened={!!activeVideoModal}
      onClose={onClose}
      title={
        <Group gap="xs">
          {isYouTube ? (
            <IconBrandYoutube size={20} color="red" />
          ) : (
            <IconPlayerPlay size={20} color="#4f46e5" />
          )}
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
          {/* Responsive Video Container */}
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
            {isDirectVideo ? (
              <video
                controls
                src={url}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "8px",
                }}
              />
            ) : (
              <iframe
                src={getEmbedUrl(url)}
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
            )}
          </div>

          {/* If YouTube, provide direct fallback note and button */}
          {isYouTube && (
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
                    If YouTube says <i>"Playback on other websites has been disabled by the video owner"</i>, click here to watch directly on YouTube at this exact timestamp segment.
                  </Text>
                </div>
                <Button
                  component="a"
                  href={getYouTubeWatchUrl(url)}
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

          {/* If IIPC TV Stream, provide direct link button */}
          {isIipcTv && (
            <Paper
              p="xs"
              radius="md"
              mt="sm"
              style={{
                background: isDark ? "rgba(79, 70, 229, 0.15)" : "#eef2ff",
                border: "1px solid rgba(79, 70, 229, 0.3)",
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Group gap={6}>
                    <Badge color="indigo" size="xs" variant="filled">
                      IIPC TV Stream
                    </Badge>
                    <Text size="xs" fw={700} c="indigo.8">
                      Official Lecture Recording
                    </Text>
                  </Group>
                  <Text size="11px" c="dimmed" mt={2}>
                    If your browser restricts embedding external web streams, click here to watch the full episode directly on IIPC TV.
                  </Text>
                </div>
                <Button
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="indigo"
                  size="xs"
                  leftSection={<IconExternalLink size={15} />}
                >
                  Watch on IIPC TV
                </Button>
              </Group>
            </Paper>
          )}

          {/* Video Footer info and external link */}
          <Group justify="space-between" align="center" mt="md">
            <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 420 }}>
              {url}
            </Text>
            <Group gap="xs">
              {isYouTube ? (
                <Button
                  component="a"
                  href={getYouTubeWatchUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  color="red"
                  variant="light"
                  leftSection={<IconBrandYoutube size={14} />}
                >
                  Open on YouTube
                </Button>
              ) : (
                <Button
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  color="indigo"
                  variant="light"
                  leftSection={<IconExternalLink size={14} />}
                >
                  Open Video Link
                </Button>
              )}
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
