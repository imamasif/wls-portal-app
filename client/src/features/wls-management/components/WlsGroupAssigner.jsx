import React, { useState } from 'react';
import { Accordion, Checkbox, Textarea, Card, Text, Title, Grid, Stack, Group, Badge, Tooltip } from '@mantine/core';
import { IconUsersGroup, IconUserCheck } from '@tabler/icons-react';
import { SliderCountSelector } from '../../../components/common/SliderCountSelector';
import { QuranVersePicker } from '../../../components/common/QuranVersePicker';

export function WlsGroupAssigner({ users = [], wlsAdmins = [], groupAssignments, onAssignmentsChange }) {
  const [groupCount, setGroupCount] = useState(1);

  const handleUserToggle = (groupIdx, userId) => {
    const isAssignedElsewhere = Object.entries(groupAssignments).some(([gIdx, data]) => {
      return Number(gIdx) !== groupIdx && data.userIds?.includes(userId);
    });

    if (isAssignedElsewhere) {
      alert('User is already assigned to another group in this WLS Session.');
      return;
    }

    const currentGroup = groupAssignments[groupIdx] || { userIds: [], adminIds: [], selectedAyats: [], instructions: '' };
    const exists = currentGroup.userIds.includes(userId);
    const updatedUserIds = exists
      ? currentGroup.userIds.filter((id) => id !== userId)
      : [...currentGroup.userIds, userId];

    onAssignmentsChange(groupIdx, { ...currentGroup, userIds: updatedUserIds });
  };

  const handleAdminToggle = (groupIdx, adminId) => {
    const currentGroup = groupAssignments[groupIdx] || { userIds: [], adminIds: [], selectedAyats: [], instructions: '' };
    const exists = currentGroup.adminIds.includes(adminId);
    const updatedAdminIds = exists
      ? currentGroup.adminIds.filter((id) => id !== adminId)
      : [...currentGroup.adminIds, adminId];

    onAssignmentsChange(groupIdx, { ...currentGroup, adminIds: updatedAdminIds });
  };

  const handleFieldChange = (groupIdx, field, value) => {
    const currentGroup = groupAssignments[groupIdx] || { userIds: [], adminIds: [], selectedAyats: [], instructions: '' };
    onAssignmentsChange(groupIdx, { ...currentGroup, [field]: value });
  };

  const renderUserCheckboxWithTooltip = (person, isChecked, onChange) => {
    const tooltipContent = (
      <Stack gap={2} p={2}>
        <Text size="xs" fw={700}>{person.name}</Text>
        <Text size="xs">📧 {person.email || 'N/A'}</Text>
        <Text size="xs">🏙️ {person.city || 'N/A'}</Text>
        <Text size="xs">🛡️ {person.role || 'User'}</Text>
      </Stack>
    );

    return (
      <Tooltip label={tooltipContent} position="top" withArrow withinPortal multiline>
        <div>
          <Checkbox
            label={person.name}
            checked={isChecked}
            onChange={onChange}
          />
        </div>
      </Tooltip>
    );
  };

  return (
    <Card withBorder padding="lg" radius="md">
      <Group gap="xs" mb="md">
        <IconUsersGroup size={20} color="var(--mantine-color-indigo-6)" />
        <Title order={4}>Group Configuration & Member Assignment</Title>
      </Group>
      
      <SliderCountSelector
        label="Total Groups to Create"
        min={1}
        max={100}
        value={groupCount}
        onChange={(val) => setGroupCount(val)}
      />

      <Accordion variant="separated" radius="md" mt="md">
        {Array.from({ length: groupCount }, (_, i) => {
          const groupIdx = i + 1;
          const assignedData = groupAssignments[groupIdx] || { userIds: [], adminIds: [], selectedAyats: [], instructions: '' };

          return (
            <Accordion.Item key={groupIdx} value={`group-${groupIdx}`}>
              <Accordion.Control>
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconUserCheck size={18} color="var(--mantine-color-teal-6)" />
                    <Text fw={600}>Group {groupIdx}</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" variant="light">{assignedData.userIds?.length || 0} Users</Badge>
                    <Badge color="grape" variant="light">{assignedData.adminIds?.length || 0} Admins</Badge>
                  </Group>
                </Group>
              </Accordion.Control>

              <Accordion.Panel>
                <Stack gap="md">
                  <div>
                    <Text fw={600} size="sm" mb="xs">Assign WLS-Admins (Monitoring)</Text>
                    <Grid>
                      {wlsAdmins.map((admin) => {
                        const adminId = admin._id || admin.id;
                        return (
                          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={adminId}>
                            {renderUserCheckboxWithTooltip(
                              admin,
                              assignedData.adminIds?.includes(adminId),
                              () => handleAdminToggle(groupIdx, adminId)
                            )}
                          </Grid.Col>
                        );
                      })}
                    </Grid>
                  </div>

                  <div>
                    <Text fw={600} size="sm" mb="xs">Assign Users & Students</Text>
                    <Grid>
                      {users.map((u) => {
                        const uId = u._id || u.id;
                        return (
                          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={uId}>
                            {renderUserCheckboxWithTooltip(
                              u,
                              assignedData.userIds?.includes(uId),
                              () => handleUserToggle(groupIdx, uId)
                            )}
                          </Grid.Col>
                        );
                      })}
                    </Grid>
                  </div>

                  <QuranVersePicker
                    selectedAyats={assignedData.selectedAyats || []}
                    onChange={(newAyats) => handleFieldChange(groupIdx, 'selectedAyats', newAyats)}
                  />

                  <Textarea
                    label="📝 Special Instructions & PDF Comments"
                    placeholder="E.g., Prepare recitation video for Verses 1-5. Refer to PDF pages 12-14."
                    rows={3}
                    value={assignedData.instructions || ''}
                    onChange={(e) => handleFieldChange(groupIdx, 'instructions', e.target.value)}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Card>
  );
}