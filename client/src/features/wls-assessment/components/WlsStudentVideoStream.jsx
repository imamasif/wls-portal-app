import React, { useState, useEffect } from 'react';
import { Card, Group, Stack, Text, TextInput, ThemeIcon, Alert, Box, Button } from '@mantine/core';
import { IconVideo, IconAlertCircle, IconExternalLink } from '@tabler/icons-react';

export function WlsStudentVideoStream({ selectedUser, adminVideoUrl }) {
  const videoUrl = adminVideoUrl || selectedUser?.submissionUrl || selectedUser?.videoUrl || '';
  const hasValidVideo = Boolean(videoUrl);

  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Reset load state when switching students or updating URL
  useEffect(() => {
    setIsVideoLoaded(false);
  }, [selectedUser?.id, videoUrl]);

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

    // Click-to-load placeholder state (prevents auto-fetching and hammering)
    if (!isVideoLoaded) {
      return (
        <Stack align="center" justify="center" h={240} bg="gray.1" style={{ borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <ThemeIcon size={48} radius="xl" color="blue" variant="light">
            <IconVideo size={24} />
          </ThemeIcon>
          <Text size="sm" fw={600} c="dark">Video submission available</Text>
          <Button 
            variant="filled" 
            color="blue" 
            size="sm"
            onClick={() => setIsVideoLoaded(true)}
          >
            Click to Load Video Stream
          </Button>
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
      const fileId = driveMatch[1];
      return (
        <Stack gap="sm">
          <Box style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
            <iframe
              src={`https://drive.google.com/file/d/${fileId}/preview`}
              title="Google Drive Video Submission"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
              allow="autoplay"
            />
          </Box>
          <Group justify="flex-end">
            <Button
              component="a"
              href={`https://drive.google.com/file/d/${fileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              color="blue"
              size="xs"
              leftSection={<IconExternalLink size={14} />}
            >
              Open in Google Drive (if quota limited)
            </Button>
          </Group>
        </Stack>
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

  return (
    <Stack gap="md" mb="xl">
      {!hasValidVideo && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Missing Mandatory Video Submission"
          color="red"
          variant="filled"
          radius="md"
        >
          This student has not submitted a video link.
        </Alert>
      )}

      <Card padding="lg" radius="md" withBorder>
        <Group gap="xs" mb="md">
          <ThemeIcon size="md" radius="xl" color="blue" variant="light">
            <IconVideo size={18} />
          </ThemeIcon>
          <Text fw={800} size="md" c="dark">Student Video Stream</Text>
        </Group>

        <TextInput
          label="Student Provided Video Link:"
          value={videoUrl}
          readOnly
          mb="md"
        />

        {renderVideoPlayer(videoUrl)}
      </Card>
    </Stack>
  );
}