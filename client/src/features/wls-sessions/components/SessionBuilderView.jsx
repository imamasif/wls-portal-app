import React, { useState, useEffect } from 'react';
import {
  Card,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Text,
  NumberInput,
  Grid,
  Box,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Modal,
  Anchor,
  Divider,
  List
} from '@mantine/core';
import {
  IconBook,
  IconCalendar,
  IconVideo,
  IconFileText,
  IconUsers,
  IconDeviceFloppy,
  IconX,
  IconEdit,
  IconPower,
  IconTrash,
  IconEye
} from '@tabler/icons-react';
import { API_BASE } from '../../../config/constants';

export function SessionBuilderView({ initialData = null, onCreated, onCancel }) {
  // Form State
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [videoDeadline, setVideoDeadline] = useState('');
  const [totalGroups, setTotalGroups] = useState(1);
  const [videoClipUrl, setVideoClipUrl] = useState('');
  const [pdfResourceUrl, setPdfResourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Management & Modal State
  const [activeEditSession, setActiveEditSession] = useState(initialData);
  const [previewSession, setPreviewSession] = useState(null);
  const [managedSessions, setManagedSessions] = useState([]);
  const [banner, setBanner] = useState(null);

  // Fetch managed sessions list
  const fetchManagedSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/wls-sessions`);
      if (res.ok) {
        const data = await res.json();
        setManagedSessions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load managed sessions:', err);
    }
  };

  useEffect(() => {
    fetchManagedSessions();
  }, []);

  // Pre-fill form fields when activeEditSession changes
  useEffect(() => {
    if (activeEditSession) {
      setTopicName(activeEditSession.topicName || activeEditSession.topic || activeEditSession.title || '');
      setDescription(activeEditSession.description || '');

      if (activeEditSession.sessionDateTimeToronto || activeEditSession.dateTime) {
        const dt = new Date(activeEditSession.sessionDateTimeToronto || activeEditSession.dateTime);
        setDateTime(dt.toISOString().slice(0, 16));
      } else {
        setDateTime('');
      }

      if (activeEditSession.videoDeadline) {
        const vd = new Date(activeEditSession.videoDeadline);
        setVideoDeadline(vd.toISOString().slice(0, 16));
      } else {
        setVideoDeadline('');
      }

      setTotalGroups(
        activeEditSession.totalGroups ||
        (activeEditSession.groupAssignments ? Object.keys(activeEditSession.groupAssignments).length : 1)
      );

      const videoUrl = Array.isArray(activeEditSession.quranVideoUrls)
        ? activeEditSession.quranVideoUrls[0]
        : activeEditSession.videoClipUrl || '';
      setVideoClipUrl(videoUrl);

      const pdfUrl = Array.isArray(activeEditSession.pdfBookletUrls)
        ? activeEditSession.pdfBookletUrls[0]
        : activeEditSession.pdfResourceUrl || '';
      setPdfResourceUrl(pdfUrl);
    } else {
      resetForm();
    }
  }, [activeEditSession]);

  const resetForm = () => {
    setActiveEditSession(null);
    setTopicName('');
    setDescription('');
    setDateTime('');
    setVideoDeadline('');
    setTotalGroups(1);
    setVideoClipUrl('');
    setPdfResourceUrl('');
  };

  const handleEditSelect = (session) => {
    setPreviewSession(null);
    setActiveEditSession(session);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (session) => {
    const sId = session.id || session._id;
    const newStatus = session.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const res = await fetch(`${API_BASE}/wls-sessions/${sId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchManagedSessions();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteSession = async (session) => {
    const sId = session.id || session._id;
    if (!window.confirm(`Are you sure you want to delete "${session.topicName || session.topic}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/wls-sessions/${sId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeEditSession && (activeEditSession.id === sId || activeEditSession._id === sId)) {
          resetForm();
        }
        fetchManagedSessions();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicName.trim() || !dateTime.trim()) return;

    setIsSubmitting(true);
    const isEditMode = Boolean(activeEditSession?.id || activeEditSession?._id);

    const targetUrl = isEditMode
      ? `${API_BASE}/wls-sessions/${activeEditSession.id || activeEditSession._id}`
      : `${API_BASE}/wls-sessions`;

    const payload = {
      topicName,
      sessionDateTimeToronto: new Date(dateTime).toISOString(),
      videoDeadline: videoDeadline ? new Date(videoDeadline).toISOString() : null,
      description,
      pdfBookletUrls: pdfResourceUrl ? [pdfResourceUrl] : [],
      quranVideoUrls: videoClipUrl ? [videoClipUrl] : [],
      totalGroups
    };

    try {
      const res = await fetch(targetUrl, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setBanner(isEditMode ? 'Session updated successfully!' : 'Session published successfully!');
        setTimeout(() => setBanner(null), 3000);
        resetForm();
        fetchManagedSessions();
        if (onCreated) onCreated();
      }
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="xl">
      {/* Session Builder Form Card */}
      <Card shadow="xs" padding="xl" radius="md" withBorder>
        <Box mb="lg">
          <Group justify="space-between">
            <Box>
              <Text weight={800} size="xl" color="dark">
                {activeEditSession ? 'Edit WLS Session' : 'WLS Session Builder'}
              </Text>
              <Text size="xs" color="dimmed">
                Configure session topics, assigned ayats/passages, media links, and break-out groups.
              </Text>
            </Box>
            {activeEditSession && (
              <Badge color="teal" size="lg" variant="filled">
                Editing Session
              </Badge>
            )}
          </Group>
        </Box>

        {banner && (
          <Alert color="green" mb="md" radius="md">
            {banner}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Topic Name *"
              placeholder="e.g. Tafseer & Recitation Module - Week 1"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              leftSection={<IconBook size={18} />}
              required
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Session Date & Time (Toronto ET) *"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  leftSection={<IconCalendar size={18} />}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Video Submission Deadline"
                  type="datetime-local"
                  value={videoDeadline}
                  onChange={(e) => setVideoDeadline(e.target.value)}
                  leftSection={<IconCalendar size={18} />}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Session Description & Zoom Meeting Details"
              placeholder="Assalam-u-Alaikum... Paste full Zoom invite here or instructions"
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="PDF Booklet URL"
                  placeholder="https://..."
                  type="url"
                  value={pdfResourceUrl}
                  onChange={(e) => setPdfResourceUrl(e.target.value)}
                  leftSection={<IconFileText size={18} />}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Quran Video / Stream URL"
                  placeholder="https://..."
                  type="url"
                  value={videoClipUrl}
                  onChange={(e) => setVideoClipUrl(e.target.value)}
                  leftSection={<IconVideo size={18} />}
                />
              </Grid.Col>
            </Grid>

            <NumberInput
              label="Total Groups to Create"
              min={1}
              max={20}
              value={totalGroups}
              onChange={(val) => setTotalGroups(val || 1)}
              leftSection={<IconUsers size={18} />}
            />

            <Group justify="flex-end" mt="md">
              {(activeEditSession || onCancel) && (
                <Button
                  variant="default"
                  leftSection={<IconX size={16} />}
                  onClick={() => {
                    resetForm();
                    if (onCancel) onCancel();
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                loading={isSubmitting}
                leftSection={<IconDeviceFloppy size={18} />}
                style={{ backgroundColor: '#0ca678' }}
              >
                {activeEditSession ? 'Update Active Session' : 'Publish & Create Active Session'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {/* Managed Sessions Table Card */}
      <Card shadow="xs" padding="lg" radius="md" withBorder>
        <Text weight={800} size="lg" mb="md" color="dark">
          Managed Sessions
        </Text>

        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Date & Time (Toronto)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {managedSessions.map((session) => {
              const sId = session.id || session._id;
              const isActive = session.status === 'ACTIVE';
              const topicTitle = session.topicName || session.topic || session.title;

              return (
                <tr key={sId}>
                  <td>
                    <Text
                      weight={600}
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPreviewSession(session)}
                    >
                      {topicTitle}
                    </Text>
                  </td>
                  <td>
                    {session.sessionDateTimeToronto
                      ? new Date(session.sessionDateTimeToronto).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td>
                    <Badge color={isActive ? 'green' : 'gray'} variant="filled">
                      {session.status || 'ACTIVE'}
                    </Badge>
                  </td>
                  <td>
                    <Group gap="xs">
                      {/* Preview Trigger */}
                      <Tooltip label="Preview Details">
                        <ActionIcon
                          size="sm"
                          color="blue"
                          variant="light"
                          onClick={() => setPreviewSession(session)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>

                      {/* Edit Session Trigger */}
                      <Tooltip label="Edit in Form Above">
                        <ActionIcon
                          size="sm"
                          color="teal"
                          variant="light"
                          onClick={() => handleEditSelect(session)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>

                      {/* Toggle Status */}
                      <Tooltip label={isActive ? 'Deactivate' : 'Activate'}>
                        <ActionIcon
                          size="sm"
                          color="orange"
                          variant="light"
                          onClick={() => handleToggleStatus(session)}
                        >
                          <IconPower size={16} />
                        </ActionIcon>
                      </Tooltip>

                      {/* Delete Session */}
                      <Tooltip label="Delete Session">
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="light"
                          onClick={() => handleDeleteSession(session)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* Preview Dialog Modal */}
<Modal
  opened={Boolean(previewSession)}
  onClose={() => setPreviewSession(null)}
  title={`WLS - Topic: ${previewSession?.topicName || previewSession?.topic || ''}`}
  size="lg"
  radius="md"
>
  {previewSession && (
    <Stack gap="md" pt="xs">
      <Group justify="space-between">
        <Text size="sm" component="div">
          <strong>Date & Time (Toronto):</strong>{' '}
          {previewSession.sessionDateTimeToronto
            ? new Date(previewSession.sessionDateTimeToronto).toLocaleString()
            : 'N/A'}
        </Text>
        <Badge color={previewSession?.status === 'ACTIVE' ? 'green' : 'gray'} variant="filled">
          {previewSession?.status || 'ACTIVE'}
        </Badge>
      </Group>

      {previewSession.videoDeadline && (
        <Text size="sm" component="div">
          <strong>Video Deadline:</strong>{' '}
          <Text component="span" color="red" weight={600}>
            {new Date(previewSession.videoDeadline).toLocaleString()}
          </Text>
        </Text>
      )}

      {previewSession.description && (
        <Box>
          <Text size="sm" weight={600} mb={4}>
            Zoom Meeting Details / Description:
          </Text>
          <Card withBorder padding="xs" radius="sm" bg="gray.0">
            <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
              {previewSession.description}
            </Text>
          </Card>
        </Box>
      )}

      {Array.isArray(previewSession.pdfBookletUrls) && previewSession.pdfBookletUrls.length > 0 && (
        <Box>
          <Text size="sm" weight={600}>PDF Booklets:</Text>
          <List size="xs">
            {previewSession.pdfBookletUrls.map((url, idx) => (
              <List.Item key={idx}>
                <Anchor href={url} target="_blank" size="xs">
                  {url}
                </Anchor>
              </List.Item>
            ))}
          </List>
        </Box>
      )}

      {Array.isArray(previewSession.quranVideoUrls) && previewSession.quranVideoUrls.length > 0 && (
        <Box>
          <Text size="sm" weight={600}>Quran Streams:</Text>
          <List size="xs">
            {previewSession.quranVideoUrls.map((url, idx) => (
              <List.Item key={idx}>
                <Anchor href={url} target="_blank" size="xs">
                  {url}
                </Anchor>
              </List.Item>
            ))}
          </List>
        </Box>
      )}

      <Divider my="xs" />

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={() => setPreviewSession(null)}>
          Close
        </Button>
        <Button
          color="teal"
          leftSection={<IconEdit size={16} />}
          onClick={() => handleEditSelect(previewSession)}
        >
          Edit Session Details
        </Button>
      </Group>
    </Stack>
  )}
</Modal>
    </Stack>
  );
}