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

function extractNormalizedScores(rawAssessment, currentAdminId) {
  const existingScores = {};
  if (!rawAssessment) return existingScores;

  const adminIdStr = currentAdminId ? String(currentAdminId).trim() : '';

  // 1. Check evaluations array first
  if (Array.isArray(rawAssessment.evaluations) && rawAssessment.evaluations.length > 0) {
    const adminEval = rawAssessment.evaluations.find((e) => {
      const eId = e.evaluatorId ? String(e.evaluatorId).trim() : '';
      return adminIdStr && eId === adminIdStr;
    });

    const targetEval = adminEval || rawAssessment.evaluations[rawAssessment.evaluations.length - 1];

    if (targetEval && targetEval.scores) {
      let scoresObj = targetEval.scores;
      
      if (scoresObj instanceof Map) {
        scoresObj = Object.fromEntries(scoresObj);
      } else if (typeof scoresObj.get === 'function') {
        const resolved = {};
        for (const [k, v] of scoresObj.entries()) {
          resolved[k] = v;
        }
        scoresObj = resolved;
      } else if (typeof scoresObj === 'object' && scoresObj !== null) {
        scoresObj = Object.fromEntries(
          Object.entries(scoresObj).map(([k, v]) => [
            k, 
            typeof v === 'object' && v !== null ? (v.score ?? v.value ?? v.points ?? 0) : v
          ])
        );
      }

      Object.entries(scoresObj || {}).forEach(([key, val]) => {
        const numVal = Number(val);
        if (key && !isNaN(numVal)) {
          existingScores[String(key)] = numVal;
        }
      });

      if (Object.keys(existingScores).length > 0) {
        return existingScores;
      }
    }
  }

  // 2. Check direct property bags
  const rawEvals = 
    rawAssessment.scores || 
    rawAssessment.grades || 
    rawAssessment.criteriaScores ||
    rawAssessment.points ||
    rawAssessment;

  if (Array.isArray(rawEvals)) {
    rawEvals.forEach((item) => {
      const key = item.criterionKey || item.key || item.criterion || item.id;
      const scoreVal = item.score !== undefined ? item.score : (item.points !== undefined ? item.points : item.value);
      const numVal = Number(scoreVal);
      if (key && !isNaN(numVal)) {
        existingScores[String(key)] = numVal;
      }
    });
  } else if (typeof rawEvals === 'object' && rawEvals !== null) {
    Object.entries(rawEvals).forEach(([key, val]) => {
      const scoreVal = (typeof val === 'object' && val !== null) 
        ? (val.score ?? val.points ?? val.value ?? val.grade ?? 0) 
        : val;
      const numVal = Number(scoreVal);
      if (key && !isNaN(numVal)) {
        existingScores[String(key)] = numVal;
      }
    });
  }
  
  return existingScores;
}

