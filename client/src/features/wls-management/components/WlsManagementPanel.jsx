import React, { useState, useEffect } from 'react';
import { 
  Card, TextInput, Button, Title, Stack, Group, Table, Badge, 
  ActionIcon, Text, Tooltip, Modal, Divider, Paper, List 
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { 
  IconSchool, IconCalendarEvent, IconFileTypePdf, IconBook, 
  IconTrash, IconPlayerPause, IconRefresh, IconListCheck, IconEye,
  IconPlus, IconMinus
} from '@tabler/icons-react';
import { WlsGroupAssigner } from './WlsGroupAssigner';

export function WlsManagementPanel() {
  const [topicName, setTopicName] = useState('');
  const [sessionDate, setSessionDate] = useState(null);
  
  // Dynamic Arrays for URLs
  const [pdfUrls, setPdfUrls] = useState(['']);
  const [quranVideoUrls, setQuranVideoUrls] = useState(['']);
  
  const [groupAssignments, setGroupAssignments] = useState({
    1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' }
  });

  const [users, setUsers] = useState([]);
  const [wlsAdmins, setWlsAdmins] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          setWlsAdmins(data.filter((u) => u.role === 'WLS_ADMIN' || u.role === 'SUPER_ADMIN'));
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

  // Helper functions to manage PDF URL dynamic list
  const handlePdfChange = (index, value) => {
    const updated = [...pdfUrls];
    updated[index] = value;
    setPdfUrls(updated);
  };
  const addPdfField = () => setPdfUrls((prev) => [...prev, '']);
  const removePdfField = (index) => setPdfUrls((prev) => prev.filter((_, i) => i !== index));

  // Helper functions to manage Video URL dynamic list
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

    // Filter out empty URL strings before saving
    const cleanPdfUrls = pdfUrls.map((url) => url.trim()).filter(Boolean);
    const cleanVideoUrls = quranVideoUrls.map((url) => url.trim()).filter(Boolean);

    const newSessionPayload = {
      topicName,
      sessionDateTimeToronto: dateObj.toISOString(),
      pdfBookletUrls: cleanPdfUrls,
      quranVideoUrls: cleanVideoUrls,
      groupAssignments,
      status: 'ACTIVE'
    };

    try {
      const res = await fetch('/api/wls-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionPayload)
      });

      if (res.ok) {
        const savedSession = await res.json();
        setSessions((prev) => [savedSession, ...prev]);

        // Reset form
        setTopicName('');
        setSessionDate(null);
        setPdfUrls(['']);
        setQuranVideoUrls(['']);
        setGroupAssignments({ 1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' } });
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.message || 'Validation error'}`);
      }
    } catch (err) {
      console.error('Failed to publish session:', err);
    }
  };

  const handleToggleStatus = async (e, session, index) => {
    e.stopPropagation();
    const sessionId = session.id || session._id;
    if (!sessionId) return;

    const nextStatus = session.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const res = await fetch(`/api/wls-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setSessions((prev) => prev.map((s, idx) => (idx === index ? updated : s)));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleCancelSession = async (e, session, index) => {
    e.stopPropagation();
    const sessionId = session.id || session._id;
    if (!sessionId) return;

    const reason = window.prompt('Enter reason for postponing/cancelling this session:');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/wls-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', cancelReason: reason })
      });

      if (res.ok) {
        const updated = await res.json();
        setSessions((prev) => prev.map((s, idx) => (idx === index ? updated : s)));
      }
    } catch (err) {
      console.error('Failed to postpone session:', err);
    }
  };

  const handleDeleteSession = async (e, session, index) => {
    e.stopPropagation();
    const sessionId = session.id || session._id;
    if (!sessionId) return;

    if (window.confirm(`Delete "${session.topicName}"?`)) {
      try {
        const res = await fetch(`/api/wls-sessions/${sessionId}`, { method: 'DELETE' });
        if (res.ok) {
          setSessions((prev) => prev.filter((_, idx) => idx !== index));
        }
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const getUserName = (userId) => {
    const found = users.find((u) => (u.id || u._id) === userId);
    return found ? `${found.name} (${found.email || 'User'})` : userId;
  };

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg" radius="md" shadow="sm">
        <Group gap="xs" mb="md">
          <IconSchool size={24} color="var(--mantine-color-teal-6)" />
          <Title order={3}>WLS Session Builder & Management</Title>
        </Group>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Group grow align="flex-start">
              <TextInput
                label="Topic Name"
                placeholder="e.g., Tafseer & Recitation Module - Week 1"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                required
              />
              <DateTimePicker
                label={
                  <Group gap={4} wrap="nowrap" style={{ display: 'inline-flex' }}>
                    <IconCalendarEvent size={15} color="var(--mantine-color-blue-6)" />
                    <span>Session Date & Time (Toronto ET)</span>
                  </Group>
                }
                placeholder="Pick date and time"
                value={sessionDate}
                onChange={setSessionDate}
                required
              />
            </Group>

            {/* Dynamic PDF Booklet URLs */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconFileTypePdf size={15} color="var(--mantine-color-red-6)" />
                  <span>PDF Booklet URLs</span>
                </Text>
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

            {/* Dynamic Quran Stream URLs */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconBook size={15} color="var(--mantine-color-teal-6)" />
                  <span>Quran Video / Stream URLs</span>
                </Text>
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

            <Button type="submit" size="md" color="teal" fullWidth>
              Publish & Create Active Session
            </Button>
          </Stack>
        </form>
      </Card>

      <Card withBorder padding="lg" radius="md" shadow="sm">
        <Group gap="xs" mb="md">
          <IconListCheck size={20} color="var(--mantine-color-blue-6)" />
          <Title order={4}>Managed Sessions</Title>
        </Group>

        {sessions.length === 0 ? (
          <Text c="dimmed" size="sm">No historical or active sessions logged yet.</Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm" style={{ cursor: 'pointer' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Date & Time (Toronto)</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th justify="flex-end">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((s, idx) => (
                <Table.Tr key={s.id || s._id || idx} onClick={() => setSelectedSession(s)}>
                  <Table.Td>
                    <Text fw={600} c="blue">{s.topicName}</Text>
                    {s.cancelReason && (
                      <Text size="xs" c="red">Reason: {s.cancelReason}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {s.sessionDateTimeToronto ? new Date(s.sessionDateTimeToronto).toLocaleString() : 'N/A'}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={s.status === 'ACTIVE' ? 'green' : s.status === 'CANCELLED' ? 'red' : 'gray'}>
                      {s.status || 'ACTIVE'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="View Full Details">
                        <ActionIcon variant="light" color="indigo" onClick={(e) => { e.stopPropagation(); setSelectedSession(s); }}>
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Toggle Active/Inactive">
                        <ActionIcon variant="light" color="blue" onClick={(e) => handleToggleStatus(e, s, idx)}>
                          <IconRefresh size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {s.status !== 'CANCELLED' && (
                        <Tooltip label="Postpone / Cancel">
                          <ActionIcon variant="light" color="orange" onClick={(e) => handleCancelSession(e, s, idx)}>
                            <IconPlayerPause size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Delete Session">
                        <ActionIcon variant="light" color="red" onClick={(e) => handleDeleteSession(e, s, idx)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Session Detail Modal */}
      <Modal 
        opened={!!selectedSession} 
        onClose={() => setSelectedSession(null)} 
        title={<Title order={3}>{selectedSession?.topicName}</Title>} 
        size="lg"
        radius="md"
      >
        {selectedSession && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm"><strong>Date & Time (Toronto):</strong> {new Date(selectedSession.sessionDateTimeToronto).toLocaleString()}</Text>
              <Badge color={selectedSession.status === 'ACTIVE' ? 'green' : selectedSession.status === 'CANCELLED' ? 'red' : 'gray'}>
                {selectedSession.status}
              </Badge>
            </Group>

            {/* Render Multiple PDFs */}
            {(selectedSession.pdfBookletUrls?.length > 0 || selectedSession.pdfBookletUrl) && (
              <div>
                <Text size="sm" fw={700}>📄 PDF Booklets:</Text>
                <List size="sm" spacing={4}>
                  {(selectedSession.pdfBookletUrls || [selectedSession.pdfBookletUrl]).filter(Boolean).map((url, i) => (
                    <List.Item key={i}>
                      <a href={url} target="_blank" rel="noreferrer">{url}</a>
                    </List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* Render Multiple Quran Streams */}
            {(selectedSession.quranVideoUrls?.length > 0 || selectedSession.quranVideoUrl) && (
              <div>
                <Text size="sm" fw={700}>📖 Quran Streams:</Text>
                <List size="sm" spacing={4}>
                  {(selectedSession.quranVideoUrls || [selectedSession.quranVideoUrl]).filter(Boolean).map((url, i) => (
                    <List.Item key={i}>
                      <a href={url} target="_blank" rel="noreferrer">{url}</a>
                    </List.Item>
                  ))}
                </List>
              </div>
            )}

            <Divider my="xs" label="Group Configurations" labelPosition="center" />

            {Object.entries(selectedSession.groupAssignments || {}).map(([gNum, gData]) => (
              <Paper key={gNum} withBorder p="md" radius="sm" bg="var(--mantine-color-gray-0)">
                <Group justify="space-between" mb="xs">
                  <Text fw={700} c="indigo">Group {gNum}</Text>
                  <Group gap="xs">
                    <Badge variant="light" color="blue">{gData.userIds?.length || 0} Students</Badge>
                    <Badge variant="light" color="grape">{gData.adminIds?.length || 0} Admins</Badge>
                  </Group>
                </Group>

                <Stack gap="xs">
                  <div>
                    <Text size="xs" fw={700}>Assigned Admins:</Text>
                    {gData.adminIds?.length > 0 ? (
                      <List size="xs" spacing={2}>{gData.adminIds.map((id) => <List.Item key={id}>{getUserName(id)}</List.Item>)}</List>
                    ) : <Text size="xs" c="dimmed">None</Text>}
                  </div>

                  <div>
                    <Text size="xs" fw={700}>Assigned Students:</Text>
                    {gData.userIds?.length > 0 ? (
                      <List size="xs" spacing={2}>{gData.userIds.map((id) => <List.Item key={id}>{getUserName(id)}</List.Item>)}</List>
                    ) : <Text size="xs" c="dimmed">None</Text>}
                  </div>

                  {gData.selectedAyats?.length > 0 && (
                    <div>
                      <Text size="xs" fw={700}>Selected Ayats:</Text>
                      <Group gap={4}>{gData.selectedAyats.map((ayat, i) => <Badge key={i} size="xs" color="teal">{ayat}</Badge>)}</Group>
                    </div>
                  )}

                  {gData.instructions && (
                    <div>
                      <Text size="xs" fw={700}>Instructions:</Text>
                      <Text size="xs" style={{ whiteSpace: 'pre-line' }}>{gData.instructions}</Text>
                    </div>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}