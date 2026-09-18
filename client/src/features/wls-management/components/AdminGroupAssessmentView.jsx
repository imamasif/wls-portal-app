import React from 'react';
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Avatar,
  Grid,
  ThemeIcon,
  Box,
  UnstyledButton,
  Button
} from '@mantine/core';
import {
  IconUsers,
  IconAward,
  IconCheck
} from '@tabler/icons-react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';

export function AdminGroupAssessmentView({
  assignedUsers = [],
  selectedUser,
  onSelectUser,
  criteriaList = [],
  scores = {},
  onScoreChange,
  onOpenSaveModal,
  getStatusBadge
}) {
  return (
    <Box w="100%" px="16px" py="12px" style={{ boxSizing: 'border-box' }}>
      <Card
        shadow="xs"
        padding="md"
        radius="lg"
        withBorder
        mb="lg"
        bg="blue.0"
        style={{ borderColor: 'var(--mantine-color-blue-2)' }}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="xl" color="blue" variant="filled">
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={800} size="lg" c="blue.9">
                Group Assessment Overview
              </Text>
              <Text size="xs" c="dimmed">
                Select a student avatar below to review video submissions and record evaluation scores.
              </Text>
            </Box>
          </Group>
          <Badge size="lg" color="blue" variant="filled">
            {assignedUsers.length} Students Assigned
          </Badge>
        </Group>
      </Card>

      <Grid gutter="md" mb="xl">
        {assignedUsers.map((user) => {
          const isSelected = selectedUser?.id === user.id;
          const userInitials = user.name
            ? user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'ST';

          return (
            <Grid.Col key={user.id} span={{ base: 6, sm: 4, md: 3, lg: 2 }}>
              <Card
                component={UnstyledButton}
                onClick={() => onSelectUser(user)}
                padding="sm"
                radius="md"
                withBorder
                bg={isSelected ? 'blue.0' : 'white'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-3)',
                  borderWidth: isSelected ? 2 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <Avatar
                  size="xl"
                  radius="xl"
                  color={isSelected ? 'blue' : 'gray'}
                  mb="xs"
                  style={{ border: isSelected ? '2px solid #1c7ed6' : 'none' }}
                >
                  {userInitials}
                </Avatar>

                <Text fw={700} size="sm" ta="center" lineClamp={1} c="dark">
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  Group {user.groupNumber}
                </Text>

                {getStatusBadge ? getStatusBadge(user.status) : <Badge size="xs">{user.status}</Badge>}
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>

      {selectedUser && (
        <Card shadow="xs" padding="xl" radius="lg" withBorder>
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <Avatar size="lg" radius="xl" color="blue">
                {selectedUser.name?.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Text size="xl" fw={800}>
                  {selectedUser.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedUser.email || `Student ID: ${selectedUser.id}`}
                </Text>
              </Box>
            </Group>
            {getStatusBadge && getStatusBadge(selectedUser.status)}
          </Group>

          <Group gap="xs" mb="md">
            <ThemeIcon size="lg" radius="xl" color="green" variant="light">
              <IconAward size={22} />
            </ThemeIcon>
            <Text fw={800} size="lg" c="green.7">
              Evaluation Criteria
            </Text>
          </Group>

          <Stack gap="md" mb="xl">
            {criteriaList.map((criterion, idx) => {
              const key =
                criterion.key ||
                criterion.code ||
                (typeof criterion === 'string' ? criterion : `criterion_${idx}`);
              const label =
                criterion.title ||
                criterion.criterion ||
                (typeof criterion === 'string' ? criterion : `Criteria ${idx + 1}`);

              return (
                <ColorScoreSlider
                  key={key}
                  label={label}
                  value={scores[key] !== undefined ? scores[key] : 1}
                  onChange={(val) => onScoreChange(key, val)}
                />
              );
            })}
          </Stack>

          <Button
            size="lg"
            color="blue"
            fullWidth
            leftSection={<IconCheck size={20} />}
            onClick={onOpenSaveModal}
            radius="md"
          >
            Submit Assessment Scores
          </Button>
        </Card>
      )}
    </Box>
  );
}

export default AdminGroupAssessmentView;