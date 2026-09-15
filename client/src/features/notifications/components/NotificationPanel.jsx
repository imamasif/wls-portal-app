// src/features/notifications/components/NotificationPanel.jsx
import React from 'react';
import styles from './NotificationPanel.module.css';

export function NotificationPanel({ notifications = [] }) {
  const sampleNotifications = notifications.length > 0 ? notifications : [
    {
      id: 1,
      title: 'New WLS Session Published',
      message: 'Tafseer & Recitation Session #1 has been published by the admin.',
      date: '2026-09-14 10:30 AM',
      type: 'INFO'
    },
    {
      id: 2,
      title: 'Submission Assessment Pending',
      message: 'You have 3 new user submissions waiting for criteria evaluation in Group 1.',
      date: '2026-09-14 09:15 AM',
      type: 'WARNING'
    },
    {
      id: 3,
      title: 'Group Assignment Updated',
      message: 'You were assigned as WLS-Admin for Group 2 for the upcoming module.',
      date: '2026-09-13 04:00 PM',
      type: 'SUCCESS'
    }
  ];

  return (
    <div className={styles.container}>
      <h2>🔔 Notifications Directory</h2>
      <div className={styles.cardGrid}>
        {sampleNotifications.map((n) => (
          <div key={n.id} className={`${styles.card} ${styles[n.type]}`}>
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>{n.title}</h4>
              <span className={styles.cardDate}>{n.date}</span>
            </div>
            <p className={styles.cardBody}>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}