import React, { useState, useEffect } from 'react';
import { Grid, Box, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { WlsSessionHeader } from './WlsSessionHeader';
import { WlsAssignedMembers } from './WlsAssignedMembers';
import { WlsAssessmentWorkspace } from './WlsAssessmentWorkspace';
import { WlsStudentVideoStream } from './WlsStudentVideoStream';
import {
  fetchAssessmentPanelData,
  createAssessmentRecord,
  gradeAssessmentRecord,
  sendAssessmentMessage
} from '../api/wlsAssessmentApi';

function formatDriveEmbedUrl(url) {
  if (!url) return { embedUrl: '', error: null };
  const cleanUrl = url.trim();

  if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch =
      cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);

    if (!fileIdMatch || !fileIdMatch[1]) {
      return {
        embedUrl: '',
        error: 'Invalid Google Drive URL format. Ensure it contains a valid File ID.'
      };
    }

    const formattedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    return { embedUrl: formattedUrl, error: null };
  }

  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return {
      embedUrl: `https://drive.google.com/file/d/${cleanUrl}/preview`,
      error: null
    };
  }

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return {
      embedUrl: cleanUrl,
      error: 'Non-Google Drive URL detected.'
    };
  }

  return { embedUrl: '', error: 'Unrecognized URL or invalid video stream link.' };
}

