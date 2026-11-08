// client/src/features/university/components/UniversityStudentView.jsx
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
  Accordion,
  Tooltip,
  ThemeIcon,
  Collapse,
  TextInput,
} from "@mantine/core";
import {
  IconSchool,
  IconVideo,
  IconBooks,
  IconLock,
  IconCheck,
  IconCircleCheck,
  IconCircleDot,
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
  IconPlus,
  IconFileText,
  IconCertificate,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import ReactPlayer from "react-player";
import { universityApi } from "../api/universityApi";
import { CertificateModal } from "./CertificateModal";

export function UniversityStudentView({ currentUser, onSwitchPerspective }) {
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

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

  // Time-stamped Notes State
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

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
  const [examTimer, setExamTimer] = useState(300); // 5 min demo timer

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

      // Load all available courses
      const cList = await universityApi.getCourses();
      setCourses(cList || []);

      if (cList && cList.length > 0 && !selectedCourseId) {
        // Prefer "Color Coded Quran (Urdu Language)" if present
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
        // Default to first unlocked incomplete lecture or first lecture
        const currentActive = activeLecture
          ? data.lectures.find((l) => (l.lectureId || l._id) === (activeLecture.lectureId || activeLecture._id))
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

  // 4. Load Time-stamped Notes for active lecture
  const loadNotes = (lectureId) => {
    if (!studentId || !lectureId) return;
    universityApi
      .getLectureNotes(studentId, lectureId)
      .then((nList) => setNotes(nList || []))
      .catch((err) => console.warn("Failed to load lecture notes:", err));
  };

  // Helper: Select active lecture and initialize anti-cheat watch bounds
  const selectLecture = (lecture) => {
    if (!lecture) return;
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
    setAntiCheatWarning(null);

    loadNotes(lecture.lectureId || lecture._id);
  };

  // 5. Anti-Cheat Video Watch Logic
  const handleProgress = ({ playedSeconds: currentSecs }) => {
    // ANTI-CHEAT: Prevent skipping ahead past what has been watched!
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

    // Periodically save progress to backend (every ~10 seconds)
    if (Math.round(currentSecs) > 0 && Math.round(currentSecs) % 10 === 0) {
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
        loadCourseLectures(selectedCourseId);
      }
    } catch (err) {
      console.warn("Progress sync warning:", err.message);
    }
  };

  // 6. Manual Mark Completed Action (Image 5 center pill button)
  const handleManualMarkCompleted = async () => {
    if (!activeLecture) return;
    await saveProgressToBackend(durationSeconds || playedSeconds || 60, true);
    setIsCompletedState(true);
    // Proceed to next lecture
    handleNextLecture();
  };

  // 7. Navigation: Next & Previous Lectures
  const allLecturesList = courseData?.lectures || [];
  const currentLectureIndex = allLecturesList.findIndex(
    (l) => (l.lectureId || l._id) === (activeLecture?.lectureId || activeLecture?._id)
  );

  const handleNextLecture = () => {
    if (currentLectureIndex >= 0 && currentLectureIndex < allLecturesList.length - 1) {
      const nextLec = allLecturesList[currentLectureIndex + 1];
      if (nextLec.isUnlocked || isCompletedState) {
        selectLecture(nextLec);
      }
    }
  };

  const handlePrevLecture = () => {
    if (currentLectureIndex > 0) {
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

  // Group lectures by topicName
  const groupedTopics = {};
  allLecturesList.forEach((lec) => {
    const topic = lec.topicName || "General Curriculum";
    if (!groupedTopics[topic]) groupedTopics[topic] = [];
    groupedTopics[topic].push(lec);
  });

  const activeCourse = courses.find((c) => (c._id || c.id) === selectedCourseId) || courses[0];
  const courseCoverage = courseData?.totalCoursePercentage || 0;

  // Calculate total study time across watched lectures
  const totalWatchedSeconds = (courseData?.lectures || []).reduce(
    (sum, l) => sum + (l.watchedSeconds || 0),
    0
  );
  const totalHoursSpent = (totalWatchedSeconds / 3600).toFixed(1);

  if (loading) {
    return (
      <Center py={100}>
        <Loader size="lg" color="indigo" />
      </Center>
    );
  }

  // =========================================================================
  // VIEW MODE 1: CONTINUOUS COURSE PLAYER (Images 1, 2, 5)
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
            {/* LEFT COLUMN: Sidebar with Progress & Collapsible Topics (Cols: 4) */}
            <Box style={{ gridColumn: "span 4" }}>
              <Paper p="md" radius="md" withBorder bg="white" shadow="xs" mb="md">
                {/* Progress Card (Matching Images 1, 2, 5) */}
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

              {/* Topics & Lectures Accordion */}
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
                              {tIdx + 1}
                            </Text>
                          </ThemeIcon>
                          <Text size="xs" fw={700} c="dark.8" lineClamp={1}>
                            {topicTitle}
                          </Text>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap={3}>
                          {topicLectures.map((lec) => {
                            const isSelected =
                              (lec.lectureId || lec._id) ===
                              (activeLecture?.lectureId || activeLecture?._id);
                            const isCompleted = Boolean(lec.isCompleted);
                            const isLocked = !lec.isUnlocked && !isCompleted;

                            return (
                              <Box
                                key={lec.lectureId || lec._id}
                                p="8px 12px"
                                style={{
                                  borderRadius: "6px",
                                  backgroundColor: isSelected
                                    ? "#f1f5f9"
                                    : "transparent",
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
                                      <IconCircleCheck size={18} color="#10b981" />
                                    ) : isLocked ? (
                                      <IconLock size={16} color="#94a3b8" />
                                    ) : (
                                      <IconVideo
                                        size={18}
                                        color={isSelected ? "#2563eb" : "#64748b"}
                                      />
                                    )}
                                    <Box style={{ minWidth: 0, flex: 1 }}>
                                      <Text
                                        size="xs"
                                        fw={isSelected ? 700 : 500}
                                        c={isSelected ? "blue.8" : isLocked ? "dimmed" : "dark.8"}
                                        lineClamp={1}
                                      >
                                        {lec.title}
                                      </Text>
                                      <Text size="11px" c="dimmed">
                                        Video - {formatTime(lec.durationSeconds || 900)} mins
                                      </Text>
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
                </Accordion>
              </Paper>
            </Box>

            {/* RIGHT COLUMN: Video Player, Notes, Tabs & Action Bar (Cols: 8) */}
            <Box style={{ gridColumn: "span 8" }}>
              <Paper p="md" radius="md" withBorder bg="white" shadow="xs" mb="md">
                {/* Lecture Title & Compliance Alert */}
                <Group justify="space-between" mb="xs" align="center">
                  <div>
                    <Title order={3} c="dark.9" style={{ fontSize: "1.2rem" }}>
                      {activeLecture?.title || "Video Lecture"}
                    </Title>
                    <Text size="xs" c="dimmed">
                      {activeLecture?.topicName || "Curriculum"}
                    </Text>
                  </div>
                  {activeLecture?.isMandatory ? (
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

                {/* Video Player */}
                <Box
                  style={{
                    position: "relative",
                    paddingTop: "56.25%",
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
                    <Center style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                      <Text c="white">No video stream loaded</Text>
                    </Center>
                  )}
                </Box>

                {/* Sub-Video Tabs (Overview, Notes, Comments, Exam) */}
                <Tabs defaultValue="overview" color="indigo">
                  <Tabs.List justify="space-between">
                    <Group gap="xs">
                      <Tabs.Tab value="overview" leftSection={<IconBook2 size={16} />}>
                        Overview
                      </Tabs.Tab>
                      <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>
                        Notes ({notes.length})
                      </Tabs.Tab>
                      <Tabs.Tab value="qa" leftSection={<IconMessageDots size={16} />}>
                        Instructor Q&A
                      </Tabs.Tab>
                    </Group>

                    <Button
                      variant="subtle"
                      color="indigo"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                      onClick={() => setNoteModalOpen(true)}
                    >
                      Take Note
                    </Button>
                  </Tabs.List>

                  {/* 1. Overview Tab */}
                  <Tabs.Panel value="overview" pt="sm">
                    <Stack gap="xs">
                      <Text size="sm" c="dark.8">
                        {activeLecture?.description ||
                          "Study this lecture carefully to master the grammatical structures and word-by-word meanings of Quranic verses."}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Duration: {formatTime(activeLecture?.durationSeconds || 900)} mins |
                        Watch progress: {formatTime(playedSeconds)} / {formatTime(durationSeconds || activeLecture?.durationSeconds || 900)}
                      </Text>
                    </Stack>
                  </Tabs.Panel>

                  {/* 2. Notes Tab (Image 5 Note-taking area) */}
                  <Tabs.Panel value="notes" pt="sm">
                    <Stack gap="sm">
                      {/* Inline quick note input */}
                      <Group gap="xs" align="flex-end">
                        <TextInput
                          placeholder="Type your note here to save for later..."
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          style={{ flex: 1 }}
                          size="sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveNote();
                          }}
                        />
                        <Button
                          color="indigo"
                          size="sm"
                          onClick={handleSaveNote}
                          loading={savingNote}
                        >
                          Save Note
                        </Button>
                      </Group>

                      {/* Notes list */}
                      {notes.length === 0 ? (
                        <Center py="xl">
                          <Stack align="center" gap={4}>
                            <ThemeIcon size={40} radius="xl" color="gray" variant="light">
                              <IconFileText size={20} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">
                              No Notes Have Been Added Yet!
                            </Text>
                          </Stack>
                        </Center>
                      ) : (
                        <Stack gap="xs">
                          {notes.map((n, idx) => (
                            <Paper key={n.noteId || idx} p="xs" withBorder radius="md" bg="gray.0">
                              <Group justify="space-between" align="center">
                                <Text size="sm" c="dark.8">
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

                  {/* 3. Instructor Q&A Tab */}
                  <Tabs.Panel value="qa" pt="sm">
                    <Paper p="sm" withBorder radius="md" bg="gray.0" mb="sm">
                      <Stack gap="xs" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {messages.length === 0 ? (
                          <Text size="xs" c="dimmed" ta="center">
                            No direct messages yet. Send a question to your instructor below.
                          </Text>
                        ) : (
                          messages.map((m, idx) => {
                            const isMe = m.senderRole === "student";
                            return (
                              <Group
                                key={m._id || idx}
                                justify={isMe ? "flex-end" : "flex-start"}
                              >
                                <Paper
                                  p="xs"
                                  radius="md"
                                  bg={isMe ? "indigo.6" : "white"}
                                  c={isMe ? "white" : "dark.8"}
                                  withBorder={!isMe}
                                  style={{ maxWidth: "75%" }}
                                >
                                  <Text size="xs" fw={700} c={isMe ? "indigo.1" : "blue.7"}>
                                    {m.senderName} ({m.senderRole})
                                  </Text>
                                  <Text size="xs">{m.message}</Text>
                                </Paper>
                              </Group>
                            );
                          })
                        )}
                      </Stack>
                    </Paper>

                    <Group gap="xs">
                      <TextInput
                        placeholder="Ask your instructor a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        style={{ flex: 1 }}
                        size="sm"
                      />
                      <Button
                        color="indigo"
                        size="sm"
                        leftSection={<IconSend size={14} />}
                        onClick={async () => {
                          if (!chatInput.trim() || !selectedCourseId || !studentId) return;
                          setSendingMsg(true);
                          try {
                            const sent = await universityApi.sendMessage({
                              courseId: selectedCourseId,
                              studentId,
                              senderId: studentId,
                              senderName: currentUser?.name || "Student",
                              senderRole: "student",
                              message: chatInput.trim(),
                            });
                            setMessages((prev) => [...prev, sent]);
                            setChatInput("");
                          } catch (err) {
                            alert("Failed to send message: " + err.message);
                          } finally {
                            setSendingMsg(false);
                          }
                        }}
                        loading={sendingMsg}
                      >
                        Send
                      </Button>
                    </Group>
                  </Tabs.Panel>
                </Tabs>

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

                  <Button
                    color="teal"
                    size="md"
                    radius="xl"
                    leftSection={<IconCheck size={18} />}
                    onClick={handleManualMarkCompleted}
                  >
                    {isCompletedState ? "Completed ✔" : "Mark as Complete"}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    rightSection={<IconChevronRight size={16} />}
                    onClick={handleNextLecture}
                    disabled={currentLectureIndex >= allLecturesList.length - 1}
                  >
                    Next
                  </Button>
                </Group>
              </Paper>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Modal: Take Time-stamped Note (Image 1 & 2 popup) */}
        <Modal
          opened={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title={
            <Group gap="xs">
              <IconPencil size={18} color="#2563eb" />
              <Text fw={700}>Take Note</Text>
              <Badge color="blue" size="sm" variant="light">
                {formatTime(playedSeconds)}
              </Badge>
            </Group>
          }
          centered
        >
          <Stack gap="md">
            <Textarea
              placeholder="Use case of grids, vocabulary, or questions..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              minRows={4}
              autosize
            />
            <Group justify="flex-end" gap="xs">
              <Button variant="default" onClick={() => setNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button color="indigo" onClick={handleSaveNote} loading={savingNote}>
                Save Note
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Bottom Floating Role Perspective Pill (Images 1, 2, 3) */}
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
      {/* Hero Welcome Card (Image 4 continuous dashboard) */}
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
                  Roll No: {enrollment.rollNumber}
                </Badge>
              )}
            </Group>
            <Title order={1} style={{ color: "#ffffff", letterSpacing: "-0.5px", fontSize: "1.75rem" }}>
              Hi, {currentUser?.name || "Student"}! 👋
            </Title>
            <Text size="sm" c="gray.3" style={{ maxWidth: "600px" }}>
              The continuous dashboard — Learning feels like one continuous space, not a maze of pages.
              Lessons, progress, and course info live together so you never lose momentum.
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

      {/* 4 Metric Cards in a Grid (Matching Image 4) */}
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
            Active department tracks
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
              Completed
            </Text>
            <ThemeIcon color="green" variant="light" size="md" radius="md">
              <IconCircleCheck size={18} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={800} c="green.7">
            {courseCoverage >= 100 ? 1 : 0}
          </Text>
          <Text size="11px" c="dimmed">
            Courses completed
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

      {/* Centralized Resource Hub Cards (Image 4) */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="xl">
        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group gap="sm" mb="xs">
            <ThemeIcon color="indigo" variant="light" size="lg" radius="md">
              <IconNotes size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Note Taking Hub
              </Text>
              <Text size="xs" c="dimmed">
                Time-stamped video notes
              </Text>
            </div>
          </Group>
          <Text size="xs" c="dark.7">
            Review all notes you take during video lectures with direct timestamp jumping back into lessons.
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group gap="sm" mb="xs">
            <ThemeIcon color="blue" variant="light" size="lg" radius="md">
              <IconMessageDots size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Direct Q&A
              </Text>
              <Text size="xs" c="dimmed">
                Private instructor support
              </Text>
            </div>
          </Group>
          <Text size="xs" c="dark.7">
            A dedicated 1-on-1 space for learners to get direct answers from instructors, course by course.
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
          <Group gap="sm" mb="xs">
            <ThemeIcon color="teal" variant="light" size="lg" radius="md">
              <IconCertificate size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">
                Certifications
              </Text>
              <Text size="xs" c="dimmed">
                Official IIPC Awards
              </Text>
            </div>
          </Group>
          <Text size="xs" c="dark.7">
            Complete your courses and pass final exams to unlock formal verifiable semester certificates.
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Course Cards Grid */}
      <Title order={3} mb="md" c="dark.9">
        Continue Your Learning
      </Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {courses.map((c) => {
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
                <Badge color="indigo" size="sm">
                  {c.code}
                </Badge>
                <Badge color="gray" variant="outline" size="sm">
                  {c.credits || 4} Credits
                </Badge>
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
                color="indigo"
                radius="md"
                leftSection={<IconPlayerPlay size={16} />}
                fullWidth
                onClick={() => {
                  setSelectedCourseId(cId);
                  setIsPlayerOpen(true);
                }}
              >
                Resume Learning
              </Button>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Floating Bottom Role Switcher Pill */}
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

export default UniversityStudentView;
