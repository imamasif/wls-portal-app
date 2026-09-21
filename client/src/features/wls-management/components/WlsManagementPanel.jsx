import React, { useState, useEffect } from 'react';
import { 
  Card, TextInput, Button, Title, Stack, Group, Table, Badge, 
  ActionIcon, Text, Tooltip, Modal, Divider, Paper, List, Textarea, Grid, Select 
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { modals } from '@mantine/modals';
import { 
  IconSchool, IconCalendarEvent, IconFileTypePdf, IconBook, 
  IconTrash, IconPlayerPause, IconRefresh, IconListCheck, IconEye,
  IconPlus, IconMinus, IconBookmark, IconEdit, IconX, IconVideo, IconCheck,
  IconSparkles, IconActivity, IconClockPause, IconCircleCheckFilled
} from '@tabler/icons-react';
import { WlsGroupAssigner } from './WlsGroupAssigner';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
export function WlsManagementPanel() {
  const [editingSessionId, setEditingSessionId] = useState(null);

  const [topicName, setTopicName] = useState('');
  const [sessionDate, setSessionDate] = useState(null);
  const [videoDeadline, setVideoDeadline] = useState(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('NEW');
  
  const [pdfUrls, setPdfUrls] = useState(['']);
  const [quranVideoUrls, setQuranVideoUrls] = useState(['']);
  
  const [groupAssignments, setGroupAssignments] = useState({
    1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' }
  });

  const [users, setUsers] = useState([]);
  const [wlsAdmins, setWlsAdmins] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Delete Modal State
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          setWlsAdmins(data.filter((u) => u.role === 'WLS_ADMIN' || u.role === 'SUPER_USER'));
        }
      })
      .catch((err) => console.error('Error fetching users:', err));

    fetchSessions();
  }, []);

  const fetchSessions = () => {
    fetch('/api/wls-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch((err) => console.error('Error fetching WLS sessions:', err));
  };

  const resetForm = () => {
    setEditingSessionId(null);
    setTopicName('');
    setSessionDate(null);
    setVideoDeadline(null);
    setDescription('');
    setStatus('NEW');
    setPdfUrls(['']);
    setQuranVideoUrls(['']);
    setGroupAssignments({ 1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' } });
  };

  const handleEditSelect = (session) => {
    const sId = session.id || session._id;
    setEditingSessionId(sId);
    setTopicName(session.topicName || '');
    setSessionDate(session.sessionDateTimeToronto ? new Date(session.sessionDateTimeToronto) : null);
    setVideoDeadline(session.videoDeadline ? new Date(session.videoDeadline) : null);
    setDescription(session.description || '');
    setStatus(session.status || 'NEW');

    const pdfs = Array.isArray(session.pdfBookletUrls) && session.pdfBookletUrls.length > 0
      ? session.pdfBookletUrls 
      : (session.pdfBookletUrl ? [session.pdfBookletUrl] : ['']);
    setPdfUrls(pdfs);

    const videos = Array.isArray(session.quranVideoUrls) && session.quranVideoUrls.length > 0
      ? session.quranVideoUrls 
      : (session.quranVideoUrl ? [session.quranVideoUrl] : ['']);
    setQuranVideoUrls(videos);

    const loadedGroups = session.groupAssignments && Object.keys(session.groupAssignments).length > 0
      ? session.groupAssignments
      : { 1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' } };

    setGroupAssignments(loadedGroups);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePdfChange = (index, value) => {
    const updated = [...pdfUrls];
    updated[index] = value;
    setPdfUrls(updated);
  };
  const addPdfField = () => setPdfUrls((prev) => [...prev, '']);
  const removePdfField = (index) => setPdfUrls((prev) => prev.filter((_, i) => i !== index));

  const handleVideoChange = (index, value) => {
    const updated = [...quranVideoUrls];
    updated[index] = value;
    setQuranVideoUrls(updated);
  };
  const addVideoField = () => setQuranVideoUrls((prev) => [...prev, '']);
  const removeVideoField = (index) => setQuranVideoUrls((prev) => prev.filter((_, i) => i !== index));

  const handleGroupAssignmentChange = (groupIdx, updatedGroupData) => {
    setGroupAssignments((prev) => ({ ...prev, [groupIdx]: updatedGroupData }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicName || !sessionDate) return;

    const dateObj = sessionDate instanceof Date ? sessionDate : new Date(sessionDate);
    const deadlineObj = videoDeadline instanceof Date ? videoDeadline : (videoDeadline ? new Date(videoDeadline) : null);

    const cleanPdfUrls = pdfUrls.map((url) => url.trim()).filter(Boolean);
    const cleanVideoUrls = quranVideoUrls.map((url) => url.trim()).filter(Boolean);

    const sessionPayload = {
      topicName,
      sessionDateTimeToronto: dateObj.toISOString(),
      videoDeadline: deadlineObj ? deadlineObj.toISOString() : null,
      description,
      pdfBookletUrls: cleanPdfUrls,
      quranVideoUrls: cleanVideoUrls,
      groupAssignments,
      status
    };

    try {
      const isEditing = Boolean(editingSessionId);
      const endpoint = isEditing ? `/api/wls-sessions/${editingSessionId}` : '/api/wls-sessions';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload)
      });

      if (res.ok) {
        const savedSession = await res.json();
        if (isEditing) {
          setSessions((prev) => prev.map((s) => ((s.id || s._id) === editingSessionId ? savedSession : s)));
        } else {
          setSessions((prev) => [savedSession, ...prev]);
        }
        resetForm();
        setSelectedSession(null);
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.message || 'Validation error'}`);
      }
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const handleUpdateSingleStatus = async (sessionId, newStatus, customReason = '') => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/wls-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancelReason: customReason })
      });

      if (res.ok) {
        const updated = await res.json();
        setSessions((prev) => prev.map((s) => ((s.id || s._id) === sessionId ? updated : s)));
      }
    } catch (err) {
      console.error('Failed to update session status:', err);
    }
  };

  // Mantine Modal for Postponing Session
  const handlePostpone = (e, session) => {
    e.stopPropagation();
    const sessionId = session.id || session._id;
    let cancelReasonInput = '';

    modals.openConfirmModal({
      title: <Text fw={700} size="md">Postpone Session</Text>,
      centered: true,
      radius: 'md',
      children: (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Please enter a reason for postponing <strong>{session.topicName}</strong>:
          </Text>
          <TextInput
            placeholder="Enter reason..."
            data-autofocus
            onChange={(event) => { cancelReasonInput = event.currentTarget.value; }}
          />
        </Stack>
      ),
      labels: { confirm: 'Confirm Postpone', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: () => handleUpdateSingleStatus(sessionId, 'POSTPONED', cancelReasonInput)
    });
  };

  // Trigger Custom Delete Modal
  const openDeleteModal = (e, session) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    const sessionId = sessionToDelete.id || sessionToDelete._id;
    setDeleting(true);

    try {
      const res = await fetch(`/api/wls-sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => (s.id || s._id) !== sessionId));
        if (selectedSession && (selectedSession.id || selectedSession._id) === sessionId) {
          setSelectedSession(null);
        }
        setDeleteModalOpened(false);
        setSessionToDelete(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusBadge = (st) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge color="green" leftSection={<IconActivity size={12} />}>ACTIVE</Badge>;
      case 'NEW':
        return <Badge color="blue" leftSection={<IconSparkles size={12} />}>NEW</Badge>;
      case 'POSTPONED':
        return <Badge color="orange" leftSection={<IconClockPause size={12} />}>POSTPONED</Badge>;
      case 'COMPLETED':
        return <Badge color="grape" leftSection={<IconCircleCheckFilled size={12} />}>COMPLETED</Badge>;
      default:
        return <Badge color="gray">{st || 'NEW'}</Badge>;
    }
  };

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg" radius="md" shadow="sm">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconSchool size={24} color="var(--mantine-color-teal-6)" />
            <Title order={3}>
              {editingSessionId ? 'Edit WLS Session' : 'WLS Session Builder & Management'}
            </Title>
          </Group>
          {editingSessionId && (
            <Button variant="light" color="gray" size="xs" leftSection={<IconX size={14} />} onClick={resetForm}>
              Cancel Editing
            </Button>
          )}
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label="Topic Name"
                  placeholder="e.g., Tafseer & Recitation Module - Week 1"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Session Status"
                  value={status}
                  onChange={(val) => setStatus(val || 'NEW')}
                  data={[
                    { value: 'NEW', label: 'NEW' },
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'POSTPONED', label: 'POSTPONED' },
                    { value: 'COMPLETED', label: 'COMPLETED' }
                  ]}
                  renderOption={({ option }) => {
                    const icons = {
                      NEW: <IconSparkles size={16} color="var(--mantine-color-blue-6)" style={{ marginRight: 8 }} />,
                      ACTIVE: <IconActivity size={16} color="var(--mantine-color-green-6)" style={{ marginRight: 8 }} />,
                      POSTPONED: <IconClockPause size={16} color="var(--mantine-color-orange-6)" style={{ marginRight: 8 }} />,
                      COMPLETED: <IconCircleCheckFilled size={16} color="var(--mantine-color-grape-6)" style={{ marginRight: 8 }} />
                    };
                    return (
                      <Group gap="xs">
                        {icons[option.value]}
                        <Text size="sm">{option.label}</Text>
                      </Group>
                    );
                  }}
                  required
                />
              </Grid.Col>
            </Grid>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateTimePicker
                  label="Session Date & Time (Toronto ET)"
                  placeholder="Pick date and time"
                  value={sessionDate}
                  onChange={setSessionDate}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateTimePicker
                  label="Video Submission Deadline"
                  placeholder="Select last date/time to submit video"
                  value={videoDeadline}
                  onChange={setVideoDeadline}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Session Description & Zoom Meeting Details"
              placeholder="Paste full Zoom invite here..."
              minRows={3}
              autosize
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* PDF Booklets */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>PDF Booklet URLs</Text>
                <Button size="xs" variant="light" color="red" leftSection={<IconPlus size={14} />} onClick={addPdfField}>
                  Add PDF
                </Button>
              </Group>
              {pdfUrls.map((url, idx) => (
                <Group key={idx} gap="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder={`PDF Booklet URL #${idx + 1}`}
                    value={url}
                    onChange={(e) => handlePdfChange(idx, e.target.value)}
                  />
                  {pdfUrls.length > 1 && (
                    <ActionIcon variant="light" color="red" size="lg" onClick={() => removePdfField(idx)}>
                      <IconMinus size={16} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>

            {/* Quran Stream URLs */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Quran Video / Stream URLs</Text>
                <Button size="xs" variant="light" color="teal" leftSection={<IconPlus size={14} />} onClick={addVideoField}>
                  Add Video
                </Button>
              </Group>
              {quranVideoUrls.map((url, idx) => (
                <Group key={idx} gap="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder={`Quran Stream URL #${idx + 1}`}
                    value={url}
                    onChange={(e) => handleVideoChange(idx, e.target.value)}
                  />
                  {quranVideoUrls.length > 1 && (
                    <ActionIcon variant="light" color="red" size="lg" onClick={() => removeVideoField(idx)}>
                      <IconMinus size={16} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>

            <WlsGroupAssigner
              users={users}
              wlsAdmins={wlsAdmins}
              groupAssignments={groupAssignments}
              onAssignmentsChange={handleGroupAssignmentChange}
            />

            <Button type="submit" size="md" color={editingSessionId ? 'blue' : 'teal'} fullWidth>
              {editingSessionId ? 'Update Session Details' : 'Publish Session'}
            </Button>
          </Stack>
        </form>
      </Card>

      {/* Managed Sessions Table */}
      <Card withBorder padding="lg" radius="md" shadow="sm">
        <Group gap="xs" mb="md">
          <IconListCheck size={20} color="var(--mantine-color-blue-6)" />
          <Title order={4}>Managed Sessions</Title>
        </Group>

        {sessions.length === 0 ? (
          <Text c="dimmed" size="sm">No sessions logged yet.</Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm" style={{ cursor: 'pointer' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Date & Time (Toronto)</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Actions / Lifecycle Toggles</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((s) => {
                const sId = s.id || s._id;
                const currentStatus = s.status || 'NEW';

                return (
                  <Table.Tr key={sId} onClick={() => setSelectedSession(s)}>
                    <Table.Td style={{ width: '35%' }}>
                      <Text fw={600} c="blue">{s.topicName}</Text>
                      {s.cancelReason && (
                        <Text size="xs" c="orange">Note: {s.cancelReason}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {s.sessionDateTimeToronto ? new Date(s.sessionDateTimeToronto).toLocaleString() : 'N/A'}
                    </Table.Td>
                    <Table.Td>
                      {renderStatusBadge(currentStatus)}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end" onClick={(e) => e.stopPropagation()}>
                        {currentStatus !== 'ACTIVE' && (
                          <Tooltip label="Make Active">
                            <ActionIcon variant="light" color="green" onClick={() => handleUpdateSingleStatus(sId, 'ACTIVE')}>
                              <IconRefresh size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {currentStatus === 'ACTIVE' && (
                          <Tooltip label="Postpone Session">
                            <ActionIcon variant="light" color="orange" onClick={(e) => handlePostpone(e, s)}>
                              <IconPlayerPause size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {currentStatus !== 'COMPLETED' && (
                          <Tooltip label="Mark Completed">
                            <ActionIcon variant="light" color="grape" onClick={() => handleUpdateSingleStatus(sId, 'COMPLETED')}>
                              <IconCheck size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        <Tooltip label="Edit Session">
                          <ActionIcon variant="light" color="teal" onClick={() => handleEditSelect(s)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="View Full Details">
                          <ActionIcon variant="light" color="indigo" onClick={() => setSelectedSession(s)}>
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Session">
                          <ActionIcon variant="light" color="red" onClick={(e) => openDeleteModal(e, s)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal 
        opened={!!selectedSession} 
        onClose={() => setSelectedSession(null)} 
        title={<Text fw={700} size="lg">{selectedSession?.topicName}</Text>} 
        size="lg"
        radius="md"
      >
        {selectedSession && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm">
                <strong>Date & Time:</strong> {selectedSession.sessionDateTimeToronto ? new Date(selectedSession.sessionDateTimeToronto).toLocaleString() : 'N/A'}
              </Text>
              {renderStatusBadge(selectedSession.status)}
            </Group>

            {selectedSession.description && (
              <div>
                <Text size="sm" fw={700} mb={4}>Description / Zoom Details:</Text>
                <Paper withBorder p="xs" bg="gray.0" radius="sm">
                  <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>{selectedSession.description}</Text>
                </Paper>
              </div>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setSelectedSession(null)}>Close</Button>
              <Button color="teal" leftSection={<IconEdit size={16} />} onClick={() => { handleEditSelect(selectedSession); setSelectedSession(null); }}>
                Load into Form & Edit
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Proper Confirm Delete Modal */}
      <ConfirmDeleteModal
        opened={deleteModalOpened}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpened(false);
            setSessionToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Delete WLS Session"
        message={`Are you sure you want to delete "${sessionToDelete?.topicName}"? This action cannot be undone.`}
        loading={deleting}
      />
    </Stack>
  );
}