export function WlsAssessmentPanel({ currentAdminId, currentAdminName = 'Syed Imam', onSubmitAssessment }) {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionInfo, setSessionInfo] = useState({ topic: '', date: '', rawSession: null });
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [adminVideoUrl, setAdminVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [newMessageText, setNewMessageText] = useState('');

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => {
      setBanner({ show: false, type: '', message: '' });
    }, 4000);
  };

  const loadPanelData = async (targetSessionId = null) => {
    try {
      setLoading(true);

      const { sessions, assessments, allUsers, rulesData } = await fetchAssessmentPanelData(currentAdminId);

      if (Array.isArray(sessions)) {
        setAllSessions(sessions);
      }

      if (Array.isArray(rulesData) && rulesData.length > 0) {
        setCriteriaList(rulesData);
      } else {
        setCriteriaList([
          { key: 'presentation', title: '1. Presentation - camera position, Light, Picture and Sound Quality - Video Size' },
          { key: 'attire', title: '2. Attire / Dress Code' },
          { key: 'arabicReading', title: '3. Arabic Reading' },
          { key: 'onTimeDelivery', title: '4. On Time Delivery' },
          { key: 'transferenceOfSpirit', title: '5. Transference of Spirit' },
          { key: 'bodyLanguage', title: '6. Body Language' }
        ]);
      }

      const activeSession = targetSessionId 
        ? sessions.find((s) => (s.id || s._id) === targetSessionId)
        : (Array.isArray(sessions) ? sessions[0] : null);

      if (activeSession) {
        setSelectedSessionId(activeSession.id || activeSession._id);
        setSessionInfo({
          topic:
            activeSession.topic ||
            activeSession.topicName ||
            activeSession.sessionTitle ||
            activeSession.title ||
            activeSession.name ||
            'WLS Session Assessment',
          date: activeSession.sessionDateTimeToronto || activeSession.sessionDate || activeSession.date || '',
          rawSession: activeSession
        });
      } else {
        setSessionInfo({
          topic: 'WLS Session Assessment',
          date: '',
          rawSession: null
        });
      }

      const assignedStudentIds = new Set();

      if (activeSession?.groupAssignments) {
        Object.values(activeSession.groupAssignments).forEach((group) => {
          const isAssignedAdmin = !currentAdminId || group.adminIds?.includes(currentAdminId);
          if (isAssignedAdmin && Array.isArray(group.userIds)) {
            group.userIds.forEach((id) => assignedStudentIds.add(id));
          }
        });
      }

      const userMap = new Map((Array.isArray(allUsers) ? allUsers : []).map((u) => [u.id || u._id, u]));
      const assessmentMap = new Map((Array.isArray(assessments) ? assessments : []).map((a) => [a.userId?.id || a.userId, a]));

      const sessionSubmissions = activeSession?.studentSubmissions || {};

      const memberList = Array.from(assignedStudentIds).map((studentId) => {
        const userObj = userMap.get(studentId) || {};
        const assessment = assessmentMap.get(studentId) || {};
        
        const sessionSubRecord = sessionSubmissions instanceof Map 
          ? sessionSubmissions.get(studentId) 
          : sessionSubmissions[studentId];

        const studentUrl = assessment.submissionUrl || sessionSubRecord?.submissionUrl || (assessment.submissionUrls?.[0] || '');
        const adminUrl = assessment.adminSubmissionUrl || '';

        const extractedUserComments =
          sessionSubRecord?.userComments ||
          sessionSubRecord?.submissionNote ||
          assessment.userComments ||
          assessment.submissionNote ||
          assessment.notes ||
          assessment.comments ||
          userObj.submissionNote ||
          userObj.userComments ||
          '';

        return {
          id: studentId,
          sessionId: activeSession?.id || activeSession?._id,
          name: userObj.name || userObj.fullName || `Student (${studentId.slice(-4)})`,
          email: userObj.email || '',
          assessmentId: assessment.id || assessment._id,
          submissionUrl: studentUrl,
          adminSubmissionUrl: adminUrl,
          status: assessment.status || (assessment.isCompleted ? 'COMPLETED' : studentUrl || adminUrl ? 'SUBMITTED' : 'MISSING'),
          missedReason: assessment.missedReason || '',
          groupNumber: assessment.groupNumber || 1,
          evaluations: assessment.evaluations || assessment.scores || {},
          feedback: assessment.feedback || assessment.adminComments || '',
          userComments: extractedUserComments,
          messages: assessment.messages || []
        };
      });

      setAssignedUsers(memberList);

      if (memberList.length > 0) {
        handleUserSelect(memberList[0]);
      } else {
        setSelectedUser(null);
        setVideoUrl('');
        setAdminVideoUrl('');
        setScores({});
        setFeedback('');
      }
    } catch (err) {
      console.error('Failed to load assessment panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPanelData();
  }, [currentAdminId]);

  const handleSessionSwitch = (newSessionId) => {
    if (!newSessionId) return;
    loadPanelData(newSessionId);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFeedback(user.feedback || '');

    const activeStreamUrl = user.adminSubmissionUrl || user.submissionUrl || '';
    setVideoUrl(activeStreamUrl);
    setAdminVideoUrl(user.adminSubmissionUrl || '');
    setIframeError(false);

    const existingScores = {};
    const evals = user.evaluations || {};

    if (Array.isArray(evals)) {
      evals.forEach((item) => {
        const key = item.criterionKey || item.key || item.criterion;
        if (key && item.score !== undefined && item.score !== null) {
          existingScores[key] = Number(item.score);
        }
      });
    } else if (typeof evals === 'object' && evals !== null) {
      Object.entries(evals).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          existingScores[key] = Number(val);
        }
      });
    }

    setScores(existingScores);
  };

  const handleScoreChange = (criterionKey, score) => {
    const updatedScores = { ...scores, [criterionKey]: Number(score) };
    setScores(updatedScores);

    if (selectedUser) {
      setSelectedUser((prev) => ({
        ...prev,
        evaluations: updatedScores
      }));
    }
  };

  const handleSaveAssessment = async (saveType) => {
    if (!selectedUser) return;
    setBanner({ show: false, type: '', message: '' });

    const activeStreamUrl = adminVideoUrl || videoUrl;

    if (saveType === 'complete' && (!activeStreamUrl || activeStreamUrl.trim() === '')) {
      showBanner(
        'error',
        'Cannot complete assessment: Student has not provided a mandatory video link, and no admin override link exists.'
      );
      return;
    }

    let targetId = selectedUser.assessmentId;

    try {
      if (!targetId) {
        const resolvedSessionId = selectedSessionId || selectedUser.sessionId;

        const submitData = await createAssessmentRecord({
          sessionId: resolvedSessionId,
          userId: selectedUser.id || selectedUser._id,
          videoUrl: activeStreamUrl || 'https://placeholder-url.com',
          groupNumber: selectedUser.groupNumber || 1
        });

        targetId = submitData.id || submitData._id;
      }

      const payload = {
        evaluatorId: currentAdminId || selectedUser.id,
        evaluatorName: currentAdminName,
        scores,
        feedback: feedback || '',
        adminSubmissionUrl: adminVideoUrl || ''
      };

      await gradeAssessmentRecord(targetId, payload);

      const updatedUserObj = {
        ...selectedUser,
        assessmentId: targetId,
        submissionUrl: videoUrl,
        adminSubmissionUrl: adminVideoUrl,
        feedback,
        evaluations: payload.scores,
        status: saveType === 'complete' ? 'COMPLETED' : 'PARTIAL_SAVED'
      };

      setAssignedUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? updatedUserObj : u))
      );
      setSelectedUser(updatedUserObj);

      showBanner(
        'success',
        `Assessment successfully ${saveType === 'complete' ? 'completed' : 'saved'}!`
      );

      if (onSubmitAssessment) {
        onSubmitAssessment(updatedUserObj);
      }
    } catch (err) {
      console.error('Save failed:', err);
      showBanner('error', `Save Failed: ${err.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) {
      showBanner('error', 'Please select a user first.');
      return;
    }

    if (!newMessageText.trim()) {
      showBanner('error', 'Message cannot be empty.');
      return;
    }

    const validSenderId = (currentAdminId && currentAdminId !== 'admin') 
      ? currentAdminId 
      : (selectedUser.id || selectedUser._id);

    try {
      let targetAssessmentId = selectedUser.assessmentId;

      // If assessment record doesn't exist yet, create it first
      if (!targetAssessmentId) {
        const resolvedSessionId = selectedSessionId || selectedUser.sessionId;
        const activeStreamUrl = adminVideoUrl || selectedUser.submissionUrl || 'https://placeholder-url.com';

        const submitData = await createAssessmentRecord({
          sessionId: resolvedSessionId,
          userId: selectedUser.id || selectedUser._id,
          videoUrl: activeStreamUrl,
          groupNumber: selectedUser.groupNumber || 1
        });

        targetAssessmentId = submitData.id || submitData._id;
      }

      // Send the message via API
      const response = await sendAssessmentMessage(targetAssessmentId, {
        senderId: validSenderId,
        senderName: currentAdminName || 'Syed Imam',
        senderRole: 'ADMIN',
        text: newMessageText.trim()
      });

      // Safely extract messages from whatever format the backend response uses
      const updatedMessages = response.messages || response.assessment?.messages || response.data?.messages || [];

      const updatedUserObj = {
        ...selectedUser,
        assessmentId: targetAssessmentId,
        messages: updatedMessages
      };

      setAssignedUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? updatedUserObj : u))
      );
      setSelectedUser(updatedUserObj);
      setNewMessageText('');
      showBanner('success', 'Message sent successfully!');
    } catch (err) {
      console.error('Failed to send message:', err);
      showBanner('error', `Failed to send message: ${err.message || 'Unknown error'}`);
    }
  };

  const openSaveConfirmationModal = () => {
    if (!selectedUser) return;

    modals.openConfirmModal({
      title: <Text fw={700} size="lg">Confirm Assessment Save</Text>,
      centered: true,
      radius: 'md',
      labels: { confirm: 'Save as Completed', cancel: 'Partial Save' },
      confirmProps: { color: 'green' },
      cancelProps: { color: 'blue', variant: 'filled' },
      children: (
        <Text size="sm" c="gray.7" mb="md">
          Are you sure you want to save grades for <strong>{selectedUser.name}</strong>? 
          Select <strong>Save as Completed</strong> to mark status as fully completed, or <strong>Partial Save</strong> to save progress and resume later.
        </Text>
      ),
      onConfirm: () => handleSaveAssessment('complete'),
      onCancel: () => handleSaveAssessment('partial')
    });
  };

  if (loading) {
    return <Text ta="center" py="xl" c="dimmed">Loading assigned members...</Text>;
  }

  const activeVideoToRender = adminVideoUrl || videoUrl;
  const { embedUrl, error: urlCheckError } = formatDriveEmbedUrl(activeVideoToRender);

  return (
    <Box style={{ width: '100%', paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', boxSizing: 'border-box' }}>
      <WlsSessionHeader
        sessionInfo={sessionInfo}
        allSessions={allSessions}
        selectedSessionId={selectedSessionId}
        onSessionSwitch={handleSessionSwitch}
        currentAdminName={currentAdminName}
      />

      <Grid gutter="lg" align="flex-start" style={{ width: '100%', margin: 0 }}>
        <Grid.Col span={{ base: 12, md: 3, lg: 3 }}>
          <WlsAssignedMembers
            assignedUsers={assignedUsers}
            selectedUserId={selectedUser?.id}
            onUserSelect={handleUserSelect}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9, lg: 9 }}>
          {/* Integrated Student Video Stream Component */}
          <WlsStudentVideoStream 
            selectedUser={selectedUser} 
            adminVideoUrl={adminVideoUrl} 
          />

          <WlsAssessmentWorkspace
            selectedUser={selectedUser}
            banner={banner}
            onCloseBanner={() => setBanner({ show: false, type: '', message: '' })}
            activeVideoToRender={activeVideoToRender}
            videoUrl={videoUrl}
            adminVideoUrl={adminVideoUrl}
            onAdminVideoUrlChange={(e) => {
              setAdminVideoUrl(e.target.value);
              setIframeError(false);
            }}
            urlCheckError={urlCheckError}
            iframeError={iframeError}
            onIframeError={() => setIframeError(true)}
            embedUrl={embedUrl}
            criteriaList={criteriaList}
            scores={scores}
            onScoreChange={handleScoreChange}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            messages={selectedUser?.messages || []}
            newMessageText={newMessageText}
            onNewMessageTextChange={setNewMessageText}
            onSendMessage={handleSendMessage}
            onOpenSaveModal={openSaveConfirmationModal}
          />
        </Grid.Col>
      </Grid>
    </Box>
  );
}