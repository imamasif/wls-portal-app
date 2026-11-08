import React, { useState, useEffect, useRef } from "react";
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
} from "@mantine/core";
import {
  IconSchool,
  IconVideo,
  IconBooks,
  IconLock,
  IconCheck,
  IconAward,
  IconMessageDots,
  IconSend,
  IconAlertCircle,
  IconPlayerPlay,
  IconEye,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";
import ReactPlayer from "react-player";
import { universityApi } from "../api/universityApi";
import { CertificateModal } from "./CertificateModal";

export function UniversityStudentView({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

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

  // 1-on-1 Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Exam / Quiz Modal State
  const [examModalOpened, setExamModalOpened] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittingExam, setSubmittingExam] = useState(false);
  const [examResult, setExamResult] = useState(null);

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [activeCertToView, setActiveCertToView] = useState(null);
  const [viewCertModalOpened, setViewCertModalOpened] = useState(false);

  // Notification state
  const [antiCheatWarning, setAntiCheatWarning] = useState(null);

  const studentId = currentUser?._id || currentUser?.id;

  // 1. Load Student Enrollment and Available Courses
  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [enrollsRes, certsRes] = await Promise.all([
        universityApi.getEnrollments({ studentId }),
        universityApi.getCertificates({ studentId }),
      ]);

      const userEnrollment = enrollsRes && enrollsRes.length > 0 ? enrollsRes[0] : null;
      setEnrollment(userEnrollment);
      setCertificates(certsRes || []);

      if (userEnrollment && userEnrollment.departmentId) {
        const deptId = userEnrollment.departmentId?._id || userEnrollment.departmentId;
        const cList = await universityApi.getCourses({ departmentId: deptId });
        setCourses(cList || []);
        if (cList && cList.length > 0) {
          setSelectedCourseId(cList[0]._id || cList[0].id);
        }
      } else {
        // Fallback: list all courses if student not yet assigned a specific department
        const cList = await universityApi.getCourses();
        setCourses(cList || []);
        if (cList && cList.length > 0) {
          setSelectedCourseId(cList[0]._id || cList[0].id);
        }
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
        // Default to first unlocked, incomplete lecture or first lecture
        const nextToWatch =
          data.lectures.find((l) => l.isUnlocked && !l.isCompleted) ||
          data.lectures[0];
        selectLecture(nextToWatch);
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

  // Helper: Select active lecture and initialize anti-cheat watch bounds
  const selectLecture = (lecture) => {
    if (!lecture) return;
    setActiveLecture(lecture);
    const initialUrl =
      Array.isArray(lecture.videoUrls) && lecture.videoUrls.length > 0
        ? lecture.videoUrls[0]
        : "";
    setSelectedVideoUrl(initialUrl);

    const initialWatched = lecture.watchedSeconds || 0;
    setPlayedSeconds(lecture.lastPositionSeconds || initialWatched);
    setMaxWatchedSeconds(initialWatched);
    setIsCompletedState(Boolean(lecture.isCompleted));
    setAntiCheatWarning(null);
  };

  // 4. Anti-Cheat Video Watch Logic
  const handleProgress = ({ playedSeconds: currentSecs }) => {
    // ANTI-CHEAT: Prevent skipping ahead past what has been watched!
    if (activeLecture?.isMandatory && !isCompletedState) {
      // If student scrubbed forward more than 3 seconds past maxWatchedSeconds:
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

    // Periodically save progress to backend (every ~5 seconds)
    if (Math.round(currentSecs) % 5 === 0) {
      saveProgressToBackend(currentSecs, false);
    }
  };

  const handleDuration = (dur) => {
    setDurationSeconds(dur);
  };

  const handleEnded = () => {
    setIsCompletedState(true);
    saveProgressToBackend(durationSeconds || playedSeconds, true);
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
        // Refresh lectures to unlock the next sequential lecture!
        loadCourseLectures(selectedCourseId);
      }
    } catch (err) {
      console.warn("Progress sync warning:", err.message);
    }
  };

  // 5. Send Chat Message to Instructor
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedCourseId || !studentId) return;
    setSendingMsg(true);
    try {
      await universityApi.sendMessage({
        courseId: selectedCourseId,
        studentId,
        instructorId: courseData?.course?.instructorId,
        senderId: studentId,
        senderName: currentUser?.name || "Student",
        senderRole: "STUDENT",
        message: chatInput.trim(),
      });
      setChatInput("");
      loadMessages(selectedCourseId);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // 6. Exam Taking & Submission
  const handleOpenExam = async () => {
    try {
      const quizId = courseData?.exam?.quizId;
      if (!quizId) {
        alert("Exam quiz reference not found.");
        return;
      }
      const qRes = await fetch(`/api/quizzes/${quizId}`);
      const qData = await qRes.json();
      setActiveQuiz(qData.data || qData);
      setQuizAnswers({});
      setExamResult(null);
      setExamModalOpened(true);
    } catch (err) {
      console.error("Failed to fetch exam quiz:", err);
      alert("Error loading exam quiz.");
    }
  };

  const handleSubmitExam = async () => {
    if (!activeQuiz || !selectedCourseId || !studentId) return;
    setSubmittingExam(true);
    try {
      // Calculate score based on answers
      let earnedPoints = 0;
      let totalPossible = 0;

      const questions = activeQuiz.questions || [];
      questions.forEach((q, idx) => {
        const pts = q.points || 5;
        totalPossible += pts;
        const studentAns = quizAnswers[idx];
        const correctAnswers = q.correctAnswers || [];

        if (Array.isArray(studentAns)) {
          const match =
            studentAns.length === correctAnswers.length &&
            studentAns.every((a) => correctAnswers.includes(a));
          if (match) earnedPoints += pts;
        } else if (studentAns && correctAnswers.includes(studentAns)) {
          earnedPoints += pts;
        }
      });

      const percentage =
        totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
      const passPct = courseData?.course?.examPassingPercentage || 70;
      const isPassed = percentage >= passPct;

      const attemptResult = await universityApi.submitExamAttempt({
        studentId,
        courseId: selectedCourseId,
        quizId: activeQuiz._id || activeQuiz.id,
        score: earnedPoints,
        maxScore: totalPossible,
        percentage,
      });

      setExamResult({
        score: earnedPoints,
        maxScore: totalPossible,
        percentage,
        isPassed,
        attemptNumber: attemptResult.data?.attemptNumber || 1,
      });

      // Reload course data to reflect exam completion
      loadCourseLectures(selectedCourseId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to submit exam");
    } finally {
      setSubmittingExam(false);
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

  return (
    <Box>
      {/* Student Banner Header */}
      <Paper
        p={{ base: "md", sm: "xl" }}
        radius="lg"
        mb="lg"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)",
          color: "#ffffff",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={4}>
            <Group gap="xs">
              <Badge color="yellow" variant="filled" size="sm">
                University Student Portal
              </Badge>
              {enrollment?.rollNumber && (
                <Badge color="indigo" size="md" variant="light">
                  Roll No: {enrollment.rollNumber}
                </Badge>
              )}
            </Group>
            <Title order={2} style={{ color: "#ffffff", letterSpacing: "-0.5px" }}>
              Welcome, {currentUser?.name || "Student"}
            </Title>
            <Text size="xs" c="gray.3">
              Department:{" "}
              <strong>
                {enrollment?.departmentName ||
                  enrollment?.departmentId?.name ||
                  "Quranic Arabic & Islamic Studies"}
              </strong>{" "}
              | Current Semester:{" "}
              <strong>Semester {enrollment?.currentSemesterNumber || 1}</strong>
            </Text>
          </Stack>

          <Group gap="xs">
            <Button
              variant="white"
              color="indigo"
              size="xs"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                loadStudentData();
                if (selectedCourseId) loadCourseLectures(selectedCourseId);
              }}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Courses Selector Tabs */}
      <Title order={4} mb="xs" c="gray.8">
        Your Enrolled Courses
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="lg">
        {courses.map((c) => {
          const cId = c._id || c.id;
          const isSelected = cId === selectedCourseId;
          return (
            <Card
              key={cId}
              p="sm"
              radius="md"
              withBorder
              style={{
                borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
              }}
              onClick={() => setSelectedCourseId(cId)}
            >
              <Group justify="space-between" mb={4}>
                <Badge color="indigo" size="xs">
                  {c.code}
                </Badge>
                <Text size="11px" c="dimmed">
                  {c.credits} Credits
                </Text>
              </Group>
              <Text size="sm" fw={700} c="dark.9" lineClamp={1}>
                {c.title}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Main Course Learning Workspace */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        {/* Left 2 Columns: Video Player & Exam & Instructor Chat */}
        <Box style={{ gridColumn: "span 2" }}>
          <Paper p="md" radius="md" withBorder bg="white" mb="lg">
            <Group justify="space-between" mb="xs">
              <Stack gap={2}>
                <Group gap="xs">
                  <Badge color="indigo" size="sm">
                    {courseData?.course?.code}
                  </Badge>
                  <Title order={4}>{activeLecture?.title || "Course Video Lecture"}</Title>
                </Group>
                <Text size="xs" c="dimmed">
                  {activeLecture?.description || "Watch this lecture completely to unlock the next lesson."}
                </Text>
              </Stack>

              {activeLecture?.isMandatory ? (
                <Badge color="red" variant="light" size="sm">
                  Mandatory Lecture
                </Badge>
              ) : (
                <Badge color="gray" variant="light" size="sm">
                  Optional Lecture
                </Badge>
              )}
            </Group>

            {/* Anti-cheat warning alert */}
            {antiCheatWarning && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Watch Compliance Guard"
                color="red"
                mb="sm"
                withCloseButton
                onClose={() => setAntiCheatWarning(null)}
              >
                {antiCheatWarning}
              </Alert>
            )}

            {/* Embedded Anti-Cheat Video Player */}
            <Box
              style={{
                position: "relative",
                paddingTop: "56.25%", // 16:9 aspect ratio
                backgroundColor: "#000000",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              }}
              mb="md"
            >
              {selectedVideoUrl ? (
                <ReactPlayer
                  ref={playerRef}
                  url={selectedVideoUrl}
                  controls
                  playing={isPlaying}
                  width="100%"
                  height="100%"
                  style={{ position: "absolute", top: 0, left: 0 }}
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <Center style={{ position: "absolute", inset: 0 }} c="white">
                  <Stack align="center" gap="xs">
                    <IconVideo size={48} color="#94a3b8" />
                    <Text size="sm" c="gray.4">
                      No video URL available for this lecture.
                    </Text>
                  </Stack>
                </Center>
              )}
            </Box>

            {/* Watch Progress Bar */}
            <Box mb="md">
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={600} c="gray.7">
                  Module Completion Progress:
                </Text>
                <Text size="xs" fw={700} c={isCompletedState ? "teal.7" : "blue.7"}>
                  {durationSeconds > 0
                    ? `${Math.round((maxWatchedSeconds / durationSeconds) * 100)}%`
                    : "0%"}
                  {isCompletedState && " (COMPLETED)"}
                </Text>
              </Group>
              <Progress
                value={
                  durationSeconds > 0
                    ? Math.min(100, Math.round((maxWatchedSeconds / durationSeconds) * 100))
                    : 0
                }
                color={isCompletedState ? "teal" : "blue"}
                size="sm"
                radius="xl"
                animated={isPlaying}
              />
            </Box>

            {/* Multiple Video Links Switcher if Course Lecture has multiple URLs */}
            {activeLecture?.videoUrls && activeLecture.videoUrls.length > 1 && (
              <Group gap="xs" mb="md">
                <Text size="xs" fw={600} c="gray.7">
                  Additional Video Links:
                </Text>
                {activeLecture.videoUrls.map((url, uIdx) => (
                  <Button
                    key={uIdx}
                    size="compact-xs"
                    variant={selectedVideoUrl === url ? "filled" : "light"}
                    color="indigo"
                    onClick={() => setSelectedVideoUrl(url)}
                  >
                    Part {uIdx + 1}
                  </Button>
                ))}
              </Group>
            )}

            <Divider my="md" />

            {/* Course Final Exam Card */}
            <Paper p="md" radius="md" bg="#f8fafc" withBorder style={{ borderColor: "#e2e8f0" }}>
              <Group justify="space-between" align="center" wrap="wrap">
                <Stack gap={2}>
                  <Group gap="xs">
                    <IconAward size={20} color="#2563eb" />
                    <Title order={5}>Course Final Exam / Assessment</Title>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Passing Criteria: {courseData?.course?.examPassingPercentage || 70}% score | Allowed Attempts:{" "}
                    {courseData?.exam?.maxAttempts || 3}
                  </Text>
                </Stack>

                {/* Exam Unlock Conditions */}
                {!courseData?.allMandatoryDone ? (
                  <Badge color="gray" size="sm" variant="outline" leftSection={<IconLock size={12} />}>
                    Locked (Complete all mandatory lectures first)
                  </Badge>
                ) : !courseData?.exam?.isExamAvailable ? (
                  <Badge color="orange" size="sm" variant="light" leftSection={<IconLock size={12} />}>
                    Awaiting Instructor Release
                  </Badge>
                ) : courseData?.exam?.hasPassedExam ? (
                  <Badge color="teal" size="md" variant="filled" leftSection={<IconCheck size={14} />}>
                    Exam Passed! Course Cleared
                  </Badge>
                ) : (
                  <Button
                    color="green"
                    size="xs"
                    leftSection={<IconAward size={16} />}
                    onClick={handleOpenExam}
                  >
                    Take Exam ({courseData?.exam?.attemptsCount || 0} / {courseData?.exam?.maxAttempts || 3})
                  </Button>
                )}
              </Group>
            </Paper>
          </Paper>

          {/* 1-on-1 Student <-> Instructor Private Chat */}
          <Paper p="md" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <IconMessageDots size={20} color="#2563eb" />
                <Title order={5}>Direct Question & Chat with Instructor</Title>
              </Group>
              <Text size="xs" c="dimmed">
                Instructor: {courseData?.course?.instructorName || "Course Faculty"}
              </Text>
            </Group>

            <Box
              style={{
                height: "220px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "8px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
              mb="sm"
            >
              {messages.length === 0 ? (
                <Center style={{ height: "100%" }}>
                  <Text size="xs" c="dimmed" fs="italic">
                    Have questions about this course? Send a private message directly to your instructor.
                  </Text>
                </Center>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole === "STUDENT" || m.senderId === studentId;
                  return (
                    <Paper
                      key={m._id || m.id}
                      p="xs"
                      radius="md"
                      withBorder
                      bg={isMe ? "#eff6ff" : "#ffffff"}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        borderColor: isMe ? "#bfdbfe" : "#e2e8f0",
                      }}
                    >
                      <Group justify="space-between" gap="xs" mb={2}>
                        <Text size="11px" fw={700} c={isMe ? "blue.8" : "teal.8"}>
                          {isMe ? "You" : m.senderName}
                        </Text>
                        <Text size="9px" c="dimmed">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
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

            <Group align="flex-end">
              <Textarea
                placeholder="Ask instructor a question regarding this course..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                rows={2}
                style={{ flex: 1 }}
              />
              <Button
                color="indigo"
                leftSection={<IconSend size={16} />}
                loading={sendingMsg}
                disabled={!chatInput.trim()}
                onClick={handleSendMessage}
              >
                Send Question
              </Button>
            </Group>
          </Paper>
        </Box>

        {/* Right Column: Sequential Lecture Playlist & Certificates */}
        <Box>
          <Paper p="md" radius="md" withBorder bg="white" mb="lg">
            <Group justify="space-between" mb="sm">
              <Title order={5}>Sequential Lectures</Title>
              <Badge color="indigo" variant="light">
                {courseData?.completedMandatory || 0} / {courseData?.totalMandatory || 0} Done
              </Badge>
            </Group>

            <Stack gap="xs">
              {courseData?.lectures?.map((lec, idx) => {
                const isSelected = activeLecture?.lectureId === lec.lectureId;
                return (
                  <Paper
                    key={lec.lectureId || idx}
                    p="xs"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                      backgroundColor: isSelected
                        ? "#eff6ff"
                        : !lec.isUnlocked
                        ? "#f8fafc"
                        : "#ffffff",
                      cursor: lec.isUnlocked ? "pointer" : "not-allowed",
                      opacity: lec.isUnlocked ? 1 : 0.6,
                    }}
                    onClick={() => {
                      if (lec.isUnlocked) selectLecture(lec);
                    }}
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        {lec.isCompleted ? (
                          <Badge color="teal" size="sm" circle>
                            ✓
                          </Badge>
                        ) : lec.isUnlocked ? (
                          <Badge color="blue" size="sm" circle>
                            {lec.order}
                          </Badge>
                        ) : (
                          <Badge color="gray" size="sm" circle>
                            <IconLock size={10} />
                          </Badge>
                        )}
                        <Stack gap={2}>
                          <Text size="xs" fw={700} c={isSelected ? "blue.9" : "dark.9"}>
                            {lec.title}
                          </Text>
                          <Group gap={4}>
                            {lec.isMandatory ? (
                              <Badge color="red" variant="light" size="10px">
                                Mandatory
                              </Badge>
                            ) : (
                              <Badge color="gray" variant="light" size="10px">
                                Optional
                              </Badge>
                            )}
                            <Text size="10px" c="dimmed">
                              {Math.round((lec.durationSeconds || 0) / 60)} mins
                            </Text>
                          </Group>
                        </Stack>
                      </Group>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          {/* Certificates Earned Box */}
          <Paper p="md" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <IconAward size={18} color="#d97706" />
                <Title order={5}>My Earned Certificates</Title>
              </Group>
              <Badge color="yellow" variant="filled" size="xs">
                {certificates.length}
              </Badge>
            </Group>

            {certificates.length === 0 ? (
              <Text size="xs" c="dimmed" fs="italic">
                Complete your semester courses and exams to earn official academic certificates.
              </Text>
            ) : (
              <Stack gap="xs">
                {certificates.map((cert) => (
                  <Paper
                    key={cert._id || cert.id}
                    p="xs"
                    radius="md"
                    withBorder
                    bg="#fffbeb"
                    style={{ borderColor: "#fde68a" }}
                  >
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Text size="xs" fw={700} c="dark.9">
                          {cert.title}
                        </Text>
                        <Text size="10px" c="dimmed">
                          Cert: {cert.certificateNumber}
                        </Text>
                      </Stack>
                      <Button
                        size="compact-xs"
                        color="yellow"
                        variant="light"
                        leftSection={<IconEye size={12} />}
                        onClick={() => {
                          setActiveCertToView(cert);
                          setViewCertModalOpened(true);
                        }}
                      >
                        View
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      </SimpleGrid>

      {/* MODAL: TAKE COURSE EXAM / QUIZ */}
      <Modal
        opened={examModalOpened}
        onClose={() => setExamModalOpened(false)}
        title={
          <Group gap="xs">
            <IconAward size={20} color="#2563eb" />
            <Text fw={700}>{activeQuiz?.title || "Course Final Exam"}</Text>
          </Group>
        }
        size="lg"
      >
        {examResult ? (
          <Stack align="center" gap="md" py="xl">
            <Badge
              color={examResult.isPassed ? "teal" : "red"}
              size="xl"
              variant="filled"
            >
              {examResult.isPassed ? "EXAM PASSED!" : "EXAM FAILED"}
            </Badge>

            <Title order={2}>
              {examResult.percentage}% Score ({examResult.score} / {examResult.maxScore} Points)
            </Title>

            <Text size="sm" c="gray.7" ta="center">
              {examResult.isPassed
                ? "Congratulations! You have satisfied all academic requirements for this course. Your grade has been registered."
                : `You did not meet the required passing mark (${
                    courseData?.course?.examPassingPercentage || 70
                  }%). You may review the lecture videos and re-attempt if attempts remain.`}
            </Text>

            <Button color="indigo" onClick={() => setExamModalOpened(false)}>
              Close Assessment
            </Button>
          </Stack>
        ) : (
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              Answer all questions carefully. Passing requirement:{" "}
              <strong>{courseData?.course?.examPassingPercentage || 70}%</strong>.
            </Text>

            {activeQuiz?.questions?.map((q, idx) => (
              <Paper key={idx} p="md" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={600} mb="xs">
                  Question {idx + 1}: {q.questionText} ({q.points || 5} Points)
                </Text>

                <Radio.Group
                  value={quizAnswers[idx] || ""}
                  onChange={(val) => setQuizAnswers({ ...quizAnswers, [idx]: val })}
                >
                  <Stack gap="xs">
                    {q.options?.map((opt, oIdx) => (
                      <Radio key={oIdx} value={opt} label={opt} />
                    ))}
                  </Stack>
                </Radio.Group>
              </Paper>
            ))}

            <Button
              color="green"
              fullWidth
              loading={submittingExam}
              onClick={handleSubmitExam}
            >
              Submit Exam Answers
            </Button>
          </Stack>
        )}
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
