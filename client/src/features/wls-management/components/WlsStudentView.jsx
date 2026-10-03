import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { DualDigitalClock } from "../../../components/DualDigitalClock";
import {
  fetchActiveWlsSessions,
  fetchUserAssessments,
  submitAssessment,
  fetchSessionUserAssessment,
  postAssessmentMessage,
} from "../api/wlsManagementApi";
import { WlsSessionCard } from "./WlsSessionCard";
import { Container, Tabs, Stack, Text } from "@mantine/core";
import { IconClock, IconCheck } from "@tabler/icons-react";

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

  const userTimeZone =
    currentUser?.timezone ||
    currentUser?.timeZone ||
    currentUser?.profile?.timezone;

  const activeSessionDate =
    sessions[0]?.sessionDate ||
    sessions[0]?.startTime ||
    sessions[0]?.createdAt;

  useEffect(() => {
    if (!currentUser) return;

    Promise.all([
      fetchActiveWlsSessions().catch(() => []),
      fetchUserAssessments(userId).catch(() => []),
    ])
      .then(([sessionsData, assessmentsData]) => {
        setSessions(sessionsData);

        const map = {};
        const fetchedUrls = { ...videoUrls };
        const fetchedCompleted = { ...completedTasks };

        if (Array.isArray(assessmentsData)) {
          assessmentsData.forEach((assessment) => {
            if (!assessment) return;

            const sId = assessment.sessionId
              ? typeof assessment.sessionId === "object"
                ? assessment.sessionId?._id || assessment.sessionId?.id
                : assessment.sessionId
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
              if (
                assessment.status === "COMPLETED" ||
                assessment.status === "SUBMITTED"
              ) {
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

  const activeSessionsList = sessions.filter(
    (s) => !completedTasks[s.id || s._id] && s.status !== "COMPLETED",
  );
  const pastSessionsList = sessions.filter(
    (s) => completedTasks[s.id || s._id] || s.status === "COMPLETED",
  );

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
            Active / Upcoming Sessions ({activeSessionsList.length})
          </Tabs.Tab>
          <Tabs.Tab value="past" leftSection={<IconCheck size={16} />}>
            Past / Completed Sessions ({pastSessionsList.length})
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
