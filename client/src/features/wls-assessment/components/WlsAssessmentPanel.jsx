import React, { useState, useEffect } from 'react';
import {
  Grid,
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
  UnstyledButton,
  Paper
} from '@mantine/core';
import {
  IconClipboardCheck,
  IconVideo,
  IconAward,
  IconMessageDots,
  IconUsers,
  IconUser,
  IconUserCheck,
  IconUserX,
  IconAlertTriangle,
  IconCircleCheck,
  IconSend,
  IconCheck
} from '@tabler/icons-react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';

function formatDriveEmbedUrl(url) {
  if (!url) return { embedUrl: '', error: null };
  const cleanUrl = url.trim();

  if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);

    if (!fileIdMatch || !fileIdMatch[1]) {
      return {
        embedUrl: '',
        error: 'Invalid Google Drive URL format. Ensure it contains a valid File ID.'
      };
    }

    const formattedUrl = cleanUrl
      .replace(/\/view(\?.*)?$/, '/preview')
      .replace(/\/open(\?.*)?$/, '/preview')
      .replace(/\/edit(\?.*)?$/, '/preview');

    return { embedUrl: formattedUrl, error: null };
  }

  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return {
      embedUrl: `https://drive.google.com/file/d/${cleanUrl}/preview`,
      error: null
    };
  }

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return {
      embedUrl: cleanUrl,
      error: 'Non-Google Drive URL detected.'
    };
  }

  return { embedUrl: '', error: 'Unrecognized URL or invalid video stream link.' };
}

