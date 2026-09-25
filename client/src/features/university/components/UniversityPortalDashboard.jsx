// src/features/universities/components/UniversityPortalDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  TextInput,
  Select,
  Pagination,
  Flex,
  Box,
  ActionIcon,
} from "@mantine/core";
import {
  IconSchool,
  IconUsers,
  IconBooks,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from "@tabler/icons-react";
import { universityApi } from "../api/universityApi";

export function UniversityPortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Table Controls State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Sorting State
  const [sortField, setSortField] = useState("rollNumber");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination & Page Size State (Supports 10, 25, 50, 100)
  const [pageSize, setPageSize] = useState("25");
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    universityApi
      .getPortalSummary()
      .then((res) => {
        // Handle both unwrapped and wrapped response formats safely
        setData(res.data ? res.data : res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load university portal summary:", err);
        setLoading(false);
      });
  }, []);

  // Handle column sorting toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and Sort Enrollments
  const filteredAndSortedEnrollments = useMemo(() => {
    if (!data || !data.allEnrollments) return [];

    let result = [...data.allEnrollments];

    // 1. Search Query Filter (Name, Email, Roll Number, Course)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (en) =>
          en.name?.toLowerCase().includes(q) ||
          en.email?.toLowerCase().includes(q) ||
          en.rollNumber?.toLowerCase().includes(q) ||
          en.course?.toLowerCase().includes(q),
      );
    }

    // 2. Course Filter
    if (filterCourse && filterCourse !== "ALL") {
      result = result.filter((en) => en.course === filterCourse);
    }

    // 3. Status Filter
    if (filterStatus && filterStatus !== "ALL") {
      result = result.filter((en) => en.status === filterStatus);
    }

    // 4. Sorting Logic
    result.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchQuery, filterCourse, filterStatus, sortField, sortDirection]);

  // Paginated Slice
  const paginatedEnrollments = useMemo(() => {
    const size = parseInt(pageSize, 10);
    const start = (activePage - 1) * size;
    return filteredAndSortedEnrollments.slice(start, start + size);
  }, [filteredAndSortedEnrollments, activePage, pageSize]);

  const totalPages = Math.ceil(
    filteredAndSortedEnrollments.length / parseInt(pageSize, 10),
  );

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

  const { university, batches, totalEnrollments, courseBreakdown } = data;

  // Unique course options for filter dropdown
  const courseOptions = [
    { value: "ALL", label: "All Courses" },
    ...(courseBreakdown || []).map((c) => ({ value: c.title, label: c.title })),
  ];

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
        {courseBreakdown?.map((course) => (
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

      {/* Toolbar: Search, Filters & Page Size Cache Selector */}
      <Paper p="md" radius="md" withBorder mb="md" bg="gray.0">
        <Flex justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm" style={{ flex: 1, minWidth: "280px" }}>
            <TextInput
              placeholder="Search by name, email, roll #..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActivePage(1);
              }}
              style={{ flex: 1 }}
              clearable
            />
          </Group>

          <Group gap="sm" wrap="wrap">
            <Select
              placeholder="Filter Course"
              data={courseOptions}
              value={filterCourse}
              onChange={(val) => {
                setFilterCourse(val);
                setActivePage(1);
              }}
              style={{ width: "180px" }}
            />
            <Select
              placeholder="Filter Status"
              data={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setActivePage(1);
              }}
              style={{ width: "150px" }}
            />
            <Select
              label="Rows"
              data={["10", "25", "50", "100"]}
              value={pageSize}
              onChange={(val) => {
                setPageSize(val || "25");
                setActivePage(1);
              }}
              style={{ width: "90px" }}
            />
          </Group>
        </Flex>
      </Paper>

      {/* Detailed Student Roster with Sorting Headers & Pagination */}
      <Group justify="space-between" mb="sm">
        <Title order={4}>Student Roster, Roll Numbers & Progress</Title>
        <Text size="sm" c="dimmed">
          Showing {paginatedEnrollments.length} of{" "}
          {filteredAndSortedEnrollments.length} filtered entries (Total:{" "}
          {data.allEnrollments.length})
        </Text>
      </Group>

      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("rollNumber")}
              >
                <Group gap={4}>
                  Roll Number
                  {sortField === "rollNumber" ? (
                    sortDirection === "asc" ? (
                      <IconChevronUp size={14} />
                    ) : (
                      <IconChevronDown size={14} />
                    )
                  ) : (
                    <IconSelector size={14} color="gray" />
                  )}
                </Group>
              </Table.Th>
              <Table.Th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("name")}
              >
                <Group gap={4}>
                  Student Name
                  {sortField === "name" ? (
                    sortDirection === "asc" ? (
                      <IconChevronUp size={14} />
                    ) : (
                      <IconChevronDown size={14} />
                    )
                  ) : (
                    <IconSelector size={14} color="gray" />
                  )}
                </Group>
              </Table.Th>
              <Table.Th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("email")}
              >
                <Group gap={4}>
                  Email
                  {sortField === "email" ? (
                    sortDirection === "asc" ? (
                      <IconChevronUp size={14} />
                    ) : (
                      <IconChevronDown size={14} />
                    )
                  ) : (
                    <IconSelector size={14} color="gray" />
                  )}
                </Group>
              </Table.Th>
              <Table.Th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("course")}
              >
                <Group gap={4}>
                  Course Enrolled
                  {sortField === "course" ? (
                    sortDirection === "asc" ? (
                      <IconChevronUp size={14} />
                    ) : (
                      <IconChevronDown size={14} />
                    )
                  ) : (
                    <IconSelector size={14} color="gray" />
                  )}
                </Group>
              </Table.Th>
              <Table.Th>Course Progress</Table.Th>
              <Table.Th>Lesson Progress</Table.Th>
              <Table.Th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("status")}
              >
                <Group gap={4}>
                  Status
                  {sortField === "status" ? (
                    sortDirection === "asc" ? (
                      <IconChevronUp size={14} />
                    ) : (
                      <IconChevronDown size={14} />
                    )
                  ) : (
                    <IconSelector size={14} color="gray" />
                  )}
                </Group>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedEnrollments.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} align="center">
                  <Text c="dimmed" py="xl">
                    No matching student records found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedEnrollments.map((en) => (
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
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <Flex justify="center" mt="lg">
          <Pagination
            value={activePage}
            onChange={setActivePage}
            total={totalPages}
            color="teal"
          />
        </Flex>
      )}
    </Paper>
  );
}

export default UniversityPortalDashboard;
