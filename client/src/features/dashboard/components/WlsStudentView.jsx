import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../config/constants';
import { ZoomInviteCard } from '../../wls-management/components/ZoomInviteCard';
import { 
  Stack, Title, Text, Tabs, Card, Group, Badge, List, ThemeIcon, Paper, Divider, 
  Anchor, TextInput, Button, Tooltip, ActionIcon, Textarea, Avatar, Alert 
} from '@mantine/core';
import { 
  IconBook, IconUsers, IconFileText, IconVideo, IconClock, IconUserCheck, 
  IconAlertCircle, IconCheck, IconAlertTriangle, IconSend, IconLink,
  IconVideoPlus, IconMessageDots, IconBrandGoogleDrive 
} from '@tabler/icons-react';

const getUserGroup = (groupAssignments, currentUserId) => {
  if (!groupAssignments || typeof groupAssignments !== 'object') return null;

  for (const [groupNum, groupData] of Object.entries(groupAssignments)) {
    const isStudent = Array.isArray(groupData?.userIds) && groupData.userIds.includes(currentUserId);
    const isAdmin = Array.isArray(groupData?.adminIds) && groupData.adminIds.includes(currentUserId);

    if (isStudent || isAdmin) {
      return {
        groupNumber: groupNum,
        isStudent,
        isAdmin,
        ...groupData,
      };
    }
  }
  return null;
};

// Validates Google Drive URL permissions and structure
const validateGoogleDriveUrl = (url) => {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'Video URL cannot be empty. Please enter a valid Google Drive link.' };
  }
  const isGdrive = url.includes('drive.google.com') || url.includes('docs.google.com');
  if (!isGdrive) {
    return { isValid: false, error: 'Please enter a valid Google Drive link.' };
  }
  const hasRestrictedFlag = url.includes('usp=sharing') && !url.includes('view');
  if (hasRestrictedFlag) {
    return { isValid: false, error: 'Ensure Google Drive access is set to "Anyone with the link can view".' };
  }
  return { isValid: true, error: null };
};