export function WlsAssessmentPanel({ currentAdminId, currentAdminName = 'Syed Imam', onSubmitAssessment }) {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionInfo, setSessionInfo] = useState({ topic: '', date: '', rawSession: null });
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [userScoresMap, setUserScoresMap] = useState({});
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

      const { sessions, allUsers, rulesData } = await fetchAssessmentPanelData(currentAdminId);

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

      const resolvedSessionId = activeSession?.id || activeSession?._id;

      if (activeSession) {
        setSelectedSessionId(resolvedSessionId);
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

      let localDrafts = {};
      if (resolvedSessionId) {
        try {
          const saved = localStorage.getItem(`wls_draft_scores_${resolvedSessionId}_${currentAdminId}`);
          if (saved) {
            localDrafts = JSON.parse(saved);
          }
        } catch (e) {
          console.error('Failed to load local drafts:', e);
        }
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
      const sessionSubmissions = activeSession?.studentSubmissions || {};

      const memberList = [];
      const computedMap = { ...localDrafts };

      for (const studentId of assignedStudentIds) {
        const userObj = userMap.get(studentId) || {};
        let assessment = {};

        if (resolvedSessionId) {
          try {
            const res = await fetch(`/api/assessments/session/${resolvedSessionId}/user/${studentId}`);
            if (res.ok) {
              assessment = await res.json();
            }
          } catch (e) {
            console.error(`Could not fetch assessment for student ${studentId}:`, e);
          }
        }

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

        if (!computedMap[studentId] || Object.keys(computedMap[studentId]).length === 0) {
          computedMap[studentId] = extractNormalizedScores(assessment, currentAdminId);
        }

        memberList.push({
          id: studentId,
          sessionId: resolvedSessionId,
          name: userObj.name || userObj.fullName || `Student (${studentId.slice(-4)})`,
          email: userObj.email || '',
          assessmentId: assessment.id || assessment._id, 
          submissionUrl: studentUrl,
          adminSubmissionUrl: adminUrl,
          status: assessment.status || (assessment.isCompleted ? 'COMPLETED' : studentUrl || adminUrl ? 'SUBMITTED' : 'MISSING'),
          missedReason: assessment.missedReason || '',
          groupNumber: assessment.groupNumber || 1,
          evaluations: assessment.evaluations || [],
          feedback: assessment.feedback || assessment.adminComments || '',
          userComments: extractedUserComments,
          messages: assessment.messages || []
        });
      }

      setUserScoresMap(computedMap);
      setAssignedUsers(memberList);

      if (memberList.length > 0) {
        const prevSelectedId = selectedUser?.id;
        const matchingMember = prevSelectedId ? memberList.find(m => m.id === prevSelectedId) : null;
        const targetUser = matchingMember || memberList[0];
        
        setSelectedUser(targetUser);
        setFeedback(targetUser.feedback || '');
        setVideoUrl(targetUser.adminSubmissionUrl || targetUser.submissionUrl || '');
        setAdminVideoUrl(targetUser.adminSubmissionUrl || '');
      } else {
        setSelectedUser(null);
        setVideoUrl('');
        setAdminVideoUrl('');
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

  useEffect(() => {
    if (selectedSessionId && Object.keys(userScoresMap).length > 0) {
      try {
        localStorage.setItem(
          `wls_draft_scores_${selectedSessionId}_${currentAdminId}`,
          JSON.stringify(userScoresMap)
        );
      } catch (e) {
        console.error('Failed to persist draft scores to localStorage:', e);
      }
    }
  }, [userScoresMap, selectedSessionId, currentAdminId]);

  const handleSessionSwitch = (newSessionId) => {
    if (!newSessionId) return;
    loadPanelData(newSessionId);
  };

  const handleRefreshCurrentStudent = async () => {
    if (!selectedSessionId || !selectedUser?.id) return;

    try {
      const res = await fetch(`/api/assessments/session/${selectedSessionId}/user/${selectedUser.id}`);
      if (res.ok) {
        const assessment = await res.json();
        const updatedMessages = assessment.messages || [];
        const updatedEvalsArray = assessment.evaluations || [];
        const normalizedScores = extractNormalizedScores(assessment, currentAdminId);

        setUserScoresMap((prev) => ({ ...prev, [selectedUser.id]: normalizedScores }));
        setSelectedUser((prev) => prev ? { 
          ...prev, 
          messages: updatedMessages, 
          evaluations: updatedEvalsArray,
          assessmentId: assessment.id || assessment._id 
        } : null);

        setAssignedUsers((prev) =>
          prev.map((u) => u.id === selectedUser.id ? { ...u, messages: updatedMessages, evaluations: updatedEvalsArray } : u)
        );

        showBanner('success', 'Student record refreshed successfully!');
      }
    } catch (err) {
      console.error('Failed to refresh student record:', err);
      showBanner('error', 'Failed to refresh student record.');
    }
  };

  const handleUserSelect = (user) => {
    if (!user) return;
    setSelectedUser(user);
    setFeedback(user.feedback || '');

    const activeStreamUrl = user.adminSubmissionUrl || user.submissionUrl || '';
    setVideoUrl(activeStreamUrl);
    setAdminVideoUrl(user.adminSubmissionUrl || '');
    setIframeError(false);

    if (!userScoresMap[user.id]) {
      const evaluationsList = Array.isArray(user.evaluations) ? user.evaluations : [];
      const existingEval = evaluationsList.find(
        (e) => String(e?.evaluatorId) === String(currentAdminId)
      );
      const initialScores = existingEval ? extractNormalizedScores({ evaluations: [existingEval] }, currentAdminId) : {};
      
      setUserScoresMap((prev) => ({ ...prev, [user.id]: initialScores }));
    }
  };

  const handleScoreChange = (criterionKey, score) => {
    if (!selectedUser) return;

    const currentStudentScores = userScoresMap[selectedUser.id] || {};
    const updatedScores = { ...currentStudentScores, [criterionKey]: Number(score) };

    setUserScoresMap((prev) => ({
      ...prev,
      [selectedUser.id]: updatedScores
    }));

    const validEvaluatorId = currentAdminId || localStorage.getItem('adminId') || 'admin-default';
    const existingEvals = Array.isArray(selectedUser.evaluations) ? selectedUser.evaluations : [];
    const filteredEvals = existingEvals.filter(e => String(e?.evaluatorId) !== String(validEvaluatorId));
    
    const updatedEvaluationsList = [
      ...filteredEvals,
      { evaluatorId: validEvaluatorId, evaluatorName: currentAdminName, scores: updatedScores }
    ];

    const updatedUserObj = {
      ...selectedUser,
      evaluations: updatedEvaluationsList
    };

    setSelectedUser(updatedUserObj);
    setAssignedUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? updatedUserObj : u))
    );
  };

  const handleSaveAssessment = async (saveType) => {
    if (!selectedUser) return;
    setBanner({ show: false, type: '', message: '' });

    const validEvaluatorId = currentAdminId || localStorage.getItem('adminId') || 'admin-default';
    const activeStreamUrl = adminVideoUrl || videoUrl;

    if (saveType === 'complete' && (!activeStreamUrl || activeStreamUrl.trim() === '')) {
      showBanner(
        'error',
        'Cannot complete assessment: Student has not provided a mandatory video link, and no admin override link exists.'
      );
      return;
    }

    // Capture the exact active scores state right before saving so we can lock them in
    const currentScoresToSave = { ...(userScoresMap[selectedUser.id] || {}) };
    const sanitizedScores = {};
    const nonCriterionKeys = [
      'id', 'userId', 'groupNumber', 'submissionUrl', 'submissionUrls', 
      'missedReason', 'status', 'evaluations', 'messages', 'finalScore', 
      'conclusionStatus', 'createdAt', 'updatedAt', 'user', 'evaluatorId', 'evaluatorName'
    ];

    Object.entries(currentScoresToSave).forEach(([key, val]) => {
      if (!nonCriterionKeys.includes(key) && val !== undefined && val !== null && !isNaN(Number(val))) {
        sanitizedScores[key] = Number(val);
      }
    });

    let targetId = selectedUser.assessmentId;

    try {
      if (!targetId) {
        const resolvedSessionId = selectedSessionId || selectedUser.sessionId;

        const submitData = await createAssessmentRecord({
          sessionId: resolvedSessionId,
          userId: selectedUser.id || selectedUser._id,
          videoUrl: activeStreamUrl || '',
          groupNumber: selectedUser.groupNumber || 1
        });

        targetId = submitData.id || submitData._id;
      }

      const payload = {
        evaluatorId: validEvaluatorId,
        evaluatorName: currentAdminName,
        scores: sanitizedScores,
        feedback: feedback || '',
        adminSubmissionUrl: adminVideoUrl || ''
      };

      await gradeAssessmentRecord(targetId, payload);

      // Force-retain the exact scores just saved instead of wiping them out
      setUserScoresMap((prev) => ({
        ...prev,
        [selectedUser.id]: currentScoresToSave
      }));

      const newAdminEval = {
        evaluatorId: validEvaluatorId,
        evaluatorName: currentAdminName,
        scores: { ...sanitizedScores }
      };

      const existingEvals = Array.isArray(selectedUser.evaluations) ? selectedUser.evaluations : [];
      const filteredEvals = existingEvals.filter(e => String(e.evaluatorId) !== String(validEvaluatorId));
      const updatedEvaluationsList = [...filteredEvals, newAdminEval];

      const updatedUserObj = {
        ...selectedUser,
        assessmentId: targetId,
        submissionUrl: videoUrl,
        adminSubmissionUrl: adminVideoUrl,
        feedback,
        evaluations: updatedEvaluationsList,
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

    const rawRole = currentAdminId === 'super-user' ? 'SUPER_USER' : 'WLS_ADMIN';
    const senderRole = rawRole.toUpperCase();
    
    try {
      let targetAssessmentId = selectedUser.assessmentId;

      if (!targetAssessmentId) {
        const resolvedSessionId = selectedSessionId || selectedUser.sessionId;
        const activeStreamUrl = adminVideoUrl || selectedUser.submissionUrl || '';

        const submitData = await createAssessmentRecord({
          sessionId: resolvedSessionId,
          userId: selectedUser.id || selectedUser._id,
          videoUrl: activeStreamUrl,
          groupNumber: selectedUser.groupNumber || 1
        });

        targetAssessmentId = submitData.id || submitData._id;
      }

      const response = await sendAssessmentMessage(targetAssessmentId, {
        senderId: validSenderId,
        senderName: currentAdminName || 'Syed Imam',
        senderRole: senderRole,
        text: newMessageText.trim()
      });

      const updatedMessages = 
        response?.messages || 
        response?.assessment?.messages || 
        response?.data?.messages || 
        (Array.isArray(response) ? response : null) || 
        [...(selectedUser.messages || []), { senderName: currentAdminName, text: newMessageText.trim(), timestamp: new Date() }];

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

  const activeScores = (selectedUser && userScoresMap[selectedUser.id]) ? userScoresMap[selectedUser.id] : {};
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
            scores={activeScores}
            onScoreCheck={handleScoreChange}
            onScoreChange={handleScoreChange}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            messages={selectedUser?.messages || []}
            newMessageText={newMessageText}
            onNewMessageTextChange={setNewMessageText}
            onSendMessage={handleSendMessage}
            onOpenSaveModal={openSaveConfirmationModal}
            onRefresh={handleRefreshCurrentStudent}
          />
        </Grid.Col>
      </Grid>
    </Box>
  );
}