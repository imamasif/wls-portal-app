import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { DualDigitalClock } from "../../../components/DualDigitalClock";
import {
  fetchAllWlsSessionsForUser,
  fetchUserAssessments,
  submitAssessment,
  fetchSessionUserAssessment,
  postAssessmentMessage,
} from "../api/wlsManagementApi";
import { WlsSessionCard } from "./WlsSessionCard";
import { Container, Tabs, Stack, Text } from "@mantine/core";
import { IconClock, IconCheck } from "@tabler/icons-react";

/**
 * Derive a best-guess IANA timezone from the user's profile (country + city/state).
 * Falls back to the browser's local timezone if nothing matches.
 */
function deriveTimezone(user) {
  // If the user profile has an explicit IANA timezone string already, use it.
  const explicit =
    user?.timezone || user?.timeZone || user?.profile?.timezone;
  if (explicit) return explicit;

  // Attempt to derive from country + city.  The mapping covers the most common
  // cities used in this portal. Extend as needed.
  const country = (user?.country || "").toLowerCase();
  const city = (user?.city || "").toLowerCase();
  const state = (user?.state || "").toLowerCase();

  const cityMap = {
    toronto: "America/Toronto",
    ottawa: "America/Toronto",
    montreal: "America/Toronto",
    vancouver: "America/Vancouver",
    calgary: "America/Edmonton",
    edmonton: "America/Edmonton",
    winnipeg: "America/Winnipeg",
    halifax: "America/Halifax",
    // USA
    "new york": "America/New_York",
    "new york city": "America/New_York",
    nyc: "America/New_York",
    chicago: "America/Chicago",
    houston: "America/Chicago",
    dallas: "America/Chicago",
    phoenix: "America/Phoenix",
    denver: "America/Denver",
    "los angeles": "America/Los_Angeles",
    seattle: "America/Los_Angeles",
    "san francisco": "America/Los_Angeles",
    // UK
    london: "Europe/London",
    // South Asia
    karachi: "Asia/Karachi",
    lahore: "Asia/Karachi",
    islamabad: "Asia/Karachi",
    mumbai: "Asia/Kolkata",
    delhi: "Asia/Kolkata",
    dhaka: "Asia/Dhaka",
    // Middle East
    dubai: "Asia/Dubai",
    riyadh: "Asia/Riyadh",
    // Australia
    sydney: "Australia/Sydney",
    melbourne: "Australia/Melbourne",
  };

  for (const [key, tz] of Object.entries(cityMap)) {
    if (city.includes(key) || state.includes(key)) return tz;
  }

  // Country-level fallback
  const countryMap = {
    canada: "America/Toronto",
    "united states": "America/New_York",
    usa: "America/New_York",
    uk: "Europe/London",
    "united kingdom": "Europe/London",
    pakistan: "Asia/Karachi",
    india: "Asia/Kolkata",
    bangladesh: "Asia/Dhaka",
    uae: "Asia/Dubai",
    "united arab emirates": "Asia/Dubai",
    australia: "Australia/Sydney",
  };

  for (const [key, tz] of Object.entries(countryMap)) {
    if (country.includes(key)) return tz;
  }

  // Final fallback: browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}


export function WlsStudentView({ user: propUser }) {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;
  const userId = currentUser?._id || currentUser?.id;

  const [sessions, setSessions] = useState([]);

  const storageKeyUrls = `wls_video_urls_${userId || "guest"}`;
  const storageKeyCompleted = `wls_completed_tasks_${userId || "guest"}`;

  const [videoUrls, setVideoUrls] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeyUrls);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeyCompleted);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [urlErrors, setUrlErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [assessmentsMap, setAssessmentsMap] = useState({});
  const [apiErrors, setApiErrors] = useState({});

  // Derive the user's timezone from their profile (country/city) or browser fallback
  const userTimeZone = useMemo(() => deriveTimezone(currentUser), [currentUser]);

  // Always point the clock at the next upcoming active session
  const activeSessionDate = useMemo(() => {
    const active = sessions.find((s) => s.status === "ACTIVE");
    return (
      active?.sessionDateTimeToronto ||
      active?.sessionDate ||
      active?.startTime ||
      sessions[0]?.sessionDateTimeToronto ||
      sessions[0]?.sessionDate ||
      sessions[0]?.createdAt
    );
  }, [sessions]);

  useEffect(() => {
    if (!currentUser) return;

    Promise.all([
      // Use the all-for-user endpoint so completed sessions also load
      fetchAllWlsSessionsForUser().catch(() => []),
      fetchUserAssessments(userId).catch(() => []),
    ])
      .then(([sessionsData, assessmentsData]) => {
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);

        const map = {};
        const fetchedUrls = { ...videoUrls };
        const fetchedCompleted = { ...completedTasks };

        if (Array.isArray(assessmentsData)) {
          assessmentsData.forEach((assessment) => {
            if (!assessment) return;

            const sId = assessment.sessionId
              ? typeof assessment.sessionId === "object"
                ? String(assessment.sessionId?._id || assessment.sessionId?.id || "")
                : String(assessment.sessionId)
              : null;

            const normalizedAssessment = {
              ...assessment,
              id: assessment.id || assessment._id,
              _id: assessment._id || assessment.id,
              messages: assessment.messages || assessment.chat || [],
            };

            if (sId) {
              map[sId] = normalizedAssessment;
              const savedUrl =
                assessment.submissionUrl ||
                assessment.videoUrl ||
                (Array.isArray(assessment.submissionUrls) &&
                  assessment.submissionUrls[0]);

              if (savedUrl) fetchedUrls[sId] = savedUrl;
              if (assessment.status === "COMPLETED") {
                fetchedCompleted[sId] = true;
              }
            }
          });
        }

        setAssessmentsMap(map);
        setVideoUrls(fetchedUrls);
        setCompletedTasks(fetchedCompleted);

        try {
          localStorage.setItem(storageKeyUrls, JSON.stringify(fetchedUrls));
          localStorage.setItem(
            storageKeyCompleted,
            JSON.stringify(fetchedCompleted),
          );
        } catch (e) {}
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, [currentUser, userId]);


  const updateVideoUrlState = (sessionId, url) => {
    const updated = { ...videoUrls, [sessionId]: url };
    setVideoUrls(updated);
    try {
      localStorage.setItem(storageKeyUrls, JSON.stringify(updated));
    } catch (e) {}
  };

  const updateCompletedState = (sessionId, isDone) => {
    const updated = { ...completedTasks, [sessionId]: isDone };
    setCompletedTasks(updated);
    try {
      localStorage.setItem(storageKeyCompleted, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleUrlChange = (sessionId, url) => {
    updateVideoUrlState(sessionId, url);
    if (urlErrors[sessionId]) {
      setUrlErrors((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleSaveVideoUrl = (sessionId, validation, url) => {
    if (!validation.isValid) {
      setUrlErrors((prev) => ({ ...prev, [sessionId]: validation.error }));
      return;
    }
    setUrlErrors((prev) => ({ ...prev, [sessionId]: null }));

    submitAssessment({
      sessionId,
      userId,
      videoUrl: url,
      submissionUrl: url,
      groupNumber: 1,
      status: "SUBMITTED",
    })
      .then((updatedAssessment) => {
        const resolvedUrl =
          updatedAssessment?.submissionUrl ||
          updatedAssessment?.videoUrl ||
          url;

        if (updatedAssessment) {
          const norm = {
            ...updatedAssessment,
            id: updatedAssessment.id || updatedAssessment._id,
            _id: updatedAssessment._id || updatedAssessment.id,
            submissionUrl: resolvedUrl,
            messages:
              updatedAssessment.messages || updatedAssessment.chat || [],
          };
          setAssessmentsMap((prev) => ({ ...prev, [sessionId]: norm }));
        }
        updateVideoUrlState(sessionId, resolvedUrl);
        setSaveSuccess((prev) => ({ ...prev, [sessionId]: true }));
        setTimeout(
          () => setSaveSuccess((prev) => ({ ...prev, [sessionId]: false })),
          3000,
        );
      })
      .catch(() => {
        updateVideoUrlState(sessionId, url);
        setSaveSuccess((prev) => ({ ...prev, [sessionId]: true }));
        setTimeout(
          () => setSaveSuccess((prev) => ({ ...prev, [sessionId]: false })),
          3000,
        );
      });
  };

  const postMessageHelper = async (sessionId, messageDto) => {
    let assessment = assessmentsMap[sessionId];
    let assessmentId = assessment?.id || assessment?._id;

    if (!assessmentId) {
      try {
        // FIX: Call the correct session/user endpoint instead of submitting an empty video url
        const created = await fetchSessionUserAssessment(sessionId, userId);

        assessmentId = created?.id || created?._id;
        assessment = {
          ...created,
          id: assessmentId,
          _id: assessmentId,
          messages: created?.messages || created?.chat || [],
        };
        setAssessmentsMap((prev) => ({ ...prev, [sessionId]: assessment }));
      } catch (err) {
        throw new Error(
          err.message || "Unable to initialize assessment record for chat.",
        );
      }
    }

    if (assessmentId) {
      const updatedAssessment = await postAssessmentMessage(
        assessmentId,
        messageDto,
      );
      const normalized = {
        ...updatedAssessment,
        id: updatedAssessment?.id || updatedAssessment?._id || assessmentId,
        _id: updatedAssessment?._id || updatedAssessment?.id || assessmentId,
        messages:
          updatedAssessment?.messages ||
          updatedAssessment?.chat ||
          assessment?.messages ||
          [],
      };
      setAssessmentsMap((prev) => ({ ...prev, [sessionId]: normalized }));
    }
  };

  const handleAddComment = async (sessionId) => {
    const text = commentInputs[sessionId]?.trim();
    if (!text) {
      setCommentErrors((prev) => ({
        ...prev,
        [sessionId]: "Comment cannot be empty.",
      }));
      return;
    }
    setCommentErrors((prev) => ({ ...prev, [sessionId]: null }));

    const userName = currentUser?.name || currentUser?.fullName || "User";
    const senderRole = currentUser?.role || "USER";

    try {
      await postMessageHelper(sessionId, {
        senderId: userId,
        senderName: userName,
        senderRole,
        text,
      });
      setCommentInputs((prev) => ({ ...prev, [sessionId]: "" }));
    } catch (err) {
      setCommentErrors((prev) => ({
        ...prev,
        [sessionId]: err.message || "Failed to send message.",
      }));
    }
  };

  const handleRefreshChat = async (sessionId) => {
    try {
      const assessmentsData = await fetchUserAssessments(userId);
      const map = { ...assessmentsMap };
      if (Array.isArray(assessmentsData)) {
        assessmentsData.forEach((assessment) => {
          if (!assessment) return;
          const sId =
            assessment.sessionId?._id ||
            assessment.sessionId?.id ||
            assessment.sessionId;
          if (sId) {
            map[sId] = {
              ...assessment,
              id: assessment.id || assessment._id,
              _id: assessment._id || assessment.id,
              messages: assessment.messages || assessment.chat || [],
            };
          }
        });
      }
      setAssessmentsMap(map);
    } catch (err) {}
  };

  // A session is "past/completed" if the SERVER status is COMPLETED,
  // OR the user locally marked it done via completedTasks,
  // OR the assessment status in DB is COMPLETED.
  // A session is "active/upcoming" if none of those is true.
  const isSessionDone = (s) => {
    const sId = String(s.id || s._id || "");
    return (
      s.status === "COMPLETED" ||
      Boolean(completedTasks[sId]) ||
      assessmentsMap[sId]?.status === "COMPLETED"
    );
  };

  const activeSessionsList = sessions.filter((s) => !isSessionDone(s));
  const pastSessionsList = sessions.filter((s) => isSessionDone(s));

  return (
    <Container
      fluid
      w="100%"
      px="md"
      maw="100%"
      style={{ boxSizing: "border-box" }}
    >
      <DualDigitalClock
        userTimeZone={userTimeZone}
        sessionDate={activeSessionDate}
      />

      <Tabs defaultValue="active" mt="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="active" leftSection={<IconClock size={16} />}>
            My WLS Session ({activeSessionsList.length})
          </Tabs.Tab>
          <Tabs.Tab value="past" leftSection={<IconCheck size={16} />}>
            Past Completed Sessions ({pastSessionsList.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active">
          <Stack gap="md" w="100%" maw="100%">
            {activeSessionsList.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic" py="lg">
                No active or upcoming sessions found.
              </Text>
            ) : (
              activeSessionsList.map((s) => (
                <WlsSessionCard
                  key={s.id || s._id}
                  session={s}
                  userId={userId}
                  currentUser={currentUser}
                  isUpcoming={true}
                  videoUrls={videoUrls}
                  completedTasks={completedTasks}
                  urlErrors={urlErrors}
                  saveSuccess={saveSuccess}
                  commentInputs={commentInputs}
                  commentErrors={commentErrors}
                  apiErrors={apiErrors}
                  assessmentsMap={assessmentsMap}
                  onUrlChange={handleUrlChange}
                  onSaveVideoUrl={handleSaveVideoUrl}
                  onMarkCompleted={updateCompletedState}
                  onPostMessage={postMessageHelper}
                  onAddComment={handleAddComment}
                  onRefreshChat={handleRefreshChat}
                  setCommentInputs={setCommentInputs}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="past">
          <Stack gap="md" w="100%" maw="100%">
            {pastSessionsList.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic" py="lg">
                No past or completed sessions yet.
              </Text>
            ) : (
              pastSessionsList.map((s) => (
                <WlsSessionCard
                  key={s.id || s._id}
                  session={s}
                  userId={userId}
                  currentUser={currentUser}
                  isUpcoming={false}
                  videoUrls={videoUrls}
                  completedTasks={completedTasks}
                  urlErrors={urlErrors}
                  saveSuccess={saveSuccess}
                  commentInputs={commentInputs}
                  commentErrors={commentErrors}
                  apiErrors={apiErrors}
                  assessmentsMap={assessmentsMap}
                  onUrlChange={handleUrlChange}
                  onSaveVideoUrl={handleSaveVideoUrl}
                  onMarkCompleted={updateCompletedState}
                  onPostMessage={postMessageHelper}
                  onAddComment={handleAddComment}
                  onRefreshChat={handleRefreshChat}
                  setCommentInputs={setCommentInputs}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