export function WlsStudentView({ user: propUser }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;
  const [sessions, setSessions] = useState([]);
  
  // State management
  const [videoUrls, setVideoUrls] = useState({});
  const [urlErrors, setUrlErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [sessionComments, setSessionComments] = useState({});
  const [apiErrors, setApiErrors] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/wls-sessions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setSessions(data);
        
        const initialUrls = {};
        const initialComments = {};
        const userId = currentUser?._id || currentUser?.id;

        data.forEach((session) => {
          const sId = session.id || session._id;
          if (session.userSubmissions && session.userSubmissions[userId]) {
            initialUrls[sId] = session.userSubmissions[userId].videoUrl || '';
          }
          if (session.comments) {
            initialComments[sId] = session.comments;
          }
        });
        setVideoUrls(initialUrls);
        setSessionComments(initialComments);
      })
      .catch((err) => console.error('Error fetching WLS sessions:', err));
  }, [currentUser]);

  const handleUrlChange = (sessionId, url) => {
    setVideoUrls((prev) => ({ ...prev, [sessionId]: url }));
    if (urlErrors[sessionId]) {
      setUrlErrors((prev) => ({ ...prev, [sessionId]: null }));
    }
    if (apiErrors[sessionId]) {
      setApiErrors((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleSaveVideoUrl = (sessionId) => {
    const url = videoUrls[sessionId];
    const validation = validateGoogleDriveUrl(url);

    if (!validation.isValid) {
      setUrlErrors((prev) => ({ ...prev, [sessionId]: validation.error }));
      return;
    }

    setUrlErrors((prev) => ({ ...prev, [sessionId]: null }));
    const userId = currentUser?._id || currentUser?.id;

    fetch(`${API_BASE}/assessments/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId, 
        userId, 
        videoUrl: url,
        groupNumber: 1
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setSaveSuccess((prev) => ({ ...prev, [sessionId]: true }));
          setApiErrors((prev) => ({ ...prev, [sessionId]: null }));
          setTimeout(() => setSaveSuccess((prev) => ({ ...prev, [sessionId]: false })), 3000);
        } else {
          setApiErrors((prev) => ({ 
            ...prev, 
            [sessionId]: data.error || data.message || `Server returned ${res.status}: Failed to submit video URL.` 
          }));
        }
      })
      .catch(() => {
        setApiErrors((prev) => ({ 
          ...prev, 
          [sessionId]: 'Network error: Could not reach backend server.' 
        }));
      });
  };

  const handleAddReaction = (sessionId, emoji) => {
    setCommentInputs((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] || '') + ' ' + emoji
    }));
  };

  const handleAddComment = (sessionId) => {
    const text = commentInputs[sessionId]?.trim();
    
    if (!text) {
      setCommentErrors((prev) => ({ ...prev, [sessionId]: 'Comment cannot be empty.' }));
      return;
    }

    setCommentErrors((prev) => ({ ...prev, [sessionId]: null }));

    const newComment = {
      id: Date.now(),
      userName: currentUser?.name || currentUser?.email || 'User',
      userId: currentUser?._id || currentUser?.id,
      text,
      timestamp: new Date().toISOString(),
      role: currentUser?.role || 'STUDENT',
    };

    const updated = [...(sessionComments[sessionId] || []), newComment];
    setSessionComments((prev) => ({ ...prev, [sessionId]: updated }));
    setCommentInputs((prev) => ({ ...prev, [sessionId]: '' }));

    // Adjusted endpoint route matching standard API conventions to prevent 404 errors
    fetch(`${API_BASE}/wls-sessions/${sessionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComment),
    })
      .then((res) => {
        if (!res.ok) {
          // Fallback notice if endpoint isn't fully set up on server yet
          console.warn(`Comment synced locally, server responded with status ${res.status}`);
        }
      })
      .catch((err) => {
        console.error('Network error syncing comment:', err);
      });
  };

  const upcomingSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const pastSessions = sessions.filter((s) => s.status !== 'ACTIVE');

  const renderAdminNames = (userGroup) => {
    if (Array.isArray(userGroup.admins) && userGroup.admins.length > 0) {
      return userGroup.admins.map((a) => a.name || a.id).join(', ');
    }
    if (Array.isArray(userGroup.adminIds) && userGroup.adminIds.length > 0) {
      return userGroup.adminIds.join(', ');
    }
    return 'None assigned';
  };

  const renderSessionDetails = (session, isUpcoming) => {
    const sessionId = session.id || session._id;
    const userId = currentUser?._id || currentUser?.id;
    const userGroup = getUserGroup(session.groupAssignments, userId);

    const hasPdfs = Array.isArray(session.pdfBookletUrls) && session.pdfBookletUrls.length > 0;
    const hasVideos = Array.isArray(session.quranVideoUrls) && session.quranVideoUrls.length > 0;
    const currentUrlError = urlErrors[sessionId];
    const currentCommentError = commentErrors[sessionId];
    const currentApiError = apiErrors[sessionId];
    const commentsList = sessionComments[sessionId] || [];

    return (
      <Card key={sessionId} withBorder shadow="sm" radius="md" p="lg" mb="md">
        <ZoomInviteCard session={session} isUpcoming={isUpcoming} />

        {/* Global Resources */}
        {(hasPdfs || hasVideos) && (
          <Paper withBorder p="sm" mt="md" radius="sm" bg="gray.0">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
              Session Resources & Materials
            </Text>
            <Group gap="xl">
              {hasPdfs && (
                <Stack gap={4}>
                  {session.pdfBookletUrls.map((url, idx) => (
                    <Anchor key={idx} href={url} target="_blank" size="sm" c="blue.7" fw={500}>
                      <Group gap={4} wrap="nowrap">
                        <IconFileText size={16} />
                        <span>PDF Booklet #{idx + 1}</span>
                      </Group>
                    </Anchor>
                  ))}
                </Stack>
              )}

              {hasVideos && (
                <Stack gap={4}>
                  {session.quranVideoUrls.map((url, idx) => (
                    <Anchor key={idx} href={url} target="_blank" size="sm" c="teal.7" fw={500}>
                      <Group gap={4} wrap="nowrap">
                        <IconVideo size={16} />
                        <span>Quran Lecture Video #{idx + 1}</span>
                      </Group>
                    </Anchor>
                  ))}
                </Stack>
              )}
            </Group>
          </Paper>
        )}

        {/* Student Assigned Group Section */}
        {userGroup ? (
          <Paper withBorder p="md" mt="md" radius="sm" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <ThemeIcon color="indigo" size="sm" variant="light">
                  <IconUsers size={16} />
                </ThemeIcon>
                <Text fw={600} size="sm" c="indigo.9">
                  Your Assignment: Group {userGroup.groupNumber}
                </Text>
              </Group>
              <Badge color="indigo">Assigned</Badge>
            </Group>

            <Divider my="xs" />

            <Group gap="xs" mb="xs">
              <ThemeIcon color="orange" size="xs" variant="light">
                <IconUserCheck size={14} />
              </ThemeIcon>
              <Text size="xs" fw={600}>
                Group Admin(s):{' '}
                <Text span size="xs" c="dimmed">
                  {renderAdminNames(userGroup)}
                </Text>
              </Text>
            </Group>

            {session.videoDeadline ? (
              <Group gap="xs" mb="xs">
                <ThemeIcon color="red" size="xs" variant="light">
                  <IconClock size={14} />
                </ThemeIcon>
                <Text size="xs" fw={600} c="red.8">
                  Video Submission Deadline:{' '}
                  {new Date(session.videoDeadline).toLocaleString('en-US', {
                    timeZone: 'America/Toronto',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  (Toronto)
                </Text>
              </Group>
            ) : (
              <Group gap="xs" mb="xs">
                <ThemeIcon color="gray" size="xs" variant="light">
                  <IconClock size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  Submission Deadline: Not specified
                </Text>
              </Group>
            )}

            {Array.isArray(userGroup.selectedAyats) && userGroup.selectedAyats.length > 0 && (
              <Stack gap="xs" mt="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Assigned Ayats / Verses
                </Text>
                <List
                  spacing="xs"
                  size="sm"
                  center
                  icon={
                    <ThemeIcon color="blue" size={18} radius="xl">
                      <IconBook size={12} />
                    </ThemeIcon>
                  }
                >
                  {userGroup.selectedAyats.map((ayat, idx) => (
                    <List.Item key={idx}>
                      <strong>
                        {typeof ayat === 'string'
                          ? ayat
                          : `${ayat.surahName || 'Surah'}:${ayat.verseNumber}`}
                      </strong>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            )}

            {userGroup.instructions ? (
              <Paper withBorder p="xs" mt="xs" bg="white" radius="xs">
                <Group gap="xs">
                  <IconAlertCircle size={16} color="gray" />
                  <Text size="xs" c="gray.8">
                    <strong>Special Instructions:</strong> {userGroup.instructions}
                  </Text>
                </Group>
              </Paper>
            ) : (
              <Text size="xs" c="dimmed" mt="xs">
                <strong>Special Instructions:</strong> None provided for this group.
              </Text>
            )}

            {/* Server Error Warning Banner */}
            {currentApiError && (
              <Alert icon={<IconAlertCircle size={16} />} title="API Notice" color="yellow" mt="md" radius="sm">
                {currentApiError}
              </Alert>
            )}

            {/* SECTION 1: Video Submission */}
            <Paper withBorder p="sm" mt="md" radius="sm" bg="white">
              <Group gap="xs" mb="xs">
                <ThemeIcon color="indigo" size="md" variant="light">
                  <IconVideoPlus size={20} />
                </ThemeIcon>
                <Text size="xs" fw={700} c="gray.8" tt="uppercase">
                  Submit Recitation / Presentation Video URL
                </Text>
              </Group>

              <Group align="flex-start">
                <Tooltip
                  label="Give full access on Google Drive ('Anyone with the link can view')"
                  opened={!!currentUrlError}
                  color="red"
                  withArrow
                  position="top-start"
                >
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="https://drive.google.com/file/d/..."
                    value={videoUrls[sessionId] || ''}
                    onChange={(e) => handleUrlChange(sessionId, e.target.value)}
                    error={!!currentUrlError}
                    leftSection={<IconBrandGoogleDrive size={18} color="#1f1f1f" />}
                  />
                </Tooltip>
                <Button
                  color={saveSuccess[sessionId] ? 'teal' : 'indigo'}
                  onClick={() => handleSaveVideoUrl(sessionId)}
                  leftSection={saveSuccess[sessionId] ? <IconCheck size={16} /> : <IconLink size={16} />}
                >
                  {saveSuccess[sessionId] ? 'Saved' : 'Save Video URL'}
                </Button>
              </Group>

              {currentUrlError && (
                <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" mt="xs" p="xs">
                  <Text size="xs" fw={500}>{currentUrlError}</Text>
                </Alert>
              )}
            </Paper>

            {/* SECTION 2: Assignment Comments & Communication Thread */}
            <Paper withBorder p="sm" mt="md" radius="sm" bg="white">
              <Group gap="xs" mb="xs">
                <ThemeIcon color="teal" size="md" variant="light">
                  <IconMessageDots size={20} />
                </ThemeIcon>
                <Text size="xs" fw={700} c="gray.8" tt="uppercase">
                  Assignment Comments & Communication
                </Text>
              </Group>

              {/* Full Communication Thread History */}
              <Stack gap="xs" mb="sm">
                {commentsList.length === 0 ? (
                  <Text size="xs" c="dimmed" fs="italic">
                    No conversation history yet. Send a message or question to your admin below.
                  </Text>
                ) : (
                  commentsList.map((c) => {
                    const isAdmin = c.role === 'ADMIN' || c.isAdmin;
                    return (
                      <Paper 
                        key={c.id} 
                        p="xs" 
                        withBorder 
                        radius="xs" 
                        bg={isAdmin ? 'green.0' : 'gray.0'}
                        style={{
                          borderColor: isAdmin ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-gray-3)',
                          marginLeft: isAdmin ? '16px' : '0px',
                          marginRight: isAdmin ? '0px' : '16px',
                        }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            <Avatar size="24" radius="xl" color={isAdmin ? 'green' : 'indigo'}>
                              {c.userName?.charAt(0) || 'U'}
                            </Avatar>
                            <Text size="xs" fw={700} c={isAdmin ? 'green.9' : 'indigo.9'}>
                              {isAdmin ? `🛡️ Admin (${c.userName})` : `👤 You (${c.userName})`}
                            </Text>
                            <Badge size="xs" variant="light" color={isAdmin ? 'green' : 'blue'}>
                              {c.role || 'STUDENT'}
                            </Badge>
                          </Group>
                          <Text size="10px" c="dimmed">
                            {c.timestamp ? new Date(c.timestamp).toLocaleString('en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }) : 'Just now'}
                          </Text>
                        </Group>
                        <Text size="xs" c="gray.8" style={{ whiteSpace: 'pre-wrap' }}>
                          {c.text}
                        </Text>
                      </Paper>
                    );
                  })
                )}
              </Stack>

              {/* Quick Emojis & Reaction Toolbar */}
              <Group gap={6} mb="xs">
                <Text size="11px" fw={700} c="dimmed">Quick Emojis:</Text>
                <ActionIcon variant="light" color="blue" radius="xl" size="xs" onClick={() => handleAddReaction(sessionId, '👍')} title="Thumbs Up">
                  <span style={{ fontSize: '12px' }}>👍</span>
                </ActionIcon>
                <ActionIcon variant="light" color="red" radius="xl" size="xs" onClick={() => handleAddReaction(sessionId, '❤️')} title="Heart">
                  <span style={{ fontSize: '12px' }}>❤️</span>
                </ActionIcon>
                <ActionIcon variant="light" color="yellow" radius="xl" size="xs" onClick={() => handleAddReaction(sessionId, '😊')} title="Smile">
                  <span style={{ fontSize: '12px' }}>😊</span>
                </ActionIcon>
                <ActionIcon variant="light" color="orange" radius="xl" size="xs" onClick={() => handleAddReaction(sessionId, '👏')} title="Clap">
                  <span style={{ fontSize: '12px' }}>👏</span>
                </ActionIcon>
                <ActionIcon variant="light" color="grape" radius="xl" size="xs" onClick={() => handleAddReaction(sessionId, '🔥')} title="Fire">
                  <span style={{ fontSize: '12px' }}>🔥</span>
                </ActionIcon>
              </Group>

              <Group align="flex-end" gap="xs">
                <Textarea
                  style={{ flex: 1 }}
                  placeholder="Respond back to admin comments or ask a question..."
                  autosize
                  minRows={2}
                  maxRows={4}
                  value={commentInputs[sessionId] || ''}
                  error={!!currentCommentError}
                  onChange={(e) => {
                    setCommentInputs((prev) => ({ ...prev, [sessionId]: e.target.value }));
                    if (commentErrors[sessionId]) {
                      setCommentErrors((prev) => ({ ...prev, [sessionId]: null }));
                    }
                  }}
                />
                <ActionIcon
                  size="lg"
                  color="teal"
                  variant="filled"
                  onClick={() => handleAddComment(sessionId)}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>

              {currentCommentError && (
                <Text size="xs" c="red.7" mt={4} fw={500}>
                  {currentCommentError}
                </Text>
              )}
            </Paper>
          </Paper>
        ) : (
          <Text size="xs" c="dimmed" mt="sm">
            You are not assigned to a group in this session yet.
          </Text>
        )}
      </Card>
    );
  };

  return (
    <Stack gap="md">
      <Title order={3} c="indigo.8">
        Weekly Learning Sessions (WLS)
      </Title>

      <Tabs defaultValue="upcoming" color="indigo">
        <Tabs.List mb="md">
          <Tabs.Tab value="upcoming">Upcoming Sessions ({upcomingSessions.length})</Tabs.Tab>
          <Tabs.Tab value="past">Past Sessions ({pastSessions.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upcoming">
          <Stack gap="md">
            {upcomingSessions.length === 0 ? (
              <Text c="dimmed" size="sm">
                No active upcoming sessions found.
              </Text>
            ) : (
              upcomingSessions.map((s) => renderSessionDetails(s, true))
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="past">
          <Stack gap="md">
            {pastSessions.length === 0 ? (
              <Text c="dimmed" size="sm">
                No past sessions recorded.
              </Text>
            ) : (
              pastSessions.map((s) => renderSessionDetails(s, false))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default WlsStudentView;