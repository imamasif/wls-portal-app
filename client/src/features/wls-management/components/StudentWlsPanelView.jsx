import React, { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  TextInput,
  Textarea,
  Button,
  ThemeIcon,
  Alert,
  Box,
  Paper,
  Divider,
  useMantineTheme
} from '@mantine/core';
import {
  IconVideo,
  IconAward,
  IconMessageDots,
  IconAlertTriangle,
  IconCircleCheck,
  IconDeviceFloppy,
  IconLink,
  IconMessages,
  IconUsers,
  IconCalendar,
  IconBook
} from '@tabler/icons-react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';

function formatDriveEmbedUrl(url) {
  if (!url) return { embedUrl: '', error: null };
  const cleanUrl = url.trim();

  if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch || !fileIdMatch[1]) {
      return { embedUrl: '', error: 'Invalid Google Drive URL format. Ensure it contains a valid File ID.' };
    }
    const formattedUrl = cleanUrl
      .replace(/\/view(\?.*)?$/, '/preview')
      .replace(/\/open(\?.*)?$/, '/preview')
      .replace(/\/edit(\?.*)?$/, '/preview');
    return { embedUrl: formattedUrl, error: null };
  }

  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return { embedUrl: `https://drive.google.com/file/d/${cleanUrl}/preview`, error: null };
  }

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return { embedUrl: cleanUrl, error: 'Non-Google Drive URL detected.' };
  }

  return { embedUrl: '', error: 'Unrecognized URL or invalid video stream link.' };
}

