// client/src/features/university/components/StudentCourseView.jsx
import React, { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Box,
  Slider,
  Checkbox,
  Badge,
  Loader,
  Center,
  Accordion,
  ThemeIcon,
  NumberInput,
  Stack,
} from "@mantine/core";
import {
  IconBook2,
  IconVideo,
  IconClock,
  IconChecklist,
} from "@tabler/icons-react";
import { universityApi } from "../api/universityApi";

export function StudentCourseView({ studentId, courseId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = async () => {
    try {
      const res = await universityApi.getStudentCourseProgress(
        studentId,
        courseId,
      );
      setData(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load course progress");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [studentId, courseId]);

  // Handle updating progress when user interacts with sliders or checkboxes
  const handleUpdate = async (
    lectureId,
    watchedMinutes,
    isCompleted,
    maxDuration,
  ) => {
    // Ensure watched minutes don't exceed max lecture duration
    const clampedMinutes = Math.min(
      Math.max(0, Number(watchedMinutes)),
      maxDuration,
    );

    try {
      await universityApi.updateLectureProgress({
        studentId,
        courseId,
        lectureId,
        watchedMinutes: clampedMinutes,
        isCompleted,
      });
      fetchProgress();
    } catch (err) {
      alert(
        "Failed to update progress: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  if (loading)
    return (
      <Center py={100}>
        <Loader color="teal" size="lg" />
      </Center>
    );
  if (error) return <Text c="red">Error: {error}</Text>;

  const { course, progress } = data;

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
  };

  return (
    <Paper p="xl" radius="lg" withBorder shadow="md" bg="gray.0">
      {/* Course Header & Total Coverage Summary */}
      <Group
        justify="space-between"
        mb="xl"
        pb="md"
        style={{ borderBottom: "2px solid var(--mantine-color-gray-2)" }}
      >
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="teal" variant="light">
            <IconBook2 size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} c="dark.8">
              {course.title}
            </Title>
            <Text size="sm" c="dimmed">
              Semester: {course.semester} | Language:{" "}
              <Text span c="teal.7" fw={600}>
                {course.language}
              </Text>
            </Text>
          </div>
        </Group>
        <Paper
          p="sm"
          radius="md"
          withBorder
          bg="white"
          shadow="xs"
          style={{ textAlign: "right" }}
        >
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Total Course Coverage
          </Text>
          <Text size="xl" fw={800} c="teal.7">
            {progress.totalCoursePercentage}%
          </Text>
        </Paper>
      </Group>

      {/* Topics & Lectures Accordion */}
      <Accordion
        defaultValue={course.topics?.[0]?.topicName}
        variant="separated"
      >
        {course.topics?.map((topic, tIdx) => (
          <Accordion.Item
            key={topic._id || tIdx}
            value={topic.topicName}
            mb="md"
          >
            <Accordion.Control
              icon={
                <IconChecklist
                  size={20}
                  color="var(--mantine-color-indigo-6)"
                />
              }
            >
              <Text fw={600} size="md" c="dark.7">
                Topic {tIdx + 1}: {topic.topicName}
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                {topic.lectures.map((lecture) => {
                  const tracked = progress.lectureProgress?.find(
                    (p) => p.lectureId === lecture._id,
                  ) || { watchedMinutes: 0, isCompleted: false };
                  const isDisabled = !lecture.isActive || !lecture.isRequired;

                  return (
                    <Paper
                      key={lecture._id}
                      p="md"
                      radius="md"
                      withBorder
                      bg={isDisabled ? "gray.2" : "white"}
                      shadow="xs"
                    >
                      <Group justify="space-between" align="center" wrap="wrap">
                        {/* Lecture Details */}
                        <Group gap="sm" style={{ flex: 1, minWidth: "260px" }}>
                          <ThemeIcon
                            color="blue"
                            variant="light"
                            size="lg"
                            radius="sm"
                          >
                            <IconVideo size={18} />
                          </ThemeIcon>
                          <div>
                            <Text fw={600} size="sm" c="dark.8">
                              {lecture.lectureName}
                            </Text>
                            <Group gap="xs" mt={4}>
                              <Badge
                                size="xs"
                                color="gray"
                                variant="outline"
                                leftSection={<IconClock size={10} />}
                              >
                                Duration: {formatTime(lecture.durationMinutes)}
                              </Badge>
                              {!lecture.isRequired && (
                                <Badge size="xs" color="yellow">
                                  Optional
                                </Badge>
                              )}
                              {!lecture.isActive && (
                                <Badge size="xs" color="red">
                                  Inactive
                                </Badge>
                              )}
                            </Group>
                          </div>
                        </Group>

                        {/* Interactive Controls: Checkbox & Time Cover Slider/Input */}
                        <Group gap="xl" wrap="wrap" align="center">
                          <Box style={{ width: "220px" }}>
                            <Group justify="space-between" mb={4}>
                              <Text size="xs" c="dimmed">
                                Time Covered
                              </Text>
                              <Text size="xs" fw={700} c="blue.6">
                                {formatTime(tracked.watchedMinutes)} /{" "}
                                {formatTime(lecture.durationMinutes)}
                              </Text>
                            </Group>
                            <Slider
                              min={0}
                              max={lecture.durationMinutes}
                              value={tracked.watchedMinutes}
                              disabled={isDisabled}
                              onChangeEnd={(val) =>
                                handleUpdate(
                                  lecture._id,
                                  val,
                                  val >= lecture.durationMinutes
                                    ? true
                                    : tracked.isCompleted,
                                  lecture.durationMinutes,
                                )
                              }
                              color="teal"
                              size="sm"
                            />
                          </Box>

                          {/* Checkbox to Mark Complete / Mention Covered Status */}
                          <Checkbox
                            label="Mark Completed"
                            checked={tracked.isCompleted}
                            disabled={isDisabled}
                            onChange={(e) => {
                              const checked = e.currentTarget.checked;
                              // If checked, automatically set watched minutes to full duration; if unchecked, keep current or reset
                              const newMinutes = checked
                                ? lecture.durationMinutes
                                : tracked.watchedMinutes;
                              handleUpdate(
                                lecture._id,
                                newMinutes,
                                checked,
                                lecture.durationMinutes,
                              );
                            }}
                            color="teal"
                            size="md"
                          />
                        </Group>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Paper>
  );
}

export default StudentCourseView;