export function WlsAssessmentPanel({ currentAdminId, onSubmitAssessment }) {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [resSessions, resAssessments, resUsers, resRules] = await Promise.all([
          fetch('/api/wls-sessions?status=ACTIVE'),
          fetch('/api/assessments'),
          fetch('/api/users'),
          fetch('/api/rules').catch(() => null)
        ]);

        const sessions = await resSessions.json();
        const assessments = await resAssessments.json();
        const allUsers = await resUsers.json();
        const rulesData = resRules && resRules.ok ? await resRules.json() : [];

        if (Array.isArray(rulesData) && rulesData.length > 0) {
          setCriteriaList(rulesData);
        } else {
          setCriteriaList([
            { key: 'presentation', title: '1. Presentation - camera position, Light, Picture and Sound Quality - Video Size' },
            { key: 'attire', title: '2. Attire / Dress Code' },
            { key: 'arabicReading', title: '3. Arabic Reading' },
            { key: 'onTimeDelivery', title: '4. On Time Delivery' },
            { key: 'transferenceOfSpirit', title: '5. Transference of Spirit' },
            { key: 'bodyLanguage', title: '6. Body Language' }
          ]);
        }

        const activeSession = Array.isArray(sessions) ? sessions[0] : null;
        const assignedStudentIds = new Set();

        if (activeSession?.groupAssignments) {
          Object.values(activeSession.groupAssignments).forEach((group) => {
            const isAssignedAdmin = !currentAdminId || group.adminIds?.includes(currentAdminId);
            if (isAssignedAdmin && Array.isArray(group.userIds)) {
              group.userIds.forEach((id) => assignedStudentIds.add(id));
            }
          });
        }

        const userMap = new Map((Array.isArray(allUsers) ? allUsers : []).map((u) => [u.id || u._id, u]));
        const assessmentMap = new Map((Array.isArray(assessments) ? assessments : []).map((a) => [a.userId?.id || a.userId, a]));

        const memberList = Array.from(assignedStudentIds).map((studentId) => {
          const userObj = userMap.get(studentId) || {};
          const assessment = assessmentMap.get(studentId) || {};
          const rawUrl = assessment.submissionUrl || (assessment.submissionUrls?.[0] || '');

          return {
            id: studentId,
            name: userObj.name || `Student (${studentId.slice(-4)})`,
            email: userObj.email || '',
            assessmentId: assessment.id || assessment._id,
            submissionUrl: rawUrl,
            missedReason: assessment.missedReason || '',
            groupNumber: assessment.groupNumber || 1,
            evaluations: assessment.evaluations || [],
            feedback: assessment.feedback || assessment.comments || ''
          };
        });

        setAssignedUsers(memberList);

        if (memberList.length > 0) {
          handleUserSelect(memberList[0]);
        }
      } catch (err) {
        console.error('Failed to load assessment panel data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentAdminId]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFeedback(user.feedback || '');
    setVideoUrl(user.submissionUrl || '');
    setIframeError(false);

    const existingScores = {};
    if (Array.isArray(user.evaluations)) {
      user.evaluations.forEach((item) => {
        if (item.criterionKey && item.score) {
          existingScores[item.criterionKey] = item.score;
        }
      });
    }
    setScores(existingScores);
  };

  const handleScoreChange = (criterionKey, score) => {
    setScores((prev) => ({ ...prev, [criterionKey]: score }));
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    const payload = {
      assessmentId: selectedUser.assessmentId,
      userId: selectedUser.id,
      evaluatorId: currentAdminId || 'admin-id',
      submissionUrl: videoUrl,
      scores,
      feedback
    };

    if (onSubmitAssessment) {
      onSubmitAssessment(payload);
    } else {
      await fetch(`/api/assessments/${selectedUser.assessmentId || selectedUser.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Assessment record saved successfully!');
    }
  };

  if (loading) {
    return <Text align="center" py="xl" color="dimmed">Loading assigned members...</Text>;
  }

  const { embedUrl, error: urlCheckError } = formatDriveEmbedUrl(videoUrl);
  const hasActiveError = Boolean(urlCheckError || iframeError);

  return (
    /* Force 100% full stretch to bypass parent layout constraints */
    <Box sx={{ width: '100%', padding: '8px 0', boxSizing: 'border-box' }}>
      <Grid gutter="xl">
        {/* Left Sidebar Panel */}
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <Card shadow="xs" padding="md" radius="lg" withBorder>
            <Group position="apart" mb="md">
              <Group spacing="xs">
                <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
                  <IconUsers size={20} />
                </ThemeIcon>
                <Text weight={800} size="md" color="dark">
                  Assigned Members
                </Text>
              </Group>
              <Badge color="blue" variant="filled" radius="sm">
                {assignedUsers.length}
              </Badge>
            </Group>

            <Stack spacing="xs">
              {assignedUsers.map((item) => {
                const hasSubmitted = Boolean(item.submissionUrl);
                const isSelected = selectedUser?.id === item.id;

                return (
                  <Paper
                    key={item.id}
                    component={UnstyledButton}
                    onClick={() => handleUserSelect(item)}
                    p="sm"
                    radius="md"
                    withBorder
                    sx={(theme) => ({
                      display: 'block',
                      width: '100%',
                      cursor: 'pointer',
                      /* High-Contrast Full Row Cell Highlight */
                      backgroundColor: isSelected ? '#1c7ed6' : theme.white,
                      borderColor: isSelected ? '#1971c2' : theme.colors.gray[3],
                      boxShadow: isSelected ? '0 4px 12px rgba(28, 126, 214, 0.35)' : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? '#1971c2' : theme.colors.gray[0]
                      }
                    })}
                  >
                    <Group position="apart" noWrap alignment="center">
                      <Group spacing="xs" noWrap>
                        <ThemeIcon
                          size="md"
                          radius="xl"
                          color={isSelected ? 'blue.0' : 'blue'}
                          variant={isSelected ? 'filled' : 'light'}
                        >
                          {isSelected ? <IconCheck size={16} color="#1c7ed6" /> : <IconUser size={16} />}
                        </ThemeIcon>

                        <Box>
                          <Text
                            weight={700}
                            size="sm"
                            sx={{ color: isSelected ? '#ffffff !important' : '#1a1a1a !important' }}
                          >
                            {item.name}
                          </Text>
                          <Text
                            size="xs"
                            sx={{ color: isSelected ? '#d0ebff !important' : '#868e96 !important' }}
                          >
                            Group {item.groupNumber}
                          </Text>
                        </Box>
                      </Group>

                      <Badge
                        size="xs"
                        variant={isSelected ? 'filled' : 'light'}
                        color={hasSubmitted ? 'green' : 'red'}
                        sx={{
                          backgroundColor: isSelected
                            ? hasSubmitted
                              ? '#2b8a3e'
                              : '#c92a2a'
                            : undefined
                        }}
                      >
                        {hasSubmitted ? 'SUBMITTED' : 'MISSING'}
                      </Badge>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right Main Assessment Panel */}
        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          {selectedUser ? (
            <Card shadow="xs" padding="xl" radius="lg" withBorder>
              {/* Header */}
              <Group spacing="sm" mb="xl">
                <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                  <IconClipboardCheck size={28} />
                </ThemeIcon>
                <Text size="xl" weight={800}>
                  Assessment for:{' '}
                  <Text component="span" color="blue">
                    {selectedUser.name}
                  </Text>
                </Text>
              </Group>

              {/* Video Player Box */}
              <Card
                withBorder
                padding="lg"
                radius="md"
                mb="xl"
                sx={(theme) => ({
                  backgroundColor: hasActiveError ? theme.colors.red[0] : theme.colors.gray[0],
                  borderColor: hasActiveError ? theme.colors.red[3] : theme.colors.gray[3]
                })}
              >
                <Group spacing="xs" mb="md">
                  <ThemeIcon size="lg" radius="xl" color={hasActiveError ? 'red' : 'indigo'} variant="light">
                    <IconVideo size={22} />
                  </ThemeIcon>
                  <Text weight={700} size="md" color="gray.8">
                    Video Submission & Stream Player
                  </Text>
                </Group>

                <TextInput
                  label="Google Drive / Video Link:"
                  placeholder="Paste Google Drive video link here..."
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
                      <Alert
                        icon={<IconAlertTriangle size={20} />}
                        title="Video Stream Issue Detected"
                        color="red"
                        variant="light"
                        radius="md"
                      >
                        {urlCheckError || 'The player encountered an error streaming this video. Ensure Google Drive link sharing is set to "Anyone with the link can view".'}
                      </Alert>
                    ) : (
                      <Alert icon={<IconCircleCheck size={20} />} color="green" variant="light" radius="md">
                        Valid link format detected. Streaming video below...
                      </Alert>
                    )}
                  </Box>
                )}

                {/* Forced 16:9 Aspect Ratio Container for Google Drive Videos */}
                {embedUrl ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', /* Aspect Ratio 16:9 */
                      backgroundColor: '#000000',
                      borderRadius: 8,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
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
                      height: 300,
                      backgroundColor: '#0f172a',
                      borderRadius: 8,
                      border: '1px dashed #334155'
                    }}
                  >
                    <IconVideo size={42} color="#64748b" />
                    <Text weight={600} color="gray.3" size="sm">
                      No Video Link Provided
                    </Text>
                  </Stack>
                )}

                {videoUrl && (
                  <Group position="apart" mt="sm">
                    <Text
                      component="a"
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="xs"
                      weight={600}
                      color="blue"
                    >
                      Open Original Link in Google Drive ↗
                    </Text>
                    <Text size="xs" color="dimmed">
                      Tip: Ensure Google Drive view permissions are set to "Anyone with the link".
                    </Text>
                  </Group>
                )}
              </Card>

              {/* Evaluation Criteria */}
              <Group spacing="xs" mb="md">
                <ThemeIcon size="lg" radius="xl" color="green" variant="light">
                  <IconAward size={22} />
                </ThemeIcon>
                <Text weight={800} size="lg" color="green.7">
                  Evaluation Criteria
                </Text>
              </Group>

              <Stack spacing="md" mb="xl">
                {criteriaList.map((criterion, idx) => {
                  const key = criterion.key || criterion.code || (typeof criterion === 'string' ? criterion : `criterion_${idx}`);
                  const label = criterion.title || criterion.criterion || (typeof criterion === 'string' ? criterion : `Criteria ${idx + 1}`);

                  return (
                    <ColorScoreSlider
                      key={key}
                      label={label}
                      value={scores[key] || 1}
                      onChange={(val) => handleScoreChange(key, val)}
                    />
                  );
                })}
              </Stack>

              {/* Light Blue Feedback Block */}
              <Card
                padding="lg"
                radius="md"
                withBorder
                mb="xl"
                sx={(theme) => ({
                  backgroundColor: theme.colors.cyan[0],
                  borderColor: theme.colors.cyan[3]
                })}
              >
                <Group spacing="xs" mb="xs">
                  <ThemeIcon size="md" radius="xl" color="cyan" variant="filled">
                    <IconMessageDots size={18} />
                  </ThemeIcon>
                  <Text
                    weight={800}
                    size="md"
                    color="cyan.9"
                    sx={(theme) => ({
                      backgroundColor: theme.colors.cyan[1],
                      padding: '4px 10px',
                      borderRadius: theme.radius.xs
                    })}
                  >
                    Instructor Feedback & Comments (Visible to Student)
                  </Text>
                </Group>

                <Textarea
                  minRows={4}
                  placeholder="Enter comprehensive assessment feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  styles={(theme) => ({
                    input: {
                      borderColor: theme.colors.cyan[4],
                      fontSize: 15,
                      backgroundColor: theme.white
                    }
                  })}
                />
              </Card>

              {/* Submit Button */}
              <Button
                size="lg"
                color="blue"
                fullWidth
                leftIcon={<IconSend size={20} />}
                onClick={handleSubmit}
                radius="md"
              >
                Submit Assessment Record
              </Button>
            </Card>
          ) : (
            <Text align="center" color="dimmed" py="xl">
              Select a user from the left sidebar to begin assessment.
            </Text>
          )}
        </Grid.Col>
      </Grid>
    </Box>
  );
}