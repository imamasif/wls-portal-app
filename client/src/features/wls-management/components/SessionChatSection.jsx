import React from "react";
import {
  Paper,
  Group,
  ThemeIcon,
  Text,
  ActionIcon,
  Tooltip,
  Stack,
  Avatar,
  Button,
  Textarea,
} from "@mantine/core";
import { IconMessageDots, IconRefresh } from "@tabler/icons-react";

export function SessionChatSection({
  sessionId,
  messages = [],
  isCompleted,
  commentInput,
  commentError,
  onCommentChange,
  onAddComment,
  onRefreshChat,
  onAddEmoji,
}) {
  return (
    <Paper withBorder p="md" mt="md" radius="md" bg="white" shadow="xs">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon color="teal" size="md" variant="light">
            <IconMessageDots size={20} />
          </ThemeIcon>
          <Text size="xs" fw={700} c="gray.8" tt="uppercase">
            Comments & Chat Discussion
          </Text>
        </Group>
        <Tooltip label="Refresh chat messages" withArrow position="top">
          <ActionIcon
            variant="subtle"
            color="teal"
            size="sm"
            onClick={onRefreshChat}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Stack gap="xs" mb="md" style={{ maxHeight: "300px", overflowY: "auto" }}>
        {messages.length === 0 ? (
          <Text size="xs" c="dimmed" fs="italic">
            No conversation history yet for this session. Send a message or
            question below.
          </Text>
        ) : (
          messages.map((c, i) => {
            const isAdmin =
              c.senderRole === "WLS_ADMIN" || c.senderRole === "SUPER_USER";
            return (
              <Paper
                key={c._id || c.id || i}
                p="xs"
                withBorder
                radius="md"
                bg={isAdmin ? "green.0" : "indigo.0"}
                style={{
                  borderColor: isAdmin
                    ? "var(--mantine-color-green-3)"
                    : "var(--mantine-color-indigo-3)",
                  maxWidth: "85%",
                  marginLeft: isAdmin ? "auto" : "0",
                  marginRight: isAdmin ? "0" : "auto",
                }}
              >
                <Group justify="space-between" mb={4}>
                  <Group gap={6}>
                    <Avatar
                      size="20"
                      radius="xl"
                      color={isAdmin ? "green" : "indigo"}
                    >
                      {c.senderName?.charAt(0) || "U"}
                    </Avatar>
                    <Text
                      size="xs"
                      fw={700}
                      c={isAdmin ? "green.9" : "indigo.9"}
                    >
                      {isAdmin
                        ? `🛡️️ Admin (${c.senderName})`
                        : `👤 ${c.senderName}`}
                    </Text>
                  </Group>
                  <Text size="9px" c="dimmed">
                    {c.timestamp
                      ? new Date(c.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
                  </Text>
                </Group>
                <Text
                  size="xs"
                  c="gray.8"
                  style={{ whiteSpace: "pre-wrap", paddingLeft: "26px" }}
                >
                  {c.text}
                </Text>
              </Paper>
            );
          })
        )}
      </Stack>

      {!isCompleted && (
        <Stack gap={6}>
          <Group gap={4}>
            {["😊", "👍", "❤️", "👏", "🔥", "🙏", "💡", "✨"].map((emoji) => (
              <Button
                key={emoji}
                variant="subtle"
                size="compact-xs"
                onClick={() => onAddEmoji(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </Group>

          <Group align="flex-end" gap="xs">
            <Textarea
              style={{ flex: 1 }}
              placeholder="Type a message or question..."
              autosize
              minRows={2}
              maxRows={4}
              value={commentInput || ""}
              error={!!commentError}
              onChange={onCommentChange}
            />
            <Button color="teal" onClick={onAddComment}>
              Send
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  );
}
