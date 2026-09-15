import React, { useState } from 'react';
import { ColorScoreSlider } from '../../../components/common/ColorScoreSlider';
import styles from './WlsAssessmentPanel.module.css';

export function WlsAssessmentPanel({ assignedUsers = [], criteriaList = [], onSubmitAssessment }) {
  const [selectedUser, setSelectedUser] = useState(assignedUsers[0] || null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');

  const handleScoreChange = (criterion, score) => {
    setScores((prev) => ({ ...prev, [criterion]: score }));
  };

  const handleSubmit = () => {
    if (!selectedUser) return;
    onSubmitAssessment({
      userId: selectedUser._id,
      scores,
      feedback
    });
  };

  return (
    <div className={styles.gridContainer}>
      {/* Sidebar List */}
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Assigned Members</h3>
        <div className={styles.userList}>
          {assignedUsers.map((u) => {
            const hasSubmitted = u.submissionUrls && u.submissionUrls.length > 0;
            const isSelected = selectedUser?._id === u._id;
            return (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`${styles.userCard} ${isSelected ? styles.selectedCard : ''}`}
              >
                <div>
                  <div className={styles.userName}>{u.name}</div>
                  <div className={styles.userGroup}>{u.groupName || 'Group 1'}</div>
                </div>
                <span className={hasSubmitted ? styles.indicatorGreen : styles.indicatorRed}>
                  {hasSubmitted ? '🟢 Submitted' : '🔴 Missing'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grading Area */}
      {selectedUser ? (
        <div className={styles.gradingPanel}>
          <h2>Assessment for: {selectedUser.name}</h2>

          <div className={styles.submissionBox}>
            <h4>Submission Status & Evidence</h4>
            {selectedUser.submissionUrls?.length > 0 ? (
              <ul>
                {selectedUser.submissionUrls.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noreferrer">Video Submission Part {i + 1} ↗</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.missingWarning}>
                ⚠️ User has not submitted files. 
                {selectedUser.nonSubmissionReason && ` Reason: "${selectedUser.nonSubmissionReason}"`}
              </p>
            )}
          </div>

          <h3>Evaluation Criteria</h3>
          {criteriaList.map((criterion, idx) => (
            <ColorScoreSlider
              key={idx}
              label={criterion.title || criterion}
              value={scores[criterion.code || criterion] || 1}
              onChange={(val) => handleScoreChange(criterion.code || criterion, val)}
            />
          ))}

          <div className={styles.feedbackSection}>
            <label className={styles.label}>Instructor Feedback & Comments</label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className={styles.textarea}
              placeholder="Enter comprehensive assessment feedback..."
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