import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../config/constants';
import { ZoomInviteCard } from '../../wls-management/components/ZoomInviteCard';
import { 
  Stack, Title, Text, Tabs, Card, Group, Badge, List, ThemeIcon, Paper, Divider, Anchor 
} from '@mantine/core';
import { 
  IconBook, IconUsers, IconFileText, IconVideo, IconClock, IconUserCheck, IconAlertCircle 
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

export function DashboardView({ user: propUser }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/wls-sessions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSessions(data))
      .catch((err) => console.error('Error fetching WLS sessions:', err));
  }, []);

  const upcomingSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const pastSessions = sessions.filter((s) => s.status !== 'ACTIVE');

  // Helper to resolve admin names from populated objects or fallback to IDs
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
    const userId = currentUser?._id || currentUser?.id;
    const userGroup = getUserGroup(session.groupAssignments, userId);

    const hasPdfs = Array.isArray(session.pdfBookletUrls) && session.pdfBookletUrls.length > 0;
    const hasVideos = Array.isArray(session.quranVideoUrls) && session.quranVideoUrls.length > 0;

    return (
      <Card key={session.id || session._id} withBorder shadow="sm" radius="md" p="lg" mb="md">
        {/* Zoom & Session Overview */}
        <ZoomInviteCard session={session} isUpcoming={isUpcoming} />

        {/* Global Resources: PDF Booklets & Video Streams */}
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

            {/* Group Admin Display */}
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

            {/* Video Submission Deadline */}
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

            {/* Selected Verses / Ayats */}
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

            {/* Special Instructions */}
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