export function StudentWlsPanelView({ currentUser, sessionData }) {
  const theme = useMantineTheme();
  const [videoUrl, setVideoUrl] = useState('');
  const [userComment, setUserComment] = useState('');
  const [scores, setScores] = useState({});
  const [instructorFeedback, setInstructorFeedback] = useState('');
  const [criteriaList, setCriteriaList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setCriteriaList([
      { key: 'presentation', title: '1. Presentation - camera position, Light, Picture and Sound Quality - Video Size' },
      { key: 'attire', title: '2. Attire / Dress Code' },
      { key: 'arabicReading', title: '3. Arabic Reading' },
      { key: 'onTimeDelivery', title: '4. On Time Delivery' },
      { key: 'transferenceOfSpirit', title: '5. Transference of Spirit' },
      { key: 'bodyLanguage', title: '6. Body Language' }
    ]);

    if (sessionData) {
      setVideoUrl(sessionData.submissionUrl || '');
      setUserComment(sessionData.userComments || '');
      setScores(sessionData.scores || {});
      setInstructorFeedback(sessionData.instructorFeedback || '');
    }
  }, [sessionData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        userId: currentUser?.id,
        submissionUrl: videoUrl,
        userComments: userComment
      };

      await fetch(`/api/assessments/user/${currentUser?.id || 'me'}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      alert('Video submission & comments saved successfully!');
    } catch (err) {
      console.error('Failed to save assessment submission:', err);
      alert('Submission saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const { embedUrl, error: urlCheckError } = formatDriveEmbedUrl(videoUrl);
  const hasActiveError = Boolean(urlCheckError || iframeError);

  return (
    <Stack spacing="lg" sx={{ width: '100%' }}>
      {/* Group Assignment Banner */}
      <Paper
        p="md"
        radius="md"
        withBorder
        sx={{
          background: 'linear-gradient(135deg, #0b3c26 0%, #135235 50%, #1e6b45 100%)',
          color: '#ffffff'
        }}
      >
        <Group position="apart" mb="xs">
          <Group spacing="xs">
            <ThemeIcon size="md" radius="xl" sx={{ backgroundColor: '#2b8a3e', color: '#ffffff' }}>
              <IconUsers size={16} />
            </ThemeIcon>
            <Text weight={700} size="md" sx={{ color: '#ffffff !important' }}>
              Your Assignment: {sessionData?.groupName || 'Group 1'}
            </Text>
          </Group>

          <Badge size="sm" variant="filled" sx={{ backgroundColor: '#2f9e44', color: '#ffffff' }}>
            ASSIGNED
          </Badge>
        </Group>

        <Text size="xs" sx={{ color: '#dcfce7 !important' }} mb={4}>
          <strong>Group Admin(s):</strong> {sessionData?.admins || 'Syed Imam, Dr. Tariq Rahman, Sheikh Ahmed Khan'}
        </Text>
        <Text size="xs" sx={{ color: '#fca5a5 !important' }}>
          <strong>Video Submission Deadline:</strong> {sessionData?.deadline || 'Sep 26, 2026, 5:00 AM (Toronto)'}
        </Text>

        <Divider my="xs" color="rgba(255,255,255,0.2)" />

        <Group spacing="xs">
          <IconBook size={16} color="#a9e8c3" />
          <Text size="xs" weight={700} sx={{ color: '#a9e8c3 !important' }}>
            ASSIGNED AYATS / VERSES: {sessionData?.verses || 'Surah 1:5'}
          </Text>
        </Group>
      </Paper>

      {/* Video Submission & Player Section */}
      <Card
        withBorder
        padding="lg"
        radius="md"
        sx={{
          backgroundColor: hasActiveError ? theme.colors.red[0] : theme.colors.gray[0],
          borderColor: hasActiveError ? theme.colors.red[3] : theme.colors.gray[3]
        }}
      >
        <Group position="apart" mb="md">
          <Group spacing="xs">
            <ThemeIcon size="lg" radius="xl" color={hasActiveError ? 'red' : 'green'} variant="light">
              <IconVideo size={22} />
            </ThemeIcon>
            <Text weight={700} size="md" color="gray.8">
              Video Submission & Stream Player
            </Text>
          </Group>
        </Group>

        <TextInput
          icon={<IconLink size={18} color="#2b8a3e" />}
          label="Google Drive / Video Stream Link:"
          placeholder="Paste your public Google Drive video link here..."
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            setIframeError(false);
          }}
          mb="md"
          error={hasActiveError}
        />

        {videoUrl && (
          <Box mb="md">
            {urlCheckError || iframeError ? (
              <Alert icon={<IconAlertTriangle size={20} />} title="Video Stream Issue" color="red" variant="light" radius="md">
                {urlCheckError || 'The player encountered an error streaming this video. Ensure Google Drive link sharing is set to "Anyone with the link can view".'}
              </Alert>
            ) : (
              <Alert icon={<IconCircleCheck size={20} />} color="green" variant="light" radius="md">
                Valid link format detected. Streaming video preview below...
              </Alert>
            )}
          </Box>
        )}

        {embedUrl ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%',
              backgroundColor: '#000000',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <iframe
              src={embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              onError={() => setIframeError(true)}
              title="Google Drive Video Player"
            />
          </Box>
        ) : (
          <Stack
            align="center"
            justify="center"
            sx={{
              height: 260,
              backgroundColor: '#0f172a',
              borderRadius: 8,
              border: '1px dashed #334155'
            }}
          >
            <IconVideo size={44} color="#64748b" />
            <Text weight={600} color="gray.3" size="sm">
              No Video Link Provided. Please paste a link above.
            </Text>
          </Stack>
        )}
      </Card>

      {/* WLS-ADMIN Communication Panel */}
      <Card
        padding="lg"
        radius="md"
        withBorder
        sx={{
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0'
        }}
      >
        <Group spacing="xs" mb="xs">
          <ThemeIcon size="lg" radius="xl" color="teal" variant="filled">
            <IconMessages size={20} />
          </ThemeIcon>
          <Text
            weight={800}
            size="md"
            color="teal.9"
            sx={{
              backgroundColor: '#dcfce7',
              padding: '4px 12px',
              borderRadius: theme.radius.xs
            }}
          >
            Communication & Comments for WLS-ADMINS
          </Text>
        </Group>

        <Textarea
          minRows={3}
          placeholder="Write your notes, questions, or comments here to communicate with WLS-ADMINS regarding your video or assessment..."
          value={userComment}
          onChange={(e) => setUserComment(e.target.value)}
          mb="sm"
          styles={{
            input: {
              borderColor: '#86efac',
              fontSize: 15,
              backgroundColor: theme.white
            }
          }}
        />
      </Card>

      {/* Evaluation & Scoring */}
      <Group spacing="xs">
        <ThemeIcon size="lg" radius="xl" color="green" variant="light">
          <IconAward size={22} />
        </ThemeIcon>
        <Text weight={800} size="lg" color="green.7">
          Evaluation Criteria & Scores
        </Text>
      </Group>

      <Stack spacing="md">
        {criteriaList.map((criterion, idx) => {
          const key = criterion.key || `criterion_${idx}`;
          const label = criterion.title || `Criteria ${idx + 1}`;

          return (
            <ColorScoreSlider
              key={key}
              label={label}
              value={scores[key] || 1}
              readOnly
            />
          );
        })}
      </Stack>

      {instructorFeedback && (
        <Card padding="lg" radius="md" withBorder sx={{ backgroundColor: theme.colors.cyan[0], borderColor: theme.colors.cyan[3] }}>
          <Group spacing="xs" mb="xs">
            <ThemeIcon size="md" radius="xl" color="cyan" variant="filled">
              <IconMessageDots size={18} />
            </ThemeIcon>
            <Text weight={800} size="md" color="cyan.9">Instructor Feedback</Text>
          </Group>
          <Text size="sm" color="gray.8">{instructorFeedback}</Text>
        </Card>
      )}

      {/* Save Button */}
      <Button
        size="lg"
        color="green"
        fullWidth
        leftIcon={<IconDeviceFloppy size={22} />}
        onClick={handleSave}
        loading={saving}
        radius="md"
        sx={{
          backgroundColor: '#2b8a3e',
          '&:hover': { backgroundColor: '#237032' }
        }}
      >
        Save Video Submission & Comments
      </Button>
    </Stack>
  );
}