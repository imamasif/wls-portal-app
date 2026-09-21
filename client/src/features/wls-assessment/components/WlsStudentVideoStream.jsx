import React from 'react';
import { Card, Group, Stack, Text, TextInput, ThemeIcon, Alert, Box } from '@mantine/core';
import { IconVideo, IconAlertCircle } from '@tabler/icons-react';

export function WlsStudentVideoStream({ selectedUser, adminVideoUrl }) {
  // Determine video URL source
  const videoUrl = adminVideoUrl || selectedUser?.submissionUrl || '';

  // Helper to render responsive video player or fallback
  const renderVideoPlayer = (url) => {
    if (!url) {
      return (
        <Stack align="center" justify="center" h={240} bg="dark.9" style={{ borderRadius: '8px' }}>
          <ThemeIcon size={48} radius="xl" color="gray" variant="filled">
            <IconVideo size={24} />
          </ThemeIcon>
          <Text c="dimmed" size="sm" fw={600}>No Video Link Provided</Text>
        </Stack>
      );
    }

    // Check for YouTube URL
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return (
        <Box style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title="Student Video Submission"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>
      );
    }

    // Check for Google Drive URL
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return (
        <Box style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
            title="Google Drive Video Submission"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            allow="autoplay"
          />
        </Box>
      );
    }

    // Direct video stream / file
    return (
      <Box style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
        <video
          src={url}
          controls
          style={{ width: '100%', maxHeight: '400px', display: 'block' }}
        >
          Your browser does not support the video tag.
        </video>
      </Box>
    );
  };

  const hasValidVideo = Boolean(videoUrl);

  return (
    <Stack gap="md" mb="xl">
      {!hasValidVideo && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Missing Mandatory Video Submission"
          color="red"
          variant="filled"
          radius="md"
          style={{ boxShadow: '0 4px 12px rgba(224, 49, 49, 0.2)' }}
        >
          This student has not submitted a video link. You cannot mark this assessment as COMPLETED until a valid video URL is provided by the student or entered in the Admin Override section.
        </Alert>
      )}

      <Card
        padding="lg"
        radius="md"
        withBorder
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
        <Group gap="xs" mb="md">
          <ThemeIcon size="md" radius="xl" color="blue" variant="light">
            <IconVideo size={18} />
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
            Student Video Stream
          </Text>
        </Group>

        <TextInput
          label="Student Provided Video Link:"
          placeholder="No link submitted by student..."
          value={selectedUser?.submissionUrl || ''}
          readOnly
          mb="md"
          styles={{
            input: { backgroundColor: '#f8fafc', fontWeight: 600, color: '#334155' }
          }}
        />

        {renderVideoPlayer(videoUrl)}
      </Card>
    </Stack>
  );
}