import React from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export function ConfirmDeleteModal({ opened, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="md" radius={0}>
            <IconAlertTriangle size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">
            {title || 'Confirm Action'}
          </Text>
        </Group>
      }
      centered
      radius={0}
      size="sm"
      withCloseButton={!loading}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {message || 'Are you sure you want to perform this action? This cannot be undone.'}
        </Text>

        <Group justify="flex-end" gap="xs" mt="xs">
          <Button
            variant="default"
            radius={0}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            radius={0}
            onClick={onConfirm}
            loading={loading}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}