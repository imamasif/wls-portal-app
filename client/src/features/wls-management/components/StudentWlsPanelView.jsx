import React, { useState, useEffect } from "react";
import {
  fetchUserAssessments,
  submitAssessment,
  submitWlsSessionVideo,
  postAssessmentMessage,
} from "../api/wlsManagementApi";

export default function StudentWlsPanelView({
  currentUser,
  sessionId,
  sessionData,
}) {
  const [assessmentId, setAssessmentId] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [userComment, setUserComment] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [scores, setScores] = useState(null);
  const [instructorFeedback, setInstructorFeedback] = useState("");
  const [isCompleted, setTaskCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlPermissionError, setUrlPermissionError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const checkDrivePermission = async (url) => {
    return url.includes("drive.google.com") || url.length > 5;
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    const targetSessionId = sessionId || sessionData?.id || sessionData?._id;
    if (!targetSessionId) return;

    const intervalId = setInterval(async () => {
      try {
        const assessments = await fetchUserAssessments(currentUser.id);
        const currentAssessment = assessments.find(
          (a) => (a.sessionId?.id || a.sessionId) === targetSessionId,
        );

        if (currentAssessment) {
          if (currentAssessment.messages)
            setConversationHistory(currentAssessment.messages);
          if (currentAssessment.scores) setScores(currentAssessment.scores);
          if (currentAssessment.instructorFeedback)
            setInstructorFeedback(currentAssessment.instructorFeedback);
          if (currentAssessment.status)
            setTaskCompleted(currentAssessment.status === "COMPLETED");
        }
      } catch (err) {
        console.error("Background sync failed:", err);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [currentUser, sessionId, sessionData]);

  useEffect(() => {
    async function loadOrCreateAssessment() {
      if (!currentUser?.id) return;
      try {
        const targetSessionId =
          sessionId || sessionData?.id || sessionData?._id;
        const assessments = await fetchUserAssessments(currentUser.id);

        let currentAssessment = assessments.find((a) => {
          const sId = a.sessionId?._id || a.sessionId?.id || a.sessionId;
          return sId?.toString() === targetSessionId?.toString();
        });

        if (!currentAssessment && targetSessionId) {
          currentAssessment = await submitAssessment({
            sessionId: targetSessionId,
            userId: currentUser.id,
            videoUrl: sessionData?.submissionUrl || "",
            groupNumber: sessionData?.groupNumber || 1,
          });
        }

        if (currentAssessment) {
          setAssessmentId(currentAssessment.id || currentAssessment._id);
          setConversationHistory(currentAssessment.messages || []);
          if (currentAssessment.submissionUrl && !videoUrl) {
            setVideoUrl(currentAssessment.submissionUrl);
          }
        }
      } catch (err) {
        console.error(
          "Failed to load/initialize student assessment record:",
          err,
        );
      }
    }
    loadOrCreateAssessment();
  }, [currentUser, sessionId, sessionData]);

  const handleSave = async () => {
    if (isCompleted) return;
    setUrlPermissionError("");
    setSaving(true);

    if (!videoUrl.trim()) {
      setUrlPermissionError("Please provide a Google Drive video link.");
      setSaving(false);
      return;
    }

    const isAccessible = await checkDrivePermission(videoUrl);
    if (!isAccessible) {
      setUrlPermissionError(
        "Access Restricted: Please adjust your Google Drive link permissions so admins can view it.",
      );
      setSaving(false);
      return;
    }

    try {
      const targetSessionId = sessionId || sessionData?.id || sessionData?._id;
      await submitWlsSessionVideo(targetSessionId, {
        userId: currentUser?.id,
        submissionUrl: videoUrl,
        userComments: userComment,
      });
      alert("Video submission & comments saved successfully!");
    } catch (err) {
      console.error("Failed to save assessment submission:", err);
      alert("Submission failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendResponse = async () => {
    if (!replyMessage.trim()) return;
    if (!assessmentId) {
      alert(
        "Assessment record not initialized yet. Please save your video submission first.",
      );
      return;
    }

    try {
      const updatedAssessment = await postAssessmentMessage(assessmentId, {
        senderId: currentUser?.id,
        senderName: currentUser?.name || "Student",
        senderRole: "USER",
        text: replyMessage.trim(),
      });
      setConversationHistory(updatedAssessment.messages || []);
      setReplyMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message.");
    }
  };

  return (
    <div className="student-wls-panel p-6 w-full max-w-4xl mx-auto bg-white shadow rounded space-y-6 box-border">
      <h2 className="text-xl font-bold">Student WLS Panel View</h2>

      <div className="space-y-4 border-b pb-6">
        <div>
          <label className="block font-medium text-sm text-gray-700">
            Google Drive Video URL
          </label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={isCompleted}
            placeholder="https://drive.google.com/..."
            className="border p-2 rounded w-full mt-1"
          />
          {urlPermissionError && (
            <p className="text-red-500 text-sm mt-1">{urlPermissionError}</p>
          )}
        </div>

        <div>
          <label className="block font-medium text-sm text-gray-700">
            Comments / Notes
          </label>
          <textarea
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            disabled={isCompleted}
            placeholder="Add comments for your instructor..."
            className="border p-2 rounded w-full mt-1"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || isCompleted}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save & Submit Video"}
        </button>
      </div>

      {(instructorFeedback || scores) && (
        <div className="bg-gray-50 p-4 rounded space-y-2">
          <h3 className="font-semibold text-gray-800">Instructor Feedback</h3>
          {instructorFeedback && (
            <p className="text-gray-700">{instructorFeedback}</p>
          )}
          {scores && (
            <p className="text-sm font-medium text-blue-600">
              Scores: {JSON.stringify(scores)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">
          Conversation & Discussion
        </h3>
        <div className="border rounded p-4 h-64 overflow-y-auto space-y-3 bg-gray-50">
          {conversationHistory.length === 0 ? (
            <p className="text-gray-400 text-center">No messages yet.</p>
          ) : (
            conversationHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded max-w-md ${msg.senderRole === "USER" ? "ml-auto bg-blue-100 text-right" : "mr-auto bg-white border"}`}
              >
                <p className="text-xs font-bold text-gray-600">
                  {msg.senderName}
                </p>
                <p className="text-sm text-gray-800">{msg.text}</p>
              </div>
            ))
          )}
        </div>

        {!isCompleted && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response..."
              className="border p-2 rounded flex-grow"
            />
            <button
              onClick={handleSendResponse}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
