import React from 'react';
import { Paper, Text, Group, Button, Badge, Divider, ActionIcon, Tooltip, Box } from '@mantine/core';
import { IconVideo, IconCopy, IconExternalLink, IconCalendarEvent } from '@tabler/icons-react';

export function ZoomInviteCard({ session, isUpcoming = true }) {
  if (!session) return null;

  const topicName = session.topicName || session.title;
  const description = session.description;
  const videoDeadline = session.videoDeadline;

  // Auto-extract Zoom URL from the description text
  const zoomUrlMatch = description?.match(/https:\/\/[^\s]+/g);
  const zoomUrl = zoomUrlMatch ? zoomUrlMatch[0] : null;

  const handleCopy = () => {
    if (description) navigator.clipboard.writeText(description);
  };

  return (
    <Paper 
      withBorder 
      radius="lg" 
      p="md" 
      shadow="xs"
      style={{
        background: isUpcoming ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' : '#fafafa',
        borderColor: isUpcoming ? '#0284c7' : '#e2e8f0',
      }}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Box>
          <Group gap="xs" mb={4}>
            <Badge color={isUpcoming ? 'blue' : 'gray'} variant="filled" size="xs">
              {isUpcoming ? 'Next Session' : 'Past Session'}
            </Badge>

            {videoDeadline && (
              <Badge color="red" variant="light" size="xs" leftSection={<IconCalendarEvent size={12} />}>
                Video Due: {new Date(videoDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Badge>
            )}
          </Group>
          <Text fw={700} size="md" c="dark.8">{topicName}</Text>
        </Box>

        <Group gap="xs">
          <Tooltip label="Copy Full Invite">
            <ActionIcon variant="light" color="gray" size="sm" onClick={handleCopy} disabled={!description}>
              <IconCopy size={16} />
            </ActionIcon>
          </Tooltip>
          {zoomUrl && (
            <Button
              component="a"
              href={zoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              color="blue"
              rightSection={<IconExternalLink size={12} />}
            >
              Join Zoom
            </Button>
          )}
        </Group>
      </Group>

      <Divider my="xs" color="gray.2" />

      <Text
        component="pre"
        size="xs"
        style={{
          fontFamily: 'inherit',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#334155',
          lineHeight: 1.5,
          margin: 0,
          maxHeight: 220,
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}
      >
        {description || 'No Zoom invite details or description provided for this session.'}
      </Text>
    </Paper>
  );
}