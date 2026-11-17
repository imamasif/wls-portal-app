import React, { useState } from 'react';
import { modals } from '@mantine/modals';
import { Text, Group, ThemeIcon, Stack, TextInput } from '@mantine/core';
import { IconTrash, IconUserCheck, IconUserOff, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { isSuperUserRole } from '../../../types/user';
import styles from './AdminUserControls.module.css';

export function AdminUserControls({ targetUser, currentUser, onUserUpdated, compact = false }) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isSuperUserRole(currentUser?.role)) return null;

  const targetId = targetUser?._id || targetUser?.id;
  const isSelf = Boolean(currentUser && (currentUser._id || currentUser.id) === targetId);

  const handleToggleStatus = (e) => {
    if (e) e.stopPropagation();
    const newStatus = targetUser.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';

    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color={newStatus === 'ACTIVE' ? 'teal' : 'orange'} variant="light" size="md" radius="md">
            {newStatus === 'ACTIVE' ? <IconUserCheck size={18} /> : <IconUserOff size={18} />}
          </ThemeIcon>
          <Text fw={700} size="md">
            {newStatus === 'ACTIVE' ? 'Activate User' : 'Deactivate User'}
          </Text>
        </Group>
      ),
      centered: true,
      children: (
        <Text size="sm">
          Mark <b>{targetUser.name || targetUser.email || 'this user'}</b> as <b>{newStatus}</b>?
        </Text>
      ),
      labels: { confirm: `Set as ${newStatus}`, cancel: 'Cancel' },
      confirmProps: { color: newStatus === 'ACTIVE' ? 'teal' : 'orange' },
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          const res = await fetch(`/api/users/${targetId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          if (res.ok) {
            if (onUserUpdated) onUserUpdated({ ...targetUser, status: newStatus });
          }
        } catch (err) {
          console.error('Failed to toggle status:', err);
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  const handleToggleRadar = (e) => {
    if (e) e.stopPropagation();
    const isCurrentlyRadar = targetUser.isUnderRadar;
    let commentValue = targetUser.radarComment || '';

    if (!isCurrentlyRadar) {
      modals.openConfirmModal({
        title: (
          <Group gap="xs">
            <ThemeIcon color="orange" variant="light" size="md" radius="md">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
            <Text fw={700} size="md">
              Set Under Radar Status
            </Text>
          </Group>
        ),
        centered: true,
        children: (
          <Stack gap="xs">
            <Text size="sm">
              Place <b>{targetUser.name || targetUser.email}</b> under observation/radar?
            </Text>
            <TextInput
              label="Comment / Reason (optional)"
              placeholder="e.g. Attendance observation, special tracking..."
              defaultValue={commentValue}
              onChange={(evt) => { commentValue = evt.target.value; }}
            />
          </Stack>
        ),
        labels: { confirm: 'Set Under Radar', cancel: 'Cancel' },
        confirmProps: { color: 'orange' },
        onConfirm: async () => {
          setIsUpdating(true);
          try {
            const res = await fetch(`/api/users/${targetId}/radar`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isUnderRadar: true, radarComment: commentValue }),
            });
            if (res.ok) {
              if (onUserUpdated) onUserUpdated({ ...targetUser, isUnderRadar: true, radarComment: commentValue });
            }
          } catch (err) {
            console.error('Failed to toggle radar:', err);
          } finally {
            setIsUpdating(false);
          }
        },
      });
    } else {
      modals.openConfirmModal({
        title: (
          <Group gap="xs">
            <ThemeIcon color="teal" variant="light" size="md" radius="md">
              <IconCheck size={18} />
            </ThemeIcon>
            <Text fw={700} size="md">
              Remove from Radar
            </Text>
          </Group>
        ),
        centered: true,
        children: (
          <Text size="sm">
            Remove <b>{targetUser.name || targetUser.email}</b> from Under Radar status?
          </Text>
        ),
        labels: { confirm: 'Remove from Radar', cancel: 'Cancel' },
        confirmProps: { color: 'teal' },
        onConfirm: async () => {
          setIsUpdating(true);
          try {
            const res = await fetch(`/api/users/${targetId}/radar`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isUnderRadar: false, radarComment: '' }),
            });
            if (res.ok) {
              if (onUserUpdated) onUserUpdated({ ...targetUser, isUnderRadar: false, radarComment: '' });
            }
          } catch (err) {
            console.error('Failed to toggle radar:', err);
          } finally {
            setIsUpdating(false);
          }
        },
      });
    }
  };

  const handleDeleteUser = (e) => {
    if (e) e.stopPropagation();
    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="md" radius="md">
            <IconTrash size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">
            Permanently Delete User
          </Text>
        </Group>
      ),
      centered: true,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Are you sure you want to permanently delete user <b>{targetUser.name || targetUser.email}</b>?
          </Text>
          <Text size="xs" c="dimmed">
            This action cannot be undone and will delete the user account and associated records.
          </Text>
        </Stack>
      ),
      labels: { confirm: 'Delete User Permanently', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          const res = await fetch(`/api/users/${targetId}`, { method: 'DELETE' });
          if (res.ok && onUserUpdated) {
            onUserUpdated(null, { deletedId: targetId });
          }
        } catch (err) {
          console.error('Failed to delete user:', err);
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          onClick={handleToggleStatus}
          disabled={isUpdating || isSelf}
          className={targetUser.status === 'INACTIVE' ? styles.btnCompactInactive : styles.btnCompactActive}
        >
          {targetUser.status === 'INACTIVE' ? 'Inactive' : 'Active'}
        </button>

        <button
          onClick={handleToggleRadar}
          disabled={isUpdating}
          className={targetUser.isUnderRadar ? styles.btnCompactRadarActive : styles.btnCompactRadar}
          title={targetUser.radarComment ? `Comment: ${targetUser.radarComment}` : 'Toggle Radar'}
        >
          {targetUser.isUnderRadar ? '📡 On' : '📡 Radar'}
        </button>

        {!isSelf && (
          <button
            onClick={handleDeleteUser}
            disabled={isUpdating}
            className={styles.btnCompactDelete}
            title="Delete User"
          >
            🗑️
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={handleToggleStatus}
          disabled={isUpdating || isSelf}
          className={targetUser.status === 'INACTIVE' ? styles.btnFullInactive : styles.btnFullActive}
          style={{ opacity: isSelf ? 0.6 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
        >
          ● {targetUser.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
        </button>

        <button
          onClick={handleToggleRadar}
          disabled={isUpdating}
          className={targetUser.isUnderRadar ? styles.btnFullRadarActive : styles.btnFullRadar}
        >
          📡 {targetUser.isUnderRadar ? 'Radar Active' : 'Radar Off'}
        </button>

        {!isSelf && (
          <button
            onClick={handleDeleteUser}
            disabled={isUpdating}
            className={styles.btnFullDelete}
          >
            🗑️ Delete
          </button>
        )}
      </div>

      {targetUser.isUnderRadar && (
        <div className={styles.radarCommentBox}>
          <strong className={styles.radarCommentTitle}>📡 Under Radar Reason:</strong>
          <p className={styles.radarCommentText}>
            {targetUser.radarComment || 'No comments specified.'}
          </p>
        </div>
      )}
    </div>
  );
}