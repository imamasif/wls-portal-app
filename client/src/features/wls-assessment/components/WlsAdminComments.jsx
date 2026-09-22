import React from 'react';
import { Card, Group, Stack, Text, Textarea, ThemeIcon, Paper, TextInput, Button, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconMessageDots, IconRefresh } from '@tabler/icons-react';

export function WlsAdminComments({ 
  selectedUser, 
  feedback, 
  onFeedbackChange, 
  messages, 
  newMessageText, 
  onNewMessageTextChange, 
  onSendMessage,
  onRefresh 
}) {
  return (
    <Card
      padding="lg"
      radius="md"
      withBorder
      mb="xl"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        transition: 'all 0.2s ease',
        cursor: 'default'
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            borderColor: '#94a3b8'
          },
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(0, 0, 0, 0.04)'
          }
        }
      }}
    >
      <Group gap="xs" mb="sm">
        <ThemeIcon size="md" radius="xl" color="blue" variant="light">
          <IconMessageDots size={18} />
        </ThemeIcon>
        <Text
          fw={800}
          size="md"
          c="dark"
          style={{
            backgroundColor: 'var(--mantine-color-blue-0)',
            padding: '4px 10px',
            borderRadius: 'var(--mantine-radius-xs)'
          }}
        >
          Admin Comments / Feedbacks
        </Text>
      </Group>

      {selectedUser?.userComments && (
        <Paper withBorder p="xs" radius="sm" mb="md" bg="gray.0">
          <Text size="xs" fw={700} c="dark" mb={4}>Initial User Note:</Text>
          <Text size="xs" c="gray.8" style={{ whiteSpace: 'pre-wrap' }}>
            {selectedUser.userComments}
          </Text>
        </Paper>
      )}

      <Textarea
        minRows={4}
        placeholder="Enter comprehensive assessment feedback and respond to the student..."
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        mb="md"
      />

      <Box mt="md" pt="md" style={{ borderTop: '1px dashed var(--mantine-color-gray-3)' }}>
        <Group justify="space-between" mb="xs">
          <Text size="xs" fw={700} c="dark">Assessment Discussion Thread:</Text>
          {onRefresh && (
            <Tooltip label="Refresh chat thread" withArrow position="top">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                onClick={onRefresh}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        
        <Stack gap="xs" mb="md">
          {Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg, idx) => (
              <Paper key={idx} p="xs" radius="sm" bg={msg.senderRole === 'ADMIN' ? 'blue.0' : 'gray.0'} withBorder>
                <Group justify="space-between" mb={2}>
                  <Text size="xs" fw={700} c={msg.senderRole === 'ADMIN' ? 'blue.9' : 'dark'}>
                    {msg.senderName} ({msg.senderRole})
                  </Text>
                  <Text size="10px" c="dimmed">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </Group>
                <Text size="xs" c="gray.8" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Text>
              </Paper>
            ))
          ) : (
            <Text size="xs" c="dimmed" fs="italic">No messages in this assessment thread yet.</Text>
          )}
        </Stack>

        <Group gap="sm">
          <TextInput
            placeholder="Type a message to the student..."
            style={{ flex: 1 }}
            value={newMessageText}
            onChange={(e) => onNewMessageTextChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSendMessage(); }}
          />
          <Button size="sm" color="blue" onClick={onSendMessage}>
            Send
          </Button>
        </Group>
      </Box>
    </Card>
  );
}