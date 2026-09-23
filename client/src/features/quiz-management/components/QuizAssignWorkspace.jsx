import React, { useState } from 'react';
import { Box, Title, Text, Card, Select, MultiSelect, Button, Stack, Group, Divider } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

export function QuizAssignWorkspace({ quizzes = [], users = [], onAssign }) {
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const handleAssignSubmit = () => {
    if (!selectedQuizId || selectedUserIds.length === 0) {
      alert("Please select a quiz and at least one user.");
      return;
    }
    onAssign({ quizId: selectedQuizId, userIds: selectedUserIds });
    alert("Quiz successfully assigned!");
  };

  return (
    <Box maw={600} mx="auto" p="md">
      <Title order={2} mb="xs">Assign Quizzes to Users</Title>
      <Text size="sm" c="dimmed" mb="xl">Select a published assessment and target users who should take it.</Text>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Select
            label="Select Quiz"
            placeholder="Choose a quiz..."
            data={quizzes.map(q => ({ value: q.id, label: q.title }))}
            value={selectedQuizId}
            onChange={setSelectedQuizId}
            required
          />

          <MultiSelect
            label="Assign to Users"
            placeholder="Select users or groups"
            data={users.map(u => ({ value: u.id, label: u.name }))}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            required
          />

          <Button 
            leftSection={<IconSend size={16} />} 
            color="blue" 
            mt="md" 
            onClick={handleAssignSubmit}
          >
            Deploy / Assign Quiz
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}