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

export function MSTeamGroupManager() {
  const [teams, setTeams] = useState([]);
  const [masterUsers, setMasterUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState('all');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    status: 'active',
    members: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [usersRes, groupsRes] = await Promise.all([
        fetchApi('/users'),
        fetchApi('/social-groups')
      ]);

      const loadedUsers = Array.isArray(usersRes) ? usersRes : usersRes.users || [];
      const loadedGroups = Array.isArray(groupsRes) ? groupsRes : groupsRes.groups || [];

      setMasterUsers(loadedUsers);
      setTeams(loadedGroups);

      if (loadedGroups.length > 0) {
        const firstId = loadedGroups[0].id || loadedGroups[0]._id;
        setSelectedTeamId(firstId);
      }
    } catch (err) {
      console.error('Error fetching data from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTeam = teams.find((t) => (t.id || t._id) === selectedTeamId) || teams[0];

  // Dashboard Metrics
  const totalTeams = teams.length;
  const activeTeams = teams.filter((t) => t.status === 'active').length;
  const totalUniqueAdmins = new Set(
    teams.flatMap((t) => t.members?.filter((m) => m.role === 'admin').map((m) => m.userId) || [])
  ).size;
  const totalUniqueMembers = new Set(
    teams.flatMap((t) => t.members?.map((m) => m.userId) || [])
  ).size;

  // CRUD Actions
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', description: '', status: 'active', members: [] });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team) => {
    setModalMode('edit');
    setFormData({
      id: team.id || team._id,
      name: team.name || '',
      description: team.description || '',
      status: team.status || 'active',
      members: team.members || []
    });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (teamId) => {
    const targetTeam = teams.find((t) => (t.id || t._id) === teamId);
    if (!targetTeam) return;

    const newStatus = targetTeam.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/social-groups/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetTeam, status: newStatus })
      });
      if (response.ok) {
        setTeams((prev) =>
          prev.map((t) => ((t.id || t._id) === teamId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle team status:', err);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this MS Teams Channel?')) return;

    try {
      const response = await fetch(`/api/social-groups/${teamId}`, { method: 'DELETE' });
      if (response.ok) {
        const remaining = teams.filter((t) => (t.id || t._id) !== teamId);
        setTeams(remaining);
        if (selectedTeamId === teamId && remaining.length > 0) {
          setSelectedTeamId(remaining[0].id || remaining[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/social-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const newTeam = await res.json();
        setTeams((prev) => [...prev, newTeam]);
        setSelectedTeamId(newTeam.id || newTeam._id);
      } else {
        const res = await fetch(`/api/social-groups/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const updatedTeam = await res.json();
        setTeams((prev) =>
          prev.map((t) => ((t.id || t._id) === (updatedTeam.id || updatedTeam._id) ? updatedTeam : t))
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save MS Team:', err);
    }
  };

  const handleToggleUserSelection = (userId) => {
    setFormData((prev) => {
      const exists = prev.members.some((m) => m.userId === userId);
      if (exists) {
        return { ...prev, members: prev.members.filter((m) => m.userId !== userId) };
      }
      return { ...prev, members: [...prev.members, { userId, role: 'participant' }] };
    });
  };

  const handleToggleUserRole = (userId) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.userId === userId ? { ...m, role: m.role === 'admin' ? 'participant' : 'admin' } : m
      )
    }));
  };

  // Safe Filtering Logic
  const filteredTeams = teams.filter((t) => {
    const matchesSearch = t.name?.toLowerCase().includes(teamSearchQuery.toLowerCase());
    if (activeMetricFilter === 'active') return matchesSearch && t.status === 'active';
    if (activeMetricFilter === 'inactive') return matchesSearch && t.status === 'inactive';
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
      {/* HEADER */}
      <Group justify="space-between" align="center">
        <Box>
          <Group gap="xs" align="center">
            <ThemeIcon color="indigo" size="lg" radius="md" variant="light">
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
        <Button
          leftSection={<IconPlus size={18} />}
          color="indigo"
          radius="md"
          onClick={handleOpenCreateModal}
        >
          Create MS Team
        </Button>
      </Group>

      {/* METRICS DASHBOARD CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <MetricCard
          title="Total MS Teams"
          value={totalTeams}
          icon={IconUsers}
          color="indigo"
          isActive={activeMetricFilter === 'all'}
          onClick={() => setActiveMetricFilter('all')}
        />
        <MetricCard
          title="Active Channels"
          value={activeTeams}
          icon={IconCircleCheck}
          color="teal"
          isActive={activeMetricFilter === 'active'}
          onClick={() =>
            setActiveMetricFilter(activeMetricFilter === 'active' ? 'all' : 'active')
          }
        />
        <MetricCard
          title="Team Owners Assigned"
          value={totalUniqueAdmins}
          icon={IconShieldCheck}
          color="amber"
          isActive={false}
          onClick={() => {}}
        />
        <MetricCard
          title="Total Members"
          value={totalUniqueMembers}
          icon={IconUserPlus}
          color="blue"
          isActive={false}
          onClick={() => {}}
        />
      </SimpleGrid>

      {/* MAIN CONTENT GRID */}
      <SimpleGrid cols={{ base: 1, lg: 12 }} spacing="md">
        {/* LEFT SIDEBAR: TEAM LIST */}
        <Box style={{ gridColumn: 'span 4' }}>
          <Card withBorder padding="md" radius="md" shadow="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={700} size="md">
                  MS Teams Channels
                </Text>
                {activeMetricFilter !== 'all' && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    rightSection={<IconX size={12} />}
                    onClick={() => setActiveMetricFilter('all')}
                  >
                    Clear filter
                  </Button>
                )}
              </Group>

              <TextInput
                placeholder="Search teams..."
                leftSection={<IconSearch size={16} />}
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
              />

              <ScrollArea h={450} offsetScrollbars>
                <Stack gap="xs">
                  {filteredTeams.map((team) => {
                    const tId = team.id || team._id;
                    const isSelected = selectedTeamId === tId;
                    const adminCount = team.members?.filter((m) => m.role === 'admin').length || 0;

                    return (
                      <Paper
                        key={tId}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--mantine-color-indigo-6)' : undefined,
                          backgroundColor: isSelected
                            ? 'var(--mantine-color-indigo-0)'
                            : undefined
                        }}
                        onClick={() => setSelectedTeamId(tId)}
                      >
                        <Group justify="space-between" align="flex-start" mb={4}>
                          <Text fw={600} size="sm">
                            {team.name}
                          </Text>
                          <Badge
                            size="xs"
                            color={team.status === 'active' ? 'green' : 'red'}
                            variant="light"
                          >
                            {team.status}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1} mb={8}>
                          {team.description}
                        </Text>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            {team.members?.length || 0} Members
                          </Text>
                          <Text size="xs" c="dimmed">
                            •
                          </Text>
                          <Text size="xs" c="orange.7" fw={500}>
                            {adminCount} Owners
                          </Text>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </ScrollArea>
            </Stack>
          </Card>
        </Box>

        {/* RIGHT DETAIL PANEL */}
        {selectedTeam && (
          <Box style={{ gridColumn: 'span 8' }}>
            <Card withBorder padding="lg" radius="md" shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Group gap="xs" align="center">
                      <Title order={3}>{selectedTeam.name}</Title>
                      <Badge
                        color={selectedTeam.status === 'active' ? 'green' : 'red'}
                        variant="light"
                      >
                        {selectedTeam.status === 'active' ? 'Active' : 'Disabled'}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mt={4}>
                      {selectedTeam.description}
                    </Text>
                  </Box>

                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color={selectedTeam.status === 'active' ? 'red' : 'green'}
                      size="lg"
                      radius="md"
                      onClick={() => handleToggleStatus(selectedTeam.id || selectedTeam._id)}
                    >
                      <IconPower size={18} />
                    </ActionIcon>
                    <Button
                      size="xs"
                      variant="light"
                      color="indigo"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => handleOpenEditModal(selectedTeam)}
                    >
                      Manage Team
                    </Button>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      radius="md"
                      onClick={() => handleDeleteTeam(selectedTeam.id || selectedTeam._id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Box mt="xs">
                  <Group gap="xs" mb="sm">
                    <IconUserPlus size={18} style={{ color: 'var(--mantine-color-indigo-6)' }} />
                    <Text fw={600} size="sm">
                      Channel Roster ({selectedTeam.members?.length || 0})
                    </Text>
                  </Group>

                  <Table highlightOnHover withTableBorder radius="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedTeam.members?.map((m) => {
                        const user = masterUsers.find((u) => (u.id || u._id) === m.userId);
                        if (!user) return null;

                        const name =
                          user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

                        return (
                          <Table.Tr key={user.id || user._id}>
                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon size="sm" radius="xl" color="indigo" variant="light">
                                  <Text size="xs" fw={700}>
                                    {name.charAt(0)}
                                  </Text>
                                </ThemeIcon>
                                <Text size="sm" fw={500}>
                                  {name}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                {user.email || '—'}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              {m.role === 'admin' ? (
                                <Badge
                                  color="orange"
                                  variant="light"
                                  leftSection={<IconShield size={12} />}
                                >
                                  Owner
                                </Badge>
                              ) : (
                                <Badge color="gray" variant="light">
                                  Member
                                </Badge>
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
        )}
      </SimpleGrid>

      {/* CREATE / EDIT MODAL */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <Text fw={700} size="lg">
            {modalMode === 'create' ? 'Create MS Team Channel' : 'Edit MS Team Channel'}
          </Text>
        }
        size="lg"
        radius="md"
      >
        <form onSubmit={handleSaveTeam}>
          <Stack gap="md">
            <TextInput
              label="Team Channel Name"
              required
              placeholder="e.g. Cloud Operations Team"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <TextInput
              label="Description"
              placeholder="Channel scope and overview"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Box>
              <Text fw={600} size="xs" tt="uppercase" c="dimmed" mb={8}>
                Assign Members ({formData.members.length} Selected)
              </Text>

              <TextInput
                placeholder="Search user directory..."
                leftSection={<IconSearch size={14} />}
                size="xs"
                mb="xs"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />

              <Paper withBorder p="xs" radius="md">
                <ScrollArea h={200} offsetScrollbars>
                  <Stack gap="xs">
                    {filteredMasterUsers.length === 0 ? (
                      <Text size="xs" c="dimmed" ta="center" py="md">
                        No users found in database
                      </Text>
                    ) : (
                      filteredMasterUsers.map((user) => {
                        const userId = user.id || user._id;
                        const name =
                          user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

                        const memberRecord = formData.members.find((m) => m.userId === userId);
                        const isSelected = !!memberRecord;
                        const isAdmin = memberRecord?.role === 'admin';

                        return (
                          <Flex
                            key={userId}
                            justify="space-between"
                            align="center"
                            p="xs"
                            style={{
                              borderRadius: 'var(--mantine-radius-sm)',
                              backgroundColor: isSelected
                                ? 'var(--mantine-color-gray-0)'
                                : undefined
                            }}
                          >
                            <Group gap="sm">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleUserSelection(userId)}
                                color="indigo"
                              />
                              <Box>
                                <Text size="sm" fw={500}>
                                  {name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {user.email}
                                </Text>
                              </Box>
                            </Group>

                            {isSelected && (
                              <Button
                                size="xs"
                                variant={isAdmin ? 'light' : 'subtle'}
                                color={isAdmin ? 'orange' : 'gray'}
                                leftSection={<IconShield size={12} />}
                                onClick={() => handleToggleUserRole(userId)}
                              >
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
              <Button variant="default" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" color="indigo">
                Save Team
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function MetricCard({ title, value, icon: Icon, color, isActive, onClick }) {
  return (
    <Card
      withBorder
      padding="md"
      radius="md"
      shadow="sm"
      style={{
        cursor: 'pointer',
        borderColor: isActive ? `var(--mantine-color-${color}-6)` : undefined
      }}
      onClick={onClick}
    >
      <Group justify="space-between" align="center">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
        </Box>
        <ThemeIcon color={color} variant="light" size="lg" radius="md">
          <Icon size={20} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}