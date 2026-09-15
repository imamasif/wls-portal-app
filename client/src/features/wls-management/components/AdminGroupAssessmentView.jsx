import React, { useState } from 'react';
import { Stack, Group, Button, Title, Text, Paper } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { AdminStudentAssessmentCard } from './AdminStudentAssessmentCard';

export function AdminGroupAssessmentView({ session, assignedStudents, onSaveAssessment }) {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <Stack gap="md">
      <Paper p="md" withBorder shadow="xs" radius="md">
        <Group justify="space-between">
          <div>
            <Title order={4} c="indigo.9">{session.topicName}</Title>
            <Text size="xs" c="dimmed">
              Assigned Group Students: {assignedStudents.length}
            </Text>
          </div>

          <Button 
            variant="light" 
            size="xs"
            leftSection={expandAll ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            onClick={() => setExpandAll((prev) => !prev)}
          >
            {expandAll ? 'Collapse All Cards' : 'Expand All Cards'}
          </Button>
        </Group>
      </Paper>

      {/* Assigned Student Cards */}
      {assignedStudents.map((student) => (
        <AdminStudentAssessmentCard
          key={student.id || student._id}
          student={student}
          assignedAyats={student.assignedAyats}
          deadline={session.videoDeadline}
          onSaveAssessment={onSaveAssessment}
        />
      ))}
    </Stack>
  );
}