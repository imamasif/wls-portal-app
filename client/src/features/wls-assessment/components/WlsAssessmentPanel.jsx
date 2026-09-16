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
  Modal
} from '@mantine/core';
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
  IconX,
  IconBookmark
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

export function WlsAssessmentPanel({ currentAdminId, onSubmitAssessment }) {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [adminVideoUrl, setAdminVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [banner, setBanner] = useState({ show: false, type: '', message: '' });

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => {
      setBanner({ show: false, type: '', message: '' });
    }, 4000);
  };

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
          const studentUrl = assessment.submissionUrl || (assessment.submissionUrls?.[0] || '');
          const adminUrl = assessment.adminSubmissionUrl || '';

          return {
            id: studentId,
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
        }
      } catch (err) {
        console.error('Failed to load assessment panel data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentAdminId]);

  // ✅ FIX 1: Enhanced Score Extraction supporting both Object & Array shapes
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

    // Map fallbacks for standard keys
    if (existingScores.recitation && !existingScores.arabicReading) {
      existingScores.arabicReading = existingScores.recitation;
    }
    if (existingScores.reflection && !existingScores.transferenceOfSpirit) {
      existingScores.transferenceOfSpirit = existingScores.reflection;
    }

    setScores(existingScores);
  };

  const handleScoreChange = (criterionKey, score) => {
    const updatedScores = { ...scores, [criterionKey]: Number(score) };
    setScores(updatedScores);

    // Keep active selection updated locally
    if (selectedUser) {
      setSelectedUser((prev) => ({
        ...prev,
        evaluations: updatedScores
      }));
    }
  };

  const resetToSelectedUserOriginalState = () => {
    if (!selectedUser) return;
    handleUserSelect(selectedUser);
  };

  // ✅ FIX 2: Dynamic & Schema-Safe Score Saving
  const handleSaveAssessment = async (saveType) => {
    if (!selectedUser) return;
    setIsSaving(true);
    setBanner({ show: false, type: '', message: '' });

    let targetId = selectedUser.assessmentId;

    try {
      if (!targetId) {
        const resolvedSessionId =
          selectedUser.sessionId ||
          selectedUser.sessionId?._id ||
          '650000000000000000000001';

        const submitResponse = await fetch('/api/assessments/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: resolvedSessionId,
            userId: selectedUser.id || selectedUser._id,
            videoUrl: videoUrl || 'https://placeholder-url.com',
            groupNumber: selectedUser.groupNumber || 1
          })
        });

        const submitData = await submitResponse.json();

        if (!submitResponse.ok) {
          throw new Error(
            submitData.error || submitData.message || 'Failed to initialize assessment record'
          );
        }

        targetId = submitData.id || submitData._id;
      }

      if (!targetId || !/^[0-9a-fA-F]{24}$/.test(targetId)) {
        throw new Error(`Invalid Assessment Record ID (${targetId}). Unable to save grade.`);
      }

      // Save both UI dynamic keys & schema required keys
      const savedScores = {
        ...scores,
        presentation: Number(scores.presentation ?? scores.attire ?? 1),
        recitation: Number(scores.recitation ?? scores.arabicReading ?? 1),
        reflection: Number(scores.reflection ?? scores.transferenceOfSpirit ?? 1)
      };

      const payload = {
        evaluatorId: currentAdminId || selectedUser.id,
        evaluatorName: 'Admin Evaluator',
        scores: savedScores,
        feedback: feedback || '',
        adminSubmissionUrl: adminVideoUrl || ''
      };

      const gradeResponse = await fetch(`/api/assessments/${targetId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const gradeData = await gradeResponse.json();

      if (!gradeResponse.ok) {
        throw new Error(gradeData.message || gradeData.error || 'Validation Failed');
      }

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

      setTimeout(() => {
        setShowSaveModal(false);
      }, 1000);
    } catch (err) {
      console.error('Save failed:', err);
      showBanner('error', `Save Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetToSelectedUserOriginalState();
    setShowSaveModal(false);
  };

  if (loading) {
    return <Text align="center" py="xl" color="dimmed">Loading assigned members...</Text>;
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
    <Box sx={{ width: '100%', px: '16px', py: '12px', boxSizing: 'border-box' }}>
      <Grid gutter="lg" align="flex-start" style={{ width: '100%', margin: 0 }}>
        {/* Sidebar */}
        <Grid.Col span={{ base: 12, md: 3, lg: 3 }}>
          <Card shadow="xs" padding="lg" radius="lg" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
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

            <Stack gap="xs">
              {assignedUsers.map((item) => {
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
                      backgroundColor: isSelected ? theme.colors.blue[0] : theme.white,
                      borderColor: isSelected ? theme.colors.blue[5] : theme.colors.gray[3],
                      borderWidth: isSelected ? 2 : 1,
                      boxShadow: isSelected ? '0 2px 8px rgba(28, 126, 214, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? theme.colors.blue[0] : theme.colors.gray[0]
                      }
                    })}
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
                          <Text weight={700} size="sm" color="dark">
                            {item.name}
                          </Text>
                          <Text size="xs" color="dimmed">
                            Group {item.groupNumber}
                          </Text>
                        </Box>
                      </Group>

                      {getStatusBadge(item.status)}
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Main Panel */}
        <Grid.Col span={{ base: 12, md: 9, lg: 9 }}>
          {selectedUser ? (
            <Card shadow="xs" padding="xl" radius="lg" withBorder sx={{ width: '100%' }}>
              <Group justify="space-between" mb="xl">
                <Group gap="sm">
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

              {/* Video Player */}
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
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <ThemeIcon size="lg" radius="xl" color={hasActiveError ? 'red' : 'indigo'} variant="light">
                      <IconVideo size={22} />
                    </ThemeIcon>
                    <Text weight={700} size="md" color="gray.8">
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
                    sx={{
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
                    sx={{
                      height: 320,
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

                {activeVideoToRender && (
                  <Group justify="space-between" mt="sm">
                    <Text
                      component="a"
                      href={activeVideoToRender}
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

              {/* Admin Video Override */}
              <Card
                padding="lg"
                radius="md"
                withBorder
                mb="xl"
                sx={(theme) => ({
                  backgroundColor: theme.colors.indigo[0],
                  borderColor: theme.colors.indigo[2]
                })}
              >
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="md" radius="xl" color="indigo" variant="filled">
                    <IconShieldCheck size={18} />
                  </ThemeIcon>
                  <Text weight={800} size="md" color="indigo.9">
                    Admin Video Override & Submission Menu
                  </Text>
                </Group>
                <Text size="xs" color="dimmed" mb="md">
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
                  styles={(theme) => ({
                    input: {
                      borderColor: theme.colors.indigo[3],
                      backgroundColor: theme.white
                    }
                  })}
                />
              </Card>

              {/* Evaluation Criteria */}
              <Group gap="xs" mb="md">
                <ThemeIcon size="lg" radius="xl" color="green" variant="light">
                  <IconAward size={22} />
                </ThemeIcon>
                <Text weight={800} size="lg" color="green.7">
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

              {/* Feedback Block */}
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
                <Group gap="xs" mb="xs">
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

              <Button
                size="lg"
                color="blue"
                fullWidth
                leftSection={<IconDeviceFloppy size={20} />}
                onClick={() => setShowSaveModal(true)}
                radius="md"
              >
                Save Video & Submit Assessment Record
              </Button>
            </Card>
          ) : (
            <Text align="center" color="dimmed" py="xl">
              Select a user from the left sidebar to begin assessment.
            </Text>
          )}
        </Grid.Col>
      </Grid>

      {/* Confirmation Modal */}
      <Modal
        opened={showSaveModal}
        onClose={handleCancel}
        title={<Text weight={700} size="lg">Confirm Assessment Save</Text>}
        centered
        radius="md"
        padding="lg"
      >
        <Text size="sm" color="gray.7" mb="xl">
          Choose how you would like to save this assessment for <strong>{selectedUser?.name}</strong>:
        </Text>

        <Stack gap="md">
          <Paper withBorder p="md" radius="md" sx={(theme) => ({ backgroundColor: theme.colors.green[0], borderColor: theme.colors.green[3] })}>
            <Text weight={700} color="green.9" size="sm" mb={4}>Save & Mark Completed (Green)</Text>
            <Text size="xs" color="dimmed" mb="md">
              Marks evaluation as finished, saves all scores/feedback to database, and tags as <strong>Assessment Completed</strong>.
            </Text>
            <Button
              color="green"
              fullWidth
              loading={isSaving}
              leftSection={<IconDeviceFloppy size={18} />}
              onClick={() => handleSaveAssessment('complete')}
            >
              Save as Completed
            </Button>
          </Paper>

          <Paper withBorder p="md" radius="md" sx={(theme) => ({ backgroundColor: theme.colors.blue[0], borderColor: theme.colors.blue[3] })}>
            <Text weight={700} color="blue.9" size="sm" mb={4}>Partial Save (Blue)</Text>
            <Text size="xs" color="dimmed" mb="md">
              Saves current progress so you can complete marking later. Highlights status as <strong>Partial Saved</strong>.
            </Text>
            <Button
              color="blue"
              fullWidth
              loading={isSaving}
              leftSection={<IconBookmark size={18} />}
              onClick={() => handleSaveAssessment('partial')}
            >
              Partial Save
            </Button>
          </Paper>

          <Button
            variant="default"
            fullWidth
            leftSection={<IconX size={18} />}
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel & Revert Changes
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}