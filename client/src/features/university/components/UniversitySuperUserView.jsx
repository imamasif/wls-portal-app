import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Tabs,
  Button,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Switch,
  Card,
  SimpleGrid,
  Loader,
  Center,
  Tooltip,
  Divider,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconSchool,
  IconBooks,
  IconVideo,
  IconUsers,
  IconAward,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconLock,
  IconLockOpen,
  IconExternalLink,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";
import { universityApi } from "../api/universityApi";
import { CertificateModal } from "./CertificateModal";

export function UniversitySuperUserView({ currentUser }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Core Data Lists
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [quizzesList, setQuizzesList] = useState([]);

  // Modals state
  const [uniModalOpened, setUniModalOpened] = useState(false);
  const [deptModalOpened, setDeptModalOpened] = useState(false);
  const [courseModalOpened, setCourseModalOpened] = useState(false);
  const [lectureModalOpened, setLectureModalOpened] = useState(false);
  const [enrollModalOpened, setEnrollModalOpened] = useState(false);
  const [certModalOpened, setCertModalOpened] = useState(false);
  const [viewCertModalOpened, setViewCertModalOpened] = useState(false);
  const [activeCertToView, setActiveCertToView] = useState(null);

  // Edit / Form states
  const [editingItem, setEditingItem] = useState(null);
  const [uniForm, setUniForm] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    description: "",
    headOfDepartment: "",
    totalSemesters: 8,
  });
  const [courseForm, setCourseForm] = useState({
    title: "",
    code: "",
    description: "",
    credits: 3,
    instructorId: "",
    instructorName: "",
    examQuizId: "",
    examPassingPercentage: 70,
    examMaxAttempts: 3,
    isExamAvailable: false,
  });
  const [lectureForm, setLectureForm] = useState({
    title: "",
    description: "",
    order: 1,
    videoUrls: [""],
    isMandatory: true,
    durationSeconds: 1800,
  });
  const [enrollForm, setEnrollForm] = useState({
    studentId: "",
    departmentId: "",
    semesterId: "",
    customRollNumber: "",
  });
  const [certForm, setCertForm] = useState({
    studentId: "",
    departmentId: "",
    semesterId: "",
    courseId: "",
    type: "SEMESTER",
    title: "",
    grade: "PASSED",
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Initial Load
  const loadAll = async () => {
    setLoading(true);
    try {
      const [sumRes, deptsRes, enrollsRes, certsRes] = await Promise.all([
        universityApi.getPortalSummary(),
        universityApi.getDepartments(),
        universityApi.getEnrollments(),
        universityApi.getCertificates(),
      ]);

      setSummary(sumRes);
      setDepartments(deptsRes || []);
      setEnrollments(enrollsRes || []);
      setCertificates(certsRes || []);

      if (deptsRes && deptsRes.length > 0 && !selectedDeptId) {
        setSelectedDeptId(deptsRes[0]._id || deptsRes[0].id);
      }

      if (sumRes?.university) {
        setUniForm({
          name: sumRes.university.name || "",
          code: sumRes.university.code || "",
          description: sumRes.university.description || "",
          address: sumRes.university.address || "",
          contactEmail: sumRes.university.contactEmail || "",
          contactPhone: sumRes.university.contactPhone || "",
        });
      }

      // Fetch users for instructor/student selection
      try {
        const uRes = await fetch("/api/users?limit=200");
        const uData = await uRes.json();
        setUsersList(Array.isArray(uData) ? uData : uData.users || []);
      } catch (e) {
        console.warn("Failed to load users list", e);
      }

      // Fetch quizzes for exam linkage
      try {
        const qRes = await fetch("/api/quizzes");
        const qData = await qRes.json();
        setQuizzesList(Array.isArray(qData) ? qData : qData.quizzes || []);
      } catch (e) {
        console.warn("Failed to load quizzes", e);
      }
    } catch (err) {
      console.error("Error loading university data:", err);
      showNotification("Failed to load university records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // When selected department changes, load its semesters and courses
  useEffect(() => {
    if (!selectedDeptId) return;

    universityApi
      .getSemesters(selectedDeptId)
      .then((sems) => {
        setSemesters(sems || []);
        if (sems && sems.length > 0) {
          setSelectedSemesterId(sems[0]._id || sems[0].id);
        } else {
          setSelectedSemesterId(null);
        }
      })
      .catch((err) => console.error("Error loading semesters:", err));

    universityApi
      .getCourses({ departmentId: selectedDeptId })
      .then((cList) => {
        setCourses(cList || []);
        if (cList && cList.length > 0) {
          setSelectedCourseId(cList[0]._id || cList[0].id);
        } else {
          setSelectedCourseId(null);
        }
      })
      .catch((err) => console.error("Error loading courses:", err));
  }, [selectedDeptId]);

  // When selected course changes, load its lectures
  useEffect(() => {
    if (!selectedCourseId) {
      setLectures([]);
      return;
    }
    universityApi
      .getLectures(selectedCourseId)
      .then((lList) => setLectures(lList || []))
      .catch((err) => console.error("Error loading lectures:", err));
  }, [selectedCourseId]);

  // --- Handlers: University ---
  const handleSaveUniversity = async () => {
    try {
      if (!summary?.university?._id) return;
      await universityApi.updateUniversity(summary.university._id, uniForm);
      showNotification("University profile updated successfully!");
      setUniModalOpened(false);
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  // --- Handlers: Department ---
  const handleSaveDepartment = async () => {
    try {
      if (editingItem) {
        await universityApi.updateDepartment(editingItem._id || editingItem.id, deptForm);
        showNotification("Department updated successfully!");
      } else {
        await universityApi.createDepartment(deptForm);
        showNotification("Department created with standard 8 semesters!");
      }
      setDeptModalOpened(false);
      setEditingItem(null);
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm("Are you sure you want to delete this department? All associated semesters will be removed.")) return;
    try {
      await universityApi.deleteDepartment(deptId);
      showNotification("Department deleted successfully!");
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  // --- Handlers: Course ---
  const handleSaveCourse = async () => {
    try {
      const payload = {
        ...courseForm,
        departmentId: selectedDeptId,
        semesterId: selectedSemesterId,
      };
      if (editingItem) {
        await universityApi.updateCourse(editingItem._id || editingItem.id, payload);
        showNotification("Course updated successfully!");
      } else {
        await universityApi.createCourse(payload);
        showNotification("Course created successfully!");
      }
      setCourseModalOpened(false);
      setEditingItem(null);
      // Reload courses
      const cList = await universityApi.getCourses({ departmentId: selectedDeptId });
      setCourses(cList || []);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  const handleToggleExamAvailability = async (courseId, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      await universityApi.toggleExamAvailability(courseId, nextStatus);
      showNotification(`Exam is now ${nextStatus ? "AVAILABLE" : "HIDDEN"} for students.`);
      const cList = await universityApi.getCourses({ departmentId: selectedDeptId });
      setCourses(cList || []);
    } catch (err) {
      showNotification("Failed to toggle exam availability", "error");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? Associated lectures will be removed.")) return;
    try {
      await universityApi.deleteCourse(courseId);
      showNotification("Course deleted successfully!");
      const cList = await universityApi.getCourses({ departmentId: selectedDeptId });
      setCourses(cList || []);
      if (selectedCourseId === courseId) {
        setSelectedCourseId(cList[0]?._id || null);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  // --- Handlers: Lecture ---
  const handleSaveLecture = async () => {
    try {
      const cleanedUrls = lectureForm.videoUrls.map((u) => u.trim()).filter(Boolean);
      if (cleanedUrls.length === 0) {
        showNotification("Please provide at least one valid video URL.", "error");
        return;
      }
      const payload = {
        ...lectureForm,
        videoUrls: cleanedUrls,
        courseId: selectedCourseId,
      };
      if (editingItem) {
        await universityApi.updateLecture(editingItem._id || editingItem.id, payload);
        showNotification("Lecture updated successfully!");
      } else {
        await universityApi.createLecture(selectedCourseId, payload);
        showNotification("Lecture added to sequence!");
      }
      setLectureModalOpened(false);
      setEditingItem(null);
      const lList = await universityApi.getLectures(selectedCourseId);
      setLectures(lList || []);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm("Delete this lecture?")) return;
    try {
      await universityApi.deleteLecture(lectureId);
      showNotification("Lecture deleted successfully!");
      const lList = await universityApi.getLectures(selectedCourseId);
      setLectures(lList || []);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  // --- Handlers: Enroll Student ---
  const handleEnrollStudent = async () => {
    try {
      if (!enrollForm.studentId || !enrollForm.departmentId) {
        showNotification("Please select both a student and a department.", "error");
        return;
      }
      const res = await universityApi.enrollStudent(enrollForm);
      showNotification(`Student enrolled successfully! Roll Number assigned: ${res.rollNumber}`);
      setEnrollModalOpened(false);
      setEnrollForm({ studentId: "", departmentId: "", semesterId: "", customRollNumber: "" });
      const enrolls = await universityApi.getEnrollments();
      setEnrollments(enrolls || []);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  const handlePromoteStudent = async (studentId, departmentId) => {
    if (!window.confirm("Promote student to next semester? This will issue a semester completion certificate.")) return;
    try {
      const res = await universityApi.promoteStudent({ studentId, departmentId });
      showNotification(`Student successfully promoted! Status: ${res.data?.status}`);
      const enrolls = await universityApi.getEnrollments();
      setEnrollments(enrolls || []);
      const certs = await universityApi.getCertificates();
      setCertificates(certs || []);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  // --- Handlers: Certificates ---
  const handleAwardCertificate = async () => {
    try {
      if (!certForm.studentId || !certForm.departmentId || !certForm.title) {
        showNotification("Please fill required fields (Student, Department, Title).", "error");
        return;
      }
      const cert = await universityApi.awardCertificate(certForm);
      showNotification(`Certificate #${cert.certificateNumber} awarded successfully!`);
      setCertModalOpened(false);
      const certs = await universityApi.getCertificates();
      setCertificates(certs || []);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  if (loading) {
    return (
      <Center py={80}>
        <Loader size="lg" color="indigo" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Toast Notification Banner */}
      {notification && (
        <Paper
          p="sm"
          mb="md"
          radius="md"
          bg={notification.type === "error" ? "red.6" : "teal.6"}
          c="white"
          shadow="sm"
        >
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              {notification.msg}
            </Text>
            <ActionIcon
              size="sm"
              variant="transparent"
              c="white"
              onClick={() => setNotification(null)}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Paper>
      )}

      {/* University Header Banner */}
      <Paper
        p={{ base: "md", sm: "xl" }}
        radius="lg"
        mb="lg"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
          color: "#ffffff",
        }}
      >
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Group gap="xs">
              <Badge color="yellow" variant="filled" size="sm">
                Super User Administration
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                {summary?.university?.code || "IIPC-U"}
              </Badge>
            </Group>
            <Title order={2} style={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
              {summary?.university?.name || "IIPC University Portal"}
            </Title>
            <Text size="sm" c="gray.3" maw={700}>
              {summary?.university?.description}
            </Text>
          </Stack>

          <Group gap="xs">
            <Button
              variant="white"
              color="indigo"
              size="xs"
              leftSection={<IconEdit size={16} />}
              onClick={() => setUniModalOpened(true)}
            >
              Edit University
            </Button>
            <Button
              variant="light"
              color="gray"
              size="xs"
              leftSection={<IconRefresh size={16} />}
              onClick={loadAll}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Aggregate KPI counters */}
        <SimpleGrid cols={{ base: 2, sm: 5 }} mt="xl" spacing="sm">
          <Card p="xs" radius="md" bg="rgba(255,255,255,0.08)" c="white">
            <Text size="xs" c="gray.3" tt="uppercase" fw={600}>
              Departments
            </Text>
            <Title order={3} mt={4}>
              {summary?.totalDepartments || 0}
            </Title>
          </Card>
          <Card p="xs" radius="md" bg="rgba(255,255,255,0.08)" c="white">
            <Text size="xs" c="gray.3" tt="uppercase" fw={600}>
              Semesters
            </Text>
            <Title order={3} mt={4}>
              {summary?.totalSemesters || 0}
            </Title>
          </Card>
          <Card p="xs" radius="md" bg="rgba(255,255,255,0.08)" c="white">
            <Text size="xs" c="gray.3" tt="uppercase" fw={600}>
              Courses
            </Text>
            <Title order={3} mt={4}>
              {summary?.totalCourses || 0}
            </Title>
          </Card>
          <Card p="xs" radius="md" bg="rgba(255,255,255,0.08)" c="white">
            <Text size="xs" c="gray.3" tt="uppercase" fw={600}>
              Enrolled Students
            </Text>
            <Title order={3} mt={4}>
              {summary?.totalStudents || 0}
            </Title>
          </Card>
          <Card p="xs" radius="md" bg="rgba(255,255,255,0.08)" c="white">
            <Text size="xs" c="gray.3" tt="uppercase" fw={600}>
              Certificates Issued
            </Text>
            <Title order={3} mt={4}>
              {summary?.totalCertificates || 0}
            </Title>
          </Card>
        </SimpleGrid>
      </Paper>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onChange={setActiveTab} color="indigo" radius="md">
        <Tabs.List mb="md" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
          <Tabs.Tab value="overview" leftSection={<IconBuildingBank size={16} />}>
            Departments & Semesters
          </Tabs.Tab>
          <Tabs.Tab value="courses" leftSection={<IconBooks size={16} />}>
            Courses & Exams
          </Tabs.Tab>
          <Tabs.Tab value="lectures" leftSection={<IconVideo size={16} />}>
            Sequential Video Lectures
          </Tabs.Tab>
          <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
            Students & Roll Numbers ({enrollments.length})
          </Tabs.Tab>
          <Tabs.Tab value="certificates" leftSection={<IconAward size={16} />}>
            Certificates Awarded ({certificates.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* TAB 1: DEPARTMENTS & SEMESTERS */}
        <Tabs.Panel value="overview">
          <Paper p="md" radius="md" withBorder mb="lg" bg="white">
            <Group justify="space-between" mb="md">
              <Stack gap={2}>
                <Title order={4}>Academic Departments</Title>
                <Text size="xs" c="dimmed">
                  Manage undergraduate departments and faculties with automatic semester generation (Semesters 1 to 8).
                </Text>
              </Stack>
              <Button
                leftSection={<IconPlus size={16} />}
                color="indigo"
                size="xs"
                onClick={() => {
                  setEditingItem(null);
                  setDeptForm({
                    name: "",
                    code: "",
                    description: "",
                    headOfDepartment: "",
                    totalSemesters: 8,
                  });
                  setDeptModalOpened(true);
                }}
              >
                Add Department
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              {departments.map((dept) => {
                const isSelected = (dept._id || dept.id) === selectedDeptId;
                return (
                  <Card
                    key={dept._id || dept.id}
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: isSelected ? "#3b82f6" : "#e2e8f0",
                      backgroundColor: isSelected ? "#f0f7ff" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => setSelectedDeptId(dept._id || dept.id)}
                  >
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Badge color="blue" size="lg" variant="filled">
                        {dept.code}
                      </Badge>
                      <Group gap={4}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(dept);
                            setDeptForm({
                              name: dept.name,
                              code: dept.code,
                              description: dept.description || "",
                              headOfDepartment: dept.headOfDepartment || "",
                              totalSemesters: dept.totalSemesters || 8,
                            });
                            setDeptModalOpened(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDepartment(dept._id || dept.id);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Text fw={600} size="sm" c="dark.9">
                      {dept.name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                      {dept.description || "No description provided."}
                    </Text>

                    <Divider my="xs" />

                    <Group justify="space-between">
                      <Text size="xs" c="gray.6">
                        Curriculum:
                      </Text>
                      <Badge color="teal" variant="light" size="xs">
                        {dept.totalSemesters || 8} Semesters
                      </Badge>
                    </Group>
                    {dept.headOfDepartment && (
                      <Group justify="space-between" mt={4}>
                        <Text size="xs" c="gray.6">
                          HOD:
                        </Text>
                        <Text size="xs" fw={500}>
                          {dept.headOfDepartment}
                        </Text>
                      </Group>
                    )}
                  </Card>
                );
              })}
            </SimpleGrid>
          </Paper>

          {/* Department Semesters Overview */}
          {selectedDeptId && (
            <Paper p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="sm">
                <Title order={4}>Semesters in Selected Department</Title>
                <Badge color="indigo" variant="outline">
                  {semesters.length} Semesters Generated
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 2, sm: 4, md: 8 }} spacing="xs">
                {semesters.map((sem) => (
                  <Card
                    key={sem._id || sem.id}
                    p="xs"
                    radius="md"
                    withBorder
                    style={{
                      textAlign: "center",
                      backgroundColor:
                        (sem._id || sem.id) === selectedSemesterId
                          ? "#eff6ff"
                          : "#fafafa",
                      borderColor:
                        (sem._id || sem.id) === selectedSemesterId
                          ? "#2563eb"
                          : "#e2e8f0",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedSemesterId(sem._id || sem.id)}
                  >
                    <Text size="xs" fw={700} c="indigo.8">
                      Semester {sem.semesterNumber}
                    </Text>
                    <Text size="10px" c="dimmed">
                      {sem.academicYear || "2026-2027"}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            </Paper>
          )}
        </Tabs.Panel>

        {/* TAB 2: COURSES & EXAMS */}
        <Tabs.Panel value="courses">
          <Paper p="md" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="md" wrap="wrap">
              <Group gap="sm">
                <Select
                  label="Filter by Department"
                  data={departments.map((d) => ({
                    value: d._id || d.id,
                    label: `${d.code} - ${d.name}`,
                  }))}
                  value={selectedDeptId}
                  onChange={setSelectedDeptId}
                  size="xs"
                  w={260}
                />
                <Select
                  label="Filter by Semester"
                  data={semesters.map((s) => ({
                    value: s._id || s.id,
                    label: `Semester ${s.semesterNumber} (${s.title})`,
                  }))}
                  value={selectedSemesterId}
                  onChange={setSelectedSemesterId}
                  size="xs"
                  w={240}
                  clearable
                />
              </Group>

              <Button
                leftSection={<IconPlus size={16} />}
                color="indigo"
                size="xs"
                mt={{ base: "xs", sm: 22 }}
                disabled={!selectedDeptId}
                onClick={() => {
                  setEditingItem(null);
                  setCourseForm({
                    title: "",
                    code: "",
                    description: "",
                    credits: 3,
                    instructorId: "",
                    instructorName: "",
                    examQuizId: "",
                    examPassingPercentage: 70,
                    examMaxAttempts: 3,
                    isExamAvailable: false,
                  });
                  setCourseModalOpened(true);
                }}
              >
                Create New Course
              </Button>
            </Group>

            {/* Courses Table / Cards */}
            {courses.length === 0 ? (
              <Center py={40}>
                <Stack align="center" gap="xs">
                  <IconBooks size={40} color="#94a3b8" />
                  <Text size="sm" c="dimmed">
                    No courses found for this department/semester. Click "Create New Course" above.
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={700}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Course Code</Table.Th>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Semester</Table.Th>
                      <Table.Th>Credits</Table.Th>
                      <Table.Th>Instructor</Table.Th>
                      <Table.Th>Exam Status</Table.Th>
                      <Table.Th>Exam Visibility</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {courses.map((c) => {
                      const cId = c._id || c.id;
                      return (
                        <Table.Tr
                          key={cId}
                          style={{
                            backgroundColor:
                              selectedCourseId === cId ? "#f8fafc" : "transparent",
                          }}
                        >
                          <Table.Td>
                            <Badge color="indigo" variant="light">
                              {c.code}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600}>
                              {c.title}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {c.description || "No description"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="cyan" variant="outline" size="xs">
                              Sem {c.semesterId?.semesterNumber || 1}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{c.credits} Credits</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={500}>
                              {c.instructorName || "Unassigned"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {c.examQuizId ? (
                              <Badge color="green" variant="light" size="xs">
                                Quiz Linked ({c.examPassingPercentage}% Pass)
                              </Badge>
                            ) : (
                              <Badge color="gray" variant="outline" size="xs">
                                No Quiz Linked
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Tooltip
                              label={
                                c.isExamAvailable
                                  ? "Exam is UNLOCKED for students"
                                  : "Exam is HIDDEN from students"
                              }
                            >
                              <Switch
                                checked={Boolean(c.isExamAvailable)}
                                onChange={() =>
                                  handleToggleExamAvailability(cId, c.isExamAvailable)
                                }
                                color="teal"
                                size="sm"
                                onLabel={<IconLockOpen size={12} />}
                                offLabel={<IconLock size={12} />}
                              />
                            </Tooltip>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Group gap={4} justify="flex-end">
                              <Tooltip label="View / Manage Sequential Lectures">
                                <ActionIcon
                                  size="sm"
                                  color="indigo"
                                  variant="light"
                                  onClick={() => {
                                    setSelectedCourseId(cId);
                                    setActiveTab("lectures");
                                  }}
                                >
                                  <IconVideo size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <ActionIcon
                                size="sm"
                                color="blue"
                                variant="subtle"
                                onClick={() => {
                                  setEditingItem(c);
                                  setCourseForm({
                                    title: c.title,
                                    code: c.code,
                                    description: c.description || "",
                                    credits: c.credits || 3,
                                    instructorId: c.instructorId || "",
                                    instructorName: c.instructorName || "",
                                    examQuizId: c.examQuizId?._id || c.examQuizId || "",
                                    examPassingPercentage: c.examPassingPercentage || 70,
                                    examMaxAttempts: c.examMaxAttempts || 3,
                                    isExamAvailable: Boolean(c.isExamAvailable),
                                  });
                                  setCourseModalOpened(true);
                                }}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm"
                                color="red"
                                variant="subtle"
                                onClick={() => handleDeleteCourse(cId)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        </Tabs.Panel>

        {/* TAB 3: SEQUENTIAL LECTURES & ANTI-CHEAT VIDEO LINKS */}
        <Tabs.Panel value="lectures">
          <Paper p="md" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="md" wrap="wrap">
              <Group gap="sm">
                <Select
                  label="Selected Course"
                  data={courses.map((c) => ({
                    value: c._id || c.id,
                    label: `${c.code}: ${c.title}`,
                  }))}
                  value={selectedCourseId}
                  onChange={setSelectedCourseId}
                  size="xs"
                  w={360}
                />
              </Group>

              <Button
                leftSection={<IconPlus size={16} />}
                color="indigo"
                size="xs"
                mt={{ base: "xs", sm: 22 }}
                disabled={!selectedCourseId}
                onClick={() => {
                  setEditingItem(null);
                  setLectureForm({
                    title: "",
                    description: "",
                    order: lectures.length + 1,
                    videoUrls: [""],
                    isMandatory: true,
                    durationSeconds: 1800,
                  });
                  setLectureModalOpened(true);
                }}
              >
                Add Lecture
              </Button>
            </Group>

            {/* Anti-cheat explanation badge */}
            <Paper p="xs" radius="md" bg="blue.0" mb="md" withBorder style={{ borderColor: "#bfdbfe" }}>
              <Text size="xs" c="blue.9">
                ℹ️ <strong>Sequential Anti-Cheat Architecture:</strong> Lectures marked as <strong>Mandatory</strong> require students to watch the video from start to finish. Fast-forwarding beyond what they've already watched is automatically blocked. Subsequent lectures remain locked until all preceding mandatory lectures are 100% completed.
              </Text>
            </Paper>

            {lectures.length === 0 ? (
              <Center py={40}>
                <Stack align="center" gap="xs">
                  <IconVideo size={40} color="#94a3b8" />
                  <Text size="sm" c="dimmed">
                    No lectures added to this course yet. Click "Add Lecture" to set up video lessons.
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="sm">
                {lectures.map((lec) => {
                  const lId = lec._id || lec.id;
                  return (
                    <Paper key={lId} p="sm" radius="md" withBorder bg="#ffffff">
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm" align="flex-start">
                          <Badge color="indigo" size="lg" circle>
                            {lec.order}
                          </Badge>
                          <Stack gap={2}>
                            <Group gap="xs">
                              <Text size="sm" fw={700}>
                                {lec.title}
                              </Text>
                              {lec.isMandatory ? (
                                <Badge color="red" variant="filled" size="xs">
                                  Mandatory (End-to-End)
                                </Badge>
                              ) : (
                                <Badge color="gray" variant="light" size="xs">
                                  Optional (Can Skip)
                                </Badge>
                              )}
                              <Badge color="blue" variant="outline" size="xs">
                                {Math.round((lec.durationSeconds || 0) / 60)} mins
                              </Badge>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {lec.description || "No description"}
                            </Text>

                            {/* Video URLs list */}
                            <Stack gap={2} mt={4}>
                              <Text size="11px" fw={600} c="gray.7">
                                Video Links ({lec.videoUrls?.length || 0}):
                              </Text>
                              {lec.videoUrls?.map((url, uIdx) => (
                                <Text
                                  key={uIdx}
                                  size="xs"
                                  c="blue.7"
                                  component="a"
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ wordBreak: "break-all" }}
                                >
                                  🔗 {url}
                                </Text>
                              ))}
                            </Stack>
                          </Stack>
                        </Group>

                        <Group gap={4}>
                          <ActionIcon
                            size="sm"
                            color="blue"
                            variant="subtle"
                            onClick={() => {
                              setEditingItem(lec);
                              setLectureForm({
                                title: lec.title,
                                description: lec.description || "",
                                order: lec.order,
                                videoUrls:
                                  Array.isArray(lec.videoUrls) && lec.videoUrls.length > 0
                                    ? lec.videoUrls
                                    : [""],
                                isMandatory: Boolean(lec.isMandatory),
                                durationSeconds: lec.durationSeconds || 1800,
                              });
                              setLectureModalOpened(true);
                            }}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteLecture(lId)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>

        {/* TAB 4: ENROLLED STUDENTS & ROLL NUMBERS */}
        <Tabs.Panel value="students">
          <Paper p="md" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="md">
              <Stack gap={2}>
                <Title order={4}>Enrolled Students & Roll Numbers</Title>
                <Text size="xs" c="dimmed">
                  Official roll numbers follow standardized format: <strong>YYYY-DEPT-ROLL#</strong> (e.g. <code>2026-QA-073</code>).
                </Text>
              </Stack>

              <Button
                leftSection={<IconPlus size={16} />}
                color="indigo"
                size="xs"
                onClick={() => setEnrollModalOpened(true)}
              >
                Enroll New Student
              </Button>
            </Group>

            {enrollments.length === 0 ? (
              <Center py={40}>
                <Text size="sm" c="dimmed">
                  No students enrolled yet. Click "Enroll New Student" to assign a roll number.
                </Text>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={700}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Roll Number</Table.Th>
                      <Table.Th>Student Name</Table.Th>
                      <Table.Th>Department</Table.Th>
                      <Table.Th>Current Semester</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Enrolled Date</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {enrollments.map((en) => {
                      const eId = en._id || en.id;
                      const sId = en.studentId?._id || en.studentId;
                      const dId = en.departmentId?._id || en.departmentId;
                      return (
                        <Table.Tr key={eId}>
                          <Table.Td>
                            <Badge color="indigo" size="md" variant="filled">
                              {en.rollNumber}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600}>
                              {en.studentName || en.studentId?.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {en.studentEmail || en.studentId?.email}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="blue" variant="light" size="xs">
                              {en.departmentCode || en.departmentId?.code || "DEPT"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="cyan" variant="outline" size="xs">
                              Semester {en.currentSemesterNumber || 1}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                en.status === "ACTIVE"
                                  ? "green"
                                  : en.status === "PROMOTED"
                                  ? "blue"
                                  : en.status === "GRADUATED"
                                  ? "yellow"
                                  : "gray"
                              }
                              size="xs"
                            >
                              {en.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {en.enrolledAt ? new Date(en.enrolledAt).toLocaleDateString() : "N/A"}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Group gap={4} justify="flex-end">
                              <Button
                                size="compact-xs"
                                color="teal"
                                variant="light"
                                onClick={() => handlePromoteStudent(sId, dId)}
                              >
                                Promote Semester
                              </Button>
                              <Button
                                size="compact-xs"
                                color="indigo"
                                variant="outline"
                                onClick={() => {
                                  setCertForm({
                                    studentId: sId,
                                    departmentId: dId,
                                    semesterId: en.currentSemesterId?._id || en.currentSemesterId,
                                    courseId: "",
                                    type: "SEMESTER",
                                    title: `Certificate of Completion - Semester ${en.currentSemesterNumber}`,
                                    grade: "PASSED",
                                  });
                                  setCertModalOpened(true);
                                }}
                              >
                                Award Cert
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        </Tabs.Panel>

        {/* TAB 5: CERTIFICATES AWARDED */}
        <Tabs.Panel value="certificates">
          <Paper p="md" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="md">
              <Title order={4}>Official Certificates & Diplomas</Title>
              <Button
                leftSection={<IconAward size={16} />}
                color="indigo"
                size="xs"
                onClick={() => setCertModalOpened(true)}
              >
                Award Certificate
              </Button>
            </Group>

            {certificates.length === 0 ? (
              <Center py={40}>
                <Text size="sm" c="dimmed">
                  No certificates awarded yet. Certificates are issued automatically upon semester promotion or course completion.
                </Text>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={700}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Certificate #</Table.Th>
                      <Table.Th>Student</Table.Th>
                      <Table.Th>Roll Number</Table.Th>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Grade</Table.Th>
                      <Table.Th>Issued Date</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>View / Print</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {certificates.map((cert) => {
                      const cId = cert._id || cert.id;
                      return (
                        <Table.Tr key={cId}>
                          <Table.Td>
                            <Badge color="indigo" variant="filled" size="sm">
                              {cert.certificateNumber}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600}>
                              {cert.studentName}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="gray" variant="outline" size="xs">
                              {cert.rollNumber}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={500}>
                              {cert.title}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="teal" variant="light" size="xs">
                              {cert.grade || "PASSED"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : "N/A"}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Button
                              size="compact-xs"
                              color="indigo"
                              variant="light"
                              leftSection={<IconEye size={12} />}
                              onClick={() => {
                                setActiveCertToView(cert);
                                setViewCertModalOpened(true);
                              }}
                            >
                              View Official
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* MODAL: EDIT UNIVERSITY */}
      <Modal
        opened={uniModalOpened}
        onClose={() => setUniModalOpened(false)}
        title="Edit University Profile"
        size="md"
      >
        <Stack gap="sm">
          <TextInput
            label="University Name"
            required
            value={uniForm.name}
            onChange={(e) => setUniForm({ ...uniForm, name: e.target.value })}
          />
          <TextInput
            label="Institution Code"
            required
            value={uniForm.code}
            onChange={(e) => setUniForm({ ...uniForm, code: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={3}
            value={uniForm.description}
            onChange={(e) => setUniForm({ ...uniForm, description: e.target.value })}
          />
          <TextInput
            label="Official Contact Email"
            value={uniForm.contactEmail}
            onChange={(e) => setUniForm({ ...uniForm, contactEmail: e.target.value })}
          />
          <TextInput
            label="Campus Address"
            value={uniForm.address}
            onChange={(e) => setUniForm({ ...uniForm, address: e.target.value })}
          />
          <Button fullWidth mt="md" color="indigo" onClick={handleSaveUniversity}>
            Save University Details
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: DEPARTMENT */}
      <Modal
        opened={deptModalOpened}
        onClose={() => setDeptModalOpened(false)}
        title={editingItem ? "Edit Department" : "Add New Department"}
        size="md"
      >
        <Stack gap="sm">
          <TextInput
            label="Department Name"
            placeholder="e.g. Quranic Arabic & Tafseer"
            required
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />
          <TextInput
            label="Department Code (for Roll Numbers)"
            placeholder="e.g. QA, IS, CS"
            required
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
          />
          <Textarea
            label="Department Description"
            rows={2}
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />
          <TextInput
            label="Head of Department"
            placeholder="e.g. Dr. Mohammad Shaikh"
            value={deptForm.headOfDepartment}
            onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
          />
          <NumberInput
            label="Total Semesters in Degree"
            defaultValue={8}
            min={1}
            max={12}
            value={deptForm.totalSemesters}
            onChange={(val) => setDeptForm({ ...deptForm, totalSemesters: val })}
          />
          <Button fullWidth mt="md" color="indigo" onClick={handleSaveDepartment}>
            {editingItem ? "Update Department" : "Create Department & Generate Semesters"}
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: COURSE */}
      <Modal
        opened={courseModalOpened}
        onClose={() => setCourseModalOpened(false)}
        title={editingItem ? "Edit Course" : "Create New Course"}
        size="lg"
      >
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label="Course Code"
              placeholder="e.g. QA-101"
              required
              value={courseForm.code}
              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
            />
            <TextInput
              label="Course Title"
              placeholder="e.g. Introduction to Quranic Recitation"
              required
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            />
          </Group>

          <Textarea
            label="Course Description"
            rows={2}
            value={courseForm.description}
            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
          />

          <Group grow>
            <NumberInput
              label="Academic Credits"
              defaultValue={3}
              min={1}
              max={6}
              value={courseForm.credits}
              onChange={(val) => setCourseForm({ ...courseForm, credits: val })}
            />
            <Select
              label="Assigned Instructor"
              placeholder="Select Instructor"
              data={usersList.map((u) => ({
                value: u._id || u.id,
                label: `${u.name} (${u.role})`,
              }))}
              value={courseForm.instructorId}
              onChange={(val) => {
                const found = usersList.find((u) => (u._id || u.id) === val);
                setCourseForm({
                  ...courseForm,
                  instructorId: val,
                  instructorName: found ? found.name : "",
                });
              }}
              clearable
            />
          </Group>

          <Divider my="xs" label="Exam / Quiz Integration" labelPosition="center" />

          <Select
            label="Link Final Exam (from Quizzes)"
            placeholder="Select a created quiz to act as the course exam"
            data={quizzesList.map((q) => ({
              value: q._id || q.id,
              label: `${q.title} (${q.questions?.length || 0} questions)`,
            }))}
            value={courseForm.examQuizId}
            onChange={(val) => setCourseForm({ ...courseForm, examQuizId: val })}
            clearable
          />

          <Group grow>
            <NumberInput
              label="Passing Grade (%)"
              defaultValue={70}
              min={40}
              max={100}
              value={courseForm.examPassingPercentage}
              onChange={(val) => setCourseForm({ ...courseForm, examPassingPercentage: val })}
            />
            <NumberInput
              label="Allowed Exam Attempts"
              defaultValue={3}
              min={1}
              max={10}
              value={courseForm.examMaxAttempts}
              onChange={(val) => setCourseForm({ ...courseForm, examMaxAttempts: val })}
            />
          </Group>

          <Switch
            label="Make Exam Available to Students immediately"
            description="If disabled, exam remains locked until you turn on visibility."
            checked={courseForm.isExamAvailable}
            onChange={(e) => setCourseForm({ ...courseForm, isExamAvailable: e.currentTarget.checked })}
            color="teal"
            mt="xs"
          />

          <Button fullWidth mt="md" color="indigo" onClick={handleSaveCourse}>
            {editingItem ? "Update Course" : "Create Course"}
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: LECTURE */}
      <Modal
        opened={lectureModalOpened}
        onClose={() => setLectureModalOpened(false)}
        title={editingItem ? "Edit Lecture" : "Add Lecture to Sequence"}
        size="lg"
      >
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label="Lecture Title"
              placeholder="e.g. Chapter 1: The Foundations of Arabic Roots"
              required
              value={lectureForm.title}
              onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
            />
            <NumberInput
              label="Order in Sequence"
              defaultValue={1}
              min={1}
              value={lectureForm.order}
              onChange={(val) => setLectureForm({ ...lectureForm, order: val })}
            />
          </Group>

          <Textarea
            label="Lesson Summary / Notes"
            rows={2}
            value={lectureForm.description}
            onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
          />

          <Switch
            label="Mandatory Lecture (Requires End-to-End Watch Tracking)"
            description="Student cannot scrub ahead or proceed to subsequent lectures until this video is watched fully."
            checked={lectureForm.isMandatory}
            onChange={(e) => setLectureForm({ ...lectureForm, isMandatory: e.currentTarget.checked })}
            color="red"
          />

          <Divider my="xs" label="Lecture Video URLs (Array of Strings)" labelPosition="center" />

          {lectureForm.videoUrls.map((url, idx) => (
            <Group key={idx} align="flex-end">
              <TextInput
                label={`Video Link #${idx + 1}`}
                placeholder="https://youtube.com/watch?v=... or direct MP4 URL"
                value={url}
                onChange={(e) => {
                  const updated = [...lectureForm.videoUrls];
                  updated[idx] = e.target.value;
                  setLectureForm({ ...lectureForm, videoUrls: updated });
                }}
                style={{ flex: 1 }}
              />
              {lectureForm.videoUrls.length > 1 && (
                <ActionIcon
                  color="red"
                  variant="subtle"
                  mb={4}
                  onClick={() => {
                    const updated = lectureForm.videoUrls.filter((_, i) => i !== idx);
                    setLectureForm({ ...lectureForm, videoUrls: updated });
                  }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          ))}

          <Button
            size="xs"
            variant="light"
            color="indigo"
            leftSection={<IconPlus size={14} />}
            onClick={() =>
              setLectureForm({
                ...lectureForm,
                videoUrls: [...lectureForm.videoUrls, ""],
              })
            }
          >
            Add Another Video URL
          </Button>

          <Button fullWidth mt="md" color="indigo" onClick={handleSaveLecture}>
            {editingItem ? "Update Lecture" : "Save & Add to Course"}
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: ENROLL STUDENT */}
      <Modal
        opened={enrollModalOpened}
        onClose={() => setEnrollModalOpened(false)}
        title="Enroll Student with Official Roll Number"
        size="md"
      >
        <Stack gap="sm">
          <Select
            label="Select Student"
            placeholder="Search student..."
            required
            data={usersList.map((u) => ({
              value: u._id || u.id,
              label: `${u.name} (${u.email})`,
            }))}
            value={enrollForm.studentId}
            onChange={(val) => setEnrollForm({ ...enrollForm, studentId: val })}
            searchable
          />

          <Select
            label="Department"
            placeholder="Select department..."
            required
            data={departments.map((d) => ({
              value: d._id || d.id,
              label: `${d.code} - ${d.name}`,
            }))}
            value={enrollForm.departmentId}
            onChange={(val) => setEnrollForm({ ...enrollForm, departmentId: val })}
          />

          <TextInput
            label="Custom Roll Number (Optional)"
            placeholder="Leave empty for auto-generation (e.g. 2026-QA-073)"
            value={enrollForm.customRollNumber}
            onChange={(e) => setEnrollForm({ ...enrollForm, customRollNumber: e.target.value })}
          />

          <Paper p="xs" radius="md" bg="gray.1">
            <Text size="xs" c="dimmed">
              Format: <strong>YYYY-DEPT-ROLL#</strong>. If left blank, the system automatically assigns the next sequential roll number for this department and academic year.
            </Text>
          </Paper>

          <Button fullWidth mt="md" color="indigo" onClick={handleEnrollStudent}>
            Enroll & Assign Roll Number
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: AWARD CERTIFICATE */}
      <Modal
        opened={certModalOpened}
        onClose={() => setCertModalOpened(false)}
        title="Award Official Certificate"
        size="md"
      >
        <Stack gap="sm">
          <Select
            label="Student"
            required
            data={enrollments.map((en) => ({
              value: en.studentId?._id || en.studentId,
              label: `${en.studentName || en.studentId?.name} (Roll: ${en.rollNumber})`,
            }))}
            value={certForm.studentId}
            onChange={(val) => setCertForm({ ...certForm, studentId: val })}
          />

          <Select
            label="Department"
            required
            data={departments.map((d) => ({
              value: d._id || d.id,
              label: `${d.code} - ${d.name}`,
            }))}
            value={certForm.departmentId}
            onChange={(val) => setCertForm({ ...certForm, departmentId: val })}
          />

          <Select
            label="Certificate Type"
            data={[
              { value: "SEMESTER", label: "Semester Completion Certificate" },
              { value: "COURSE", label: "Individual Course Mastery Certificate" },
              { value: "DEGREE", label: "Full Degree Conferral" },
            ]}
            value={certForm.type}
            onChange={(val) => setCertForm({ ...certForm, type: val })}
          />

          <TextInput
            label="Certificate Title"
            placeholder="e.g. Certificate of Mastery in Quranic Arabic - Semester 1"
            required
            value={certForm.title}
            onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
          />

          <Select
            label="Grade / Distinction"
            data={["PASSED", "PASSED WITH MERIT", "PASSED WITH DISTINCTION", "EXEMPLARY"]}
            value={certForm.grade}
            onChange={(val) => setCertForm({ ...certForm, grade: val })}
          />

          <Button fullWidth mt="md" color="indigo" onClick={handleAwardCertificate}>
            Issue Certificate
          </Button>
        </Stack>
      </Modal>

      {/* MODAL: VIEW / PRINT OFFICIAL CERTIFICATE */}
      <CertificateModal
        certificate={activeCertToView}
        opened={viewCertModalOpened}
        onClose={() => {
          setViewCertModalOpened(false);
          setActiveCertToView(null);
        }}
      />
    </Box>
  );
}
