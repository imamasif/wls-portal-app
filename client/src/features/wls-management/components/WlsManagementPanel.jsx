import React, { useState } from 'react';
import styles from './WlsManagementPanel.module.css';

export function WlsManagementPanel({ onCreateSession, existingSessions = [] }) {
  const [topicName, setTopicName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [quranVideoUrl, setQuranVideoUrl] = useState('');
  
  const [localSessions, setLocalSessions] = useState(existingSessions);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topicName || !sessionDate) return;

    const newSession = {
      topicName,
      sessionDateTimeToronto: sessionDate,
      pdfBookletUrl: pdfUrl,
      quranVideoUrl,
      status: 'ACTIVE'
    };

    // Safe execution check preventing crashes
    if (typeof onCreateSession === 'function') {
      onCreateSession(newSession);
    } else {
      setLocalSessions((prev) => [newSession, ...prev]);
    }

    setTopicName('');
    setSessionDate('');
    setPdfUrl('');
    setQuranVideoUrl('');
  };

  const sessionsToDisplay = existingSessions.length > 0 ? existingSessions : localSessions;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>WLS Session Builder & Management</h2>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Topic Name</label>
            <input
              type="text"
              className={styles.input}
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Tafseer & Recitation Module - Week 1"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Session Date & Time (Toronto)</label>
            <input
              type="datetime-local"
              className={styles.input}
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>PDF Booklet URL</label>
            <input
              type="url"
              className={styles.input}
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Quran Video / Stream URL</label>
            <input
              type="url"
              className={styles.input}
              value={quranVideoUrl}
              onChange={(e) => setQuranVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className={styles.fullWidth}>
            <button type="submit" className={styles.btnPrimary}>
              Publish & Create Active Session
            </button>
          </div>
        </form>
      </div>

      <div className={styles.card} style={{ marginTop: '24px' }}>
        <h3 className={styles.subTitle}>Managed Sessions</h3>
        {sessionsToDisplay.length === 0 ? (
          <p className={styles.mutedText}>No historical or active sessions logged yet.</p>
        ) : (
          <ul className={styles.sessionList}>
            {sessionsToDisplay.map((s, idx) => (
              <li key={idx} className={styles.sessionItem}>
                <span>{s.topicName}</span>
                <span className={styles.badge}>{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}