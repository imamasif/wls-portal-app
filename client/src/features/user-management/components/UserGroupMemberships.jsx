import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Button, Select, Group, SimpleGrid, Card, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconBrandWhatsapp, IconBrandTeams, IconSchool, IconPlus, IconTrash } from '@tabler/icons-react';

const CATEGORY_CONFIG = {
  WHATSAPP: {
    title: 'WhatsApp Groups',
    icon: <IconBrandWhatsapp size={24} color="#25D366" />,
    roles: ['WHATSAPP_GROUP_ADMIN', 'WHATSAPP_GROUP_USER']
  },
  TEAMS: {
    title: 'Microsoft Teams Channels',
    icon: <IconBrandTeams size={24} color="#6264A7" />,
    roles: ['TEAMS_CHANNEL_ADMIN', 'TEAMS_CHANNEL_MEMBER']
  },
  UNIVERSITY: {
    title: 'Online University Batches',
    icon: <IconSchool size={24} color="#228BE6" />,
    roles: ['UNIVERSITY_FACULTY', 'UNIVERSITY_STUDENT']
  }
};

export function UserGroupMemberships({ userId }) {
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeCategory, setActiveCategory] = useState('WHATSAPP');

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/social-groups');
      const data = await res.json();
      if (res.ok) setAllGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) fetchGroups();
  }, [userId]);

  const assignedGroups = allGroups.filter((g) =>
    g.members?.some((m) => (m.userId?._id || m.userId) === userId)
  );

  const handleAddUserToGroup = async () => {
    if (!selectedGroup || !selectedRole) return;
    try {
      const group = allGroups.find((g) => g._id === selectedGroup);
      const updatedMembers = [...(group.members || []), { userId, role: selectedRole }];

      const res = await fetch(`/api/social-groups/${selectedGroup}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      });

      if (res.ok) {
        fetchGroups();
        setSelectedGroup(null);
        setSelectedRole(null);
      }
    } catch (err) {
      console.error('Error assigning user to group:', err);
    }
  };

  const handleRemoveUserFromGroup = async (groupId) => {
    try {
      const group = allGroups.find((g) => g._id === groupId);
      const updatedMembers = group.members.filter(
        (m) => (m.userId?._id || m.userId) !== userId
      );

      const res = await fetch(`/api/social-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      });

      if (res.ok) fetchGroups();
    } catch (err) {
      console.error('Error removing user:', err);
    }
  };

  return (
    <Stack gap="md" mt="xl">
      <Group justify="space-between">
        <Title order={3}>Community & Social Memberships</Title>
        <Badge color="teal" size="lg">{assignedGroups.length} ACTIVE GROUPS</Badge>
      </Group>

      {/* Assign Member Form */}
      <Paper p="md" withBorder radius="md" bg="gray.0">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">Assign User to Group</Text>
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="sm">
          <Select
            placeholder="Platform"
            data={[
              { value: 'WHATSAPP', label: 'WhatsApp Groups' },
              { value: 'TEAMS', label: 'MS Teams Channels' },
              { value: 'UNIVERSITY', label: 'University Batches' }
            ]}
            value={activeCategory}
            onChange={(val) => {
              setActiveCategory(val);
              setSelectedGroup(null);
              setSelectedRole(null);
            }}
          />

          <Select
            placeholder="Select Group..."
            data={allGroups
              .filter((g) => g.type?.toUpperCase() === activeCategory)
              .map((g) => ({ value: g._id, label: g.name }))}
            value={selectedGroup}
            onChange={setSelectedGroup}
          />

          <Select
            placeholder="Select Role..."
            data={CATEGORY_CONFIG[activeCategory].roles.map((r) => ({ value: r, label: r }))}
            value={selectedRole}
            onChange={setSelectedRole}
          />

          <Button
            color="teal"
            leftSection={<IconPlus size={16} />}
            disabled={!selectedGroup || !selectedRole}
            onClick={handleAddUserToGroup}
          >
            Assign Member
          </Button>
        </SimpleGrid>
      </Paper>

      {/* Membership Cards Grid */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {Object.entries(CATEGORY_CONFIG).map(([typeKey, cfg]) => {
          const typeMemberships = assignedGroups.filter(
            (g) => g.type?.toUpperCase() === typeKey
          );

          return (
            <Card key={typeKey} withBorder padding="md" radius="md">
              <Group gap="xs" mb="sm">
                {cfg.icon}
                <Text fw={700} size="sm">{cfg.title}</Text>
              </Group>

              {typeMemberships.length === 0 ? (
                <Text size="xs" c="dimmed" fs="italic">No assigned groups found for this user.</Text>
              ) : (
                <Stack gap="xs">
                  {typeMemberships.map((group) => {
                    const memberRecord = group.members.find(
                      (m) => (m.userId?._id || m.userId) === userId
                    );

                    return (
                      <Paper key={group._id} p="xs" withBorder radius="sm" bg="white">
                        <Group justify="space-between">
                          <div>
                            <Text size="sm" fw={600}>{group.name}</Text>
                            <Badge size="xs" variant="light" color="gray">
                              {memberRecord?.role || 'MEMBER'}
                            </Badge>
                          </div>
                          <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveUserFromGroup(group._id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}