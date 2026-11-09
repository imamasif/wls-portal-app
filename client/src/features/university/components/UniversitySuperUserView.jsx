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
  Progress,
  Alert,
  Accordion,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconSchool,
  IconBooks,
  IconVideo,
  IconUsers,
  IconUser,
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
  IconGripVertical,
  IconArrowUp,
  IconArrowDown,
  IconReportAnalytics,
  IconCircleCheck,
  IconChecklist,
  IconAlertTriangle,
  IconCalendar,
  IconClock,
  IconShieldLock,
  IconInfoCircle,
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

  // Department Deletion Safety & Eligibility Modal States
  const [deleteDeptModalOpened, setDeleteDeptModalOpened] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deletionEligibility, setDeletionEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [deletingDept, setDeletingDept] = useState(false);

  // Department Update Error Modal (when reducing semesters with courses)
  const [deptErrorModal, setDeptErrorModal] = useState({ opened: false, title: "", message: "" });

  // Semester Details Edit Modal State
  const [semModalOpened, setSemModalOpened] = useState(false);
  const [selectedSemForEdit, setSelectedSemForEdit] = useState(null);
  const [semForm, setSemForm] = useState({
    title: "",
    academicYear: "2026-2027",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Analytics & Progress Reports State (Tab 6)
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [syncingWeb, setSyncingWeb] = useState(false);

  const handleSyncWebCurriculum = async () => {
    if (!window.confirm("Are you sure you want to re-sync curriculum directly from IIPC Canada web portal? This will refresh all 5 courses and lectures for both departments.")) return;
    setSyncingWeb(true);
    try {
      await universityApi.syncWebCurriculum();
      showNotification("Successfully synced 2 departments, 10 courses, and all lectures from IIPC Canada!");
      await loadAll();
    } catch (err) {
      showNotification("Failed to sync from web: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSyncingWeb(false);
    }
  };
  const [reportFilterDept, setReportFilterDept] = useState("");
  const [reportFilterSem, setReportFilterSem] = useState("");

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
    topicName: "General Curriculum",
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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [auditCourseId, setAuditCourseId] = useState("");
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedStudentAudit, setSelectedStudentAudit] = useState(null);
  const [studentAuditModalOpen, setStudentAuditModalOpen] = useState(false);

  const loadCourseAudit = async (cId) => {
    if (!cId) return;
    setLoadingAudit(true);
    try {
      const res = await universityApi.getCourseAudit(cId);
      setAuditData(res);
    } catch (err) {
      showNotification("Failed to load course audit: " + err.message, "error");
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0 && !auditCourseId) {
      const initial = courses[0]._id || courses[0].id;
      setAuditCourseId(initial);
      loadCourseAudit(initial);
    }
  }, [courses]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const updated = [...lectures];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    setLectures(updated);
    setDraggedIndex(null);

    try {
      const orderedIds = updated.map((l) => l._id || l.id);
      await universityApi.reorderLectures(selectedCourseId, orderedIds);
      showNotification("Lecture order updated successfully!");
    } catch (err) {
      showNotification("Failed to save lecture order: " + err.message, "error");
    }
  };

  const handleMoveLecture = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lectures.length) return;
    const updated = [...lectures];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    setLectures(updated);

    try {
      const orderedIds = updated.map((l) => l._id || l.id);
      await universityApi.reorderLectures(selectedCourseId, orderedIds);
      showNotification("Lecture sequence updated!");
    } catch (err) {
      showNotification("Failed to save sequence: " + err.message, "error");
    }
  };


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

  // Helper to re-fetch and synchronize semesters and courses when department changes or updates
  const reloadSemestersAndCourses = async (deptId) => {
    if (!deptId) return;
    try {
      const [sems, cList] = await Promise.all([
        universityApi.getSemesters(deptId),
        universityApi.getCourses({ departmentId: deptId }),
      ]);
      setSemesters(sems || []);
      if (sems && sems.length > 0) {
        setSelectedSemesterId((prev) => {
          const stillExists = sems.some((s) => (s._id || s.id) === prev);
          return stillExists ? prev : (sems[0]._id || sems[0].id);
        });
      } else {
        setSelectedSemesterId(null);
      }
      setCourses(cList || []);
      if (cList && cList.length > 0) {
        setSelectedCourseId((prev) => {
          const stillExists = cList.some((c) => (c._id || c.id) === prev);
          return stillExists ? prev : (cList[0]._id || cList[0].id);
        });
      } else {
        setSelectedCourseId(null);
      }
    } catch (err) {
      console.error("Error reloading semesters & courses:", err);
    }
  };

  // Safe Department Deletion Flow
  const initiateDeleteDepartment = async (dept) => {
    setDeptToDelete(dept);
    setCheckingEligibility(true);
    setDeletionEligibility(null);
    setDeleteDeptModalOpened(true);
    try {
      const elig = await universityApi.checkDepartmentDeletionEligibility(dept._id || dept.id);
      setDeletionEligibility(elig);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
      setDeleteDeptModalOpened(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const confirmDeleteDepartment = async () => {
    if (!deptToDelete) return;
    setDeletingDept(true);
    try {
      await universityApi.deleteDepartment(deptToDelete._id || deptToDelete.id);
      showNotification(`Department ${deptToDelete.name} deleted successfully!`);
      setDeleteDeptModalOpened(false);
      setDeptToDelete(null);
      setDeletionEligibility(null);
      if (selectedDeptId === (deptToDelete._id || deptToDelete.id)) {
        setSelectedDeptId(null);
        setSemesters([]);
        setCourses([]);
      }
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    } finally {
      setDeletingDept(false);
    }
  };

  // Semester Modal Handlers
  const openEditSemesterModal = (sem) => {
    setSelectedSemForEdit(sem);
    setSemForm({
      title: sem.title || `Semester ${sem.semesterNumber}`,
      academicYear: sem.academicYear || "2026-2027",
      startDate: sem.startDate ? sem.startDate.substring(0, 10) : "",
      endDate: sem.endDate ? sem.endDate.substring(0, 10) : "",
      isActive: sem.isActive !== false,
    });
    setSemModalOpened(true);
  };

  const handleSaveSemester = async () => {
    if (!selectedSemForEdit) return;
    try {
      await universityApi.updateSemester(selectedSemForEdit._id || selectedSemForEdit.id, semForm);
      showNotification("Semester details updated successfully!");
      setSemModalOpened(false);
      if (selectedDeptId) {
        await reloadSemestersAndCourses(selectedDeptId);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    }
  };

  // Analytics Report Loader
  const loadAnalyticsReport = async () => {
    setLoadingReport(true);
    try {
      const res = await universityApi.getAnalyticsReport({
        departmentId: reportFilterDept || undefined,
        semesterId: reportFilterSem || undefined,
      });
      setReportData(res);
    } catch (err) {
      console.error("Failed to load analytics report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      loadAnalyticsReport();
    }
  }, [activeTab, reportFilterDept, reportFilterSem]);

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
          <Tabs.Tab value="audit" leftSection={<IconReportAnalytics size={16} />}>
            Student Progress Audit
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
                            initiateDeleteDepartment(dept);
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
                {lectures.map((lec, idx) => {
                  const lId = lec._id || lec.id;
                  return (
                    <Paper
                      key={lId}
                      p="sm"
                      radius="md"
                      withBorder
                      bg="#ffffff"
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{
                        cursor: "grab",
                        opacity: draggedIndex === idx ? 0.4 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Group gap="sm" align="flex-start">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            style={{ cursor: "grab", marginTop: 2 }}
                            title="Drag to reorder"
                          >
                            <IconGripVertical size={16} />
                          </ActionIcon>
                          <Badge color="indigo" size="lg" circle>
                            {idx + 1}
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
                            color="gray"
                            variant="subtle"
                            disabled={idx === 0}
                            onClick={() => handleMoveLecture(idx, -1)}
                            title="Move Up"
                          >
                            <IconArrowUp size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            color="gray"
                            variant="subtle"
                            disabled={idx === lectures.length - 1}
                            onClick={() => handleMoveLecture(idx, 1)}
                            title="Move Down"
                          >
                            <IconArrowDown size={14} />
                          </ActionIcon>
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

        {/* TAB 6: STUDENT PROGRESS AUDIT (Image 4 & SuperUserCourseAudit) */}
        <Tabs.Panel value="audit">
          <Stack gap="lg">
            {/* Header & Filter Bar */}
            <Paper p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="sm" wrap="wrap">
                <div>
                  <Title order={4} c="dark.9">
                    University & Student Progress Reports
                  </Title>
                  <Text size="xs" c="dimmed">
                    Track overall departments, semester curricula, course allocations, and individual student lecture watch progress.
                  </Text>
                </div>

                <Group gap="sm">
                  <Select
                    label="Filter by Department"
                    placeholder="All Departments"
                    data={[
                      { value: "", label: "All Departments" },
                      ...departments.map((d) => ({
                        value: d._id || d.id,
                        label: `${d.code}: ${d.name}`,
                      })),
                    ]}
                    value={reportFilterDept}
                    onChange={(val) => setReportFilterDept(val || "")}
                    size="xs"
                    w={220}
                    clearable
                  />
                  <Select
                    label="Filter by Semester"
                    placeholder="All Semesters"
                    data={[
                      { value: "", label: "All Semesters" },
                      { value: "1", label: "Semester 1" },
                      { value: "2", label: "Semester 2" },
                      { value: "3", label: "Semester 3" },
                      { value: "4", label: "Semester 4" },
                    ]}
                    value={reportFilterSem}
                    onChange={(val) => setReportFilterSem(val || "")}
                    size="xs"
                    w={150}
                    clearable
                  />
                  <Button
                    variant="light"
                    color="indigo"
                    size="xs"
                    mt={22}
                    leftSection={<IconRefresh size={14} />}
                    onClick={loadAnalyticsReport}
                    loading={loadingReport}
                  >
                    Refresh Report
                  </Button>
                </Group>
              </Group>

              {/* 4 Summary Stat Cards */}
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mt="md">
                <Paper p="sm" radius="md" withBorder bg="blue.0" style={{ borderColor: "#bfdbfe" }}>
                  <Text size="xs" fw={700} c="blue.8" tt="uppercase">
                    Total Departments
                  </Text>
                  <Title order={3} c="blue.9" mt={4}>
                    {reportData?.departments?.length || departments.length}
                  </Title>
                  <Text size="10px" c="dimmed">Configured tracks</Text>
                </Paper>

                <Paper p="sm" radius="md" withBorder bg="indigo.0" style={{ borderColor: "#c7d2fe" }}>
                  <Text size="xs" fw={700} c="indigo.8" tt="uppercase">
                    Total Semesters
                  </Text>
                  <Title order={3} c="indigo.9" mt={4}>
                    {reportData?.departments?.reduce((acc, d) => acc + (d.actualSemestersCount || 0), 0) || semesters.length}
                  </Title>
                  <Text size="10px" c="dimmed">Active academic terms</Text>
                </Paper>

                <Paper p="sm" radius="md" withBorder bg="teal.0" style={{ borderColor: "#a7f3d0" }}>
                  <Text size="xs" fw={700} c="teal.8" tt="uppercase">
                    Active Courses
                  </Text>
                  <Title order={3} c="teal.9" mt={4}>
                    {reportData?.departments?.reduce((acc, d) => acc + (d.totalCoursesCount || 0), 0) || courses.length}
                  </Title>
                  <Text size="10px" c="dimmed">Across all semesters</Text>
                </Paper>

                <Paper p="sm" radius="md" withBorder bg="green.0" style={{ borderColor: "#bbf7d0" }}>
                  <Text size="xs" fw={700} c="green.8" tt="uppercase">
                    Enrolled Students
                  </Text>
                  <Title order={3} c="green.9" mt={4}>
                    {reportData?.departments?.reduce((acc, d) => acc + (d.totalEnrolledStudents || 0), 0) || enrollments.length}
                  </Title>
                  <Text size="10px" c="dimmed">With unique roll numbers</Text>
                </Paper>
              </SimpleGrid>
            </Paper>

            {/* SECTION 1: Department Curriculum & Semester Allocation Overview */}
            <Paper p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="sm">
                <div>
                  <Title order={4} c="dark.9">
                    Department & Semester Curriculum Hierarchy
                  </Title>
                  <Text size="xs" c="dimmed">
                    Overview of courses, instructors, dates, and average progress for each department track.
                  </Text>
                </div>
              </Group>

              {loadingReport ? (
                <Center py={40}>
                  <Loader size="md" color="indigo" />
                </Center>
              ) : !reportData || reportData.departments.length === 0 ? (
                <Center py={30}>
                  <Text size="sm" c="dimmed">No department data available to display.</Text>
                </Center>
              ) : (
                <Stack gap="md">
                  {reportData.departments.map((d) => (
                    <Card key={d.id} p="md" radius="md" withBorder bg="gray.0">
                      <Group justify="space-between" align="center" mb="xs">
                        <div>
                          <Group gap="xs">
                            <Badge color="blue" size="lg" variant="filled">
                              {d.code}
                            </Badge>
                            <Text fw={700} size="md" c="dark.9">
                              {d.name}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed" mt={2}>
                            Lead Instructor: <b>{d.headOfDepartment || "Not Assigned"}</b> • {d.totalSemesters || 4} Semesters Configured • {d.totalCoursesCount} Courses
                          </Text>
                        </div>
                        <Badge color="indigo" variant="light" size="sm">
                          {d.totalEnrolledStudents} Students Enrolled
                        </Badge>
                      </Group>

                      {/* Semesters & Courses Grid */}
                      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" mt="sm">
                        {d.semesters.map((sem) => (
                          <Paper key={sem.id} p="xs" radius="md" withBorder bg="white">
                            <Group justify="space-between" align="center" mb={6}>
                              <Badge color="indigo" variant="outline" size="xs">
                                Semester {sem.semesterNumber}: {sem.title || sem.academicYear}
                              </Badge>
                              <Badge color={sem.isActive !== false ? "teal" : "gray"} size="xs" variant="dot">
                                {sem.isActive !== false ? "Active" : "Disabled"}
                              </Badge>
                            </Group>

                            {sem.courses.length === 0 ? (
                              <Text size="11px" c="dimmed" fs="italic">
                                No courses assigned to this semester yet.
                              </Text>
                            ) : (
                              <Stack gap={6}>
                                {sem.courses.map((c) => (
                                  <Group key={c.id} justify="space-between" p={6} bg="gray.0" style={{ borderRadius: 6 }}>
                                    <div>
                                      <Text size="xs" fw={700} c="dark.9">
                                        [{c.code}] {c.title}
                                      </Text>
                                      <Text size="10px" c="dimmed">
                                        Teacher: <b>{c.instructorName}</b> • {c.totalLectures} Lectures {c.hasExam && "• Final Exam Configured"}
                                      </Text>
                                    </div>
                                    <Badge color={c.averageCoursePercentage >= 75 ? "teal" : "blue"} size="xs" variant="light">
                                      {c.averageCoursePercentage}% Avg
                                    </Badge>
                                  </Group>
                                ))}
                              </Stack>
                            )}
                          </Paper>
                        ))}
                      </SimpleGrid>
                    </Card>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* SECTION 2: Individual Student Watch Progress & Tracking Table */}
            <Paper p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="md" wrap="wrap">
                <div>
                  <Title order={4} c="dark.9">
                    Student Progress & Lecture Watch Audit
                  </Title>
                  <Text size="xs" c="dimmed">
                    Detailed per-student breakdown: lectures watched, lessons remaining, percentage completion, and examination results.
                  </Text>
                </div>
              </Group>

              {loadingReport ? (
                <Center py={40}>
                  <Loader size="md" color="indigo" />
                </Center>
              ) : (
                <Table.ScrollContainer minWidth={850}>
                  <Table verticalSpacing="sm" highlightOnHover striped withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Roll Number</Table.Th>
                        <Table.Th>Student Name</Table.Th>
                        <Table.Th>Dept & Semester</Table.Th>
                        <Table.Th>Course</Table.Th>
                        <Table.Th>Lectures Watched</Table.Th>
                        <Table.Th>What is Left</Table.Th>
                        <Table.Th>Completion (%)</Table.Th>
                        <Table.Th>Exam Outcome</Table.Th>
                        <Table.Th>Watch Time</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {(() => {
                        const allStudentRows = [];
                        if (reportData?.departments) {
                          for (const d of reportData.departments) {
                            for (const sem of d.semesters) {
                              for (const c of sem.courses) {
                                for (const st of c.students) {
                                  allStudentRows.push({
                                    deptCode: d.code,
                                    deptName: d.name,
                                    semNumber: sem.semesterNumber,
                                    courseCode: c.code,
                                    courseTitle: c.title,
                                    ...st,
                                  });
                                }
                              }
                            }
                          }
                        }

                        if (allStudentRows.length === 0) {
                          return (
                            <Table.Tr>
                              <Table.Td colSpan={9} style={{ textAlign: "center" }} c="dimmed" py="lg">
                                No student progress records found. Enroll students into departments and courses to see live tracking.
                              </Table.Td>
                            </Table.Tr>
                          );
                        }

                        return allStudentRows.map((row, idx) => (
                          <Table.Tr key={`${row.studentId}_${row.courseCode}_${idx}`}>
                            <Table.Td>
                              <Badge color="dark" variant="outline">
                                {row.rollNumber}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={600} size="sm">{row.name}</Text>
                              <Text size="11px" c="dimmed">{row.email}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="indigo" variant="light" size="xs">
                                {row.deptCode} - Sem {row.semNumber}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" fw={600} lineClamp={1}>
                                [{row.courseCode}] {row.courseTitle}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="teal" variant="light" size="xs">
                                {row.completedLecturesCount} / {row.totalLecturesCount}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" c={row.remainingLecturesCount === 0 ? "teal.7" : "orange.8"} fw={600}>
                                {row.remainingLecturesCount === 0 ? "All Complete ✔" : `${row.remainingLecturesCount} left`}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" style={{ minWidth: 140 }}>
                                <Progress
                                  value={row.totalCoursePercentage}
                                  color={row.totalCoursePercentage >= 75 ? "teal" : "blue"}
                                  size="sm"
                                  style={{ flex: 1 }}
                                  radius="xl"
                                />
                                <Text size="xs" fw={700} style={{ width: "36px" }}>
                                  {row.totalCoursePercentage}%
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              {row.isExamPassed ? (
                                <Badge color="green" variant="filled" size="xs">
                                  Passed ({row.examHighestScore}%)
                                </Badge>
                              ) : row.examAttemptsCount > 0 ? (
                                <Badge color="orange" variant="light" size="xs">
                                  {row.examHighestScore}% ({row.examAttemptsCount} att.)
                                </Badge>
                              ) : (
                                <Badge color="gray" variant="outline" size="xs">
                                  Not Attempted
                                </Badge>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" c="dimmed">
                                {row.watchTimeMinutes ? `${(row.watchTimeMinutes / 60).toFixed(1)} hrs` : "0 min"}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ));
                      })()}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Paper>
          </Stack>
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

      {/* Student Audit Detail Modal */}
      <Modal
        opened={studentAuditModalOpen}
        onClose={() => setStudentAuditModalOpen(false)}
        title={
          <Group gap="xs">
            <IconUser size={18} color="#2563eb" />
            <Text fw={700}>
              Student Course Audit: {selectedStudentAudit?.name}
            </Text>
            <Badge color="dark" size="sm" variant="outline">
              {selectedStudentAudit?.rollNumber}
            </Badge>
          </Group>
        }
        size="lg"
        centered
      >
        {selectedStudentAudit && (
          <Stack gap="md">
            <Paper p="sm" withBorder radius="md" bg="gray.0">
              <SimpleGrid cols={2} spacing="xs">
                <div>
                  <Text size="xs" c="dimmed">Email:</Text>
                  <Text size="sm" fw={600}>{selectedStudentAudit.email}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Roll Number:</Text>
                  <Text size="sm" fw={600}>{selectedStudentAudit.rollNumber}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Lectures Completed:</Text>
                  <Text size="sm" fw={600}>
                    {selectedStudentAudit.completedLecturesCount} of {selectedStudentAudit.totalLecturesCount}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Total Coverage:</Text>
                  <Text size="sm" fw={700} c="teal.7">
                    {selectedStudentAudit.totalCoursePercentage}%
                  </Text>
                </div>
              </SimpleGrid>
            </Paper>

            <Title order={5} c="dark.8">
              Lecture Watch Logs
            </Title>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Lecture</Table.Th>
                  <Table.Th>Watch Time</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(lectures || []).map((lec, idx) => {
                  const lProg = (selectedStudentAudit.lectureProgress || []).find(
                    (p) => p.lectureId === (lec._id || lec.id)
                  );
                  const isDone = Boolean(lProg?.isCompleted);
                  const watchedMins = Math.round((lProg?.watchedSeconds || 0) / 60);
                  const totalMins = Math.round((lec.durationSeconds || 0) / 60);

                  return (
                    <Table.Tr key={lec._id || idx}>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td fw={500} size="xs">{lec.title}</Table.Td>
                      <Table.Td size="xs">
                        {watchedMins} / {totalMins} mins
                      </Table.Td>
                      <Table.Td>
                        {isDone ? (
                          <Badge color="green" size="xs">100% Watched</Badge>
                        ) : (
                          <Badge color="gray" variant="light" size="xs">Pending</Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            <Group justify="flex-end">
              <Button onClick={() => setStudentAuditModalOpen(false)}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

    
      {/* MODAL 1: DEPARTMENT DELETION ELIGIBILITY & SAFETY MODAL */}
      <Modal
        opened={deleteDeptModalOpened}
        onClose={() => setDeleteDeptModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color={deletionEligibility?.canDelete ? "orange" : "red"} variant="light" size="md">
              {deletionEligibility?.canDelete ? <IconTrash size={18} /> : <IconAlertTriangle size={18} />}
            </ThemeIcon>
            <Text fw={700}>
              {deletionEligibility?.canDelete ? "Confirm Department Deletion" : "Department Deletion Blocked"}
            </Text>
          </Group>
        }
        size="lg"
      >
        {checkingEligibility ? (
          <Center py={40}>
            <Loader size="md" color="indigo" />
            <Text size="sm" ml="md">Checking affiliated courses and exams...</Text>
          </Center>
        ) : deletionEligibility && !deletionEligibility.canDelete ? (
          <Stack gap="md">
            <Alert color="red" variant="light" icon={<IconShieldLock size={20} />} title="Deletion Not Allowed">
              The department <b>{deptToDelete?.name} ({deptToDelete?.code})</b> cannot be deleted because it has <b>{deletionEligibility.totalCourses} course(s)</b> and affiliated exams assigned to it.
            </Alert>

            <Text size="xs" c="dark.7" fw={500}>
              You must first reassign or clear these courses from the department before you can delete it:
            </Text>

            <Table.ScrollContainer minWidth={450}>
              <Table verticalSpacing="xs" striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Course Title</Table.Th>
                    <Table.Th>Semester</Table.Th>
                    <Table.Th>Exam</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {deletionEligibility.courses.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td><Badge color="indigo" size="xs">{c.code}</Badge></Table.Td>
                      <Table.Td fw={600} size="xs">{c.title}</Table.Td>
                      <Table.Td size="xs">Semester {c.semesterNumber}</Table.Td>
                      <Table.Td>
                        {c.hasExam ? (
                          <Badge color="green" variant="light" size="xs">Exam Linked</Badge>
                        ) : (
                          <Badge color="gray" variant="outline" size="xs">No Exam</Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            <Alert color="blue" variant="outline" size="xs">
              💡 <b>Administrative Protection:</b> To preserve academic records and student progression transcripts, departments containing active courses cannot be removed without first deleting or reassigning those courses.
            </Alert>

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setDeleteDeptModalOpened(false)}>
                Close & Return
              </Button>
              <Button disabled color="red">
                Delete Blocked (Courses Affiliated)
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md">
            <Alert color="orange" variant="light" icon={<IconAlertTriangle size={20} />} title="Confirm Removal">
              Are you sure you want to delete department <b>{deptToDelete?.name} ({deptToDelete?.code})</b>?
            </Alert>
            <Text size="sm" c="dark.7">
              This department currently has <b>0 courses</b>. Deleting it will safely remove all {deletionEligibility?.totalSemesters || deptToDelete?.totalSemesters || 4} empty semester shells. This action cannot be undone.
            </Text>
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setDeleteDeptModalOpened(false)}>
                Cancel
              </Button>
              <Button color="red" loading={deletingDept} onClick={confirmDeleteDepartment}>
                Confirm & Delete Department
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* MODAL 2: DEPARTMENT UPDATE ERROR / WARNING MODAL */}
      <Modal
        opened={deptErrorModal.opened}
        onClose={() => setDeptErrorModal({ opened: false, title: "", message: "" })}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
            <Text fw={700} c="red.9">{deptErrorModal.title || "Department Action Notice"}</Text>
          </Group>
        }
        size="md"
      >
        <Stack gap="md">
          <Alert color="red" variant="light" icon={<IconShieldLock size={20} />}>
            {deptErrorModal.message}
          </Alert>
          <Text size="xs" c="dimmed">
            Semesters that contain active courses or exams cannot be deleted or pruned automatically. Please move or clear those courses first before reducing total semesters.
          </Text>
          <Button fullWidth variant="default" onClick={() => setDeptErrorModal({ opened: false, title: "", message: "" })}>
            Understood
          </Button>
        </Stack>
      </Modal>

      {/* MODAL 3: SEMESTER DETAILS EDIT MODAL */}
      <Modal
        opened={semModalOpened}
        onClose={() => setSemModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="indigo" variant="light">
              <IconSchool size={18} />
            </ThemeIcon>
            <Text fw={700}>
              Edit Semester Details - {selectedSemForEdit?.title || `Semester ${selectedSemForEdit?.semesterNumber}`}
            </Text>
          </Group>
        }
        size="md"
      >
        <Stack gap="sm">
          <TextInput
            label="Semester Title"
            required
            placeholder="e.g. Semester 1 - Foundation & Fundamentals"
            value={semForm.title}
            onChange={(e) => setSemForm({ ...semForm, title: e.target.value })}
          />
          <TextInput
            label="Academic Term / Year"
            required
            placeholder="e.g. 2026-2027"
            value={semForm.academicYear}
            onChange={(e) => setSemForm({ ...semForm, academicYear: e.target.value })}
          />
          <Group grow>
            <TextInput
              label="Term Start Date"
              type="date"
              value={semForm.startDate}
              onChange={(e) => setSemForm({ ...semForm, startDate: e.target.value })}
            />
            <TextInput
              label="Term End Date"
              type="date"
              value={semForm.endDate}
              onChange={(e) => setSemForm({ ...semForm, endDate: e.target.value })}
            />
          </Group>
          <Switch
            label="Semester Status (Active / Disabled)"
            description="Controls whether students can access courses within this semester"
            checked={semForm.isActive}
            onChange={(e) => setSemForm({ ...semForm, isActive: e.currentTarget.checked })}
            color="teal"
          />

          <Divider my="xs" label="Affiliated Courses" labelPosition="center" />
          {courses.filter((c) => (c.semesterId?._id || c.semesterId) === (selectedSemForEdit?._id || selectedSemForEdit?.id)).length === 0 ? (
            <Text size="xs" c="dimmed" ta="center">
              No courses assigned to this semester yet.
            </Text>
          ) : (
            <Stack gap={4}>
              {courses
                .filter((c) => (c.semesterId?._id || c.semesterId) === (selectedSemForEdit?._id || selectedSemForEdit?.id))
                .map((c) => (
                  <Group key={c._id || c.id} justify="space-between" p="xs" bg="gray.0" style={{ borderRadius: 6 }}>
                    <div>
                      <Text size="xs" fw={700}>[{c.code}] {c.title}</Text>
                      <Text size="10px" c="dimmed">Instructor: {c.instructorName || "Not assigned"}</Text>
                    </div>
                    <Badge color={c.isActive !== false ? "teal" : "gray"} size="xs">
                      {c.isActive !== false ? "Active" : "Disabled"}
                    </Badge>
                  </Group>
                ))}
            </Stack>
          )}

          <Button fullWidth mt="md" color="indigo" onClick={handleSaveSemester}>
            Save Semester Details
          </Button>
        </Stack>
      </Modal>

    </Box>
  );
}
