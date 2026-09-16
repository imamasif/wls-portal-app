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
  IconVideo,
  IconAward,
  IconCheck,
  IconShieldCheck
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
    <Box sx={{ width: '100%', px: '16px', py: '12px', boxSizing: 'border-box' }}>
      {/* Group Header Banner */}
      <Card
        shadow="xs"
        padding="md"
        radius="lg"
        withBorder
        mb="lg"
        sx={(theme) => ({
          backgroundColor: theme.colors.blue[0],
          borderColor: theme.colors.blue[2]
        })}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="xl" color="blue" variant="filled">
              <IconUsers size={20} />
            </ThemeIcon>
            <Box>
              <Text weight={800} size="lg" color="blue.9">
                Group Assessment Overview
              </Text>
              <Text size="xs" color="dimmed">
                Select a student avatar below to review video submissions and record evaluation scores.
              </Text>
            </Box>
          </Group>
          <Badge size="lg" color="blue" variant="filled">
            {assignedUsers.length} Students Assigned
          </Badge>
        </Group>
      </Card>

      {/* Avatar Grid */}
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
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? theme.colors.blue[0] : theme.white,
                  borderColor: isSelected ? theme.colors.blue[5] : theme.colors.gray[3],
                  borderWidth: isSelected ? 2 : 1,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: isSelected ? theme.colors.blue[0] : theme.colors.gray[0]
                  }
                })}
              >
                <Avatar
                  size="xl"
                  radius="xl"
                  color={isSelected ? 'blue' : 'gray'}
                  mb="xs"
                  sx={{ border: isSelected ? '2px solid #1c7ed6' : 'none' }}
                >
                  {userInitials}
                </Avatar>

                <Text weight={700} size="sm" align="center" lineClamp={1} color="dark">
                  {user.name}
                </Text>
                <Text size="xs" color="dimmed" mb="xs">
                  Group {user.groupNumber}
                </Text>

                {getStatusBadge ? getStatusBadge(user.status) : <Badge size="xs">{user.status}</Badge>}
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>

      {/* Assessment Controls for Selected User */}
      {selectedUser && (
        <Card shadow="xs" padding="xl" radius="lg" withBorder>
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <Avatar size="lg" radius="xl" color="blue">
                {selectedUser.name?.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Text size="xl" weight={800}>
                  {selectedUser.name}
                </Text>
                <Text size="xs" color="dimmed">
                  {selectedUser.email || `Student ID: ${selectedUser.id}`}
                </Text>
              </Box>
            </Group>
            {getStatusBadge && getStatusBadge(selectedUser.status)}
          </Group>

          {/* Criteria Scoring */}
          <Group gap="xs" mb="md">
            <ThemeIcon size="lg" radius="xl" color="green" variant="light">
              <IconAward size={22} />
            </ThemeIcon>
            <Text weight={800} size="lg" color="green.7">
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