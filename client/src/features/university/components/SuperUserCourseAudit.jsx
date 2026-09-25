// client/src/features/university/components/SuperUserCourseAudit.jsx
import React, { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Table,
  Badge,
  Progress,
  Loader,
  Center,
} from "@mantine/core";
import { universityApi } from "../api/universityApi";

export function SuperUserCourseAudit({ courseId }) {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    universityApi
      .getCourseAudit(courseId)
      .then((res) => {
        setAuditData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load audit data");
        setLoading(false);
      });
  }, [courseId]);

  if (loading)
    return (
      <Center py={100}>
        <Loader color="teal" size="lg" />
      </Center>
    );
  if (error) return <Text c="red">Error: {error}</Text>;

  return (
    <Paper p="lg" radius="md" withBorder shadow="xs">
      <Group
        justify="space-between"
        mb="xl"
        pb="md"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
      >
        <div>
          <Title order={2} c="dark.8">
            Super User Audit: {auditData.courseTitle}
          </Title>
          <Text size="sm" c="dimmed">
            Language:{" "}
            <Text span c="blue.6" fw={500}>
              {auditData.language}
            </Text>{" "}
            | Semester: {auditData.semester} | Enrolled:{" "}
            {auditData.totalEnrolledStudents}
          </Text>
        </div>
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Roll Number</Table.Th>
              <Table.Th>Student Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Lectures Completed</Table.Th>
              <Table.Th>Course Coverage (%)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {auditData.students.map((student, idx) => (
              <Table.Tr key={student.studentId || idx}>
                <Table.Td>
                  <Badge variant="outline" color="dark">
                    {student.rollNumber}
                  </Badge>
                </Table.Td>
                <Table.Td fw={600}>{student.name}</Table.Td>
                <Table.Td c="dimmed">{student.email}</Table.Td>
                <Table.Td>{student.lecturesCompletedCount}</Table.Td>
                <Table.Td>
                  <Group gap="sm">
                    <Progress
                      value={student.totalCoursePercentage}
                      size="sm"
                      color="blue"
                      style={{ width: "100px" }}
                    />
                    <Text size="sm" fw={700} c="blue.6">
                      {student.totalCoursePercentage}%
                    </Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

export default SuperUserCourseAudit;
