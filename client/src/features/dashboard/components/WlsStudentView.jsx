import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../config/constants';
import { ZoomInviteCard } from '../../wls-management/components/ZoomInviteCard';
import { 
  Stack, Title, Text, Tabs, Card, Group, Badge, List, ThemeIcon, Paper, Divider, 
  Anchor, TextInput, Button, Tooltip, ActionIcon, Textarea, Avatar, Alert 
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { 
  IconBook, IconUsers, IconFileText, IconVideo, IconClock, IconUserCheck, 
  IconAlertCircle, IconCheck, IconAlertTriangle, IconSend, IconLink,
  IconVideoPlus, IconMessageDots, IconBrandGoogleDrive, IconUserX, IconRefresh 
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
  
  const [videoUrls, setVideoUrls] = useState({});
  const [urlErrors, setUrlErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [assessmentsMap, setAssessmentsMap] = useState({}); 
  const [apiErrors, setApiErrors] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser._id || currentUser.id;

    Promise.all([
      fetch(`${API_BASE}/wls-sessions`).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE}/assessments/user/${userId}`).then((res) => (res.ok ? res.json() : []))
    ])
      .then(([sessionsData, assessmentsData]) => {
        setSessions(sessionsData);

        const map = {};
        const initialUrls = {};
        
        if (Array.isArray(assessmentsData)) {
          assessmentsData.forEach((assessment) => {
            if (!assessment) return;
            
            const sId = assessment.sessionId 
              ? (typeof assessment.sessionId === 'object' ? assessment.sessionId?._id || assessment.sessionId?.id : assessment.sessionId)
              : null;

            const normalizedAssessment = {
              ...assessment,
              id: assessment.id || assessment._id,
              _id: assessment._id || assessment.id,
              messages: assessment.messages || []
            };

            if (sId) {
              map[sId] = normalizedAssessment;
              if (assessment.submissionUrl) {
                initialUrls[sId] = assessment.submissionUrl;
              }
            } else {
              sessionsData.forEach((session) => {
                const sessId = session.id || session._id;
                const userGroup = getUserGroup(session.groupAssignments, userId);
                if (userGroup) {
                  map[sessId] = normalizedAssessment;
                  if (assessment.submissionUrl) {
                    initialUrls[sessId] = assessment.submissionUrl;
                  }
                }
              });
            }
          });
        }
        
        setAssessmentsMap(map);
        setVideoUrls((prev) => ({ ...prev, ...initialUrls }));
      })
      .catch((err) => console.error('Error fetching data:', err));
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

  const handleMarkCompleted = (sessionId) => {
    const url = videoUrls[sessionId];
    const validation = validateGoogleDriveUrl(url);
    if (!validation.isValid) {
      modals.open({
        title: <Text fw={700} c="red">Missing Video Submission</Text>,
        centered: true,
        children: (
          <Text size="sm" c="dimmed">
            Please submit a valid video URL before marking the task as completed.
          </Text>
        ),
      });
      return;
    }

    modals.openConfirmModal({
      title: <Text fw={700} size="md">Confirm Task Completion</Text>,
      centered: true,
      children: (
        <Text size="sm" c="dimmed">
          Are you sure you want to mark this task as completed? Once finalized, your submission will lock in.
        </Text>
      ),
      labels: { confirm: 'Yes, Complete', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: () => {
        setCompletedTasks((prev) => ({ ...prev, [sessionId]: true }));
      }
    });
  };

  const postAssessmentMessage = async (sessionId, messageDto) => {
    const userId = currentUser?._id || currentUser?.id;
    let assessment = assessmentsMap[sessionId];

    if (!assessment || !assessment.id) {
      const res = await fetch(`${API_BASE}/assessments/session/${sessionId}/user/${userId}`);
      if (!res.ok) throw new Error('Failed to initialize assessment record');
      assessment = await res.json();
    }

    const assessmentId = assessment.id || assessment._id;
    const res = await fetch(`${API_BASE}/assessments/${assessmentId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageDto),
    });

    if (!res.ok) throw new Error('Failed to send message');
    const updatedAssessment = await res.json();

    setAssessmentsMap((prev) => ({ ...prev, [sessionId]: updatedAssessment }));
  };

  const handleRequestAbsence = (sessionId) => {
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
        if (!reasonText.trim()) return;
        const userId = currentUser?._id || currentUser?.id;
        const userName = currentUser?.name || currentUser?.fullName || currentUser?.email || 'User';
        const senderRole = currentUser?.role || 'USER';

        try {
          await postAssessmentMessage(sessionId, {
            senderId: userId,
            senderName: userName,
            senderRole: senderRole,
            text: `[ABSENCE REQUEST]: ${reasonText}`
          });
        } catch (err) {
          console.error('Failed to submit absence request:', err);
        }
      }
    });
  };

  const handleAddEmoji = (sessionId, emoji) => {
    setCommentInputs((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] || '') + emoji
    }));
  };

  const handleAddComment = async (sessionId) => {
    const text = commentInputs[sessionId]?.trim();
    if (!text) {
      setCommentErrors((prev) => ({ ...prev, [sessionId]: 'Comment cannot be empty.' }));
      return;
    }

    setCommentErrors((prev) => ({ ...prev, [sessionId]: null }));

    const userId = currentUser?._id || currentUser?.id;
    const userName = currentUser?.name || currentUser?.fullName || currentUser?.email || 'User';
    const senderRole = currentUser?.role || 'USER';

    try {
      await postAssessmentMessage(sessionId, {
        senderId: userId,
        senderName: userName,
        senderRole: senderRole,
        text: text
      });
      setCommentInputs((prev) => ({ ...prev, [sessionId]: '' }));
    } catch (err) {
      console.error('Failed to sync message to assessment API:', err);
      setCommentErrors((prev) => ({ ...prev, [sessionId]: 'Failed to send message. Please try again.' }));
    }
  };

  const upcomingSessions = sessions.filter((s) => s.status === 'ACTIVE' && !completedTasks[s.id || s._id]);
  const pastSessions = sessions.filter((s) => s.status !== 'ACTIVE' || completedTasks[s.id || s._id]);

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
    
    const commentsList = assessmentsMap[sessionId]?.messages || [];
    const isCompleted = completedTasks[sessionId] || session.status === 'COMPLETED';

    return (
      <Card key={sessionId} withBorder shadow="sm" radius="md" p="lg" mb="md">
        <ZoomInviteCard session={session} isUpcoming={isUpcoming && !isCompleted} />

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

        {userGroup ? (
          <Paper withBorder p="md" mt="md" radius="sm" bg={isCompleted ? 'gray.1' : 'blue.0'}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <ThemeIcon color={isCompleted ? 'gray' : 'indigo'} size="sm" variant="light">
                  <IconUsers size={16} />
                </ThemeIcon>
                <Text fw={600} size="sm" c={isCompleted ? 'gray.8' : 'indigo.9'}>
                  Your Assignment: Group {userGroup.groupNumber} {isCompleted && '(Completed)'}
                </Text>
              </Group>
              <Group gap="xs">
                <Badge color={isCompleted ? 'grape' : 'indigo'}>
                  {isCompleted ? 'COMPLETED' : 'Assigned'}
                </Badge>
                {!isCompleted && (
                  <Button size="xs" variant="outline" color="red" leftSection={<IconUserX size={12} />} onClick={() => handleRequestAbsence(sessionId)}>
                    Request Absence
                  </Button>
                )}
              </Group>
            </Group>

            <Divider my="xs" />

            <Group gap="xs" mb="xs">
              <ThemeIcon color="orange" size="xs" variant="light">
                <IconUserCheck size={14} />
              </ThemeIcon>
              <Text size="xs" fw={600}>
                Group Admin(s): <Text span size="xs" c="dimmed">{renderAdminNames(userGroup)}</Text>
              </Text>
            </Group>

            {session.videoDeadline && (
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
                  })} (Toronto)
                </Text>
              </Group>
            )}

            {Array.isArray(userGroup.selectedAyats) && userGroup.selectedAyats.length > 0 && (
              <Stack gap="xs" mt="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">Assigned Ayats / Verses</Text>
                <List spacing="xs" size="sm" center icon={<ThemeIcon color="blue" size={18} radius="xl"><IconBook size={12} /></ThemeIcon>}>
                  {userGroup.selectedAyats.map((ayat, idx) => (
                    <List.Item key={idx}>
                      <strong>{typeof ayat === 'string' ? ayat : `${ayat.surahName || 'Surah'}:${ayat.verseNumber}`}</strong>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            )}

            {currentApiError && (
              <Alert icon={<IconAlertCircle size={16} />} title="API Notice" color="yellow" mt="md" radius="sm">
                {currentApiError}
              </Alert>
            )}

            {/* Video Submission Section */}
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
                <Tooltip label="Give full access on Google Drive ('Anyone with the link can view')" opened={!!currentUrlError} color="red" withArrow position="top-start">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="https://drive.google.com/file/d/..."
                    value={videoUrls[sessionId] || ''}
                    readOnly={isCompleted}
                    onChange={(e) => handleUrlChange(sessionId, e.target.value)}
                    error={!!currentUrlError}
                    leftSection={<IconBrandGoogleDrive size={18} color="#1f1f1f" />}
                  />
                </Tooltip>
                {!isCompleted && (
                  <Button
                    color={saveSuccess[sessionId] ? 'teal' : 'indigo'}
                    onClick={() => handleSaveVideoUrl(sessionId)}
                    leftSection={saveSuccess[sessionId] ? <IconCheck size={16} /> : <IconLink size={16} />}
                  >
                    {saveSuccess[sessionId] ? 'Saved' : 'Save Video URL'}
                  </Button>
                )}
              </Group>

              {!isCompleted && (
                <Button 
                  fullWidth 
                  color="green" 
                  mt="sm" 
                  leftSection={<IconCheck size={16} />} 
                  onClick={() => handleMarkCompleted(sessionId)}
                >
                  Mark Task as Completed
                </Button>
              )}

              {currentUrlError && (
                <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" mt="xs" p="xs">
                  <Text size="xs" fw={500}>{currentUrlError}</Text>
                </Alert>
              )}
            </Paper>

            {/* Comments & Chat Thread Section */}
            <Paper withBorder p="sm" mt="md" radius="sm" bg="white">
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
                    onClick={async () => {
                      const userId = currentUser?._id || currentUser?.id;
                      try {
                        const res = await fetch(`${API_BASE}/assessments/user/${userId}`);
                        if (res.ok) {
                          const assessmentsData = await res.json();
                          const map = { ...assessmentsMap };
                          if (Array.isArray(assessmentsData)) {
                            assessmentsData.forEach((assessment) => {
                              if (!assessment) return;
                              const sId = assessment.sessionId 
                                ? (typeof assessment.sessionId === 'object' ? assessment.sessionId?._id || assessment.sessionId?.id : assessment.sessionId)
                                : null;

                              const normalizedAssessment = {
                                ...assessment,
                                id: assessment.id || assessment._id,
                                _id: assessment._id || assessment.id,
                                messages: assessment.messages || []
                              };

                              if (sId) {
                                map[sId] = normalizedAssessment;
                              } else {
                                sessions.forEach((session) => {
                                  const sessId = session.id || session._id;
                                  map[sessId] = normalizedAssessment;
                                });
                              }
                            });
                          }
                          setAssessmentsMap(map);
                        }
                      } catch (err) {
                        console.error('Failed to refresh chat:', err);
                      }
                    }}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              {/* Chat Message Bubbles */}
              <Stack gap="xs" mb="md" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {commentsList.length === 0 ? (
                  <Text size="xs" c="dimmed" fs="italic">
                    No conversation history yet. Send a message or question to your admin below.
                  </Text>
                ) : (
                  commentsList.map((c) => {
                    const isAdmin = c.senderRole === 'WLS_ADMIN' || c.senderRole === 'SUPER_USER';
                    return (
                      <Paper 
                        key={c._id || c.id} 
                        p="xs" 
                        withBorder 
                        radius="md" 
                        bg={isAdmin ? 'green.0' : 'indigo.0'}
                        style={{
                          borderColor: isAdmin ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-indigo-3)',
                          maxWidth: '85%',
                          marginLeft: isAdmin ? 'auto' : '0',
                          marginRight: isAdmin ? '0' : 'auto',
                        }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Group gap={6}>
                            <Avatar size="20" radius="xl" color={isAdmin ? 'green' : 'indigo'}>
                              {c.senderName?.charAt(0) || 'U'}
                            </Avatar>
                            <Text size="xs" fw={700} c={isAdmin ? 'green.9' : 'indigo.9'}>
                              {isAdmin ? `🛡️ Admin (${c.senderName})` : `👤 ${c.senderName}`}
                            </Text>
                          </Group>
                          <Text size="9px" c="dimmed">
                            {c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </Text>
                        </Group>
                        <Text size="xs" c="gray.8" style={{ whiteSpace: 'pre-wrap', paddingLeft: '26px' }}>
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
                    {['😊', '👍', '❤️', '👏', '🔥', '🤲', '💡', '✨'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => handleAddEmoji(sessionId, emoji)}
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
                </Stack>
              )}

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