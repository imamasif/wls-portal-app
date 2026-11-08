import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Badge,
  Button,
  Select,
  Table,
  Loader,
  Center,
  Switch,
  ActionIcon,
  Tooltip,
  Textarea,
  Avatar,
  Divider,
} from "@mantine/core";
import {
  IconSchool,
  IconBooks,
  IconUsers,
  IconMessageDots,
  IconLock,
  IconLockOpen,
  IconSend,
  IconRefresh,
  IconCheck,
} from "@tabler/icons-react";
import { universityApi } from "../api/universityApi";

export function UniversityInstructorView({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const loadInstructorData = async () => {
    setLoading(true);
    try {
      // Find courses assigned to this instructor or all active courses
      const instructorId = currentUser?._id || currentUser?.id;
      let cList = await universityApi.getCourses({ instructorId });
      if (!cList || cList.length === 0) {
        // Fallback: list all courses if none specifically assigned
        cList = await universityApi.getCourses();
      }
      setCourses(cList || []);

      if (cList && cList.length > 0) {
        const initialCourse = cList[0];
        const initialCourseId = initialCourse._id || initialCourse.id;
        setSelectedCourseId(initialCourseId);

        // Load enrollments for this department
        if (initialCourse.departmentId) {
          const deptId = initialCourse.departmentId._id || initialCourse.departmentId;
          const eList = await universityApi.getEnrollments({ departmentId: deptId });
          setEnrollments(eList || []);
          if (eList && eList.length > 0) {
            setSelectedStudentId(eList[0].studentId?._id || eList[0].studentId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load instructor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructorData();
  }, [currentUser]);

  // Load chat messages when course or student changes
  useEffect(() => {
    if (!selectedCourseId || !selectedStudentId) {
      setMessages([]);
      return;
    }
    universityApi
      .getMessages(selectedCourseId, selectedStudentId)
      .then((mList) => setMessages(mList || []))
      .catch((err) => console.error("Error loading chat:", err));
  }, [selectedCourseId, selectedStudentId]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedCourseId || !selectedStudentId) return;
    setSendingMsg(true);
    try {
      await universityApi.sendMessage({
        courseId: selectedCourseId,
        studentId: selectedStudentId,
        instructorId: currentUser?._id || currentUser?.id,
        senderId: currentUser?._id || currentUser?.id,
        senderName: currentUser?.name || "Instructor",
        senderRole: "INSTRUCTOR",
        message: chatInput.trim(),
      });
      setChatInput("");
      const mList = await universityApi.getMessages(selectedCourseId, selectedStudentId);
      setMessages(mList || []);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleExam = async (courseId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      await universityApi.toggleExamAvailability(courseId, nextStatus);
      const cList = await universityApi.getCourses();
      setCourses(cList || []);
    } catch (err) {
      console.error("Toggle exam error:", err);
    }
  };

  if (loading) {
    return (
      <Center py={80}>
        <Loader size="lg" color="indigo" />
      </Center>
    );
  }

  const activeCourse = courses.find((c) => (c._id || c.id) === selectedCourseId);
  const activeStudent = enrollments.find(
    (e) => (e.studentId?._id || e.studentId) === selectedStudentId
  );

  return (
    <Box>
      {/* Header Banner */}
      <Paper
        p="lg"
        radius="lg"
        mb="lg"
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
          color: "#ffffff",
        }}
      >
        <Group justify="space-between">
          <Stack gap={2}>
            <Group gap="xs">
              <Badge color="yellow" variant="filled" size="sm">
                Faculty & Instructor Portal
              </Badge>
              <Text size="xs" c="teal.1">
                Welcome, {currentUser?.name || "Instructor"}
              </Text>
            </Group>
            <Title order={2} style={{ color: "#ffffff" }}>
              Course Management & Student Guidance
            </Title>
            <Text size="xs" c="teal.2">
              Oversee sequential lectures, unlock exams, and answer student questions directly via 1-on-1 messaging.
            </Text>
          </Stack>
          <Button
            variant="white"
            color="teal"
            size="xs"
            leftSection={<IconRefresh size={16} />}
            onClick={loadInstructorData}
          >
            Refresh
          </Button>
        </Group>
      </Paper>

      {/* Courses Overview */}
      <Title order={4} mb="sm" c="gray.8">
        Your Courses
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        {courses.map((c) => {
          const cId = c._id || c.id;
          const isSelected = cId === selectedCourseId;
          return (
            <Card
              key={cId}
              p="md"
              radius="md"
              withBorder
              style={{
                borderColor: isSelected ? "#0d9488" : "#e2e8f0",
                backgroundColor: isSelected ? "#f0fdfa" : "#ffffff",
                cursor: "pointer",
              }}
              onClick={() => setSelectedCourseId(cId)}
            >
              <Group justify="space-between" mb="xs">
                <Badge color="teal" size="sm">
                  {c.code}
                </Badge>
                <Tooltip
                  label={
                    c.isExamAvailable
                      ? "Exam is currently UNLOCKED for students"
                      : "Exam is currently LOCKED"
                  }
                >
                  <Switch
                    checked={Boolean(c.isExamAvailable)}
                    onChange={() => handleToggleExam(cId, c.isExamAvailable)}
                    color="teal"
                    size="xs"
                    onLabel={<IconLockOpen size={10} />}
                    offLabel={<IconLock size={10} />}
                  />
                </Tooltip>
              </Group>

              <Text size="sm" fw={700} c="dark.9">
                {c.title}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                {c.description || "No description provided."}
              </Text>

              <Divider my="xs" />

              <Group justify="space-between">
                <Text size="xs" c="gray.6">
                  Pass Grade: {c.examPassingPercentage}%
                </Text>
                <Badge color={c.isExamAvailable ? "green" : "gray"} variant="light" size="xs">
                  {c.isExamAvailable ? "Exam Available" : "Exam Hidden"}
                </Badge>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* 2-Column: Student Roster & 1-on-1 Instructor Chat */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Left Column: Enrolled Students in Course */}
        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="md">
            <Stack gap={2}>
              <Title order={4}>Enrolled Students</Title>
              <Text size="xs" c="dimmed">
                Select a student to inspect progress and open private 1-on-1 chat.
              </Text>
            </Stack>
            <Badge color="teal" variant="light">
              {enrollments.length} Students
            </Badge>
          </Group>

          {enrollments.length === 0 ? (
            <Center py={40}>
              <Text size="sm" c="dimmed">
                No students enrolled in this course department yet.
              </Text>
            </Center>
          ) : (
            <Stack gap="xs">
              {enrollments.map((en) => {
                const sId = en.studentId?._id || en.studentId;
                const isSelected = sId === selectedStudentId;
                return (
                  <Paper
                    key={en._id || en.id}
                    p="xs"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: isSelected ? "#0d9488" : "#e2e8f0",
                      backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedStudentId(sId)}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Avatar color="teal" radius="xl" size="sm">
                          {(en.studentName || en.studentId?.name || "S")[0]}
                        </Avatar>
                        <Stack gap={0}>
                          <Text size="xs" fw={700}>
                            {en.studentName || en.studentId?.name}
                          </Text>
                          <Text size="10px" c="dimmed">
                            {en.studentEmail || en.studentId?.email}
                          </Text>
                        </Stack>
                      </Group>

                      <Badge color="indigo" size="xs" variant="filled">
                        {en.rollNumber}
                      </Badge>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>

        {/* Right Column: 1-on-1 Direct Messaging */}
        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <IconMessageDots size={20} color="#0d9488" />
              <Title order={4}>1-on-1 Student Chat</Title>
            </Group>
            {activeStudent && (
              <Badge color="teal" variant="outline">
                {activeStudent.studentName || activeStudent.studentId?.name} ({activeStudent.rollNumber})
              </Badge>
            )}
          </Group>

          <Divider mb="sm" />

          {/* Chat Messages Log */}
          <Box
            style={{
              height: "360px",
              overflowY: "auto",
              paddingRight: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.length === 0 ? (
              <Center style={{ height: "100%" }}>
                <Text size="xs" c="dimmed" fs="italic">
                  No conversation history with this student yet. Send a message below.
                </Text>
              </Center>
            ) : (
              messages.map((m) => {
                const isMe = m.senderRole === "INSTRUCTOR" || m.senderId === (currentUser?._id || currentUser?.id);
                return (
                  <Paper
                    key={m._id || m.id}
                    p="xs"
                    radius="md"
                    withBorder
                    bg={isMe ? "#f0fdf4" : "#f1f5f9"}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      borderColor: isMe ? "#bbf7d0" : "#cbd5e1",
                    }}
                  >
                    <Group justify="space-between" gap="xs" mb={2}>
                      <Text size="11px" fw={700} c={isMe ? "teal.9" : "gray.8"}>
                        {isMe ? "You (Instructor)" : m.senderName}
                      </Text>
                      <Text size="9px" c="dimmed">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </Text>
                    </Group>
                    <Text size="xs" c="dark.9">
                      {m.message}
                    </Text>
                  </Paper>
                );
              })
            )}
          </Box>

          <Divider my="sm" />

          {/* Message Input */}
          <Group align="flex-end">
            <Textarea
              placeholder={
                selectedStudentId
                  ? "Write message or feedback to student..."
                  : "Select a student to start messaging..."
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={2}
              style={{ flex: 1 }}
              disabled={!selectedStudentId}
            />
            <Button
              color="teal"
              leftSection={<IconSend size={16} />}
              loading={sendingMsg}
              disabled={!selectedStudentId || !chatInput.trim()}
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </Group>
        </Paper>
      </SimpleGrid>
    </Box>
  );
}
