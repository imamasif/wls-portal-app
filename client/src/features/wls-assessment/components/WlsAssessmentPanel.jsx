import React, { useState, useEffect } from 'react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';
import styles from './WlsAssessmentPanel.module.css';

// Converts standard Google Drive view/share URLs or raw IDs into an embeddable preview URL
function formatDriveEmbedUrl(url) {
  if (!url) return '';
  const cleanUrl = url.trim();

  // If user enters a full Google Drive URL
  if (cleanUrl.includes('drive.google.com')) {
    return cleanUrl
      .replace(/\/view(\?.*)?$/, '/preview')
      .replace(/\/open(\?.*)?$/, '/preview')
      .replace(/\/edit(\?.*)?$/, '/preview');
  }

  // If a raw Google Drive File ID is pasted (e.g., 1A2b3C4d5E...)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return `https://drive.google.com/file/d/${cleanUrl}/preview`;
  }

  return cleanUrl;
}

export function WlsAssessmentPanel({ currentAdminId, onSubmitAssessment }) {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [resSessions, resAssessments, resUsers, resRules] = await Promise.all([
          fetch('/api/wls-sessions?status=ACTIVE'),
          fetch('/api/assessments'),
          fetch('/api/users'),
          fetch('/api/rules').catch(() => null)
        ]);

        const sessions = await resSessions.json();
        const assessments = await resAssessments.json();
        const allUsers = await resUsers.json();
        const rulesData = resRules && resRules.ok ? await resRules.json() : [];

        // Populates dynamic evaluation criteria from Rule Engine
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

        const activeSession = Array.isArray(sessions) ? sessions[0] : null;
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

        const memberList = Array.from(assignedStudentIds).map((studentId) => {
          const userObj = userMap.get(studentId) || {};
          const assessment = assessmentMap.get(studentId) || {};

          const rawUrl = assessment.submissionUrl || (assessment.submissionUrls?.[0] || '');

          return {
            id: studentId,
            name: userObj.name || `Student (${studentId.slice(-4)})`,
            email: userObj.email || '',
            assessmentId: assessment.id || assessment._id,
            submissionUrl: rawUrl,
            missedReason: assessment.missedReason || '',
            groupNumber: assessment.groupNumber || 1,
            evaluations: assessment.evaluations || [],
            feedback: assessment.feedback || assessment.comments || ''
          };
        });

        setAssignedUsers(memberList);

        if (memberList.length > 0) {
          handleUserSelect(memberList[0]);
        }
      } catch (err) {
        console.error('Failed to load assessment panel data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentAdminId]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFeedback(user.feedback || '');
    setVideoUrl(user.submissionUrl || '');

    const existingScores = {};
    if (Array.isArray(user.evaluations)) {
      user.evaluations.forEach((item) => {
        if (item.criterionKey && item.score) {
          existingScores[item.criterionKey] = item.score;
        }
      });
    }
    setScores(existingScores);
  };

  const handleScoreChange = (criterionKey, score) => {
    setScores((prev) => ({ ...prev, [criterionKey]: score }));
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    const payload = {
      assessmentId: selectedUser.assessmentId,
      userId: selectedUser.id,
      evaluatorId: currentAdminId || 'admin-id',
      submissionUrl: videoUrl,
      scores,
      feedback
    };

    if (onSubmitAssessment) {
      onSubmitAssessment(payload);
    } else {
      await fetch(`/api/assessments/${selectedUser.assessmentId || selectedUser.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Assessment record saved successfully!');
    }
  };

  if (loading) {
    return <div className={styles.emptyState}>Loading assigned members...</div>;
  }

  const embedUrl = formatDriveEmbedUrl(videoUrl);

  return (
    <div className={styles.gridContainer}>
      {/* Sidebar List */}
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Assigned Members</h3>
        <div className={styles.userList}>
          {assignedUsers.length === 0 ? (
            <div className={styles.emptyState}>No members assigned to current admin.</div>
          ) : (
            assignedUsers.map((item) => {
              const hasSubmitted = Boolean(item.submissionUrl);
              const isSelected = selectedUser?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleUserSelect(item)}
                  className={`${styles.userCard} ${isSelected ? styles.selectedCard : ''}`}
                >
                  <div>
                    <div className={styles.userName}>{item.name}</div>
                    <div className={styles.userGroup}>Group {item.groupNumber}</div>
                  </div>
                  <span className={hasSubmitted ? styles.indicatorGreen : styles.indicatorRed}>
                    {hasSubmitted ? '🟢 Submitted' : '🔴 Missing'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Assessment Panel */}
      {selectedUser ? (
        <div className={styles.gradingPanel}>
          <h2>Assessment for: {selectedUser.name}</h2>

          {/* Video Player Box */}
          <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Video Submission & Player</h4>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Google Drive / Video Link:
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste Google Drive video link here..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            {/* Always-rendered Video Frame Container */}
            <div style={{ marginTop: '12px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                Embedded Video Stream:
              </p>
              
              {embedUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '360px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe
                    src={embedUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Google Drive Video Player"
                  />
                </div>
              ) : (
                <div style={{
                  height: '200px',
                  backgroundColor: '#0f172a',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  border: '1px dashed #334155'
                }}>
                  <span>📹 No Video Link Provided</span>
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Paste a link above to stream video directly here
                  </span>
                </div>
              )}

              {videoUrl && (
                <div style={{ marginTop: '8px' }}>
                  <a href={videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb' }}>
                    Open Original Link in Google Drive ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Criteria List */}
          <h3>Evaluation Criteria</h3>
          {criteriaList.map((criterion, idx) => {
            const key = criterion.key || criterion.code || (typeof criterion === 'string' ? criterion : `criterion_${idx}`);
            const label = criterion.title || criterion.criterion || (typeof criterion === 'string' ? criterion : `Criteria ${idx + 1}`);

            return (
              <ColorScoreSlider
                key={key}
                label={label}
                value={scores[key] || 1}
                onChange={(val) => handleScoreChange(key, val)}
              />
            );
          })}

          {/* Instructor Comments */}
          <div className={styles.feedbackSection}>
            <label className={styles.label}>Instructor Feedback & Comments (Visible to Student)</label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className={styles.textarea}
              placeholder="Enter assessment comments for student..."
            />
          </div>

          <button onClick={handleSubmit} className={styles.btnSubmit}>
            Submit Assessment Record
          </button>
        </div>
      ) : (
        <div className={styles.emptyState}>Select a user from the left sidebar to begin assessment.</div>
      )}
    </div>
  );
}