import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Title,
  Button,
  Group,
  Stack,
  SimpleGrid,
  TextInput,
  Badge,
  Table,
  Modal,
  Checkbox,
  ActionIcon,
  ThemeIcon,
  Paper,
  Box,
  ScrollArea,
  Flex,
  Loader,
  Center
} from '@mantine/core';
import {
  IconUsers,
  IconShieldCheck,
  IconCircleCheck,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconPower,
  IconUserPlus,
  IconShield,
  IconVideo,
  IconX
} from '@tabler/icons-react';
import { fetchApi } from '../../api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

export function MSTeamGroupManager() {
  const [teams, setTeams] = useState([]);
  const [masterUsers, setMasterUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState('all');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    status: 'active',
    type: 'MICROSOFT_TEAMS',
    members: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getMemberUserId = (m) => {
    if (!m) return '';
    if (typeof m === 'string') return String(m);
    if (typeof m.userId === 'object' && m.userId !== null) {
      return String(m.userId._id || m.userId.id || '');
    }
    return String(m.userId || m.id || m._id || '');
  };

  const getMemberRole = (m) => m?.role || 'MEMBER';

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [usersRes, groupsRes] = await Promise.all([
        fetchApi('/api/users'),
        fetchApi('/api/social-groups')
      ]);

      const loadedUsers = Array.isArray(usersRes) ? usersRes : usersRes.users || [];
      const loadedGroups = Array.isArray(groupsRes) ? groupsRes : groupsRes.groups || [];

      const teamGroups = loadedGroups.filter((g) => g.type === 'MICROSOFT_TEAMS');

      setMasterUsers(loadedUsers);
      setTeams(teamGroups);

      if (teamGroups.length > 0) {
        const firstId = String(teamGroups[0].id || teamGroups[0]._id);
        setSelectedTeamId(firstId);
      }
    } catch (err) {
      console.error('Error fetching data from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTeam = teams.find((t) => {
    const currentId = String(t.id || t._id || '');
    return currentId === String(selectedTeamId);
  }) || teams[0];

  const totalTeams = teams.length;
  const activeTeams = teams.filter((t) => t.status === 'active' || t.status === 'ACTIVE' || t.isActive).length;
  const totalUniqueAdmins = new Set(
    teams.flatMap((t) =>
      t.members
        ?.filter((m) => getMemberRole(m) === 'ADMIN' || getMemberRole(m) === 'admin')
        .map((m) => getMemberUserId(m)) || []
    )
  ).size;

  const totalUniqueMembers = new Set(
    teams.flatMap((t) => t.members?.map((m) => getMemberUserId(m)) || [])
  ).size;

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({ id: '', name: '', description: '', status: 'active', type: 'MICROSOFT_TEAMS', members: [] });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team) => {
    setModalMode('edit');
    setFormData({
      id: team.id || team._id,
      name: team.name || '',
      description: team.description || '',
      status: (team.status === 'active' || team.status === 'ACTIVE' || team.isActive) ? 'active' : 'inactive',
      type: 'MICROSOFT_TEAMS',
      members: Array.isArray(team.members)
        ? team.members.map((m) => ({ userId: getMemberUserId(m), role: getMemberRole(m) }))
        : []
    });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handlePromptDelete = (team) => {
    setTeamToDelete(team);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    const tId = String(teamToDelete.id || teamToDelete._id);

    setDeleting(true);
    try {
      await fetchApi(`/api/social-groups/${tId}`, { method: 'DELETE' });
      const remaining = teams.filter((t) => String(t.id || t._id) !== tId);
      setTeams(remaining);

      if (String(selectedTeamId) === tId) {
        setSelectedTeamId(remaining.length > 0 ? String(remaining[0].id || remaining[0]._id) : null);
      }
      setDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete team:', err);
    } finally {
      setDeleting(false);
      setTeamToDelete(null);
    }
  };

  const handleToggleStatus = async (teamId) => {
    const targetTeam = teams.find((t) => String(t.id || t._id) === String(teamId));
    if (!targetTeam) return;

    const currentActive = targetTeam.status === 'active' || targetTeam.status === 'ACTIVE' || targetTeam.isActive;
    const newStatus = currentActive ? 'inactive' : 'active';
    try {
      const updatedTeam = await fetchApi(`/api/social-groups/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetTeam.name, type: 'MICROSOFT_TEAMS', isActive: !currentActive })
      });

      if (updatedTeam) {
        setTeams((prev) =>
          prev.map((t) => (String(t.id || t._id) === String(teamId) ? { ...t, ...updatedTeam, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle team status:', err);
    }
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (submitting || !formData.name?.trim()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload = {
          name: formData.name.trim(),
          description: formData.description,
          type: 'MICROSOFT_TEAMS',
          members: formData.members
        };

        const newTeam = await fetchApi('/api/social-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (newTeam) {
          const normalizedTeam = {
            ...newTeam,
            members: newTeam.members && newTeam.members.length > 0 ? newTeam.members : formData.members
          };
          const targetId = String(normalizedTeam.id || normalizedTeam._id);

          setTeams((prev) => [...prev, normalizedTeam]);
          setSelectedTeamId(targetId);
        }
      } else {
        const updatePayload = {
          name: formData.name.trim(),
          description: formData.description,
          type: 'MICROSOFT_TEAMS',
          isActive: formData.status === 'active' || formData.status === 'ACTIVE',
          members: formData.members
        };

        const updatedTeam = await fetchApi(`/api/social-groups/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (updatedTeam) {
          setTeams((prev) =>
            prev.map((t) =>
              String(t.id || t._id) === String(updatedTeam.id || updatedTeam._id) ? updatedTeam : t
            )
          );
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save MS Team:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserSelection = (userId) => {
    setFormData((prev) => {
      const exists = prev.members.some((m) => String(m.userId) === String(userId));
      if (exists) {
        return { ...prev, members: prev.members.filter((m) => String(m.userId) !== String(userId)) };
      }
      return { ...prev, members: [...prev.members, { userId, role: 'MEMBER' }] };
    });
  };

  const handleToggleUserRole = (userId) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        String(m.userId) === String(userId)
          ? { ...m, role: (m.role === 'ADMIN' || m.role === 'admin') ? 'MEMBER' : 'ADMIN' }
          : m
      )
    }));
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch = t.name?.toLowerCase().includes(teamSearchQuery.toLowerCase());
    if (activeMetricFilter === 'active') return matchesSearch && (t.status === 'active' || t.status === 'ACTIVE' || t.isActive);
    if (activeMetricFilter === 'inactive') return matchesSearch && (t.status === 'inactive' || t.status === 'INACTIVE' || t.isActive === false);
    return matchesSearch;
  });

  const filteredMasterUsers = masterUsers.filter((u) => {
    const query = userSearchQuery.toLowerCase();
    const fullName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
    const email = u.email || '';

    return fullName.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <Center h={400}>
        <Loader color="indigo" size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg" pt="xl" px="md" pb="xl">
      <Group justify="space-between" align="center">
        <Box>
          <Group gap="xs" align="center">
            <ThemeIcon color="indigo" size="lg" radius={0} variant="light">
              <IconVideo size={24} />
            </ThemeIcon>
            <Title order={2} fw={700}>
              Microsoft Teams Channel Manager
            </Title>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Manage MS Teams channels, owner access control, and team members.
          </Text>
        </Box>
        <Button leftSection={<IconPlus size={18} />} color="indigo" radius={0} onClick={handleOpenCreateModal}>
          Create MS Team
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <MetricCard title="Total MS Teams" value={totalTeams} icon={IconUsers} color="indigo" isActive={activeMetricFilter === 'all'} onClick={() => setActiveMetricFilter('all')} />
        <MetricCard title="Active Channels" value={activeTeams} icon={IconCircleCheck} color="teal" isActive={activeMetricFilter === 'active'} onClick={() => setActiveMetricFilter(activeMetricFilter === 'active' ? 'all' : 'active')} />
        <MetricCard title="Team Owners Assigned" value={totalUniqueAdmins} icon={IconShieldCheck} color="amber" isActive={false} onClick={() => {}} />
        <MetricCard title="Total Members" value={totalUniqueMembers} icon={IconUserPlus} color="blue" isActive={false} onClick={() => {}} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 12 }} spacing="md">
        <Box style={{ gridColumn: 'span 4' }}>
          <Card withBorder padding="md" radius={0} shadow="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={700} size="md">MS Teams Channels</Text>
                {activeMetricFilter !== 'all' && (
                  <Button size="xs" variant="subtle" color="gray" rightSection={<IconX size={12} />} onClick={() => setActiveMetricFilter('all')}>
                    Clear filter
                  </Button>
                )}
              </Group>

              <TextInput placeholder="Search teams..." leftSection={<IconSearch size={16} />} value={teamSearchQuery} onChange={(e) => setTeamSearchQuery(e.target.value)} />

              <ScrollArea h={480} offsetScrollbars>
                <Stack gap="xs">
                  {filteredTeams.map((team) => {
                    const tId = String(team.id || team._id);
                    const isSelected = String(selectedTeamId) === tId;
                    const adminCount = team.members?.filter(
                      (m) => getMemberRole(m) === 'ADMIN' || getMemberRole(m) === 'admin'
                    ).length || 0;

                    return (
                      <Paper
                        key={tId || `msteam-${team.name}`}
                        withBorder
                        p="sm"
                        radius={0}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          borderColor: isSelected ? 'var(--mantine-color-indigo-6)' : 'var(--mantine-color-gray-3)',
                          borderLeft: isSelected ? '4px solid var(--mantine-color-indigo-6)' : undefined,
                          backgroundColor: isSelected ? 'var(--mantine-color-gray-0)' : '#ffffff',
                          boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.05)' : undefined
                        }}
                        onClick={() => setSelectedTeamId(tId)}
                      >
                        <Group justify="space-between" align="flex-start" mb={6}>
                          <Group gap="xs" style={{ flex: 1 }}>
                            <ThemeIcon size="sm" radius={0} color="indigo" variant="light">
                              <IconVideo size={14} />
                            </ThemeIcon>
                            <Text fw={600} size="sm" lineClamp={1}>
                              {team.name}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <Badge size="xs" color={(team.status === 'active' || team.status === 'ACTIVE' || team.isActive) ? 'green' : 'red'} variant="light">
                              {team.status || (team.isActive ? 'active' : 'inactive')}
                            </Badge>
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="subtle"
                              radius={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromptDelete(team);
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        {team.description && (
                          <Text size="xs" c="dimmed" lineClamp={1} mb={8}>
                            {team.description}
                          </Text>
                        )}

                        <Group gap="md" mt="xs">
                          <Group gap={4}>
                            <IconUsers size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
                            <Text size="xs" c="dimmed">
                              {team.members?.length || 0} Members
                            </Text>
                          </Group>

                          <Group gap={4}>
                            <IconShieldCheck size={14} style={{ color: 'var(--mantine-color-orange-6)' }} />
                            <Text size="xs" c="orange.7" fw={500}>
                              {adminCount} Owners
                            </Text>
                          </Group>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </ScrollArea>
            </Stack>
          </Card>
        </Box>

        {selectedTeam ? (
          <Box style={{ gridColumn: 'span 8' }}>
            <Card withBorder padding="lg" radius={0} shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Group gap="xs" align="center">
                      <ThemeIcon color="indigo" size="md" radius={0} variant="light">
                        <IconVideo size={20} />
                      </ThemeIcon>
                      <Title order={3}>{selectedTeam.name}</Title>
                      <Badge color={(selectedTeam.status === 'active' || selectedTeam.status === 'ACTIVE' || selectedTeam.isActive) ? 'green' : 'red'} variant="light">
                        {(selectedTeam.status === 'active' || selectedTeam.status === 'ACTIVE' || selectedTeam.isActive) ? 'Active' : 'Disabled'}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mt={4}>{selectedTeam.description || 'No description provided.'}</Text>
                  </Box>

                  <Group gap="xs">
                    <ActionIcon variant="light" color={(selectedTeam.status === 'active' || selectedTeam.status === 'ACTIVE' || selectedTeam.isActive) ? 'red' : 'green'} size="lg" radius={0} onClick={() => handleToggleStatus(selectedTeam.id || selectedTeam._id)}>
                      <IconPower size={18} />
                    </ActionIcon>
                    <Button size="xs" variant="light" color="indigo" radius={0} leftSection={<IconEdit size={14} />} onClick={() => handleOpenEditModal(selectedTeam)}>
                      Manage Team
                    </Button>
                    <ActionIcon variant="light" color="red" size="lg" radius={0} onClick={() => handlePromptDelete(selectedTeam)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Box mt="xs">
                  <Group gap="xs" mb="sm">
                    <IconUserPlus size={18} style={{ color: 'var(--mantine-color-indigo-6)' }} />
                    <Text fw={600} size="sm">Channel Roster ({selectedTeam.members?.length || 0})</Text>
                  </Group>

                  <Table highlightOnHover withTableBorder radius={0}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedTeam.members?.map((m, idx) => {
                        const userId = getMemberUserId(m);
                        const user = masterUsers.find((u) => String(u.id || u._id) === String(userId));
                        
                        const name = user
                          ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email)
                          : `User (${userId.substring(0, 6)}...)`;

                        const email = user ? (user.email || '—') : '—';
                        const role = getMemberRole(m);
                        const isAdmin = role === 'ADMIN' || role === 'admin';

                        return (
                          <Table.Tr key={userId || idx}>
                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon size="sm" radius={0} color="indigo" variant="light">
                                  <Text size="xs" fw={700}>{name.charAt(0)}</Text>
                                </ThemeIcon>
                                <Text size="sm" fw={500}>{name}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">{email}</Text>
                            </Table.Td>
                            <Table.Td>
                              {isAdmin ? (
                                <Badge color="orange" variant="light" leftSection={<IconShield size={12} />}>Owner</Badge>
                              ) : (
                                <Badge color="gray" variant="light">Member</Badge>
                              )}
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Box>
              </Stack>
            </Card>
          </Box>
        ) : (
          <Box style={{ gridColumn: 'span 8' }}>
            <Paper withBorder p="xl" radius={0} ta="center">
              <Text c="dimmed">Select a team channel from the list to view its details.</Text>
            </Paper>
          </Box>
        )}
      </SimpleGrid>

      {/* Create/Edit Modal */}
      <Modal opened={isModalOpen} onClose={() => !submitting && setIsModalOpen(false)} title={<Text fw={700} size="lg">{modalMode === 'create' ? 'Create MS Team Channel' : 'Edit MS Team Channel'}</Text>} size="lg" radius={0}>
        <form onSubmit={handleSaveTeam}>
          <Stack gap="md">
            <TextInput label="Team Channel Name" required placeholder="e.g. Cloud Operations Team" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextInput label="Description" placeholder="Channel scope and overview" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            <Box>
              <Text fw={600} size="xs" tt="uppercase" c="dimmed" mb={8}>Assign Members ({formData.members.length} Selected)</Text>
              <TextInput placeholder="Search user directory..." leftSection={<IconSearch size={14} />} size="xs" mb="xs" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} />

              <Paper withBorder p="xs" radius={0}>
                <ScrollArea h={220} offsetScrollbars>
                  <Stack gap="xs">
                    {filteredMasterUsers.length === 0 ? (
                      <Text size="xs" c="dimmed" ta="center" py="md">No users found in database</Text>
                    ) : (
                      filteredMasterUsers.map((user) => {
                        const userId = String(user.id || user._id);
                        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

                        const memberRecord = formData.members.find((m) => String(m.userId) === userId);
                        const isSelected = !!memberRecord;
                        const isAdmin = memberRecord?.role === 'ADMIN' || memberRecord?.role === 'admin';

                        return (
                          <Flex key={userId} justify="space-between" align="center" p="xs" style={{ backgroundColor: isSelected ? 'var(--mantine-color-gray-0)' : undefined }}>
                            <Group gap="sm">
                              <Checkbox checked={isSelected} onChange={() => handleToggleUserSelection(userId)} color="indigo" />
                              <Box>
                                <Text size="sm" fw={500}>{name}</Text>
                                <Text size="xs" c="dimmed">{user.email}</Text>
                              </Box>
                            </Group>

                            {isSelected && (
                              <Button size="xs" radius={0} variant={isAdmin ? 'light' : 'subtle'} color={isAdmin ? 'orange' : 'gray'} leftSection={<IconShield size={12} />} onClick={() => handleToggleUserRole(userId)}>
                                {isAdmin ? 'Owner' : 'Member'}
                              </Button>
                            )}
                          </Flex>
                        );
                      })
                    )}
                  </Stack>
                </ScrollArea>
              </Paper>
            </Box>

            <Group justify="flex-end" gap="sm" mt="md">
              <Button variant="default" radius={0} onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" color="indigo" radius={0} loading={submitting}>Save Team</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Shared Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete MS Teams Channel"
        message={`Are you sure you want to delete "${teamToDelete?.name || 'this channel'}"? This action cannot be undone.`}
        loading={deleting}
      />
    </Stack>
  );
}

function MetricCard({ title, value, icon: Icon, color, isActive, onClick }) {
  return (
    <Card withBorder padding="md" radius={0} shadow="sm" style={{ cursor: 'pointer', borderColor: isActive ? `var(--mantine-color-${color}-6)` : undefined }} onClick={onClick}>
      <Group justify="space-between" align="center">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{title}</Text>
          <Text size="xl" fw={700} mt={4}>{value}</Text>
        </Box>
        <ThemeIcon color={color} variant="light" size="lg" radius={0}>
          <Icon size={20} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}