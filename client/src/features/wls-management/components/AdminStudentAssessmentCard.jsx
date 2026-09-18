import React, { useState } from 'react';
import { 
  Paper, Group, Stack, Text, Badge, Slider, Textarea, Button, 
  Collapse, ActionIcon, Anchor, Modal, Alert, Box, Avatar, Title 
} from '@mantine/core';
import { 
  IconChevronDown, IconChevronUp, IconVideo, IconCheck, 
  IconX, IconAlertCircle, IconMaximize, IconUser, IconCalendar 
} from '@tabler/icons-react';
import { getSliderColor } from './utils';

const DEFAULT_CRITERIA = [
  { id: 'presentation', label: 'Presentation (Camera, Light, Sound & Video Quality)' },
  { id: 'attire', label: 'Attire / Dress Code' },
  { id: 'arabicReading', label: 'Arabic Reading / Recitation' },
  { id: 'onTimeDelivery', label: 'On Time Delivery' },
  { id: 'transferenceOfSpirit', label: 'Transference of Spirit' },
  { id: 'bodyLanguage', label: 'Body Language' }
];

export function AdminStudentAssessmentCard({ 
  student, 
  session,
  assignedAyats = [], 
  deadline, 
  sessionConfigCriteria = DEFAULT_CRITERIA,
  onSaveAssessment 
}) {
  const [opened, setOpened] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  
  const [ratings, setRatings] = useState(student?.assessment?.scores || {});
  const [comments, setComments] = useState(student?.assessment?.comments || '');
  const [saving, setSaving] = useState(false);

  const hasSubmitted = Array.isArray(student?.submissionUrls) && student.submissionUrls.length > 0;
  const isMissedWithReason = !hasSubmitted && Boolean(student?.missedReason);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  const handleSliderChange = (criterionId, val) => {
    setRatings((prev) => ({ ...prev, [criterionId]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    if (onSaveAssessment) {
      await onSaveAssessment({
        studentId: student?.id || student?._id,
        scores: ratings,
        comments,
      });
    }
    setSaving(false);
  };

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md" bg="blue.0">
        <Group justify="space-between" align="center">
          <div>
            <Group gap="xs" mb={4}>
              <Badge color="indigo" variant="light">Session Under Assessment</Badge>
              {session?.status && (
                <Badge color={session.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {session.status}
                </Badge>
              )}
            </Group>
            <Title order={3} c="indigo.9">
              {session?.topicName || session?.title || 'WLS Session Assessment'}
            </Title>
          </div>

          {(session?.sessionDateTimeToronto || deadline) && (
            <Group gap="xs">
              <IconCalendar size={16} color="#4c6ef5" />
              <Text size="xs" c="indigo.9" fw={600}>
                {new Date(session?.sessionDateTimeToronto || deadline).toLocaleDateString('en-US', {
                  dateStyle: 'medium',
                  timeZone: 'America/Toronto',
                })}
              </Text>
            </Group>
          )}
        </Group>
      </Paper>

      <Paper withBorder shadow="sm" radius="md" p="md">
        <Group justify="space-between" style={{ cursor: 'pointer' }} onClick={() => setOpened((o) => !o)}>
          <Group gap="md">
            <Avatar
              src={student?.avatarUrl || student?.snapUrl || student?.drive}
              alt={student?.fullName || student?.name}
              size="lg"
              radius="100%"
              color="indigo"
              style={{ border: '2px solid #4c6ef5' }}
            >
              {student?.fullName || student?.name ? (
                (student.fullName || student.name).charAt(0).toUpperCase()
              ) : (
                <IconUser size={20} />
              )}
            </Avatar>

            <div>
              <Text fw={700} size="md" c="gray.8">
                Assessment for: {student?.fullName || student?.name || 'Student Name'}
              </Text>
              <Text size="xs" c="dimmed">{student?.email}</Text>
            </div>
          </Group>

          <Group gap="xs">
            {hasSubmitted ? (
              <Badge color="green" leftSection={<IconCheck size={12} />}>
                File Received ({student.submissionUrls.length})
              </Badge>
            ) : isMissedWithReason ? (
              <Badge color="orange" leftSection={<IconAlertCircle size={12} />}>
                Missed (Reason Stated)
              </Badge>
            ) : (
              <Badge color="red" leftSection={<IconX size={12} />}>
                Not Submitted
              </Badge>
            )}

            <ActionIcon variant="subtle" color="gray">
              {opened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </ActionIcon>
          </Group>
        </Group>

        <Collapse in={opened} mt="md">
          <Stack gap="md">
            <Paper withBorder p="xs" bg="gray.0" radius="sm">
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">Assigned Verses</Text>
                  <Text size="xs" fw={600}>
                    {assignedAyats.length > 0 ? assignedAyats.join(', ') : 'None assigned'}
                  </Text>
                </Box>

                {deadline && (
                  <Box style={{ textAlign: 'right' }}>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Deadline</Text>
                    <Text size="xs" fw={600} c="red.8">
                      {new Date(deadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                  </Box>
                )}
              </Group>
            </Paper>

            {isMissedWithReason && (
              <Alert color="orange" icon={<IconAlertCircle size={16} />} title="Non-Submission Reason">
                <Text size="xs">{student.missedReason}</Text>
              </Alert>
            )}

            {hasSubmitted && (
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">Student Video Submissions</Text>
                {student.submissionUrls.map((url, idx) => (
                  <Paper key={idx} withBorder p="xs" radius="xs" bg="blue.0">
                    <Group justify="space-between" mb="xs">
                      <Anchor href={url} target="_blank" size="xs" fw={500} c="blue.8">
                        <Group gap={4}>
                          <IconVideo size={14} />
                          <span>Video Link #{idx + 1}</span>
                        </Group>
                      </Anchor>
                      <Button 
                        size="xs" 
                        variant="subtle" 
                        leftSection={<IconMaximize size={12} />}
                        onClick={() => {
                          setSelectedVideoUrl(url);
                          setVideoModalOpen(true);
                        }}
                      >
                        Maximize Player
                      </Button>
                    </Group>

                    <Box style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                      <iframe
                        src={getEmbedUrl(url)}
                        title={`Submission ${idx + 1}`}
                        allow="autoplay"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
                      />
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}

            <Stack gap="sm" mt="xs">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">Evaluation & Criteria Marking (1 - 10)</Text>
              
              {sessionConfigCriteria.map((criterion) => {
                const currentValue = ratings[criterion.id] || 1;
                const activeColor = getSliderColor ? getSliderColor(currentValue) : '#4c6ef5';

                return (
                  <Paper key={criterion.id} withBorder p="xs" radius="xs">
                    <Group justify="space-between" mb={6}>
                      <Text size="xs" fw={600}>{criterion.label}</Text>
                      <Badge style={{ backgroundColor: activeColor, color: '#fff' }}>
                        {currentValue} / 10
                      </Badge>
                    </Group>
                    <Slider
                      value={currentValue}
                      min={1}
                      max={10}
                      step={1}
                      onChange={(val) => handleSliderChange(criterion.id, val)}
                      styles={{
                        bar: { backgroundColor: activeColor },
                        thumb: { borderColor: activeColor }
                      }}
                    />
                  </Paper>
                );
              })}
            </Stack>

            <Textarea
              label="Admin Feedback & Comments"
              placeholder="Provide comments or guidance visible to the student..."
              value={comments}
              onChange={(e) => setComments(e.currentTarget.value)}
              rows={3}
              size="xs"
            />

            <Group justify="flex-end">
              <Button color="indigo" size="xs" loading={saving} onClick={handleSave}>
                Save Assessment & Feedback
              </Button>
            </Group>
          </Stack>
        </Collapse>

        <Modal 
          opened={videoModalOpen} 
          onClose={() => setVideoModalOpen(false)} 
          size="xl" 
          title="Student Submission Video"
        >
          <Box style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
            <iframe
              src={getEmbedUrl(selectedVideoUrl)}
              title="Maximized Video Player"
              allow="autoplay"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </Box>
        </Modal>
      </Paper>
    </Stack>
  );
}

export default AdminStudentAssessmentCard;