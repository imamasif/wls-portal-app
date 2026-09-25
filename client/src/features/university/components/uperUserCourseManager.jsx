// client/src/features/university/components/SuperUserCourseManager.jsx
import React, { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  TextInput,
  NumberInput,
  Select,
  Switch,
  Button,
  Stack,
  Accordion,
  Badge,
  Card,
  Loader,
  Center,
  Divider,
} from "@mantine/core";
import { IconPlus, IconTrash, IconBook, IconVideo } from "@tabler/icons-react";
import { universityApi } from "../api/universityApi";

export function SuperUserCourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Form State for Adding a Lecture
  const [topicName, setTopicName] = useState("");
  const [lectureName, setLectureName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isRequired, setIsRequired] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await universityApi.getCourses(); // Assumes an endpoint exists to fetch all courses
      const courseList = res.data || res;
      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseList[0]._id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !topicName || !lectureName) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await universityApi.addLectureToCourse(selectedCourseId, {
        topicName,
        lectureName,
        durationMinutes,
        isRequired,
        isActive,
      });
      setLectureName("");
      setDurationMinutes(30);
      await fetchCourses();
      alert("Lecture added successfully!");
    } catch (err) {
      alert(
        "Failed to add lecture: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLecture = async (courseId, lectureId) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await universityApi.deleteLecture(courseId, lectureId);
      await fetchCourses();
    } catch (err) {
      alert(
        "Failed to delete lecture: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  if (loading) {
    return (
      <Center py={100}>
        <Loader color="teal" size="lg" />
      </Center>
    );
  }

  return (
    <Paper p="xl" radius="md" withBorder shadow="xs">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} c="dark.8">
            Super User Course Builder
          </Title>
          <Text size="sm" c="dimmed">
            Manage curriculum topics, add lectures, and configure course
            requirements.
          </Text>
        </div>
        <Select
          label="Select Course to Manage"
          data={courses.map((c) => ({
            value: c._id,
            label: `${c.title} (${c.code})`,
          }))}
          value={selectedCourseId}
          onChange={setSelectedCourseId}
          style={{ width: "280px" }}
        />
      </Group>

      {selectedCourse && (
        <Stack gap="xl">
          {/* Add Lecture Form */}
          <Card withBorder p="md" radius="md" bg="gray.0">
            <Title order={4} mb="md">
              Add New Topic / Lecture
            </Title>
            <form onSubmit={handleAddLecture}>
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="Topic Name"
                    placeholder="e.g., Semester 1 - Topic 1 : Aaliha aur Allah"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Lecture Name"
                    placeholder="e.g., Introduction & Context"
                    value={lectureName}
                    onChange={(e) => setLectureName(e.target.value)}
                    required
                  />
                </Group>
                <Group grow align="flex-end">
                  <NumberInput
                    label="Duration (Minutes)"
                    min={1}
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                    required
                  />
                  <Group gap="xl">
                    <Switch
                      label="Is Required (Mandatory)"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Is Active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.currentTarget.checked)}
                    />
                  </Group>
                  <Button
                    type="submit"
                    color="teal"
                    leftSection={<IconPlus size={16} />}
                    loading={submitting}
                  >
                    Add Lecture
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>

          <Divider />

          {/* Current Course Syllabus Tree */}
          <Title order={4}>
            Current Syllabus Breakdown: {selectedCourse.title}
          </Title>
          <Accordion
            defaultValue={selectedCourse.topics?.[0]?.topicName}
            variant="separated"
          >
            {selectedCourse.topics?.map((topic, tIdx) => (
              <Accordion.Item key={topic._id || tIdx} value={topic.topicName}>
                <Accordion.Control
                  icon={
                    <IconBook size={20} color="var(--mantine-color-teal-6)" />
                  }
                >
                  <Text fw={600}>{topic.topicName}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="xs">
                    {topic.lectures.map((lec) => (
                      <Paper
                        key={lec._id}
                        p="sm"
                        radius="sm"
                        withBorder
                        bg="white"
                      >
                        <Group justify="space-between" align="center">
                          <Group gap="sm">
                            <IconVideo size={18} color="gray" />
                            <div>
                              <Text size="sm" fw={600}>
                                {lec.lectureName}
                              </Text>
                              <Group gap="xs" mt={2}>
                                <Badge size="xs" color="gray" variant="outline">
                                  {lec.durationMinutes} mins
                                </Badge>
                                <Badge
                                  size="xs"
                                  color={lec.isRequired ? "red" : "blue"}
                                >
                                  {lec.isRequired ? "Required" : "Optional"}
                                </Badge>
                                <Badge
                                  size="xs"
                                  color={lec.isActive ? "green" : "gray"}
                                >
                                  {lec.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </Group>
                            </div>
                          </Group>
                          <Button
                            color="red"
                            variant="subtle"
                            size="xs"
                            leftSection={<IconTrash size={14} />}
                            onClick={() =>
                              handleDeleteLecture(selectedCourse._id, lec._id)
                            }
                          >
                            Remove
                          </Button>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      )}
    </Paper>
  );
}

export default SuperUserCourseManager;
