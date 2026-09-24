import React, { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  SimpleGrid,
  Card,
  Badge,
  Table,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconSchool,
  IconUsers,
  IconBooks,
  IconCertificate,
} from "@tabler/icons-react";
import { universityApi } from "../api/universityApi";

export function UniversityPortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    universityApi
      .getPortalSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load university portal summary:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Center py={100}>
        <Loader color="teal" size="lg" />
      </Center>
    );
  }

  if (!data) {
    return <Text c="red">Failed to load university data.</Text>;
  }

  const {
    university,
    batches,
    totalEnrollments,
    courseBreakdown,
    allEnrollments,
  } = data;

  return (
    <Paper p="lg" radius="md" withBorder shadow="xs">
      {/* Header Info */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} c="teal.7">
            {university.name}
          </Title>
          <Text size="sm" c="dimmed">
            Institution Code: {university.code} | Founded:{" "}
            {university.foundedYear}
          </Text>
        </div>
        <Badge size="lg" color="violet" variant="light">
          Super Admin Portal View
        </Badge>
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder p="md" radius="md">
          <Group>
            <IconSchool size={32} color="var(--mantine-color-teal-6)" />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Active Batches
              </Text>
              <Text size="xl" fw={700}>
                {batches.length}
              </Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group>
            <IconUsers size={32} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Total Registered Students
              </Text>
              <Text size="xl" fw={700}>
                {totalEnrollments}
              </Text>
            </div>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group>
            <IconBooks size={32} color="var(--mantine-color-violet-6)" />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Active Courses
              </Text>
              <Text size="xl" fw={700}>
                {courseBreakdown.length}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Course Enrollment Breakdown */}
      <Title order={4} mb="md">
        Course Registration & Student Counts
      </Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} mb="xl">
        {courseBreakdown.map((course) => (
          <Card key={course.courseId} withBorder p="md" radius="md">
            <Text fw={600} size="md" mb="xs">
              {course.title}
            </Text>
            <Group justify="space-between">
              <Badge color="cyan" variant="light">
                Registered: {course.totalRegistered}
              </Badge>
              <Badge color="green" variant="light">
                Active: {course.activeCount}
              </Badge>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* Detailed Student Roster with Roll Numbers & Progress */}
      <Title order={4} mb="md">
        Student Roster, Roll Numbers & Progress
      </Title>
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Roll Number</Table.Th>
              <Table.Th>Student Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Course Enrolled</Table.Th>
              <Table.Th>Course Progress</Table.Th>
              <Table.Th>Lesson Progress</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {allEnrollments.map((en) => (
              <Table.Tr key={en.id}>
                <Table.Td>
                  <Badge variant="outline" color="dark">
                    {en.rollNumber}
                  </Badge>
                </Table.Td>
                <Table.Td fw={500}>{en.name}</Table.Td>
                <Table.Td>{en.email}</Table.Td>
                <Table.Td>{en.course}</Table.Td>
                <Table.Td>
                  <Badge color="teal" variant="light">
                    {en.courseProgress}
                  </Badge>
                </Table.Td>
                <Table.Td>{en.lessonProgress}</Table.Td>
                <Table.Td>
                  <Badge color={en.status === "ACTIVE" ? "green" : "gray"}>
                    {en.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}
