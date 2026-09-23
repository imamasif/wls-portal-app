import React, { useState } from 'react';
import { 
  Paper, TextInput, Textarea, Select, Button, Group, Text, 
  NumberInput, ActionIcon, Radio, Checkbox, Box, Image, Badge, SimpleGrid, Stack 
} from '@mantine/core';
import { 
  IconPlus, IconTrash, IconDeviceFloppy, IconCheck 
} from '@tabler/icons-react';
import { quizApi } from '../api/quizApi';

export default function QuizCreatorStudio({ onQuizCreated }) {
  const [title, setTitle] = useState('New Weekly Assessment');
  const [description, setDescription] = useState('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      questionType: 'SINGLE_SELECT',
      imageUrl: '',
      options: ['', '', '', ''],
      optionImages: ['', '', '', ''],
      correctAnswers: [],
      points: 5
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const currentQ = questions[activeQuestionIndex] || questions[0];

  const handleImageCapture = (e, callback) => {
    const file = e.target.files?.[0] || Array.from(e.clipboardData?.files || [])[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const updateCurrentQuestion = (field, value) => {
    const updated = [...questions];
    updated[activeQuestionIndex][field] = value;
    if (field === 'questionType') {
      updated[activeQuestionIndex].correctAnswers = [];
      if (value === 'TRUE_FALSE') {
        updated[activeQuestionIndex].options = ['True', 'False'];
      }
    }
    setQuestions(updated);
  };

  const handleSaveCurrentQuestionLocally = () => {
    setSuccessmsgTimeout(`Question #${activeQuestionIndex + 1} added/saved to queue!`);
    // Automatically jump to next question or show success feedback
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    } else {
      addQuestion();
    }
  };

  const setSuccessmsgTimeout = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const addQuestion = () => {
    const newQuestions = [
      ...questions,
      {
        questionText: '',
        questionType: 'SINGLE_SELECT',
        imageUrl: '',
        options: ['', '', '', ''],
        optionImages: ['', '', '', ''],
        correctAnswers: [],
        points: 5
      }
    ];
    setQuestions(newQuestions);
    setActiveQuestionIndex(newQuestions.length - 1);
  };

  const removeCurrentQuestion = () => {
    if (questions.length === 1) {
      setError('You must keep at least one question in the quiz.');
      return;
    }
    const updated = questions.filter((_, i) => i !== activeQuestionIndex);
    setQuestions(updated);
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
    setError(null);
  };

  const updateOptionText = (oIndex, text) => {
    const updated = [...questions];
    updated[activeQuestionIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const addOption = () => {
    const updated = [...questions];
    updated[activeQuestionIndex].options.push('');
    updated[activeQuestionIndex].optionImages.push('');
    setQuestions(updated);
  };

  const removeOption = (oIndex) => {
    const updated = [...questions];
    const q = updated[activeQuestionIndex];
    const optionValToRemove = q.options[oIndex];

    q.options = q.options.filter((_, i) => i !== oIndex);
    q.correctAnswers = q.correctAnswers.filter(ans => ans !== optionValToRemove);
    setQuestions(updated);
  };

  const handleCorrectAnswerToggle = (optText) => {
    if (!optText.trim()) return;
    const updated = [...questions];
    const q = updated[activeQuestionIndex];

    if (q.questionType === 'SINGLE_SELECT' || q.questionType === 'TRUE_FALSE') {
      q.correctAnswers = [optText];
    } else if (q.questionType === 'MULTIPLE_SELECT') {
      if (q.correctAnswers.includes(optText)) {
        q.correctAnswers = q.correctAnswers.filter(a => a !== optText);
      } else {
        q.correctAnswers.push(optText);
      }
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        title,
        description,
        isPublished: true,
        createdBy: "super_user", // Set to super_user or your auth user variable
        questions: questions.map(q => ({
          ...q,
          points: Number(q.points) || 5
        }))
      };

      await quizApi.createQuiz(payload);
      setSuccessMsg('Quiz successfully created and published!');
      if (onQuizCreated) onQuizCreated();
    } catch (err) {
      setError(err.message || 'Failed to publish quiz');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box style={{ backgroundColor: '#f8fafc', minHeight: '85vh', padding: '16px', borderRadius: '16px' }}>
      {error && (
        <Paper p="sm" bg="red.0" c="red.8" radius="md" mb="md" withBorder>
          <Text size="sm">⚠️ {error}</Text>
        </Paper>
      )}

      {successMsg && (
        <Paper p="sm" bg="teal.0" c="teal.8" radius="md" mb="md" withBorder>
          <Text size="sm">✅ {successMsg}</Text>
        </Paper>
      )}

      {/* Top Header Card: Quiz Title & Final Publish Action */}
      <Paper p="md" radius="md" shadow="xs" withBorder mb="lg">
        <Group justify="space-between" align="center" mb="sm">
          <Box style={{ flex: 1, maxWidth: '400px' }}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Quiz Title</Text>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Quiz Title..."
              size="md"
              required
            />
          </Box>
          <Group gap="sm">
            <Badge variant="light" color="violet" size="lg">Editing Q{activeQuestionIndex + 1} of {questions.length}</Badge>
            <Button 
              color="violet" 
              size="sm" 
              loading={loading}
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSubmit}
            >
              Save & Publish Entire Quiz
            </Button>
          </Group>
        </Group>

        {/* Question Pagination Pills Bar */}
        <Group gap="xs" mt="md">
          {questions.map((_, idx) => (
            <Button
              key={idx}
              size="compact-sm"
              variant={activeQuestionIndex === idx ? 'filled' : 'light'}
              color={activeQuestionIndex === idx ? 'violet' : 'gray'}
              onClick={() => setActiveQuestionIndex(idx)}
              radius="xl"
            >
              Q{idx + 1}
            </Button>
          ))}
          <Button 
            size="compact-sm" 
            variant="subtle" 
            color="violet" 
            leftSection={<IconPlus size={14} />} 
            onClick={addQuestion}
          >
            Add Question
          </Button>
        </Group>
      </Paper>

      {/* Main Builder Panel */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {/* Left Sidebar Menu / Config */}
        <Paper p="md" radius="md" shadow="xs" withBorder style={{ height: 'fit-content' }}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">Question Config</Text>
          <Stack gap="sm">
            <Select
              label="Question Type"
              data={[
                { value: 'SINGLE_SELECT', label: 'Single Choice (Radio)' },
                { value: 'MULTIPLE_SELECT', label: 'Multiple Selection' },
                { value: 'TRUE_FALSE', label: 'True / False' },
                { value: 'SHORT_ANSWER', label: 'Short Answer / Text' }
              ]}
              value={currentQ.questionType}
              onChange={(val) => updateCurrentQuestion('questionType', val)}
            />
            <NumberInput
              label="Points"
              min={1}
              value={currentQ.points}
              onChange={(val) => updateCurrentQuestion('points', val)}
            />
            <Button 
              color="red" 
              variant="light" 
              size="xs" 
              leftSection={<IconTrash size={14} />}
              onClick={removeCurrentQuestion}
              disabled={questions.length <= 1}
              mt="md"
            >
              Delete Question #{activeQuestionIndex + 1}
            </Button>
          </Stack>
        </Paper>

        {/* Center / Right Main Editor Stage */}
        <Paper p="xl" radius="md" shadow="xs" withBorder style={{ gridColumn: 'span 2' }}>
          <Group justify="space-between" mb="md">
            <Text fw={700} size="md" c="indigo.9">Question #{activeQuestionIndex + 1} Details</Text>
            <Group gap="xs">
              <Button 
                size="xs" 
                color="teal" 
                variant="light" 
                leftSection={<IconCheck size={14} />}
                onClick={handleSaveCurrentQuestionLocally}
              >
                Save Question to Quiz
              </Button>
              <ActionIcon color="red" variant="subtle" onClick={removeCurrentQuestion} title="Delete Question">
                <IconTrash size={18} />
              </ActionIcon>
            </Group>
          </Group>

          <Textarea
            label="Question Text"
            placeholder="Type your question here... (Supports Ctrl+V image pasting)"
            required
            autosize
            minRows={2}
            value={currentQ.questionText}
            onChange={(e) => updateCurrentQuestion('questionText', e.target.value)}
            onPaste={(e) => handleImageCapture(e, (img) => updateCurrentQuestion('imageUrl', img))}
            mb="md"
          />

          {currentQ.imageUrl && (
            <Box pos="relative" mb="md" w={160} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px' }}>
              <Image src={currentQ.imageUrl} h={100} radius="md" fit="contain" />
              <ActionIcon size="xs" color="red" variant="filled" pos="absolute" top={4} right={4} onClick={() => updateCurrentQuestion('imageUrl', '')}>×</ActionIcon>
            </Box>
          )}

          {/* Options / Choices Builder */}
          {currentQ.questionType !== 'SHORT_ANSWER' && (
            <Box mt="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                Answer Choices (Click indicator to mark correct answer)
              </Text>
              
              <Stack gap="xs">
                {currentQ.options.map((opt, oIndex) => {
                  const isCorrect = currentQ.correctAnswers.includes(opt) && opt !== '';
                  return (
                    <Group 
                      key={oIndex} 
                      p="xs" 
                      bg={isCorrect ? 'teal.0' : 'gray.0'} 
                      style={{ border: `1px solid ${isCorrect ? 'var(--mantine-color-teal-4)' : 'var(--mantine-color-gray-3)'}`, borderRadius: '8px' }}
                    >
                      {currentQ.questionType === 'MULTIPLE_SELECT' ? (
                        <Checkbox 
                          checked={isCorrect} 
                          onChange={() => handleCorrectAnswerToggle(opt)} 
                        />
                      ) : (
                        <Radio 
                          checked={isCorrect} 
                          name="correct-radio" 
                          onChange={() => handleCorrectAnswerToggle(opt)} 
                        />
                      )}

                      <TextInput
                        variant="unstyled"
                        placeholder={`Option ${oIndex + 1}`}
                        style={{ flex: 1 }}
                        value={opt}
                        onChange={(e) => updateOptionText(oIndex, e.target.value)}
                      />

                      {isCorrect && <IconCheck size={18} color="teal" />}

                      {currentQ.options.length > 2 && currentQ.questionType !== 'TRUE_FALSE' && (
                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => removeOption(oIndex)} title="Delete Option">
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  );
                })}

                {currentQ.questionType !== 'TRUE_FALSE' && (
                  <Button variant="light" color="violet" size="xs" leftSection={<IconPlus size={14} />} onClick={addOption} mt="xs" w="fit-content">
                    Add Option Choice
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          {currentQ.questionType === 'SHORT_ANSWER' && (
            <TextInput
              label="Expected Correct Text Answer"
              placeholder="Enter exact correct string..."
              value={currentQ.correctAnswers[0] || ''}
              onChange={(e) => {
                const updated = [...questions];
                updated[activeQuestionIndex].correctAnswers = [e.target.value];
                setQuestions(updated);
              }}
              mt="md"
            />
          )}
        </Paper>
      </SimpleGrid>
    </Box>
  );
}