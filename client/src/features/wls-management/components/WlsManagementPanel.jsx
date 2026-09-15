import React, { useState, useEffect } from 'react';
import { Card, TextInput, Button, Title, Stack, Group, Table, Badge, ActionIcon, Text, Tooltip } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { 
  IconSchool, 
  IconCalendarEvent, 
  IconFileTypePdf, 
  IconBook, 
  IconTrash, 
  IconPlayerPause, 
  IconRefresh,
  IconListCheck
} from '@tabler/icons-react';
import { WlsGroupAssigner } from './WlsGroupAssigner';

export function WlsManagementPanel() {
  const [topicName, setTopicName] = useState('');
  const [sessionDate, setSessionDate] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [quranVideoUrl, setQuranVideoUrl] = useState('');
  
  const [groupAssignments, setGroupAssignments] = useState({
    1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' }
  });

  const [users, setUsers] = useState([]);
  const [wlsAdmins, setWlsAdmins] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Fetch Users and Persisted WLS Sessions whenever component mounts
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

  // API Call: Retrieve saved sessions from MongoDB
  const fetchSessions = () => {
    fetch('/api/wls-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch((err) => console.error('Error fetching WLS sessions:', err));
  };

  const handleGroupAssignmentChange = (groupIdx, updatedGroupData) => {
    setGroupAssignments((prev) => ({ ...prev, [groupIdx]: updatedGroupData }));
  };

  // API Call: Save new session to backend database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicName || !sessionDate) return;

    const dateObj = sessionDate instanceof Date ? sessionDate : new Date(sessionDate);

    const newSessionPayload = {
      topicName,
      sessionDateTimeToronto: dateObj.toISOString(),
      pdfBookletUrl: pdfUrl,
      quranVideoUrl,
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

        // Reset Form Fields
        setTopicName('');
        setSessionDate(null);
        setPdfUrl('');
        setQuranVideoUrl('');
        setGroupAssignments({ 1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' } });
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.message || 'Validation error'}`);
      }
    } catch (err) {
      console.error('Failed to publish session:', err);
    }
  };

  // API Call: Delete session from backend database
  const handleDeleteSession = async (session, index) => {
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

            <Group grow align="flex-start">
              <TextInput
                label={
                  <Group gap={4} wrap="nowrap" style={{ display: 'inline-flex' }}>
                    <IconFileTypePdf size={15} color="var(--mantine-color-red-6)" />
                    <span>PDF Booklet URL</span>
                  </Group>
                }
                placeholder="https://..."
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
              />
              <TextInput
                label={
                  <Group gap={4} wrap="nowrap" style={{ display: 'inline-flex' }}>
                    <IconBook size={15} color="var(--mantine-color-teal-6)" />
                    <span>Quran Video / Stream URL</span>
                  </Group>
                }
                placeholder="https://youtube.com/..."
                value={quranVideoUrl}
                onChange={(e) => setQuranVideoUrl(e.target.value)}
              />
            </Group>

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
          <Table highlightOnHover verticalSpacing="sm">
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
                <Table.Tr key={s.id || s._id || idx}>
                  <Table.Td>
                    <Text fw={500}>{s.topicName}</Text>
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
                      <Tooltip label="Delete Session">
                        <ActionIcon variant="light" color="red" onClick={() => handleDeleteSession(s, idx)}>
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
    </Stack>
  );
}