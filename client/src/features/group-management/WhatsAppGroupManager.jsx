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
import { fetchApi } from '../../api';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

export function WhatsAppGroupManager() {
  const [groups, setGroups] = useState([]);
  const [masterUsers, setMasterUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState('all');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    status: 'active',
    type: 'WHATSAPP',
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

      const whatsappGroups = loadedGroups.filter((g) => g.type === 'WHATSAPP');

      setMasterUsers(loadedUsers);
      setGroups(whatsappGroups);

      if (whatsappGroups.length > 0) {
        const firstId = String(whatsappGroups[0].id || whatsappGroups[0]._id);
        setSelectedGroupId(firstId);
      }
    } catch (err) {
      console.error('Error fetching data from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => {
    const currentId = String(g.id || g._id || '');
    return currentId === String(selectedGroupId);
  }) || groups[0];

  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.status === 'active' || g.status === 'ACTIVE' || g.isActive).length;
  const totalUniqueAdmins = new Set(
    groups.flatMap((g) =>
      g.members
        ?.filter((m) => getMemberRole(m) === 'ADMIN' || getMemberRole(m) === 'admin')
        .map((m) => getMemberUserId(m)) || []
    )
  ).size;

  const totalUniqueMembers = new Set(
    groups.flatMap((g) => g.members?.map((m) => getMemberUserId(m)) || [])
  ).size;

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({ id: '', name: '', description: '', status: 'active', type: 'WHATSAPP', members: [] });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group) => {
    setModalMode('edit');
    setFormData({
      id: group.id || group._id,
      name: group.name || '',
      description: group.description || '',
      status: (group.status === 'active' || group.status === 'ACTIVE' || group.isActive) ? 'active' : 'inactive',
      type: 'WHATSAPP',
      members: Array.isArray(group.members)
        ? group.members.map((m) => ({ userId: getMemberUserId(m), role: getMemberRole(m) }))
        : []
    });
    setUserSearchQuery('');
    setIsModalOpen(true);
  };

  const handlePromptDelete = (group) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    const gId = String(groupToDelete.id || groupToDelete._id);

    setDeleting(true);
    try {
      await fetchApi(`/api/social-groups/${gId}`, { method: 'DELETE' });
      const remaining = groups.filter((g) => String(g.id || g._id) !== gId);
      setGroups(remaining);

      if (String(selectedGroupId) === gId) {
        setSelectedGroupId(remaining.length > 0 ? String(remaining[0].id || remaining[0]._id) : null);
      }
      setDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete group:', err);
    } finally {
      setDeleting(false);
      setGroupToDelete(null);
    }
  };

  const handleToggleStatus = async (groupId) => {
    const targetGroup = groups.find((g) => String(g.id || g._id) === String(groupId));
    if (!targetGroup) return;

    const currentActive = targetGroup.status === 'active' || targetGroup.status === 'ACTIVE' || targetGroup.isActive;
    const newStatus = currentActive ? 'inactive' : 'active';
    try {
      const updatedGroup = await fetchApi(`/api/social-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetGroup.name, type: 'WHATSAPP', isActive: !currentActive })
      });

      if (updatedGroup) {
        setGroups((prev) =>
          prev.map((g) => (String(g.id || g._id) === String(groupId) ? { ...g, ...updatedGroup, status: newStatus } : g))
        );
      }
    } catch (err) {
      console.error('Failed to toggle group status:', err);
    }
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (submitting || !formData.name?.trim()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload = {
          name: formData.name.trim(),
          description: formData.description,
          type: 'WHATSAPP',
          members: formData.members
        };

        const newGroup = await fetchApi('/api/social-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (newGroup) {
          const normalizedGroup = {
            ...newGroup,
            members: newGroup.members && newGroup.members.length > 0 ? newGroup.members : formData.members
          };
          const targetId = String(normalizedGroup.id || normalizedGroup._id);

          setGroups((prev) => [...prev, normalizedGroup]);
          setSelectedGroupId(targetId);
        }
      } else {
        const updatePayload = {
          name: formData.name.trim(),
          description: formData.description,
          type: 'WHATSAPP',
          isActive: formData.status === 'active' || formData.status === 'ACTIVE',
          members: formData.members
        };

        const updatedGroup = await fetchApi(`/api/social-groups/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (updatedGroup) {
          setGroups((prev) =>
            prev.map((g) =>
              String(g.id || g._id) === String(updatedGroup.id || updatedGroup._id) ? updatedGroup : g
            )
          );
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save group:', err);
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

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name?.toLowerCase().includes(groupSearchQuery.toLowerCase());
    if (activeMetricFilter === 'active') return matchesSearch && (g.status === 'active' || g.status === 'ACTIVE' || g.isActive);
    if (activeMetricFilter === 'inactive') return matchesSearch && (g.status === 'inactive' || g.status === 'INACTIVE' || g.isActive === false);
    return matchesSearch;
  });

  const filteredMasterUsers = masterUsers.filter((u) => {
    const query = userSearchQuery.toLowerCase();
    const fullName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
    const email = u.email || '';
    const phone = u.phone || u.phoneNumber || '';

    return fullName.toLowerCase().includes(query) || email.toLowerCase().includes(query) || phone.includes(query);
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
      <Group justify="space-between" align="center">
        <Box>
          <Group gap="xs" align="center">
            <ThemeIcon color="green" size="lg" radius={0} variant="light">
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
        <Button leftSection={<IconPlus size={18} />} color="green" radius={0} onClick={handleOpenCreateModal}>
          Create WhatsApp Group
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <MetricCard title="Total WhatsApp Groups" value={totalGroups} icon={IconUsers} color="green" isActive={activeMetricFilter === 'all'} onClick={() => setActiveMetricFilter('all')} />
        <MetricCard title="Active Groups" value={activeGroups} icon={IconCircleCheck} color="teal" isActive={activeMetricFilter === 'active'} onClick={() => setActiveMetricFilter(activeMetricFilter === 'active' ? 'all' : 'active')} />
        <MetricCard title="Group Admins Assigned" value={totalUniqueAdmins} icon={IconShieldCheck} color="amber" isActive={false} onClick={() => {}} />
        <MetricCard title="Total Participants" value={totalUniqueMembers} icon={IconUserPlus} color="blue" isActive={false} onClick={() => {}} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 12 }} spacing="md">
        <Box style={{ gridColumn: 'span 4' }}>
          <Card withBorder padding="md" radius={0} shadow="sm">
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

              <ScrollArea h={480} offsetScrollbars>
                <Stack gap="xs">
                  {filteredGroups.map((group) => {
                    const gId = String(group.id || group._id);
                    const isSelected = String(selectedGroupId) === gId;
                    const adminCount = group.members?.filter(
                      (m) => getMemberRole(m) === 'ADMIN' || getMemberRole(m) === 'admin'
                    ).length || 0;

                    return (
                      <Paper
                        key={gId || `whatsapp-group-${group.name}`}
                        withBorder
                        p="sm"
                        radius={0}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          borderColor: isSelected ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-3)',
                          borderLeft: isSelected ? '4px solid var(--mantine-color-green-6)' : undefined,
                          backgroundColor: isSelected ? 'var(--mantine-color-gray-0)' : '#ffffff',
                          boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.05)' : undefined
                        }}
                        onClick={() => setSelectedGroupId(gId)}
                      >
                        <Group justify="space-between" align="flex-start" mb={6}>
                          <Group gap="xs" style={{ flex: 1 }}>
                            <ThemeIcon size="sm" radius={0} color="green" variant="light">
                              <IconBrandWhatsapp size={14} />
                            </ThemeIcon>
                            <Text fw={600} size="sm" lineClamp={1}>
                              {group.name}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <Badge size="xs" color={(group.status === 'active' || group.status === 'ACTIVE' || group.isActive) ? 'green' : 'red'} variant="light">
                              {group.status || (group.isActive ? 'active' : 'inactive')}
                            </Badge>
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="subtle"
                              radius={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePromptDelete(group);
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        {group.description && (
                          <Text size="xs" c="dimmed" lineClamp={1} mb={8}>
                            {group.description}
                          </Text>
                        )}

                        <Group gap="md" mt="xs">
                          <Group gap={4}>
                            <IconUsers size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
                            <Text size="xs" c="dimmed">
                              {group.members?.length || 0} Participants
                            </Text>
                          </Group>

                          <Group gap={4}>
                            <IconShieldCheck size={14} style={{ color: 'var(--mantine-color-orange-6)' }} />
                            <Text size="xs" c="orange.7" fw={500}>
                              {adminCount} Admins
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

        {selectedGroup ? (
          <Box style={{ gridColumn: 'span 8' }}>
            <Card withBorder padding="lg" radius={0} shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Group gap="xs" align="center">
                      <ThemeIcon color="green" size="md" radius={0} variant="light">
                        <IconBrandWhatsapp size={20} />
                      </ThemeIcon>
                      <Title order={3}>{selectedGroup.name}</Title>
                      <Badge color={(selectedGroup.status === 'active' || selectedGroup.status === 'ACTIVE' || selectedGroup.isActive) ? 'green' : 'red'} variant="light">
                        {(selectedGroup.status === 'active' || selectedGroup.status === 'ACTIVE' || selectedGroup.isActive) ? 'Active' : 'Disabled'}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mt={4}>{selectedGroup.description || 'No description provided.'}</Text>
                  </Box>

                  <Group gap="xs">
                    <ActionIcon variant="light" color={(selectedGroup.status === 'active' || selectedGroup.status === 'ACTIVE' || selectedGroup.isActive) ? 'red' : 'green'} size="lg" radius={0} onClick={() => handleToggleStatus(selectedGroup.id || selectedGroup._id)}>
                      <IconPower size={18} />
                    </ActionIcon>
                    <Button size="xs" variant="light" color="green" radius={0} leftSection={<IconEdit size={14} />} onClick={() => handleOpenEditModal(selectedGroup)}>
                      Manage Members
                    </Button>
                    <ActionIcon variant="light" color="red" size="lg" radius={0} onClick={() => handlePromptDelete(selectedGroup)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Box mt="xs">
                  <Group gap="xs" mb="sm">
                    <IconUserPlus size={18} style={{ color: 'var(--mantine-color-green-6)' }} />
                    <Text fw={600} size="sm">Group Members ({selectedGroup.members?.length || 0})</Text>
                  </Group>

                  <Table highlightOnHover withTableBorder radius={0}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Member Name</Table.Th>
                        <Table.Th>Phone / Contact</Table.Th>
                        <Table.Th>Role</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedGroup.members?.map((m, idx) => {
                        const memberId = getMemberUserId(m);
                        const user = masterUsers.find((u) => String(u.id || u._id) === String(memberId));
                        
                        const name = user
                          ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email)
                          : `User (${memberId.substring(0, 6)}...)`;

                        const contact = user ? (user.phone || user.phoneNumber || user.email || '—') : '—';
                        const role = getMemberRole(m);
                        const isAdmin = role === 'ADMIN' || role === 'admin';

                        return (
                          <Table.Tr key={memberId || idx}>
                            <Table.Td>
                              <Group gap="sm">
                                <ThemeIcon size="sm" radius={0} color="green" variant="light">
                                  <Text size="xs" fw={700}>{name.charAt(0)}</Text>
                                </ThemeIcon>
                                <Text size="sm" fw={500}>{name}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">{contact}</Text>
                            </Table.Td>
                            <Table.Td>
                              {isAdmin ? (
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
        ) : (
          <Box style={{ gridColumn: 'span 8' }}>
            <Paper withBorder p="xl" radius={0} ta="center">
              <Text c="dimmed">Select a group from the list to view its details.</Text>
            </Paper>
          </Box>
        )}
      </SimpleGrid>

      {/* Create/Edit Modal */}
      <Modal opened={isModalOpen} onClose={() => !submitting && setIsModalOpen(false)} title={<Text fw={700} size="lg">{modalMode === 'create' ? 'Create WhatsApp Group' : 'Edit WhatsApp Group'}</Text>} size="lg" radius={0}>
        <form onSubmit={handleSaveGroup}>
          <Stack gap="md">
            <TextInput label="Group Name" required placeholder="e.g. Architecture Steering Board" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextInput label="Description" placeholder="Brief overview of group scope" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            <Box>
              <Text fw={600} size="xs" tt="uppercase" c="dimmed" mb={8}>Assign Members & Roles ({formData.members.length} Selected)</Text>
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
                        const contact = user.phone || user.phoneNumber || user.email || 'No contact info';

                        const memberRecord = formData.members.find((m) => String(m.userId) === userId);
                        const isSelected = !!memberRecord;
                        const isAdmin = memberRecord?.role === 'ADMIN' || memberRecord?.role === 'admin';

                        return (
                          <Flex key={userId} justify="space-between" align="center" p="xs" style={{ backgroundColor: isSelected ? 'var(--mantine-color-gray-0)' : undefined }}>
                            <Group gap="sm">
                              <Checkbox checked={isSelected} onChange={() => handleToggleUserSelection(userId)} color="green" />
                              <Box>
                                <Text size="sm" fw={500}>{name}</Text>
                                <Text size="xs" c="dimmed">{contact}</Text>
                              </Box>
                            </Group>

                            {isSelected && (
                              <Button size="xs" radius={0} variant={isAdmin ? 'light' : 'subtle'} color={isAdmin ? 'orange' : 'gray'} leftSection={<IconShield size={12} />} onClick={() => handleToggleUserRole(userId)}>
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
              <Button variant="default" radius={0} onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" color="green" radius={0} loading={submitting}>Save Changes</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <ConfirmDeleteModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete WhatsApp Group"
        message={`Are you sure you want to delete "${groupToDelete?.name || 'this group'}"? This action cannot be undone.`}
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