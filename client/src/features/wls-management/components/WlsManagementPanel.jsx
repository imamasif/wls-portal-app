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
  IconRefresh 
} from '@tabler/icons-react';
import { WlsGroupAssigner } from './WlsGroupAssigner';

export function WlsManagementPanel({ onCreateSession, existingSessions = [] }) {
  const [topicName, setTopicName] = useState('');
  const [sessionDate, setSessionDate] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [quranVideoUrl, setQuranVideoUrl] = useState('');
  
  const [groupAssignments, setGroupAssignments] = useState({
    1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' }
  });

  const [users, setUsers] = useState([]);
  const [wlsAdmins, setWlsAdmins] = useState([]);
  const [localSessions, setLocalSessions] = useState(existingSessions);

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
  }, []);

  const handleGroupAssignmentChange = (groupIdx, updatedGroupData) => {
    setGroupAssignments((prev) => ({ ...prev, [groupIdx]: updatedGroupData }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topicName || !sessionDate) return;

    // Safely parse date object whether sessionDate is a string or Date instance
    const dateObj = sessionDate instanceof Date ? sessionDate : new Date(sessionDate);

    const newSession = {
      id: Date.now().toString(),
      topicName,
      sessionDateTimeToronto: dateObj.toISOString(),
      pdfBookletUrl: pdfUrl,
      quranVideoUrl,
      groupAssignments,
      status: 'ACTIVE',
      hasPendingActivity: true
    };

    if (typeof onCreateSession === 'function') {
      onCreateSession(newSession);
    } else {
      setLocalSessions((prev) => [newSession, ...prev]);
    }

    setTopicName('');
    setSessionDate(null);
    setPdfUrl('');
    setQuranVideoUrl('');
    setGroupAssignments({ 1: { userIds: [], adminIds: [], selectedAyats: [], instructions: '' } });
  };

  const handleToggleStatus = (index) => {
    setLocalSessions((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : s))
    );
  };

  const handleCancelSession = (index) => {
    const reason = window.prompt('Enter reason for postponing/cancelling this session:');
    if (reason === null) return;

    setLocalSessions((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, status: 'CANCELLED', cancelReason: reason } : s))
    );
  };

  const handleDeleteSession = (session, index) => {
    if (session.hasPendingActivity) {
      alert('Cannot Delete: This WLS Session has active user activity. Complete all assessments before deleting.');
      return;
    }

    if (window.confirm(`Delete "${session.topicName}"?`)) {
      setLocalSessions((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const sessionsToDisplay = existingSessions.length > 0 ? existingSessions : localSessions;

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
        <Title order={4} mb="md">Managed Sessions</Title>
        {sessionsToDisplay.length === 0 ? (
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
              {sessionsToDisplay.map((s, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Text fw={500}>{s.topicName}</Text>
                    {s.cancelReason && (
                      <Text size="xs" c="red">Reason: {s.cancelReason}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>{new Date(s.sessionDateTimeToronto).toLocaleString()}</Table.Td>
                  <Table.Td>
                    <Badge color={s.status === 'ACTIVE' ? 'green' : s.status === 'CANCELLED' ? 'red' : 'gray'}>
                      {s.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Toggle Active/Inactive">
                        <ActionIcon variant="light" color="blue" onClick={() => handleToggleStatus(idx)}>
                          <IconRefresh size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {s.status !== 'CANCELLED' && (
                        <Tooltip label="Postpone / Cancel">
                          <ActionIcon variant="light" color="orange" onClick={() => handleCancelSession(idx)}>
                            <IconPlayerPause size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
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