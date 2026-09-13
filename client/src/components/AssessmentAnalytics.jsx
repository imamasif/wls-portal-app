import React, { useState, useEffect } from 'react';
import { Card, Text, SimpleGrid } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function AssessmentAnalytics() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('/api/assessments')
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item) => ({
          name: item.userId?.name || 'Unknown',
          presentation: item.marks?.presentation || 0,
          understanding: item.marks?.understanding || 0,
          camera: item.marks?.lightingAndCamera || 0,
          attire: item.marks?.attire || 0
        }));
        setChartData(formatted);
      });
  }, []);

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Text weight={700} size="lg" mb="md">Performance Metrics Overview</Text>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Bar dataKey="presentation" fill="#339af0" name="Presentation" />
          <Bar dataKey="understanding" fill="#51cf66" name="Understanding" />
          <Bar dataKey="camera" fill="#cc5de8" name="Camera & Lighting" />
          <Bar dataKey="attire" fill="#ff922b" name="Attire" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}