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
  Paper,
  Select
} from '@mantine/core';
import { modals } from '@mantine/modals';
import {
  IconClipboardCheck,
  IconVideo,
  IconAward,
  IconMessageDots,
  IconUsers,
  IconUser,
  IconAlertTriangle,
  IconCircleCheck,
  IconShieldCheck,
  IconDeviceFloppy,
  IconUserCheck,
  IconCalendarEvent
} from '@tabler/icons-react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';
import {
  fetchAssessmentPanelData,
  createAssessmentRecord,
  gradeAssessmentRecord
} from '../api/wlsAssessmentApi';

function formatDriveEmbedUrl(url) {
  if (!url) return { embedUrl: '', error: null };
  const cleanUrl = url.trim();

  if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch =
      cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);

    if (!fileIdMatch || !fileIdMatch[1]) {
      return {
        embedUrl: '',
        error: 'Invalid Google Drive URL format. Ensure it contains a valid File ID.'
      };
    }

    const formattedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
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

export function WlsAssessmentPanel({ currentAdminId, currentAdminName = 'WLS Admin Evaluator', onSubmitAssessment }) {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionInfo, setSessionInfo] = useState({ topic: '', date: '', rawSession: null });
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [adminVideoUrl, setAdminVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => {
      setBanner({ show: false, type: '', message: '' });
    }, 4000);
  };

  const loadPanelData = async (targetSessionId = null) => {
    try {
      setLoading(true);

      const { sessions, assessments, allUsers, rulesData } = await fetchAssessmentPanelData(currentAdminId);

      if (Array.isArray(sessions)) {
        setAllSessions(sessions);
      }

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

      const activeSession = targetSessionId 
        ? sessions.find((s) => (s.id || s._id) === targetSessionId)
        : (Array.isArray(sessions) ? sessions[0] : null);

      if (activeSession) {
        setSelectedSessionId(activeSession.id || activeSession._id);
        setSessionInfo({
          topic:
            activeSession.topic ||
            activeSession.topicName ||
            activeSession.sessionTitle ||
            activeSession.title ||
            activeSession.name ||
            'WLS Session Assessment',
          date: activeSession.sessionDateTimeToronto || activeSession.sessionDate || activeSession.date || '',
          rawSession: activeSession
        });
      } else {
        setSessionInfo({
          topic: 'WLS Session Assessment',
          date: '',
          rawSession: null
        });
      }

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
        const studentUrl = assessment.submissionUrl || (assessment.submissionUrls?.[0] || '');
        const adminUrl = assessment.adminSubmissionUrl || '';

        return {
          id: studentId,
          sessionId: activeSession?.id || activeSession?._id,
          name: userObj.name || `Student (${studentId.slice(-4)})`,
          email: userObj.email || '',
          assessmentId: assessment.id || assessment._id,
          submissionUrl: studentUrl,
          adminSubmissionUrl: adminUrl,
          status: assessment.status || (assessment.isCompleted ? 'COMPLETED' : studentUrl || adminUrl ? 'SUBMITTED' : 'MISSING'),
          missedReason: assessment.missedReason || '',
          groupNumber: assessment.groupNumber || 1,
          evaluations: assessment.evaluations || assessment.scores || {},
          feedback: assessment.feedback || assessment.comments || ''
        };
      });

      setAssignedUsers(memberList);

      if (memberList.length > 0) {
        handleUserSelect(memberList[0]);
      } else {
        setSelectedUser(null);
        setVideoUrl('');
        setAdminVideoUrl('');
        setScores({});
        setFeedback('');
      }
    } catch (err) {
      console.error('Failed to load assessment panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPanelData();
  }, [currentAdminId]);

  const handleSessionSwitch = (newSessionId) => {
    if (!newSessionId) return;
    loadPanelData(newSessionId);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFeedback(user.feedback || '');

    const activeStreamUrl = user.adminSubmissionUrl || user.submissionUrl || '';
    setVideoUrl(activeStreamUrl);
    setAdminVideoUrl(user.adminSubmissionUrl || '');
    setIframeError(false);

    const existingScores = {};
    const evals = user.evaluations || {};

    if (Array.isArray(evals)) {
      evals.forEach((item) => {
        const key = item.criterionKey || item.key || item.criterion;
        if (key && item.score !== undefined && item.score !== null) {
          existingScores[key] = Number(item.score);
        }
      });
    } else if (typeof evals === 'object' && evals !== null) {
      Object.entries(evals).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          existingScores[key] = Number(val);
        }
      });
    }

    setScores(existingScores);
  };

  const handleScoreChange = (criterionKey, score) => {
    const updatedScores = { ...scores, [criterionKey]: Number(score) };
    setScores(updatedScores);

    if (selectedUser) {
      setSelectedUser((prev) => ({
        ...prev,
        evaluations: updatedScores
      }));
    }
  };

  const handleSaveAssessment = async (saveType) => {
    if (!selectedUser) return;
    setBanner({ show: false, type: '', message: '' });

    const activeStreamUrl = adminVideoUrl || videoUrl;

    if (saveType === 'complete' && (!activeStreamUrl || activeStreamUrl.trim() === '')) {
      showBanner(
        'error',
        'Cannot complete assessment: Student has not provided a mandatory video link, and no admin override link exists.'
      );
      return;
    }

    let targetId = selectedUser.assessmentId;

    try {
      if (!targetId) {
        const resolvedSessionId = selectedSessionId || selectedUser.sessionId;

        const submitData = await createAssessmentRecord({
          sessionId: resolvedSessionId,
          userId: selectedUser.id || selectedUser._id,
          videoUrl: activeStreamUrl || 'https://placeholder-url.com',
          groupNumber: selectedUser.groupNumber || 1
        });

        targetId = submitData.id || submitData._id;
      }

      const payload = {
        evaluatorId: currentAdminId || selectedUser.id,
        evaluatorName: currentAdminName,
        scores,
        feedback: feedback || '',
        adminSubmissionUrl: adminVideoUrl || ''
      };

      await gradeAssessmentRecord(targetId, payload);

      const updatedUserObj = {
        ...selectedUser,
        assessmentId: targetId,
        submissionUrl: videoUrl,
        adminSubmissionUrl: adminVideoUrl,
        feedback,
        evaluations: payload.scores,
        status: saveType === 'complete' ? 'COMPLETED' : 'PARTIAL_SAVED'
      };

      setAssignedUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? updatedUserObj : u))
      );
      setSelectedUser(updatedUserObj);

      showBanner(
        'success',
        `Assessment successfully ${saveType === 'complete' ? 'completed' : 'saved'}!`
      );

      if (onSubmitAssessment) {
        onSubmitAssessment(updatedUserObj);
      }
    } catch (err) {
      console.error('Save failed:', err);
      showBanner('error', `Save Failed: ${err.message}`);
    }
  };

  const openSaveConfirmationModal = () => {
    if (!selectedUser) return;

    modals.openConfirmModal({
      title: <Text fw={700} size="lg">Confirm Assessment Save</Text>,
      centered: true,
      radius: 'md',
      labels: { confirm: 'Save as Completed', cancel: 'Partial Save' },
      confirmProps: { color: 'green' },
      cancelProps: { color: 'blue', variant: 'filled' },
      children: (
        <Text size="sm" c="gray.7" mb="md">
          Are you sure you want to save grades for <strong>{selectedUser.name}</strong>? 
          Select <strong>Save as Completed</strong> to mark status as fully completed, or <strong>Partial Save</strong> to save progress and resume later.
        </Text>
      ),
      onConfirm: () => handleSaveAssessment('complete'),
      onCancel: () => handleSaveAssessment('partial')
    });
  };

  if (loading) {
    return <Text ta="center" py="xl" c="dimmed">Loading assigned members...</Text>;
  }

  const activeVideoToRender = adminVideoUrl || videoUrl;
  const { embedUrl, error: urlCheckError } = formatDriveEmbedUrl(activeVideoToRender);
  const hasActiveError = Boolean(urlCheckError || iframeError);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge size="xs" color="green" variant="filled">COMPLETED</Badge>;
      case 'PARTIAL_SAVED':
        return <Badge size="xs" color="blue" variant="filled">PARTIAL SAVED</Badge>;
      case 'SUBMITTED':
        return <Badge size="xs" color="cyan" variant="light">SUBMITTED</Badge>;
      default:
        return <Badge size="xs" color="red" variant="light">MISSING</Badge>;
    }
  };

  return (
    <Box style={{ width: '100%', paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', boxSizing: 'border-box' }}>
      {/* Metallic Shining Banner with Hover Glow Effect */}
      <Card
        shadow="md"
        padding="lg"
        radius="lg"
        withBorder
        mb="lg"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          borderColor: '#059669',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
          transition: 'all 0.3s ease',
        }}
        styles={{
          root: {
            '&:hover': {
              boxShadow: '0 6px 28px rgba(16, 185, 129, 0.45)',
              transform: 'translateY(-2px)'
            }
          }
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="md">
            <ThemeIcon size={50} radius="xl" color="white" variant="white" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
              <IconCalendarEvent size={28} color="#047857" />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="emerald.1" style={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, color: '#d1fae5' }}>
                Active Session Topic
              </Text>
              <Text fw={900} size="xl" c="white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                {sessionInfo.topic}
              </Text>
              {sessionInfo.date && (
                <Text size="xs" c="emerald.1" mt={2} style={{ color: '#a7f3d0' }}>
                  Session Date: {new Date(sessionInfo.date).toLocaleString()}
                </Text>
              )}
            </Box>
          </Group>

          <Group gap="lg" align="flex-end">
            <Select
              label={<Text size="xs" fw={700} c="white">Switch Assessment Session</Text>}
              placeholder="Select active session..."
              data={allSessions.map((s) => ({
                value: s.id || s._id,
                label: s.topic || s.topicName || s.title || `Session (${(s.id || s._id).slice(-4)})`
              }))}
              value={selectedSessionId}
              onChange={handleSessionSwitch}
              style={{ width: '280px' }}
              size="sm"
              styles={{
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: 600,
                  borderColor: '#047857'
                }
              }}
            />

            <Group gap="xs" bg="rgba(0, 0, 0, 0.15)" px="md" py="xs" style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <ThemeIcon size="md" radius="xl" color="white" variant="white">
                <IconUserCheck size={18} color="#047857" />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="emerald.1" style={{ fontWeight: 600, color: '#a7f3d0', lineHeight: 1.1 }}>
                  Active Evaluator:
                </Text>
                <Text size="sm" fw={800} c="white" style={{ lineHeight: 1.2 }}>
                  {currentAdminName}
                </Text>
              </Box>
            </Group>
          </Group>
        </Group>
      </Card>

      <Grid gutter="lg" align="flex-start" style={{ width: '100%', margin: 0 }}>
        {/* Sidebar */}
        <Grid.Col span={{ base: 12, md: 3, lg: 3 }}>
          <Card shadow="xs" padding="lg" radius="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
                  <IconUsers size={20} />
                </ThemeIcon>
                <Text fw={800} size="md" c="dark">
                  Assigned Members
                </Text>
              </Group>
              <Badge color="blue" variant="filled" radius="sm">
                {assignedUsers.length}
              </Badge>
            </Group>

            <Stack gap="xs">
              {assignedUsers.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" py="md">
                  No members assigned to you for this session.
                </Text>
              ) : (
                assignedUsers.map((item) => {
                  const isSelected = selectedUser?.id === item.id;

                  return (
                    <Paper
                      key={item.id}
                      component={UnstyledButton}
                      onClick={() => handleUserSelect(item)}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        display: 'block',
                        width: '100%',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : '#ffffff',
                        borderColor: isSelected ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-3)',
                        borderWidth: isSelected ? 2 : 1,
                        boxShadow: isSelected ? '0 2px 8px rgba(28, 126, 214, 0.15)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap" align="center">
                        <Group gap="xs" wrap="nowrap">
                          <ThemeIcon
                            size="md"
                            radius="xl"
                            color={isSelected ? 'blue' : 'gray'}
                            variant={isSelected ? 'filled' : 'light'}
                          >
                            <IconUser size={16} />
                          </ThemeIcon>

                          <Box>
                            <Text fw={700} size="sm" c="dark">
                              {item.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Group {item.groupNumber}
                            </Text>
                          </Box>
                        </Group>

                        {getStatusBadge(item.status)}
                      </Group>
                    </Paper>
                  );
                })
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Main Workspace */}
        <Grid.Col span={{ base: 12, md: 9, lg: 9 }}>
          {selectedUser ? (
            <Card shadow="xs" padding="xl" radius="lg" withBorder style={{ width: '100%' }}>
              <Group justify="space-between" mb="xl">
                <Group gap="sm">
                  <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                    <IconClipboardCheck size={28} />
                  </ThemeIcon>
                  <Text size="xl" fw={800}>
                    Assessment for:{' '}
                    <Text component="span" c="blue">
                      {selectedUser.name}
                    </Text>
                  </Text>
                </Group>
                {getStatusBadge(selectedUser.status)}
              </Group>

              {banner.show && (
                <Alert
                  color={banner.type === 'success' ? 'green' : 'red'}
                  title={banner.type === 'success' ? 'Success' : 'Error'}
                  withCloseButton
                  onClose={() => setBanner({ show: false, type: '', message: '' })}
                  mb="md"
                  radius="md"
                >
                  {banner.message}
                </Alert>
              )}

              {/* Mandatory Video Submission Status Alert */}
              {!activeVideoToRender ? (
                <Alert
                  icon={<IconAlertTriangle size={20} />}
                  title="Missing Mandatory Video Submission"
                  color="red"
                  variant="filled"
                  radius="md"
                  mb="md"
                >
                  This student has <strong>not submitted a video link</strong>. You cannot mark this assessment as <strong>COMPLETED</strong> until a valid video URL is provided by the student or entered in the Admin Override section.
                </Alert>
              ) : (
                <Alert
                  icon={<IconCircleCheck size={20} />}
                  title="Submission Received"
                  color="green"
                  variant="light"
                  radius="md"
                  mb="md"
                >
                  Student video submission detected for evaluation.
                </Alert>
              )}

              {/* Video Player Box */}
              <Card
                withBorder
                padding="lg"
                radius="md"
                mb="xl"
                bg={hasActiveError ? 'red.0' : 'gray.0'}
                style={{ borderColor: hasActiveError ? 'var(--mantine-color-red-3)' : 'var(--mantine-color-gray-3)' }}
              >
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <ThemeIcon size="lg" radius="xl" color={hasActiveError ? 'red' : 'indigo'} variant="light">
                      <IconVideo size={22} />
                    </ThemeIcon>
                    <Text fw={700} size="md" c="gray.8">
                      Student Video Stream
                    </Text>
                  </Group>
                  {selectedUser.submissionUrl && (
                    <Badge color="blue" variant="light">
                      User Submitted Link
                    </Badge>
                  )}
                </Group>

                <TextInput
                  label="Student Provided Video Link:"
                  placeholder="No link submitted by student..."
                  value={videoUrl}
                  readOnly
                  mb="md"
                  error={hasActiveError}
                />

                {activeVideoToRender && (
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

                {embedUrl ? (
                  <Box
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%',
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
                    style={{
                      height: 320,
                      backgroundColor: '#0f172a',
                      borderRadius: 8,
                      border: '1px dashed #334155'
                    }}
                  >
                    <IconVideo size={42} color="#64748b" />
                    <Text fw={600} c="gray.3" size="sm">
                      No Video Link Provided
                    </Text>
                  </Stack>
                )}
              </Card>

              {/* Admin Override Input */}
              <Card
                padding="lg"
                radius="md"
                withBorder
                mb="xl"
                bg="indigo.0"
                style={{ borderColor: 'var(--mantine-color-indigo-2)' }}
              >
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="md" radius="xl" color="indigo" variant="filled">
                    <IconShieldCheck size={18} />
                  </ThemeIcon>
                  <Text fw={800} size="md" c="indigo.9">
                    Admin Video Override & Submission Menu
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" mb="md">
                  Paste or overwrite a verified video link here if the user submitted an invalid link or sent it via external channels.
                </Text>

                <TextInput
                  label="Admin Overridden Drive / Video Link:"
                  placeholder="Paste official Google Drive link here..."
                  value={adminVideoUrl}
                  onChange={(e) => {
                    setAdminVideoUrl(e.target.value);
                    setIframeError(false);
                  }}
                />
              </Card>

              {/* Criteria Controls */}
              <Group gap="xs" mb="md">
                <ThemeIcon size="lg" radius="xl" color="green" variant="light">
                  <IconAward size={22} />
                </ThemeIcon>
                <Text fw={800} size="lg" c="green.7">
                  Evaluation Criteria
                </Text>
              </Group>

              <Stack gap="md" mb="xl">
                {criteriaList.map((criterion, idx) => {
                  const key = criterion.key || criterion.code || (typeof criterion === 'string' ? criterion : `criterion_${idx}`);
                  const label = criterion.title || criterion.criterion || (typeof criterion === 'string' ? criterion : `Criteria ${idx + 1}`);

                  return (
                    <ColorScoreSlider
                      key={key}
                      label={label}
                      value={scores[key] !== undefined ? scores[key] : 1}
                      onChange={(val) => handleScoreChange(key, val)}
                    />
                  );
                })}
              </Stack>

              {/* Feedback Field */}
              <Card
                padding="lg"
                radius="md"
                withBorder
                mb="xl"
                bg="cyan.0"
                style={{ borderColor: 'var(--mantine-color-cyan-3)' }}
              >
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="md" radius="xl" color="cyan" variant="filled">
                    <IconMessageDots size={18} />
                  </ThemeIcon>
                  <Text
                    fw={800}
                    size="md"
                    c="cyan.9"
                    style={{
                      backgroundColor: 'var(--mantine-color-cyan-1)',
                      padding: '4px 10px',
                      borderRadius: 'var(--mantine-radius-xs)'
                    }}
                  >
                    Instructor Feedback & Comments (Visible to Student)
                  </Text>
                </Group>

                <Textarea
                  minRows={4}
                  placeholder="Enter comprehensive assessment feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </Card>

              <Button
                size="lg"
                color="blue"
                fullWidth
                leftSection={<IconDeviceFloppy size={20} />}
                onClick={openSaveConfirmationModal}
                radius="md"
              >
                Save Video & Submit Assessment Record
              </Button>
            </Card>
          ) : (
            <Text ta="center" c="dimmed" py="xl">
              {assignedUsers.length === 0 ? 'No students are assigned to you for this session.' : 'Select a user from the left sidebar to begin assessment.'}
            </Text>
          )}
        </Grid.Col>
      </Grid>
    </Box>
  );
}