import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Paper,
  Stack,
  Card,
  Group,
  Avatar,
  Text,
  Title,
  Button,
  Grid,
  Badge,
  Anchor
} from '@mantine/core';
import {
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandGithub,
  IconLink,
  IconPhone,
  IconMapPin,
  IconPencil,
  IconExternalLink
} from '@tabler/icons-react';
import { EditProfileCard } from './EditProfileCard';
import { AdminUserControls } from './AdminUserControls';
import { UserGroupMemberships } from './UserGroupMemberships';

const SocialIcon = ({ platform }) => {
  const normalized = (platform || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.includes('linkedin')) return <IconBrandLinkedin size={16} color="#0a66c2" />;
  if (normalized.includes('youtube')) return <IconBrandYoutube size={16} color="#ff0000" />;
  if (normalized.includes('facebook')) return <IconBrandFacebook size={16} color="#1877f2" />;
  if (normalized.includes('twitter') || normalized.includes('x')) return <IconBrandTwitter size={16} color="#1da1f2" />;
  if (normalized.includes('github')) return <IconBrandGithub size={16} color="#333" />;

  return <IconLink size={16} />;
};

export function UserProfileDetail({ overrideUser, onUserUpdated }) {
  const { user: authUser, saveUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const user = overrideUser || authUser;

  if (!user) return null;

  if (isEditing) {
    return (
      <EditProfileCard
        targetUser={user}
        onCancel={() => setIsEditing(false)}
        onSaveSuccess={(updatedData) => {
          setIsEditing(false);
          saveUserData(updatedData);
          if (onUserUpdated) onUserUpdated(updatedData);
        }}
      />
    );
  }

  const driveUrl = user.driveFolderPath || user.drive;

  const displayRole = user.profession
    ? user.profession
    : user.role === 'SUPER_USER' || user.role === 'SUPER_USER'
      ? 'Super User'
      : 'User';

  const userInitials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  const userId = user._id || user.id;

  return (
    <Stack gap="lg">
      {/* Primary Profile Details Card */}
      <Card withBorder padding="lg" radius="md" shadow="xs">
        <Stack gap="lg">
          {/* Header Row */}
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap="md">
              <Avatar
                src={user.profilePictureUrl}
                alt={user.name}
                size={72}
                radius="xl"
                color="blue"
              >
                {userInitials}
              </Avatar>

              <Stack gap={2}>
                <Title order={2} fw={700}>
                  {user.name || user.email?.split('@')[0]}
                </Title>
                <Text size="sm" c="dimmed" fw={500}>
                  {displayRole}
                </Text>
                <Group gap={4} mt={4}>
                  <IconMapPin size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
                  <Text size="xs" c="dimmed">
                    {user.city ? `${user.city}, ` : ''}
                    {user.state ? `${user.state}, ` : ''}
                    {user.country || 'Canada'}
                  </Text>
                </Group>
              </Stack>
            </Group>

            <Stack gap="xs" align="flex-end">
              <Button
                variant="light"
                color="blue"
                size="xs"
                leftSection={<IconPencil size={14} />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>

              <AdminUserControls
                targetUser={user}
                currentUser={authUser}
                compact={false}
                onUserUpdated={(updatedUser, meta) => {
                  if (meta?.deletedId) {
                    if (onUserUpdated) onUserUpdated(null);
                  } else if (onUserUpdated) {
                    onUserUpdated(updatedUser);
                  }
                }}
              />
            </Stack>
          </Group>

          {/* Details Grid */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Timezone Difference
              </Text>
              <Text size="sm" fw={500} mt={2}>
                Same time as Toronto (America/Toronto)
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Highest Education
              </Text>
              <Text size="sm" fw={500} mt={2}>
                {user.education || 'Not provided'}
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Email
              </Text>
              <Text size="sm" fw={500} mt={2}>
                {user.email}
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Phone / Mobile Numbers
              </Text>
              {user.phones && user.phones.length > 0 ? (
                <Stack gap={4} mt={4}>
                  {user.phones.map((p, idx) => (
                    <Group key={idx} gap={6}>
                      <IconPhone size={14} style={{ color: 'var(--mantine-color-blue-6)' }} />
                      <Text size="sm" fw={500}>
                        <Text component="span" fw={700}>{p.type || 'Phone'}:</Text> {p.number}
                      </Text>
                      {p.isPrimary && (
                        <Badge size="xs" color="blue" variant="light">
                          Primary
                        </Badge>
                      )}
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" fw={500} mt={2}>
                  {user.phone || 'N/A'}
                </Text>
              )}
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Drive Shared Folder
              </Text>
              <Text size="sm" fw={500} mt={2}>
                {driveUrl ? (
                  <Anchor
                    href={driveUrl.startsWith('http') ? driveUrl : `https://${driveUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    fw={600}
                  >
                    <Group gap={4} wrap="nowrap">
                      <span>Open Shared Drive</span>
                      <IconExternalLink size={14} />
                    </Group>
                  </Anchor>
                ) : (
                  'Not connected'
                )}
              </Text>
            </Grid.Col>
          </Grid>

          {/* Cause Support Section */}
          {user.causeContribution && (
            <Paper p="sm" withBorder radius="sm" bg="gray.0">
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>
                How I Can Help in Cause
              </Text>
              <Text size="sm">{user.causeContribution}</Text>
            </Paper>
          )}

          {/* Social Handles Section */}
          {user.socialMedia && user.socialMedia.length > 0 && (
            <Stack gap={6}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Social Profiles
              </Text>
              <Group gap="xs">
                {user.socialMedia.map((sm, i) => {
                  if (!sm.handleUrl) return null;

                  const href = sm.handleUrl.startsWith('http')
                    ? sm.handleUrl
                    : `https://${sm.handleUrl}`;

                  return (
                    <Anchor
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      underline="none"
                    >
                      <Paper p="xs" withBorder radius="sm" style={{ cursor: 'pointer' }}>
                        <Group gap={6}>
                          <SocialIcon platform={sm.platform} />
                          <Text size="xs" fw={600}>
                            {sm.platform || 'Link'}:
                          </Text>
                          <Text size="xs" c="dimmed">
                            {sm.handleUrl}
                          </Text>
                        </Group>
                      </Paper>
                    </Anchor>
                  );
                })}
              </Group>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Interactive Group Assignment & Membership Management Component */}
      <Paper p="lg" radius="md" bg="white" shadow="xs" withBorder>
        <UserGroupMemberships userId={userId} />
      </Paper>
    </Stack>
  );
}