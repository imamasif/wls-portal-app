// client/src/features/university/components/UniversityStudentView.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Card,
  SimpleGrid,
  SegmentedControl,
  Badge,
  Button,
  Progress,
  Tabs,
  Loader,
  Center,
  Divider,
  ActionIcon,
  Textarea,
  Modal,
  Radio,
  Alert,
  Accordion,
  Tooltip,
  ThemeIcon,
  TextInput,
  Table,
} from "@mantine/core";
import {
  IconSchool,
  IconLanguage,
  IconVideo,
  IconBooks,
  IconLock,
  IconCheck,
  IconCircleCheck,
  IconAward,
  IconMessageDots,
  IconSend,
  IconAlertCircle,
  IconPlayerPlay,
  IconEye,
  IconClock,
  IconRefresh,
  IconBook2,
  IconArrowLeft,
  IconNotes,
  IconChevronRight,
  IconChevronLeft,
  IconUser,
  IconFileText,
  IconCertificate,
  IconPencil,
  IconChecklist,
  IconPuzzle,
  IconHelpCircle,
} from "@tabler/icons-react";
import { UniversityVideoPlayer } from "./UniversityVideoPlayer";
import { universityApi } from "../api/universityApi";
import { CertificateModal } from "./CertificateModal";

export function UniversityStudentView({ currentUser, onSwitchPerspective }) {
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState("QGE");
  const [departments, setDepartments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Content mode inside player: "video" or "quiz"
  const [contentMode, setContentMode] = useState("video");

  // Course Progress & Lectures
  const [courseData, setCourseData] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

  // Video Anti-Cheat Player State
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [maxWatchedSeconds, setMaxWatchedSeconds] = useState(0);
  const [isCompletedState, setIsCompletedState] = useState(false);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [autoCompletedAlert, setAutoCompletedAlert] = useState(false);

  // Time-stamped Notes State
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // 1-on-1 Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Exam / Quiz Taking State (Image 3)
  const [examModalOpened, setExamModalOpened] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittingExam, setSubmittingExam] = useState(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState(7200); // 2 hours in seconds
  const [timerActive, setTimerActive] = useState(false);

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [activeCertToView, setActiveCertToView] = useState(null);
  const [viewCertModalOpened, setViewCertModalOpened] = useState(false);

  // Anti-cheat notification state
  const [antiCheatWarning, setAntiCheatWarning] = useState(null);

  const studentId = currentUser?._id || currentUser?.id;

  // 1. Initial Load: Student Enrollment & Available Courses
  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [enrollsRes, certsRes, deptsRes] = await Promise.all([
        universityApi.getEnrollments({ studentId }),
        universityApi.getCertificates({ studentId }),
        universityApi.getDepartments(),
      ]);
      setDepartments(deptsRes || []);

      const userEnrollment = enrollsRes && enrollsRes.length > 0 ? enrollsRes[0] : null;
      setEnrollment(userEnrollment);
      setCertificates(certsRes || []);

      let filter = {};
      if (userEnrollment?.departmentId) {
        const deptId = userEnrollment.departmentId._id || userEnrollment.departmentId;
        filter.departmentId = deptId;
      }
      let cList = await universityApi.getCourses(filter);
      if (!cList || cList.length === 0) {
        cList = await universityApi.getCourses();
      }
      setCourses(cList || []);

      if (cList && cList.length > 0 && !selectedCourseId) {
        const ccqUrdu = cList.find((c) => c.code === "CCQ-URDU-101") || cList[0];
        setSelectedCourseId(ccqUrdu._id || ccqUrdu.id);
      }
    } catch (err) {
      console.error("Failed to load student university details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  // 2. Load Course Progress & Lectures for Selected Course
  const loadCourseLectures = async (courseId) => {
    if (!studentId || !courseId) return;
    try {
      const data = await universityApi.getStudentCourseProgress(studentId, courseId);
      setCourseData(data);

      if (data?.lectures && data.lectures.length > 0) {
        if (contentMode === "video") {
          const currentActive = activeLecture
            ? data.lectures.find(
                (l) => (l.lectureId || l._id) === (activeLecture.lectureId || activeLecture._id)
              )
            : null;

          if (currentActive) {
            selectLecture(currentActive);
          } else {
            const nextToWatch =
              data.lectures.find((l) => l.isUnlocked && !l.isCompleted) ||
              data.lectures[0];
            selectLecture(nextToWatch);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load course lectures:", err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseLectures(selectedCourseId);
      loadMessages(selectedCourseId);
    }
  }, [selectedCourseId]);

  // 3. Load Chat Messages
  const loadMessages = (courseId) => {
    if (!studentId || !courseId) return;
    universityApi
      .getMessages(courseId, studentId)
      .then((mList) => setMessages(mList || []))
      .catch((err) => console.error("Error loading chat:", err));
  };

  // 3b. Send 1-on-1 Chat Message to Course Instructor
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedCourseId || !studentId) return;
    setSendingMsg(true);
    try {
      await universityApi.sendMessage({
        courseId: selectedCourseId,
        studentId,
        senderId: studentId,
        senderName: currentUser?.name || "Student",
        senderRole: "student",
        message: chatInput.trim(),
      });
      setChatInput("");
      const mList = await universityApi.getMessages(selectedCourseId, studentId);
      setMessages(mList || []);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // 4. Load Time-stamped Notes for active lecture
  const loadNotes = (lectureId) => {
    if (!studentId || !lectureId) return;
    universityApi
      .getLectureNotes(studentId, lectureId)
      .then((nList) => setNotes(nList || []))
      .catch((err) => console.warn("Failed to load lecture notes:", err));
  };

  // Helper: Select active lecture and initialize anti-cheat bounds
  const selectLecture = (lecture) => {
    if (!lecture) return;
    setContentMode("video");
    setActiveLecture(lecture);
    const initialUrl =
      Array.isArray(lecture.videoUrls) && lecture.videoUrls.length > 0
        ? lecture.videoUrls[0]
        : "https://www.youtube.com/watch?v=0h6xT52z58I";
    setSelectedVideoUrl(initialUrl);

    const initialWatched = lecture.watchedSeconds || 0;
    setPlayedSeconds(lecture.lastPositionSeconds || initialWatched);
    setMaxWatchedSeconds(initialWatched);
    setIsCompletedState(Boolean(lecture.isCompleted));
    setDurationSeconds(lecture.totalDurationSeconds || lecture.durationSeconds || 0);
    setAntiCheatWarning(null);
    setEducationModalOpen(false);
    setAutoCompletedAlert(false);

    loadNotes(lecture.lectureId || lecture._id);
  };

  // Select Quiz Mode (Image 3)
  const selectQuiz = () => {
    setContentMode("quiz");
    setActiveLecture(null);
    setAntiCheatWarning(null);
  };

  // 5. Anti-Cheat Video Watch Logic:
  // If lecture is ALREADY completed -> student can re-watch freely anytime with NO restrictions!
  // If lecture is NOT completed and mandatory -> prevent scrubbing ahead!
  const handleProgress = ({ playedSeconds: currentSecs, totalSeconds }) => {
    if (totalSeconds && totalSeconds > 0 && (!durationSeconds || durationSeconds !== totalSeconds)) {
      setDurationSeconds(totalSeconds);
    }

    if (activeLecture?.isMandatory && !isCompletedState) {
      if (currentSecs > maxWatchedSeconds + 3) {
        if (playerRef.current) {
          playerRef.current.seekTo(maxWatchedSeconds, "seconds");
        }
        setAntiCheatWarning(
          "⚠️ Fast-forwarding is restricted on mandatory lectures. Please watch the video end-to-end to complete this module."
        );
        return;
      }
    }

    setPlayedSeconds(currentSecs);
    if (currentSecs > maxWatchedSeconds) {
      setMaxWatchedSeconds(currentSecs);
    }

    // Auto-complete if student has legitimately watched 95%+ of video
    const effectiveDur = totalSeconds || durationSeconds || activeLecture?.durationSeconds || 0;
    if (effectiveDur > 0 && currentSecs >= effectiveDur * 0.95 && !isCompletedState) {
      setIsCompletedState(true);
      saveProgressToBackend(currentSecs, true);
      setAutoCompletedAlert(true);
      return;
    }

    // Periodically save progress to backend (every ~10 seconds)
    if (Math.round(currentSecs) > 0 && Math.round(currentSecs) % 10 === 0) {
      saveProgressToBackend(currentSecs, false);
    }
  };

  const handleDuration = (dur) => {
    if (dur && Number.isFinite(dur) && dur > 0) {
      const roundedDur = Math.round(dur);
      setDurationSeconds(roundedDur);
      if (activeLecture) {
        activeLecture.durationSeconds = roundedDur;
        activeLecture.totalDurationSeconds = roundedDur;
      }
      if (courseData?.lectures) {
        const curLecId = activeLecture?.lectureId || activeLecture?._id;
        const target = courseData.lectures.find(
          (l) => (l.lectureId || l._id) === curLecId
        );
        if (target) {
          target.durationSeconds = roundedDur;
          target.totalDurationSeconds = roundedDur;
        }
      }
      // Persist real duration to database
      if (studentId && selectedCourseId && activeLecture) {
        universityApi.updateProgress({
          studentId,
          courseId: selectedCourseId,
          lectureId: activeLecture.lectureId || activeLecture._id,
          watchedSeconds: maxWatchedSeconds || 0,
          totalDurationSeconds: roundedDur,
          lastPositionSeconds: playedSeconds || 0,
          markComplete: false,
        }).catch(() => {});
      }
    }
  };

  const handleEnded = () => {
    const effectiveDur = durationSeconds || maxWatchedSeconds || activeLecture?.durationSeconds || 0;
    setMaxWatchedSeconds(effectiveDur);
    setIsCompletedState(true);
    saveProgressToBackend(effectiveDur, true);
    setAutoCompletedAlert(true);
  };

  const saveProgressToBackend = async (currentSecs, markComplete = false) => {
    if (!activeLecture || !selectedCourseId || !studentId) return;
    try {
      const dur = durationSeconds || activeLecture.durationSeconds || 0;
      await universityApi.updateLectureProgress({
        studentId,
        courseId: selectedCourseId,
        lectureId: activeLecture.lectureId || activeLecture._id,
        watchedSeconds: Math.round(Math.max(maxWatchedSeconds, currentSecs)),
        totalDurationSeconds: Math.round(dur),
        lastPositionSeconds: Math.round(currentSecs),
        markComplete,
      });

      if (markComplete) {
        loadCourseLectures(selectedCourseId);
      }
    } catch (err) {
      console.warn("Progress sync warning:", err.message);
    }
  };

  // 6. Manual Mark Completed Action (Image 5 center green pill button)
  const handleManualMarkCompleted = async () => {
    if (!activeLecture) return;
    const isMandatory = activeLecture.isMandatory !== false;
    const dur = durationSeconds || activeLecture.durationSeconds || 0;

    // Strict Anti-Cheat Verification:
    // If mandatory and not yet watched fully, pop up educational modal to guide the student!
    if (isMandatory && !isCompletedState) {
      if (!dur || maxWatchedSeconds < dur * 0.95) {
        setEducationModalOpen(true);
        return;
      }
    }

    const completedSeconds = dur > 0 ? dur : (durationSeconds || playedSeconds || 60);
    await saveProgressToBackend(completedSeconds, true);
    setIsCompletedState(true);
    handleNextLecture();
  };

  // 7. Navigation: Next & Previous Lectures
  const allLecturesList = courseData?.lectures || [];
  const currentLectureIndex = allLecturesList.findIndex(
    (l) => (l.lectureId || l._id) === (activeLecture?.lectureId || activeLecture?._id)
  );

  const handleNextLecture = () => {
    if (contentMode === "video") {
      const isMandatory = activeLecture?.isMandatory !== false;
      const isAlreadyCompleted = Boolean(isCompletedState || activeLecture?.isCompleted);

      // If current lecture is mandatory and NOT completed yet: show standard dialog
      if (isMandatory && !isAlreadyCompleted) {
        const dur = durationSeconds || activeLecture?.durationSeconds || 0;
        if (!dur || maxWatchedSeconds < dur * 0.95) {
          setEducationModalOpen(true);
          return;
        }
      }

      if (currentLectureIndex >= 0 && currentLectureIndex < allLecturesList.length - 1) {
        const nextLec = allLecturesList[currentLectureIndex + 1];
        selectLecture(nextLec);
      } else if (courseData?.exam?.isExamUnlocked) {
        // Reached end of lectures -> open Quiz!
        selectQuiz();
      }
    }
  };

  const handlePrevLecture = () => {
    if (contentMode === "quiz") {
      if (allLecturesList.length > 0) {
        selectLecture(allLecturesList[allLecturesList.length - 1]);
      }
    } else if (currentLectureIndex > 0) {
      selectLecture(allLecturesList[currentLectureIndex - 1]);
    }
  };

  // 8. Save Time-stamped Note
  const handleSaveNote = async () => {
    if (!noteInput.trim() || !activeLecture || !selectedCourseId) return;
    setSavingNote(true);
    try {
      const saved = await universityApi.saveLectureNote({
        studentId,
        courseId: selectedCourseId,
        lectureId: activeLecture.lectureId || activeLecture._id,
        text: noteInput.trim(),
        timestampSeconds: Math.round(playedSeconds),
      });
      setNotes((prev) => [...prev, saved]);
      setNoteInput("");
      setNoteModalOpen(false);
    } catch (err) {
      alert("Failed to save note: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  // 9. Exam / Quiz Submission (Image 3)
  const handleStartExam = () => {
    setQuizAnswers({});
    setExamTimeRemaining(7200); // 2 hours
    setTimerActive(true);
    setExamModalOpened(true);
  };

  const handleSubmitExam = async () => {
    const questions = courseData?.exam?.questions || [];
    let correctCount = 0;
    const formattedAnswers = questions.map((q, qIdx) => {
      const selected = quizAnswers[qIdx];
      const isCorrect = Array.isArray(q.correctAnswers)
        ? q.correctAnswers.includes(selected)
        : false;
      if (isCorrect) correctCount++;
      return {
        questionId: q._id || qIdx,
        selectedAnswer: selected,
        isCorrect,
      };
    });

    const score = correctCount * 10;
    const maxScore = questions.length * 10;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passingPct = courseData?.exam?.passingPercentage || 75;
    const isPassed = percentage >= passingPct;

    setSubmittingExam(true);
    try {
      await universityApi.submitExamAttempt({
        studentId,
        courseId: selectedCourseId,
        quizId: courseData?.exam?.quizId,
        attemptNumber: (courseData?.exam?.attemptsCount || 0) + 1,
        score,
        maxScore,
        percentage,
        isPassed,
        answers: formattedAnswers,
      });

      setTimerActive(false);
      setExamModalOpened(false);
      loadCourseLectures(selectedCourseId);
    } catch (err) {
      alert("Failed to submit exam: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingExam(false);
    }
  };

  // Exam timer countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && examTimeRemaining > 0) {
      interval = setInterval(() => {
        setExamTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (examTimeRemaining <= 0 && timerActive) {
      setTimerActive(false);
      handleSubmitExam();
    }
    return () => clearInterval(interval);
  }, [timerActive, examTimeRemaining]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs) => {
    if (!secs) return "00:00";
    const totalSecs = Math.round(secs);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const remSecs = totalSecs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
  };

  // Format lecture duration nicely (e.g. 53m 35s or 1h 12m)
  const formatDurationDisplay = (secs) => {
    if (!secs || secs <= 0) return "0 mins";
    const totalSecs = Math.round(secs);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const remSecs = totalSecs % 60;
    if (hrs > 0) {
      return remSecs > 0 ? `${hrs}h ${mins}m ${remSecs}s` : `${hrs}h ${mins}m`;
    }
    if (remSecs > 0) {
      return `${mins}m ${remSecs}s`;
    }
    return `${mins} mins`;
  };

  // Format remaining seconds or elapsed seconds (e.g. 5m 20s or 1h 12m)
  const formatRemaining = (secs) => {
    if (!secs || secs <= 0) return "0s";
    const totalSecs = Math.round(secs);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const remSecs = totalSecs % 60;
    if (hrs > 0) {
      return remSecs > 0 ? `${hrs}h ${mins}m ${remSecs}s` : `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
    }
    return `${remSecs}s`;
  };

  // Format 2-digit index (e.g. 01, 02, 03...)
  const formatIndex = (idx) => String(idx + 1).padStart(2, "0");

  // Group lectures by topicName
  const groupedTopics = {};
  allLecturesList.forEach((lec) => {
    const topic = lec.topicName || "General Curriculum";
    if (!groupedTopics[topic]) groupedTopics[topic] = [];
    groupedTopics[topic].push(lec);
  });

  const activeCourse = courses.find((c) => (c._id || c.id) === selectedCourseId) || courses[0];

  // Dynamic Real-time Course Coverage:
  // Combines all completed lectures + real-time in-progress watch time of the active lecture
  const dynamicCourseCoverage = useMemo(() => {
    const lectures = courseData?.lectures || [];
    if (lectures.length === 0) return 0;

    let totalProgressSum = 0;
    lectures.forEach((lec) => {
      const lecId = lec.lectureId || lec._id;
      const isActive = activeLecture && (activeLecture.lectureId || activeLecture._id) === lecId;

      if (lec.isCompleted || (isActive && isCompletedState)) {
        totalProgressSum += 1.0;
      } else {
        const watched = isActive
          ? Math.max(lec.watchedSeconds || 0, maxWatchedSeconds, playedSeconds)
          : (lec.watchedSeconds || 0);
        const dur = (isActive ? (durationSeconds || lec.totalDurationSeconds || lec.durationSeconds) : (lec.totalDurationSeconds || lec.durationSeconds)) || 1800;
        if (dur > 0 && watched > 0) {
          totalProgressSum += Math.min(0.99, watched / dur);
        }
      }
    });

    return Math.min(100, Math.round((totalProgressSum / lectures.length) * 100));
  }, [courseData, activeLecture, isCompletedState, maxWatchedSeconds, playedSeconds, durationSeconds]);

  const courseCoverage = Math.max(courseData?.totalCoursePercentage || 0, dynamicCourseCoverage);
  const completedLecturesCount = courseData?.completedCount || 0;
  const remainingLecturesCount = courseData?.remainingCount || 0;

  const totalWatchedSeconds = (courseData?.lectures || []).reduce((sum, l) => {
    const lecId = l.lectureId || l._id;
    const isActive = activeLecture && (activeLecture.lectureId || activeLecture._id) === lecId;
    const watched = isActive
      ? Math.max(l.watchedSeconds || 0, maxWatchedSeconds, playedSeconds)
      : (l.watchedSeconds || 0);
    return sum + watched;
  }, 0);
  const totalHoursSpent = (totalWatchedSeconds / 3600).toFixed(1);

  if (loading) {
    return (
      <Center py={100}>
        <Loader size="lg" color="indigo" />
      </Center>
    );
  }

  // =========================================================================
  // VIEW MODE 1: CONTINUOUS COURSE PLAYER & EXAM (Images 1, 2, 3, 5)
  // =========================================================================
  if (isPlayerOpen && activeCourse) {
    return (
      <Box style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "80px" }}>
        {/* Top Navbar Header */}
        <Paper
          p="sm"
          px="lg"
          withBorder
          shadow="xs"
          mb="md"
          bg="white"
          style={{ position: "sticky", top: 0, zIndex: 10 }}
        >
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                leftSection={<IconArrowLeft size={18} />}
                onClick={() => setIsPlayerOpen(false)}
              >
                Back to Dashboard
              </Button>
              <Divider orientation="vertical" />
              <Title order={3} c="dark.8" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                {activeCourse.title}
              </Title>
            </Group>

            <Group gap="xs">
              <Badge color="indigo" size="sm" variant="light">
                {activeCourse.code}
              </Badge>
              {enrollment?.rollNumber && (
                <Badge color="dark" size="sm" variant="outline">
                  Roll: {enrollment.rollNumber}
                </Badge>
              )}
            </Group>
          </Group>
        </Paper>

        {/* 2-Column Split Workspace */}
        <Box px={{ base: "xs", md: "md" }}>
          <SimpleGrid cols={{ base: 1, md: 12 }} spacing="md">
            {/* LEFT COLUMN: Sidebar with Progress & Sequential Topics (Cols: 4) */}
            <Box style={{ gridColumn: "span 4" }}>
              <Paper p="md" radius="md" withBorder bg="white" shadow="xs" mb="md">
                {/* Progress Card (Image 1, 2, 5) */}
                <Group justify="space-between" align="center" mb={6}>
                  <Text fw={700} size="sm" c="dark.8">
                    {courseCoverage}% Completed
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={() => loadCourseLectures(selectedCourseId)}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Group>
                <Progress
                  value={courseCoverage}
                  color="teal"
                  size="sm"
                  radius="xl"
                  animated={courseCoverage > 0 && courseCoverage < 100}
                />
              </Paper>

              {/* Topics & Lectures Accordion List */}
              <Paper radius="md" withBorder bg="white" shadow="xs" p="xs">
                <Accordion
                  multiple
                  defaultValue={Object.keys(groupedTopics)}
                  variant="filled"
                  styles={{
                    item: { borderBottom: "1px solid #f1f5f9" },
                    control: { padding: "8px 12px", fontWeight: 600, fontSize: "13px" },
                    content: { padding: "4px 0" },
                  }}
                >
                  {Object.entries(groupedTopics).map(([topicTitle, topicLectures], tIdx) => (
                    <Accordion.Item key={topicTitle} value={topicTitle}>
                      <Accordion.Control>
                        <Group gap="xs" wrap="nowrap">
                          <ThemeIcon size={20} radius="xl" color="indigo" variant="light">
                            <Text size="10px" fw={700}>
                              {formatIndex(tIdx)}
                            </Text>
                          </ThemeIcon>
                          <Text size="xs" fw={700} c="dark.8" lineClamp={1}>
                            {topicTitle}
                          </Text>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap={3}>
                          {topicLectures.map((lec, lIdx) => {
                            const isSelected =
                              contentMode === "video" &&
                              (lec.lectureId || lec._id) ===
                                (activeLecture?.lectureId || activeLecture?._id);
                            const isCompleted = Boolean(lec.isCompleted || (isSelected && isCompletedState));
                            const isLocked = !lec.isUnlocked && !isCompleted;
                            const curDur = (isSelected && durationSeconds > 0)
                              ? durationSeconds
                              : (lec.durationSeconds || lec.totalDurationSeconds || 0);

                            return (
                              <Box
                                key={lec.lectureId || lec._id}
                                p="8px 12px"
                                style={{
                                  borderRadius: "6px",
                                  backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                                  borderLeft: isSelected
                                    ? "3.5px solid #2563eb"
                                    : "3.5px solid transparent",
                                  cursor: isLocked ? "not-allowed" : "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                onClick={() => !isLocked && selectLecture(lec)}
                              >
                                <Group justify="space-between" align="center" wrap="nowrap">
                                  <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                    {isCompleted ? (
                                      <ThemeIcon size={22} radius="xl" color="teal" variant="filled">
                                        <IconCheck size={13} stroke={3} />
                                      </ThemeIcon>
                                    ) : isLocked ? (
                                      <ThemeIcon size={22} radius="xl" color="gray.2" variant="filled">
                                        <IconLock size={12} color="#94a3b8" />
                                      </ThemeIcon>
                                    ) : (
                                      <ThemeIcon size={22} radius="xl" color={isSelected ? "blue" : "gray.2"} variant="filled">
                                        <IconPlayerPlay size={12} color={isSelected ? "#ffffff" : "#475569"} />
                                      </ThemeIcon>
                                    )}
                                    <Box style={{ minWidth: 0, flex: 1 }}>
                                      <Text
                                        size="xs"
                                        fw={isSelected ? 700 : isCompleted ? 600 : 500}
                                        c={isSelected ? "blue.8" : isCompleted ? "teal.8" : isLocked ? "dimmed" : "dark.8"}
                                        lineClamp={1}
                                      >
                                        <Text span fw={600} mr={4} c="dimmed">
                                          {formatIndex(lIdx)}.
                                        </Text>
                                        {lec.title}
                                      </Text>
                                      <Group gap={6} align="center">
                                        {isCompleted ? (
                                          <Text size="11px" fw={700} c="teal.7">
                                            Completed ✔
                                          </Text>
                                        ) : (
                                          <Text size="11px" c="dimmed">
                                            Video
                                          </Text>
                                        )}
                                        <Text size="11px" c="dimmed">•</Text>
                                        <Text size="11px" c="dimmed">
                                          {formatDurationDisplay(curDur)}
                                        </Text>
                                      </Group>
                                    </Box>
                                  </Group>
                                </Group>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}

                  {/* Capstone Item: Course Quiz / Exam (Image 2 & 3) */}
                  {courseData?.exam && (
                    <Box
                      p="10px 14px"
                      mt="xs"
                      style={{
                        borderRadius: "6px",
                        backgroundColor: contentMode === "quiz" ? "#f1f5f9" : "transparent",
                        borderLeft:
                          contentMode === "quiz"
                            ? "3.5px solid #2563eb"
                            : "3.5px solid transparent",
                        cursor: courseData.exam.isExamUnlocked ? "pointer" : "not-allowed",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => courseData.exam.isExamUnlocked && selectQuiz()}
                    >
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          {courseData.exam.hasPassedExam ? (
                            <IconCircleCheck size={18} color="#10b981" />
                          ) : !courseData.exam.isExamUnlocked ? (
                            <IconLock size={16} color="#94a3b8" />
                          ) : (
                            <IconAward
                              size={18}
                              color={contentMode === "quiz" ? "#2563eb" : "#eab308"}
                            />
                          )}
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text
                              size="xs"
                              fw={contentMode === "quiz" ? 700 : 600}
                              c={
                                contentMode === "quiz"
                                  ? "blue.8"
                                  : !courseData.exam.isExamUnlocked
                                  ? "dimmed"
                                  : "dark.8"
                              }
                              lineClamp={1}
                            >
                              {courseData.exam.quizTitle}
                            </Text>
                            <Text size="11px" c="dimmed">
                              Quiz • Pass {courseData.exam.passingPercentage}% • Max {courseData.exam.maxAttempts} Attempts
                            </Text>
                          </Box>
                        </Group>
                      </Group>
                    </Box>
                  )}
                </Accordion>
              </Paper>
            </Box>

            {/* RIGHT COLUMN: Video Player or Exam Card (Cols: 8) */}
            <Box style={{ gridColumn: "span 8" }}>
              {/* CASE A: VIDEO PLAYER MODE (Images 1, 2, 5) */}
              {contentMode === "video" && (
                <Paper p="md" radius="md" withBorder bg="white" shadow="xs" mb="md">
                  <Group justify="space-between" mb="xs" align="center">
                    <div>
                      <Title order={3} c="dark.9" style={{ fontSize: "1.2rem" }}>
                        {activeLecture?.title || "Video Lecture"}
                      </Title>
                      <Text size="xs" c="dimmed">
                        {activeLecture?.topicName || "Curriculum"}
                      </Text>
                    </div>
                    {isCompletedState ? (
                      <Badge color="green" variant="light" size="sm">
                        Completed (Watch Anytime)
                      </Badge>
                    ) : activeLecture?.isMandatory ? (
                      <Badge color="red" variant="light" size="sm">
                        Mandatory Video
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light" size="sm">
                        Optional Lesson
                      </Badge>
                    )}
                  </Group>

                  {antiCheatWarning && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      color="red"
                      mb="sm"
                      withCloseButton
                      onClose={() => setAntiCheatWarning(null)}
                    >
                      {antiCheatWarning}
                    </Alert>
                  )}

                  {autoCompletedAlert && (
                    <Alert
                      icon={<IconCircleCheck size={18} />}
                      color="teal"
                      title="🎉 Module Completed Automatically!"
                      withCloseButton
                      onClose={() => setAutoCompletedAlert(false)}
                      mb="sm"
                    >
                      You have finished watching the entire video! This lecture has been automatically marked as complete in your curriculum and your progress is saved.
                    </Alert>
                  )}

                  {/* Enhanced University Video Player with YouTube IFrame API & Anti-Cheat Scrub Locking */}
                  <Box mb="md">
                    <UniversityVideoPlayer
                      videoUrl={selectedVideoUrl}
                      isMandatory={Boolean(activeLecture?.isMandatory !== false)}
                      isCompleted={isCompletedState}
                      initialPosition={activeLecture?.lastPositionSeconds || 0}
                      onDuration={handleDuration}
                      onProgress={handleProgress}
                      onEnded={handleEnded}
                      onCheatDetected={(warning) => setAntiCheatWarning(warning)}
                    />
                  </Box>

                  {/* Note Taking & 1-on-1 Course Instructor Chat Tabs */}
                  <Paper p="sm" withBorder radius="md" bg="gray.0" mb="md">
                    <style>{`
                      .student-tabs-pill-bar {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        padding: 5px;
                        border-radius: 12px;
                        display: flex;
                        gap: 6px;
                        box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.05);
                        margin-bottom: 12px;
                      }
                      .student-tabs-pill-bar .mantine-Tabs-tab {
                        font-weight: 600;
                        font-size: 13px;
                        padding: 8px 16px;
                        border-radius: 9px;
                        color: #475569;
                        border: 1px solid transparent;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                      }
                      .student-tabs-pill-bar .mantine-Tabs-tab:hover {
                        background: #f1f5f9;
                        color: #1e293b;
                        transform: translateY(-1px);
                      }
                      .student-tabs-pill-bar .mantine-Tabs-tab[data-active] {
                        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%) !important;
                        color: #ffffff !important;
                        box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.45);
                        border-color: rgba(255, 255, 255, 0.2);
                        transform: translateY(-1px);
                      }
                      .student-tabs-pill-bar .mantine-Tabs-tab[data-active] svg {
                        color: #ffffff !important;
                      }
                    `}</style>
                    <Tabs defaultValue="notes" variant="pills" radius="md">
                      <Tabs.List className="student-tabs-pill-bar">
                        <Tabs.Tab
                          value="notes"
                          leftSection={<IconFileText size={16} />}
                          rightSection={
                            <Badge
                              size="sm"
                              circle
                              variant="light"
                              color="indigo"
                              style={{ fontWeight: 700 }}
                            >
                              {notes.length}
                            </Badge>
                          }
                        >
                          Module Notes
                        </Tabs.Tab>
                        <Tabs.Tab value="chat" leftSection={<IconMessageDots size={16} />}>
                          Ask Instructor (Course Chat)
                        </Tabs.Tab>
                      </Tabs.List>

                      <Tabs.Panel value="notes">
                        <Stack gap="xs">
                          <TextInput
                            placeholder="Type your note here to save for later..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            size="sm"
                            rightSection={
                              <ActionIcon
                                variant="filled"
                                color="indigo"
                                size="sm"
                                onClick={handleSaveNote}
                                loading={savingNote}
                              >
                                <IconPencil size={14} />
                              </ActionIcon>
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNote();
                            }}
                          />

                          {notes.length === 0 ? (
                            <Center py="md">
                              <Stack align="center" gap={2}>
                                <ThemeIcon size={36} radius="xl" color="gray" variant="light">
                                  <IconFileText size={18} />
                                </ThemeIcon>
                                <Text size="xs" c="dimmed">
                                  No Notes Have Been Added!
                                </Text>
                              </Stack>
                            </Center>
                          ) : (
                            <Stack gap="xs" mt={4}>
                              {notes.map((n, idx) => (
                                <Paper key={n.noteId || idx} p="xs" withBorder radius="sm" bg="white">
                                  <Group justify="space-between" align="center">
                                    <Text size="xs" c="dark.8">
                                      {n.text}
                                    </Text>
                                    <Button
                                      variant="light"
                                      color="indigo"
                                      size="compact-xs"
                                      onClick={() => {
                                        if (playerRef.current && n.timestampSeconds != null) {
                                          playerRef.current.seekTo(n.timestampSeconds, "seconds");
                                        }
                                      }}
                                    >
                                      {formatTime(n.timestampSeconds)}
                                    </Button>
                                  </Group>
                                </Paper>
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Tabs.Panel>

                      <Tabs.Panel value="chat">
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Text size="xs" fw={600} c="dimmed">
                              Course Instructor: <strong style={{ color: "#3730a3" }}>{activeCourse?.instructorName || "Faculty Instructor"}</strong>
                            </Text>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="indigo"
                              leftSection={<IconRefresh size={12} />}
                              onClick={() => loadMessages(selectedCourseId)}
                            >
                              Refresh Chat
                            </Button>
                          </Group>

                          <Paper
                            p="xs"
                            withBorder
                            radius="sm"
                            bg="white"
                            style={{ maxHeight: "180px", minHeight: "90px", overflowY: "auto" }}
                          >
                            {messages.length === 0 ? (
                              <Text size="xs" c="dimmed" ta="center" py="md">
                                No messages yet for this course. Type your academic question or feedback below.
                              </Text>
                            ) : (
                              <Stack gap={6}>
                                {messages.map((m, idx) => {
                                  const isMe = (m.senderId?._id || m.senderId) === studentId || m.senderRole === "student";
                                  return (
                                    <Box
                                      key={m._id || idx}
                                      style={{
                                        alignSelf: isMe ? "flex-end" : "flex-start",
                                        maxWidth: "80%",
                                      }}
                                    >
                                      <Paper
                                        p="6px 10px"
                                        radius="md"
                                        bg={isMe ? "indigo.1" : "gray.1"}
                                        style={{ border: isMe ? "1px solid #c7d2fe" : "1px solid #e2e8f0" }}
                                      >
                                        <Group gap={6} mb={2}>
                                          <Text size="11px" fw={700} c={isMe ? "indigo.9" : "teal.9"}>
                                            {isMe ? "You" : m.senderName || "Instructor"}
                                          </Text>
                                          <Text size="10px" c="dimmed">
                                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                          </Text>
                                        </Group>
                                        <Text size="xs" c="dark.8">
                                          {m.message}
                                        </Text>
                                      </Paper>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            )}
                          </Paper>

                          <Group gap="xs">
                            <TextInput
                              placeholder="Type a message or question to your instructor..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendMessage();
                              }}
                              size="sm"
                              style={{ flex: 1 }}
                            />
                            <ActionIcon
                              color="indigo"
                              variant="filled"
                              size="input-sm"
                              onClick={handleSendMessage}
                              loading={sendingMsg}
                              disabled={!chatInput.trim()}
                              title="Send Message"
                            >
                              <IconSend size={16} />
                            </ActionIcon>
                          </Group>
                        </Stack>
                      </Tabs.Panel>
                    </Tabs>
                  </Paper>

                  {/* Bottom Action Bar (Image 5: Previous, Completed, Next) */}
                  <Divider my="md" />
                  <Group justify="space-between" align="center">
                    <Button
                      variant="default"
                      size="sm"
                      leftSection={<IconChevronLeft size={16} />}
                      onClick={handlePrevLecture}
                      disabled={currentLectureIndex <= 0}
                    >
                      Previous
                    </Button>

                    {isCompletedState ? (
                      <Button
                        color="teal"
                        size="md"
                        radius="xl"
                        leftSection={<IconCheck size={18} />}
                        onClick={handleNextLecture}
                      >
                        Completed ✔ {currentLectureIndex < allLecturesList.length - 1 ? "(Next Module)" : "(Take Quiz)"}
                      </Button>
                    ) : (
                      <Button
                        color={activeLecture?.isMandatory !== false && (!durationSeconds || maxWatchedSeconds < durationSeconds * 0.95) ? "orange" : "teal"}
                        variant={activeLecture?.isMandatory !== false && (!durationSeconds || maxWatchedSeconds < durationSeconds * 0.95) ? "light" : "filled"}
                        size="md"
                        radius="xl"
                        leftSection={activeLecture?.isMandatory !== false && (!durationSeconds || maxWatchedSeconds < durationSeconds * 0.95) ? <IconLock size={18} /> : <IconCheck size={18} />}
                        onClick={handleManualMarkCompleted}
                      >
                        {activeLecture?.isMandatory !== false && (!durationSeconds || maxWatchedSeconds < durationSeconds * 0.95)
                          ? `Mark as Complete (${formatRemaining(Math.max(0, (durationSeconds || 0) - maxWatchedSeconds))} left)`
                          : "Mark as Complete"}
                      </Button>
                    )}

                    <Button
                      variant="default"
                      size="sm"
                      rightSection={<IconChevronRight size={16} />}
                      onClick={handleNextLecture}
                      disabled={
                        currentLectureIndex >= allLecturesList.length - 1 &&
                        !courseData?.exam?.isExamUnlocked
                      }
                    >
                      Next
                    </Button>
                  </Group>
                </Paper>
              )}

              {/* CASE B: QUIZ / EXAM SCREEN (Image 3) */}
              {contentMode === "quiz" && (
                <Paper p="xl" radius="md" withBorder bg="white" shadow="xs">
                  {/* Top Illustration Banner (Image 3) */}
                  <Center
                    p="xl"
                    mb="lg"
                    style={{
                      background: "linear-gradient(180deg, #f1f5f9 0%, #ffffff 100%)",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <ThemeIcon size={80} radius="xl" color="indigo" variant="light">
                      <IconPuzzle size={44} />
                    </ThemeIcon>
                  </Center>

                  {/* Title & Description */}
                  <Title order={2} c="dark.9" mb={4}>
                    {courseData?.exam?.quizTitle || "Course Final Quiz"}
                  </Title>
                  <Text size="sm" c="dimmed" mb="lg">
                    {courseData?.exam?.quizDescription ||
                      "Alfaaz ke rang aur maienay ki shanakht karen."}
                  </Text>

                  {/* Info Table (Image 3) */}
                  <Table withTableBorder withColumnBorders mb="xl" verticalSpacing="sm">
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td fw={600} style={{ width: "40%" }}>
                          Questions
                        </Table.Td>
                        <Table.Td>{courseData?.exam?.questionsCount || 20}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td fw={600}>Quiz Time</Table.Td>
                        <Table.Td>{courseData?.exam?.quizTime || "2 Hours"}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td fw={600}>Total Marks</Table.Td>
                        <Table.Td>{(courseData?.exam?.questionsCount || 20) * 10}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td fw={600}>Passing Grade</Table.Td>
                        <Table.Td fw={700} c="indigo.7">
                          {courseData?.exam?.passingPercentage || 75}%
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td fw={600}>Earned Grade</Table.Td>
                        <Table.Td fw={700} c={courseData?.exam?.hasPassedExam ? "green.7" : "dark.8"}>
                          {courseData?.exam?.highestScore > 0
                            ? `${courseData.exam.highestScore}%`
                            : "-"}
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>

                  {/* Attempts History (Image 3) */}
                  <Title order={4} mb="xs" c="dark.8">
                    Attempts History
                  </Title>

                  {courseData?.exam?.attempts?.length === 0 ? (
                    <Paper p="md" withBorder radius="md" bg="gray.0" mb="lg">
                      <Text size="xs" c="dimmed" ta="center">
                        No attempts made yet. You have {courseData?.exam?.maxAttempts || 5} attempts available.
                      </Text>
                    </Paper>
                  ) : (
                    <Stack gap="sm" mb="lg">
                      {courseData?.exam?.attempts?.map((att, idx) => (
                        <Paper key={att._id || idx} p="md" withBorder radius="md" bg="gray.0">
                          <Group justify="space-between" align="center" wrap="wrap">
                            <div>
                              <Text size="sm" fw={700}>
                                Attempt {att.attemptNumber} of {courseData?.exam?.maxAttempts || 5}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {activeCourse.title} • {new Date(att.attemptedAt || att.createdAt).toLocaleString()}
                              </Text>
                            </div>

                            <Group gap="md">
                              <Badge
                                size="lg"
                                color={att.isPassed ? "green" : "red"}
                                variant="light"
                              >
                                {att.percentage}%
                              </Badge>
                              <Badge color={att.isPassed ? "green" : "red"} variant="filled">
                                {att.isPassed ? "Passed" : "Failed"}
                              </Badge>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  {/* Start Exam Button */}
                  <Group justify="flex-end">
                    {courseData?.exam?.hasPassedExam ? (
                      <Button
                        size="md"
                        color="teal"
                        radius="md"
                        leftSection={<IconCheck size={18} />}
                        onClick={() => setIsPlayerOpen(false)}
                      >
                        Continue Lesson
                      </Button>
                    ) : (courseData?.exam?.attemptsCount || 0) <
                      (courseData?.exam?.maxAttempts || 5) ? (
                      <Button
                        size="md"
                        color="indigo"
                        radius="md"
                        leftSection={<IconAward size={18} />}
                        onClick={handleStartExam}
                      >
                        Start Quiz / Exam (Attempt {(courseData?.exam?.attemptsCount || 0) + 1} of{" "}
                        {courseData?.exam?.maxAttempts || 5})
                      </Button>
                    ) : (
                      <Alert color="red" title="Maximum Attempts Reached">
                        You have used all {courseData?.exam?.maxAttempts || 5} attempts. Please contact your instructor.
                      </Alert>
                    )}
                  </Group>
                </Paper>
              )}
            </Box>
          </SimpleGrid>
        </Box>


      {/* Educational Modal for Incomplete Mandatory Lecture */}
      <Modal
        opened={educationModalOpen}
        onClose={() => setEducationModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="orange" size="lg" radius="md" variant="light">
              <IconSchool size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">Mandatory Video Completion Policy</Text>
              <Text size="xs" c="dimmed">{activeLecture?.title || "Course Lecture"}</Text>
            </div>
          </Group>
        }
        centered
        size="md"
        radius="md"
        overlayProps={{ opacity: 0.55, blur: 3 }}
      >
        <Stack gap="md" py="xs">
          <Text size="sm" c="gray.7">
            This lecture is designated as <strong>Mandatory</strong> by the University curriculum. To ensure authentic learning and preserve academic integrity, students are required to watch mandatory lectures from start to finish at their own pace.
          </Text>

          {/* Current Watch Progress Card */}
          <Paper p="md" radius="md" withBorder bg="gray.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={600} c="dimmed">YOUR WATCH PROGRESS</Text>
              <Badge color="orange" variant="light" size="xs">In Progress</Badge>
            </Group>
            
            <Progress 
              value={Math.min(100, Math.round(((maxWatchedSeconds || 0) / (durationSeconds || 1)) * 100))} 
              color="orange" 
              size="lg" 
              radius="xl" 
              animated 
            />

            <Group justify="space-between" mt="xs">
              <div>
                <Text size="xs" c="dimmed">Watched</Text>
                <Text size="xs" fw={700}>{formatRemaining(maxWatchedSeconds)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Total Duration</Text>
                <Text size="xs" fw={700}>{formatRemaining(durationSeconds)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Remaining</Text>
                <Text size="xs" fw={700} c="orange.8">
                  {formatRemaining(Math.max(0, (durationSeconds || 0) - maxWatchedSeconds))}
                </Text>
              </div>
            </Group>
          </Paper>

          {/* Key Guidelines */}
          <Paper p="xs" radius="sm" bg="blue.0" style={{ borderLeft: '4px solid var(--mantine-color-blue-6)' }}>
            <Stack gap={4}>
              <Text size="xs" fw={600} c="blue.9">🎓 How It Works:</Text>
              <Text size="xs" c="blue.8">
                • <strong>Automatic Completion:</strong> Once you watch through the video time, the system will <strong>automatically mark it complete</strong> and unlock the next lecture or quiz.
              </Text>
              <Text size="xs" c="blue.8">
                • <strong>Free Replay:</strong> After completion, you can revisit this video anytime and scroll forward or backward freely with zero restrictions.
              </Text>
            </Stack>
          </Paper>

          <Button 
            fullWidth 
            color="indigo" 
            size="md" 
            radius="md" 
            onClick={() => setEducationModalOpen(false)}
          >
            I Understand, Continue Watching
          </Button>
        </Stack>
      </Modal>

        {/* Modal: Interactive Exam Taking (Image 3) */}
        <Modal
          opened={examModalOpened}
          onClose={() => setExamModalOpened(false)}
          title={
            <Group justify="space-between" style={{ width: "100%" }}>
              <Group gap="xs">
                <IconAward size={20} color="#4f46e5" />
                <Text fw={700}>{courseData?.exam?.quizTitle || "Course Exam"}</Text>
              </Group>
              <Badge color="blue" size="md" variant="filled">
                ⏱ {formatTime(examTimeRemaining)}
              </Badge>
            </Group>
          }
          size="lg"
          centered
        >
          <Stack gap="lg">
            {(courseData?.exam?.questions || []).map((q, qIdx) => (
              <Paper key={q._id || qIdx} p="md" withBorder radius="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={700} size="sm">
                    Question {qIdx + 1} of {(courseData?.exam?.questions || []).length}
                  </Text>
                  <Badge color="gray" size="xs">
                    10 Points
                  </Badge>
                </Group>
                <Text size="sm" c="dark.8" mb="md">
                  {q.questionText}
                </Text>

                <Radio.Group
                  value={quizAnswers[qIdx] || ""}
                  onChange={(val) =>
                    setQuizAnswers((prev) => ({ ...prev, [qIdx]: val }))
                  }
                >
                  <Stack gap="xs">
                    {(q.options || []).map((opt, oIdx) => (
                      <Radio key={oIdx} value={opt} label={opt} />
                    ))}
                  </Stack>
                </Radio.Group>
              </Paper>
            ))}

            <Group justify="flex-end" gap="xs">
              <Button variant="default" onClick={() => setExamModalOpened(false)}>
                Quit Exam
              </Button>
              <Button
                color="indigo"
                onClick={handleSubmitExam}
                loading={submittingExam}
              >
                Submit Exam
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Floating Bottom Perspective Switcher Pill (Images 1, 2, 3) */}
        {onSwitchPerspective && (
          <Paper
            p="6px 14px"
            radius="xl"
            withBorder
            shadow="md"
            bg="white"
            style={{
              position: "fixed",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
            }}
          >
            <Group gap="xs">
              <Button
                size="compact-xs"
                variant="filled"
                color="indigo"
                radius="xl"
                leftSection={<IconSchool size={12} />}
              >
                Learner
              </Button>
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={() => onSwitchPerspective("instructor")}
              >
                Instructor
              </Button>
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={() => onSwitchPerspective("super_user")}
              >
                Super User
              </Button>
            </Group>
          </Paper>
        )}
      </Box>
    );
  }

  // =========================================================================
  // VIEW MODE 2: CONTINUOUS DASHBOARD (Image 4)
  // =========================================================================
  return (
    <Box style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Hero Welcome Card (Image 4) */}
      <Paper
        p="xl"
        radius="lg"
        mb="lg"
        style={{
          background: "linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%)",
          color: "#ffffff",
        }}
        shadow="md"
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={6}>
            <Group gap="xs">
              <Badge color="yellow" variant="filled" size="sm">
                Student Learning Center
              </Badge>
              {enrollment?.rollNumber && (
                <Badge color="indigo" size="md" variant="light">
                  Roll: {enrollment.rollNumber}
                </Badge>
              )}
            </Group>
            <Title order={1} style={{ color: "#ffffff", letterSpacing: "-0.5px", fontSize: "1.75rem" }}>
              Hi, {currentUser?.name || "Student"}! 👋
            </Title>
            <Text size="xs" c="gray.3">
              Department:{" "}
              <strong>
                {enrollment?.departmentName ||
                  enrollment?.departmentId?.name ||
                  "Quranic Studies"}
              </strong>{" "}
              | Batch: <strong>{enrollment?.batchName || `Batch ${enrollment?.batchYear || 2026}`}</strong>{" "}
              | Current Semester:{" "}
              <strong>Semester {enrollment?.currentSemesterNumber || 1}</strong>
            </Text>
          </Stack>

          <Button
            variant="white"
            color="indigo"
            size="sm"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              loadStudentData();
              if (selectedCourseId) loadCourseLectures(selectedCourseId);
            }}
          >
            Refresh Progress
          </Button>
        </Group>
      </Paper>

      {/* 4 Stat Metric Cards (Image 4) */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="xl">
        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Enrolled Courses
            </Text>
            <ThemeIcon color="blue" variant="light" size="md" radius="md">
              <IconBook2 size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={800} c="blue.7">
            {courses.length}
          </Text>
          <Text size="11px" c="dimmed">
            Active courses
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Active Courses
            </Text>
            <ThemeIcon color="teal" variant="light" size="md" radius="md">
              <IconPlayerPlay size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={800} c="teal.7">
            {courses.filter((c) => c.isActive !== false).length}
          </Text>
          <Text size="11px" c="dimmed">
            Currently in study
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Lessons Completed
            </Text>
            <ThemeIcon color="green" variant="light" size="md" radius="md">
              <IconCircleCheck size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={800} c="green.7">
            {completedLecturesCount}
          </Text>
          <Text size="11px" c="dimmed">
            {remainingLecturesCount} lessons left
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group justify="space-between" align="center" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Time Spent
            </Text>
            <ThemeIcon color="orange" variant="light" size="md" radius="md">
              <IconClock size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={800} c="orange.7">
            {totalHoursSpent}h+
          </Text>
          <Text size="11px" c="dimmed">
            Total video watch time
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Course Cards for Selected Academic Department Trade */}
      {(() => {
        const deptCourses = courses.filter(
          (c) =>
            (c.departmentCode === selectedDeptCode || c.code?.startsWith(selectedDeptCode)) &&
            c.isActive !== false
        );

        const curDept = departments.find((d) => d.code === selectedDeptCode) ||
          (selectedDeptCode === "QGU"
            ? { name: "Quranic Grammer - Urdu", headOfDepartment: "Br Aazim Kamal" }
            : { name: "Quranic Grammer - English", headOfDepartment: "Sister Isha" });

        const isEnglish = selectedDeptCode === "QGE";

        const renderCourseCard = (c) => {
          const cId = c._id || c.id;
          const isSelected = cId === selectedCourseId;
          const pct = isSelected ? courseCoverage : 0;

          return (
            <Card
              key={cId}
              p="lg"
              radius="lg"
              withBorder
              shadow="xs"
              bg="white"
              style={{
                transition: "all 0.2s ease",
                border: isSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
              }}
            >
              <Group justify="space-between" mb="xs">
                <Badge color={isEnglish ? "indigo" : "teal"} size="sm">
                  {c.code}
                </Badge>
                <Group gap="xs">
                  <Badge color="green" variant="light" size="xs">
                    Pass {c.examPassingPercentage || 75}%
                  </Badge>
                  <Badge color="gray" variant="outline" size="xs">
                    {c.credits || 3} Credits
                  </Badge>
                </Group>
              </Group>

              <Title order={4} mb="xs" c="dark.9">
                {c.title}
              </Title>

              <Text size="xs" c="dimmed" mb="md" lineClamp={2}>
                {c.description || "Systematic Quranic studies and Arabic language lecture series."}
              </Text>

              {/* Progress Bar inside Card */}
              <Box mb="md">
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Course Progress
                  </Text>
                  <Text size="xs" fw={700} c="teal.7">
                    {pct}%
                  </Text>
                </Group>
                <Progress value={pct} color="teal" size="sm" radius="xl" />
              </Box>

              <Button
                color={isEnglish ? "indigo" : "teal"}
                radius="md"
                leftSection={<IconPlayerPlay size={16} />}
                fullWidth
                onClick={() => {
                  setSelectedCourseId(cId);
                  setContentMode("video");
                  setIsPlayerOpen(true);
                }}
              >
                Resume Learning
              </Button>
            </Card>
          );
        };

        return (
          <Box>
            <Paper p="lg" radius="lg" withBorder bg="white" shadow="xs" mb="xl">
              <Group justify="space-between" align="center" mb="md" pb="xs" style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                <Group gap="sm">
                  <ThemeIcon size={38} radius="md" color={isEnglish ? "indigo" : "teal"} variant="light">
                    <IconLanguage size={22} />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Text fw={800} size="md" c="dark.9">
                        {curDept.name}
                      </Text>
                      <Badge color={isEnglish ? "indigo" : "teal"} size="xs">
                        {selectedDeptCode}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Instructor: {curDept.headOfDepartment} • Semester 1 Core Curriculum
                    </Text>
                  </div>
                </Group>
                <Badge color={isEnglish ? "indigo" : "teal"} variant="outline" size="sm">
                  {deptCourses.length} Active Courses
                </Badge>
              </Group>

              {deptCourses.length === 0 ? (
                <Center py={40}>
                  <Text size="sm" c="dimmed">
                    No active courses found for this department currently.
                  </Text>
                </Center>
              ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {deptCourses.map(renderCourseCard)}
                </SimpleGrid>
              )}
            </Paper>
          </Box>
        );
      })()}

          </Box>
  );
}

export default UniversityStudentView;
