import React, { useState } from 'react';
import styles from './ReportingManagement.module.css';

export function ReportingManagement({ sessions = [] }) {
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  return (
    <div className={styles.card}>
      <h2>📊 Reporting & Analytics Panel</h2>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>Select WLS Session</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className={styles.select}
          >
            <option value="">-- Select Session --</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>{s.topicName}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Group Filter</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={styles.select}
          >
            <option value="ALL">All Groups</option>
            <option value="Group 1">Group 1</option>
            <option value="Group 2">Group 2</option>
          </select>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartBox}>
          📈 [ Comparative Performance Bar Chart ]
        </div>
        <div className={styles.chartBox}>
          🍩 [ Submission Completion Ratio Donut Chart ]
        </div>
      </div>
    </div>
  );
}