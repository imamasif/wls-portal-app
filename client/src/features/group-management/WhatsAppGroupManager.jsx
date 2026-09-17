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
  IconBrandWhatsapp,
  IconX
} from '@tabler/icons-react';
import { fetchApi } from '../../api'

export function WhatsAppGroupManager() {
  const [groups, setGroups] = useState([]);
  const [masterUsers, setMasterUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
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

    // Call API endpoints through the env-configured base URL
    const [usersRes, groupsRes] = await Promise.all([
      fetchApi('/users'),
      fetchApi('/social-groups')
    ]);

    const loadedUsers = Array.isArray(usersRes) ? usersRes : usersRes.users || [];
    const loadedGroups = Array.isArray(groupsRes) ? groupsRes : groupsRes.groups || [];

    setMasterUsers(loadedUsers);
    setGroups(loadedGroups);

    if (loadedGroups.length > 0) {
      const firstId = loadedGroups[0].id || loadedGroups[0]._id;
      setSelectedGroupId(firstId);
    }
  } catch (err) {
    console.error('Error fetching data from DB:', err);
  } finally {
    setLoading(false);
  }
};

  const selectedGroup = groups.find((g) => (g.id || g._id) === selectedGroupId) || groups[0];

  // Dashboard Metrics
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.status === 'active').length;
  const totalUniqueAdmins = new Set(
    groups.flatMap((g) => g.members?.filter((m) => m.role === 'admin').map((m) => m.userId) || [])
  ).size;
  const totalUniqueMembers = new Set(
    groups.flatMap((g) => g.members?.map((m) => m.userId) || [])
  ).size;

  // CRUD Actions
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', description: '', status: 'active', members: [] });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group) => {
    setModalMode('edit');
    setFormData({
      id: group.id || group._id,
      name: group.name || '',
      description: group.description || '',
      status: group.status || 'active',
      members: group.members || []
    });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (groupId) => {
    const targetGroup = groups.find((g) => (g.id || g._id) === groupId);
    if (!targetGroup) return;

    const newStatus = targetGroup.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/social-groups/${groupId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setGroups((prev) =>
          prev.map((g) => ((g.id || g._id) === groupId ? { ...g, status: newStatus } : g))
        );
      }
    } catch (err) {
      console.error('Failed to toggle group status:', err);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this WhatsApp Group?')) return;

    try {
      const response = await fetch(`/api/social-groups/${groupId}`, { method: 'DELETE' });
      if (response.ok) {
        const remaining = groups.filter((g) => (g.id || g._id) !== groupId);
        setGroups(remaining);
        if (selectedGroupId === groupId && remaining.length > 0) {
          setSelectedGroupId(remaining[0].id || remaining[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/social-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const newGroup = await res.json();
        setGroups((prev) => [...prev, newGroup]);
        setSelectedGroupId(newGroup.id || newGroup._id);
      } else {
        const res = await fetch(`/api/social-groups/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const updatedGroup = await res.json();
        setGroups((prev) =>
          prev.map((g) => ((g.id || g._id) === (updatedGroup.id || updatedGroup._id) ? updatedGroup : g))
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save group:', err);
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
  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name?.toLowerCase().includes(groupSearchQuery.toLowerCase());
    if (activeMetricFilter === 'active') return matchesSearch && g.status === 'active';
    if (activeMetricFilter === 'inactive') return matchesSearch && g.status === 'inactive';
    return matchesSearch;
  });

  const filteredMasterUsers = masterUsers.filter((u) => {
    const query = userSearchQuery.toLowerCase();
    const fullName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
    const email = u.email || '';
    const phone = u.phone || u.phoneNumber || '';

    return (
      fullName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      phone.includes(query)
    );
  });

  if (loading) {
    return (
      <Center h={400}>
        <Loader color="green" size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg" pt="xl" px="md" pb="xl">
      {/* HEADER */}
      <Group justify="space-between" align="center">
        <Box>
          <Group gap="xs" align="center">
            <ThemeIcon color="green" size="lg" radius="md" variant="light">
              <IconBrandWhatsapp size={24} />
            </ThemeIcon>
            <Title order={2} fw={700}>
              WhatsApp Group Manager
            </Title>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Manage WhatsApp group memberships, admin permissions, and chat statuses across teams.
          </Text>
        </Box>
        <Button leftSection={<IconPlus size={18} />} color="green" radius="md" onClick={handleOpenCreateModal}>
          Create WhatsApp Group
        </Button>
      </Group>

      {/* METRICS */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <MetricCard title="Total WhatsApp Groups" value={totalGroups} icon={IconUsers} color="green" isActive={activeMetricFilter === 'all'} onClick={() => setActiveMetricFilter('all')} />
        <MetricCard title="Active Groups" value={activeGroups} icon={IconCircleCheck} color="teal" isActive={activeMetricFilter === 'active'} onClick={() => setActiveMetricFilter(activeMetricFilter === 'active' ? 'all' : 'active')} />
        <MetricCard title="Group Admins Assigned" value={totalUniqueAdmins} icon={IconShieldCheck} color="amber" isActive={false} onClick={() => {}} />
        <MetricCard title="Total Participants" value={totalUniqueMembers} icon={IconUserPlus} color="blue" isActive={false} onClick={() => {}} />
      </SimpleGrid>

      {/* MAIN VIEW */}
      <SimpleGrid cols={{ base: 1, lg: 12 }} spacing="md">
        {/* LEFT SIDEBAR */}
        <Box style={{ gridColumn: 'span 4' }}>
          <Card withBorder padding="md" radius="md" shadow="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={700} size="md">WhatsApp Groups</Text>
                {activeMetricFilter !== 'all' && (
                  <Button size="xs" variant="subtle" color="gray" rightSection={<IconX size={12} />} onClick={() => setActiveMetricFilter('all')}>
                    Clear filter
                  </Button>
                )}
              </Group>

              <TextInput placeholder="Search groups..." leftSection={<IconSearch size={16} />} value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)} />

              <ScrollArea h={450} offsetScrollbars>
                <Stack gap="xs">
                  {filteredGroups.map((group) => {
                    const gId = group.id || group._id;
                    const isSelected = selectedGroupId === gId;
                    const adminCount = group.members?.filter((m) => m.role === 'admin').length || 0;

                    return (
                      <Paper
                        key={gId}
                        withBorder
                        p="sm"
                        radius="md"
                        style={{
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--mantine-color-green-6)' : undefined,
                          backgroundColor: isSelected ? 'var(--mantine-color-green-0)' : undefined
                        }}
                        onClick={() => setSelectedGroupId(gId)}
                      >
                        <Group justify="space-between" align="flex-start" mb={4}>
                          <Text fw={600} size="sm">{group.name}</Text>
                          <Badge size="xs" color={group.status === 'active' ? 'green' : 'red'} variant="light">
                            {group.status}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1} mb={8}>{group.description}</Text>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">{group.members?.length || 0} Participants</Text>
                          <Text size="xs" c="dimmed">•</Text>
                          <Text size="xs" c="orange.7" fw={500}>{adminCount} Admins</Text>
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
        {selectedGroup && (
          <Box style={{ gridColumn: 'span 8' }}>
            <Card withBorder padding="lg" radius="md" shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Group gap="xs" align="center">
                      <Title order={3}>{selectedGroup.name}</Title>
                      <Badge color={selectedGroup.status === 'active' ? 'green' : 'red'} variant="light">
                        {selectedGroup.status === 'active' ? 'Active' : 'Disabled'}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mt={4}>{selectedGroup.description}</Text>
                  </Box>

                  <Group gap="xs">
                    <ActionIcon variant="light" color={selectedGroup.status === 'active' ? 'red' : 'green'} size="lg" radius="md" onClick={() => handleToggleStatus(selectedGroup.id || selectedGroup._id)}>
                      <IconPower size={18} />
                    </ActionIcon>
                    <Button size="xs" variant="light" color="green" leftSection={<IconEdit size={14} />} onClick={() => handleOpenEditModal(selectedGroup)}>
                      Manage Members
                    </Button>
                    <ActionIcon variant="light" color="red" size="lg" radius="md" onClick={() => handleDeleteGroup(selectedGroup.id || selectedGroup._id)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Box mt="xs">
                  <Group gap="xs" mb="sm">
                    <IconUserPlus size={18} style={{ color: 'var(--mantine-color-green-6)' }} />
                    <Text fw={600} size="sm">Group Members ({selectedGroup.members?.length || 0})</Text>
                  </Group>

                  <Table highlightOnHover withTableBorder radius="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Member Name</Table.Th>
                        <Table.Th>Phone / Contact</Table.Th>
                        <Table.Th>Role</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedGroup.members?.map((m) => {
                        const user = masterUsers.find((u) => (u.id || u._id) === m.userId);
                        if (!user) return null;

                        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                        const contact = user.phone || user.phoneNumber || user.email || '—';

                        return (
                          <Table.Tr key={user.id || user._id}>
                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon size="sm" radius="xl" color="green" variant="light">
                                  <Text size="xs" fw={700}>{name.charAt(0)}</Text>
                                </ThemeIcon>
                                <Text size="sm" fw={500}>{name}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">{contact}</Text>
                            </Table.Td>
                            <Table.Td>
                              {m.role === 'admin' ? (
                                <Badge color="orange" variant="light" leftSection={<IconShield size={12} />}>Admin</Badge>
                              ) : (
                                <Badge color="gray" variant="light">Participant</Badge>
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
      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title={<Text fw={700} size="lg">{modalMode === 'create' ? 'Create WhatsApp Group' : 'Edit WhatsApp Group'}</Text>} size="lg" radius="md">
        <form onSubmit={handleSaveGroup}>
          <Stack gap="md">
            <TextInput label="Group Name" required placeholder="e.g. Architecture Steering Board" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextInput label="Description" placeholder="Brief overview of group scope" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            <Box>
              <Text fw={600} size="xs" tt="uppercase" c="dimmed" mb={8}>Assign Members & Roles ({formData.members.length} Selected)</Text>
              <TextInput placeholder="Search user directory..." leftSection={<IconSearch size={14} />} size="xs" mb="xs" value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} />

              <Paper withBorder p="xs" radius="md">
                <ScrollArea h={220} offsetScrollbars>
                  <Stack gap="xs">
                    {filteredMasterUsers.length === 0 ? (
                      <Text size="xs" c="dimmed" ta="center" py="md">No users found in database</Text>
                    ) : (
                      filteredMasterUsers.map((user) => {
                        const userId = user.id || user._id;
                        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                        const contact = user.phone || user.phoneNumber || user.email || 'No contact info';

                        const memberRecord = formData.members.find((m) => m.userId === userId);
                        const isSelected = !!memberRecord;
                        const isAdmin = memberRecord?.role === 'admin';

                        return (
                          <Flex key={userId} justify="space-between" align="center" p="xs" style={{ borderRadius: 'var(--mantine-radius-sm)', backgroundColor: isSelected ? 'var(--mantine-color-gray-0)' : undefined }}>
                            <Group gap="sm">
                              <Checkbox checked={isSelected} onChange={() => handleToggleUserSelection(userId)} color="green" />
                              <Box>
                                <Text size="sm" fw={500}>{name}</Text>
                                <Text size="xs" c="dimmed">{contact}</Text>
                              </Box>
                            </Group>

                            {isSelected && (
                              <Button size="xs" variant={isAdmin ? 'light' : 'subtle'} color={isAdmin ? 'orange' : 'gray'} leftSection={<IconShield size={12} />} onClick={() => handleToggleUserRole(userId)}>
                                {isAdmin ? 'Admin' : 'Participant'}
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
              <Button variant="default" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" color="green">Save Changes</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function MetricCard({ title, value, icon: Icon, color, isActive, onClick }) {
  return (
    <Card withBorder padding="md" radius="md" shadow="sm" style={{ cursor: 'pointer', borderColor: isActive ? `var(--mantine-color-${color}-6)` : undefined }} onClick={onClick}>
      <Group justify="space-between" align="center">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{title}</Text>
          <Text size="xl" fw={700} mt={4}>{value}</Text>
        </Box>
        <ThemeIcon color={color} variant="light" size="lg" radius="md">
          <Icon size={20} />
        </ThemeIcon>
      </Group>
    </Card>
  );
}