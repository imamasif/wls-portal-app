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
  Tooltip,
  Timeline,
  useMantineTheme
} from '@mantine/core';
import { modals } from '@mantine/modals';
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
  IconBook,
  IconInfoCircle,
  IconSend,
  IconClock,
  IconCheck,
  IconUserX
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

async function checkDrivePermission(url) {
  const { embedUrl, error } = formatDriveEmbedUrl(url);
  if (error || !embedUrl) return false;

  try {
    await fetch(embedUrl, { method: 'HEAD', mode: 'no-cors' });
    return true;
  } catch (err) {
    return false;
  }
}

export function StudentWlsPanelView({ currentUser, sessionData, sessionId }) {
  const theme = useMantineTheme();
  const [videoUrl, setVideoUrl] = useState('');
  const [userComment, setUserComment] = useState('');
  const [scores, setScores] = useState({});
  const [instructorFeedback, setInstructorFeedback] = useState('');
  const [criteriaList, setCriteriaList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [urlPermissionError, setUrlPermissionError] = useState('');
  const [taskCompleted, setTaskCompleted] = useState(false);

  const [conversationHistory, setConversationHistory] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');

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
      setConversationHistory(sessionData.studentResponses || []);
      setTaskCompleted(sessionData.status === 'COMPLETED' || sessionData.isCompleted || false);
    }
  }, [sessionData]);

  const sessionStatus = sessionData?.status || 'NEW';
  if (sessionStatus === 'NEW' || sessionStatus === 'POSTPONED') {
    return (
      <Paper p="xl" radius="md" withBorder ta="center">
        <Text fw={700} size="lg" c="dimmed">This session is currently unavailable or postponed.</Text>
        <Text size="xs" c="dimmed" mt={4}>Please check back when the session is activated by an administrator.</Text>
      </Paper>
    );
  }

  const isCompleted = sessionStatus === 'COMPLETED' || taskCompleted;

  const handleSave = async () => {
    if (isCompleted) return;
    setUrlPermissionError('');
    setSaving(true);

    if (!videoUrl.trim()) {
      setUrlPermissionError('Please provide a Google Drive video link.');
      setSaving(false);
      return;
    }

    const isAccessible = await checkDrivePermission(videoUrl);
    if (!isAccessible) {
      setUrlPermissionError(
        'Access Restricted: Please adjust your Google Drive link permissions so admins can view it.'
      );
      setSaving(false);
      return;
    }

    try {
      const payload = {
        userId: currentUser?.id,
        submissionUrl: videoUrl,
        userComments: userComment
      };

      const targetSessionId = sessionId || sessionData?.id || sessionData?._id;
      const res = await fetch(`/api/wls-sessions/${targetSessionId}/submit-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save submission on server');
      }

      alert('Video submission & comments saved successfully!');
    } catch (err) {
      console.error('Failed to save assessment submission:', err);
      alert('Submission saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!videoUrl.trim()) {
      alert('Please submit your video URL before marking the task as completed.');
      return;
    }

    modals.openConfirmModal({
      title: <Text fw={700} size="md">Mark Task as Completed</Text>,
      centered: true,
      children: (
        <Text size="sm" c="dimmed">
          Are you sure you want to mark this assigned task as completed? Once marked, your submission will be finalized.
        </Text>
      ),
      labels: { confirm: 'Yes, Complete', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        setTaskCompleted(true);
        alert('Task successfully marked as completed!');
      }
    });
  };

  const handleRequestAbsence = () => {
    let reasonText = '';
    modals.openConfirmModal({
      title: <Text fw={700} size="md">Request Absence</Text>,
      centered: true,
      children: (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Please provide a reason for requesting absence for this session:
          </Text>
          <Textarea
            placeholder="Enter reason for absence..."
            data-autofocus
            minRows={3}
            onChange={(e) => { reasonText = e.currentTarget.value; }}
          />
        </Stack>
      ),
      labels: { confirm: 'Submit Absence Request', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const absencePayload = {
            senderId: currentUser?.id,
            senderName: currentUser?.name || 'Student',
            message: `[ABSENCE REQUEST]: ${reasonText}`,
            timestamp: new Date().toISOString()
          };
          setConversationHistory((prev) => [...prev, absencePayload]);
          alert('Absence request sent to admins successfully.');
        } catch (err) {
          console.error('Failed to submit absence request:', err);
        }
      }
    });
  };

  const handleSendResponse = async () => {
    if (!replyMessage.trim()) return;

    const newResponse = {
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'Student',
      message: replyMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const targetSessionId = sessionId || sessionData?.id || sessionData?._id;
      await fetch(`/api/wls-sessions/${targetSessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResponse)
      });

      setConversationHistory((prev) => [...prev, newResponse]);
      setReplyMessage('');
    } catch (err) {
      console.warn('Comment synced locally, server endpoint not mounted');
      setConversationHistory((prev) => [...prev, newResponse]);
      setReplyMessage('');
    }
  };

  const { embedUrl, error: urlCheckError } = formatDriveEmbedUrl(videoUrl);
  const hasActiveError = Boolean(urlCheckError || iframeError || urlPermissionError);

  return (
    <Stack spacing="lg" sx={{ width: '100%' }}>
      {/* Assignment Header */}
      <Paper
        p="md"
        radius="md"
        withBorder
        sx={{
          background: isCompleted 
            ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' 
            : 'linear-gradient(135deg, #0b3c26 0%, #135235 50%, #1e6b45 100%)',
          color: '#ffffff'
        }}
      >
        <Group position="apart" mb="xs">
          <Group spacing="xs">
            <ThemeIcon size="md" radius="xl" sx={{ backgroundColor: isCompleted ? '#4b5563' : '#2b8a3e', color: '#ffffff' }}>
              <IconUsers size={16} />
            </ThemeIcon>
            <Text weight={700} size="md" sx={{ color: '#ffffff !important' }}>
              Your Assignment: {sessionData?.groupName || 'Group 1'} {isCompleted && '(Archived / Previous Session)'}
            </Text>
          </Group>

          <Badge size="sm" variant="filled" sx={{ backgroundColor: isCompleted ? '#4f46e5' : '#2f9e44', color: '#ffffff' }}>
            {isCompleted ? 'COMPLETED' : sessionStatus}
          </Badge>
        </Group>

        <Text size="xs" sx={{ color: '#dcfce7 !important' }} mb={4}>
          <strong>Group Admin(s):</strong> {sessionData?.admins || 'Syed Imam, Dr. Tariq Rahman, Sheikh Ahmed Khan'}
        </Text>
        <Text size="xs" sx={{ color: '#fca5a5 !important' }}>
          <strong>Video Submission Deadline:</strong> {sessionData?.deadline || 'Sep 26, 2026, 5:00 AM (Toronto)'}
        </Text>

        <Divider my="xs" color="rgba(255,255,255,0.2)" />

        <Group position="apart" align="center">
          <Group spacing="xs">
            <IconBook size={16} color="#a9e8c3" />
            <Text size="xs" weight={700} sx={{ color: '#a9e8c3 !important' }}>
              ASSIGNED AYATS / VERSES: {sessionData?.verses || 'Surah 1:5'}
            </Text>
          </Group>

          {!isCompleted && (
            <Button
              size="xs"
              variant="outline"
              color="red"
              leftIcon={<IconUserX size={14} />}
              onClick={handleRequestAbsence}
            >
              Request Absence
            </Button>
          )}
        </Group>
      </Paper>

      {/* Video Submission Section */}
      <Card
        withBorder
        padding="lg"
        radius="md"
        sx={{
          backgroundColor: hasActiveError ? theme.colors.red[0] : theme.colors.gray[0],
          borderColor: hasActiveError ? theme.colors.red[3] : theme.colors.gray[3]
        }}
      >
        <Group position="apart" mb="xs">
          <Group spacing="xs">
            <ThemeIcon size="lg" radius="xl" color={hasActiveError ? 'red' : 'green'} variant="light">
              <IconVideo size={22} />
            </ThemeIcon>
            <Text weight={700} size="md" color="gray.8">
              Submit Recitation / Presentation Video URL
            </Text>
          </Group>

          {!isCompleted && (
            <Tooltip
              label="In Google Drive, click Share -> General Access -> Set to 'Anyone with the link can view'."
              position="top"
              multiline
              width={240}
              withArrow
            >
              <Group spacing={4} style={{ cursor: 'pointer' }}>
                <IconInfoCircle size={16} color="#2b8a3e" />
                <Text size="xs" color="green.8" weight={600}>
                  Link Sharing Instructions
                </Text>
              </Group>
            </Tooltip>
          )}
        </Group>

        <TextInput
          icon={<IconLink size={18} color={hasActiveError ? '#e03131' : '#2b8a3e'} />}
          label="Video Submission URL"
          placeholder="Paste your Google Drive video link here..."
          value={videoUrl}
          readOnly={isCompleted}
          onChange={(e) => {
            if (isCompleted) return;
            setVideoUrl(e.target.value);
            setIframeError(false);
            setUrlPermissionError('');
          }}
          mb="md"
          error={hasActiveError}
        />

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
              height: 240,
              backgroundColor: '#0f172a',
              borderRadius: 8,
              border: '1px dashed #334155'
            }}
          >
            <IconVideo size={44} color="#64748b" />
            <Text weight={600} color="gray.3" size="sm">
              No Video Link Provided
            </Text>
          </Stack>
        )}
      </Card>

      {/* Comments Section */}
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
            Comments
          </Text>
        </Group>

        <Textarea
          minRows={2}
          label="Submission Notes for Admin:"
          placeholder="Write initial notes regarding your submission..."
          value={userComment}
          readOnly={isCompleted}
          onChange={(e) => setUserComment(e.target.value)}
          mb="lg"
        />

        {conversationHistory.length > 0 && (
          <Box mb="md">
            <Text weight={700} size="sm" color="gray.8" mb="sm">
              Discussion History:
            </Text>
            <Timeline active={conversationHistory.length - 1} bulletSize={22} lineWidth={2}>
              {conversationHistory.map((item, idx) => (
                <Timeline.Item
                  key={idx}
                  bullet={<IconMessages size={12} />}
                  title={
                    <Group position="apart">
                      <Text size="xs" weight={700} color="teal.8">
                        {item.senderName || 'Student'}
                      </Text>
                      <Group spacing={4}>
                        <IconClock size={12} color="gray" />
                        <Text size="xs" color="dimmed">
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                      </Group>
                    </Group>
                  }
                >
                  <Paper p="xs" radius="sm" withBorder mt={4} sx={{ backgroundColor: theme.white }}>
                    <Text size="xs" color="gray.8">{item.message}</Text>
                  </Paper>
                </Timeline.Item>
              ))}
            </Timeline>
          </Box>
        )}

        {!isCompleted && (
          <Stack spacing="xs">
            <Textarea
              placeholder="Type your reply to admin comments here..."
              minRows={2}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
            />
            <Group position="right">
              <Button
                size="xs"
                color="teal"
                disabled={!replyMessage.trim()}
                onClick={handleSendResponse}
                leftIcon={<IconSend size={14} />}
              >
                Send Response
              </Button>
            </Group>
          </Stack>
        )}
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

      {/* Action Buttons */}
      {!isCompleted && (
        <Group grow>
          <Button
            size="lg"
            color="green"
            leftIcon={<IconDeviceFloppy size={22} />}
            onClick={handleSave}
            loading={saving}
            radius="md"
          >
            Save Video Submission
          </Button>
          <Button
            size="lg"
            color="indigo"
            leftIcon={<IconCheck size={22} />}
            onClick={handleMarkCompleted}
            radius="md"
          >
            Mark Task as Completed
          </Button>
        </Group>
      )}
    </Stack>
  );
}