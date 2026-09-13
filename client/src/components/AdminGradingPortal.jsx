import React, { useState, useEffect } from 'react';
import { Card, Text, Button, NumberInput, Textarea, Grid, Group, Badge, AspectRatio } from '@mantine/core';
import { getEmbeddableDriveUrl } from '../utils/mediaUtils';

export function AdminGradingPortal({ evaluatorId }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [marks, setMarks] = useState({ presentation: 0, transferenceOfSpirit: 0, lightingAndCamera: 0, attire: 0, understanding: 0 });
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetch(`/api/assessments/evaluator/${evaluatorId}`)
      .then((res) => res.json())
      .then((data) => setSubmissions(data));
  }, [evaluatorId]);

  const handleGradeSubmit = async () => {
    if (!selectedSub) return;
    const res = await fetch(`/api/assessments/${selectedSub._id}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluatorId, marks, feedbackComments: feedback })
    });
    if (res.ok) {
      alert('Assessment graded successfully!');
      setSelectedSub(null);
    }
  };

  return (
    <Grid>
      <Grid.Col span={4}>
        <Text weight={700} mb="sm">Assigned Students Queue</Text>
        {submissions.map((sub) => (
          <Card key={sub._id} shadow="sm" p="lg" radius="md" withBorder mb="sm" onClick={() => { setSelectedSub(sub); setMarks(sub.marks || {}); setFeedback(sub.feedbackComments || ''); }}>
            <Group position="apart">
              <Text weight={500}>{sub.userId?.name}</Text>
              <Badge color={sub.marks?.presentation > 0 ? 'green' : 'orange'}>{sub.marks?.presentation > 0 ? 'Graded' : 'Pending'}</Badge>
            </Group>
            <Text size="sm" color="dimmed">Session: {sub.sessionId?.title}</Text>
          </Card>
        ))}
      </Grid.Col>
      <Grid.Col span={8}>
        {selectedSub ? (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text weight={700} size="lg" mb="md">Grading: {selectedSub.userId?.name}</Text>
            <AspectRatio ratio={16 / 9} mb="md">
              <iframe src={getEmbeddableDriveUrl(selectedSub.videoUrl)} title="Student Submission" allowFullScreen />
            </AspectRatio>
            <Grid mb="md">
              {Object.keys(marks).map((key) => (
                <Grid.Col span={6} key={key}>
                  <NumberInput label={key.toUpperCase()} min={0} max={10} value={marks[key]} onChange={(val) => setMarks({ ...marks, [key]: val })} />
                </Grid.Col>
              ))}
            </Grid>
            <Textarea label="Feedback & Comments" value={feedback} onChange={(e) => setFeedback(e.currentTarget.value)} mb="md" />
            <Button onClick={handleGradeSubmit} fullWidth color="blue">Save Evaluation</Button>
          </Card>
        ) : (
          <Card shadow="sm" p="lg" radius="md" withBorder><Text align="center">Select a student from the left queue to evaluate</Text></Card>
        )}
      </Grid.Col>
    </Grid>
  );
}