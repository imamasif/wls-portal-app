import React, { useState } from 'react';
import { Box, Title, Text, Card, Group, Badge, Button, Stack, Accordion, SimpleGrid } from '@mantine/core';
import { IconBookOpen, IconClock, IconArrowRight, IconCheckCircle } from '@tabler/icons-react';

export function QuizPortal({ assignedQuizzes = [], onStartQuiz }) {
  return (
    <Box maw={1100} mx="auto" p="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>My Assigned Quizzes</Title>
          <Text size="sm" c="dimmed">Click on any assessment card to view details or start the quiz.</Text>
        </div>
      </Group>

      {assignedQuizzes.length === 0 ? (
        <Card padding="xl" radius="md" withBorder ta="center">
          <Text c="dimmed">No quizzes assigned to you right now.</Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {assignedQuizzes.map((quiz) => (
            <Card key={quiz.id} shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#ffffff' }}>
              <Stack justify="space-between" h="100%">
                <div>
                  <Group justify="space-between" mb="xs">
                    <Badge color={quiz.completed ? 'green' : 'blue'} variant="light">
                      {quiz.completed ? 'Completed' : 'Pending'}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {quiz.questionsCount || 0} Questions
                    </Text>
                  </Group>

                  <Text fw={700} size="lg" mb={6}>{quiz.title}</Text>

                  {/* Collapsible Panel for Description & Details */}
                  <Accordion variant="separated" radius="sm" mt="sm">
                    <Accordion.Item value="details">
                      <Accordion.Control>
                        <Text size="xs" fw={500}>View Description</Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text size="sm" c="dimmed">
                          {quiz.description || 'No description provided for this assessment.'}
                        </Text>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </div>

                <Button 
                  variant={quiz.completed ? 'outline' : 'filled'} 
                  color={quiz.completed ? 'gray' : 'blue'}
                  fullWidth 
                  mt="md"
                  rightSection={quiz.completed ? <IconCheckCircle size={16} /> : <IconArrowRight size={16} />}
                  onClick={() => onStartQuiz(quiz.id)}
                >
                  {quiz.completed ? 'Review Quiz' : 'Start Quiz'}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}