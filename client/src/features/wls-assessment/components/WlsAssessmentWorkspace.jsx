import React from 'react';
import { Card, Group, Stack, Text, Badge, TextInput, Button, ThemeIcon, Alert } from '@mantine/core';
import {
  IconClipboardCheck,
  IconAward,
  IconAlertTriangle,
  IconCircleCheck,
  IconShieldCheck,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';
import { WlsAdminComments } from './WlsAdminComments';

export function WlsAssessmentWorkspace({
  selectedUser,
  banner,
  onCloseBanner,
  activeVideoToRender,
  adminVideoUrl,
  onAdminVideoUrlChange,
  criteriaList,
  scores,
  onScoreChange,
  feedback,
  onFeedbackChange,
  messages,
  newMessageText,
  onNewMessageTextChange,
  onSendMessage,
  onOpenSaveModal,
  onRefresh
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge size="xs" color="green" variant="filled">COMPLETED</Badge>;
      case 'PARTIAL_SAVED':
        return <Badge size="xs" color="blue" variant="filled">PARTIAL SAVED</Badge>;
      case 'SUBMITTED':
        return <Badge size="xs" color="cyan" variant="light">SUBMITTED</Badge>;
      default:
        return <Badge size="xs" color="red" variant="light">MISSING</Badge>;
    }
  };

  if (!selectedUser) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        Select a user from the left sidebar to begin assessment.
      </Text>
    );
  }

  return (
    <Card shadow="xs" padding="xl" radius="lg" withBorder style={{ width: '100%' }}>
      <Group justify="space-between" mb="xl">
        <Group gap="sm">
          <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
            <IconClipboardCheck size={28} />
          </ThemeIcon>
          <Text size="xl" fw={800}>
            Assessment for:{' '}
            <Text component="span" c="blue">
              {selectedUser.name}
            </Text>
          </Text>
        </Group>
        {getStatusBadge(selectedUser.status)}
      </Group>

      {banner.show && (
        <Alert
          color={banner.type === 'success' ? 'green' : 'red'}
          title={banner.type === 'success' ? 'Success' : 'Error'}
          withCloseButton
          onClose={onCloseBanner}
          mb="md"
          radius="md"
        >
          {banner.message}
        </Alert>
      )}

      {!activeVideoToRender ? (
        <Alert
          icon={<IconAlertTriangle size={20} />}
          title="Missing Mandatory Video Submission"
          color="red"
          variant="filled"
          radius="md"
          mb="md"
        >
          This student has <strong>not submitted a video link</strong>. You cannot mark this assessment as <strong>COMPLETED</strong> until a valid video URL is provided by the student or entered in the Admin Override section.
        </Alert>
      ) : (
        <Alert
          icon={<IconCircleCheck size={20} />}
          title="Submission Received"
          color="green"
          variant="light"
          radius="md"
          mb="md"
        >
          Student video submission detected for evaluation.
        </Alert>
      )}

      {/* Admin Override Input */}
      <Card
        padding="lg"
        radius="md"
        withBorder
        mb="xl"
        bg="indigo.0"
        style={{ borderColor: 'var(--mantine-color-indigo-2)' }}
      >
        <Group gap="xs" mb="xs">
          <ThemeIcon size="md" radius="xl" color="indigo" variant="filled">
            <IconShieldCheck size={18} />
          </ThemeIcon>
          <Text fw={800} size="md" c="indigo.9">
            Admin Video Override & Submission Menu
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mb="md">
          Paste or overwrite a verified video link here if the user submitted an invalid link or sent it via external channels.
        </Text>

        <TextInput
          label="Admin Overridden Drive / Video Link:"
          placeholder="Paste official Google Drive link here..."
          value={adminVideoUrl}
          onChange={onAdminVideoUrlChange}
        />
      </Card>

      {/* Criteria Controls */}
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
          const key = criterion.key || criterion.code || (typeof criterion === 'string' ? criterion : `criterion_${idx}`);
          const label = criterion.title || criterion.criterion || (typeof criterion === 'string' ? criterion : `Criteria ${idx + 1}`);

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

      {/* Admin Comments & Thread Section */}
      <WlsAdminComments
        selectedUser={selectedUser}
        feedback={feedback}
        onFeedbackChange={onFeedbackChange}
        messages={messages}
        newMessageText={newMessageText}
        onNewMessageTextChange={onNewMessageTextChange}
        onSendMessage={onSendMessage}
        onRefresh={onRefresh}
      />

      {/* Submit Assessment Button */}
      <Button
        size="lg"
        color="blue"
        fullWidth
        leftSection={<IconDeviceFloppy size={20} />}
        onClick={onOpenSaveModal}
        radius="md"
      >
        Submit Assessment
      </Button>
    </Card>
  );
}