import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../../config/constants';

export function DashboardView() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/sessions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSessions(data))
      .catch((err) => console.error('Error fetching sessions:', err));
  }, []);

  const activeSessions = sessions.filter((s) => s.title && s.title.trim() !== '');

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: '22px' }}>Active Weekly Learning Sessions</h2>
      {activeSessions.length === 0 ? (
        <p style={{ color: '#64748b', fontStyle: 'italic' }}>
          No active sessions found. Create one using the WLS Session Builder.
        </p>
      ) : (
        activeSessions.map((s, idx) => (
          <div key={s._id || s.id || idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0284c7' }}>
              {s.title} {s.dateTime ? `(${s.dateTime})` : ''}
            </h3>
            <p style={{ margin: '4px 0' }}>
              <strong>Video Clip:</strong> {s.videoClipUrl ? <a href={s.videoClipUrl} target="_blank" rel="noreferrer">{s.videoClipUrl}</a> : 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>PDF Resource:</strong> {s.pdfResourceUrl ? <a href={s.pdfResourceUrl} target="_blank" rel="noreferrer">{s.pdfResourceUrl}</a> : 'N/A'}
            </p>
          </div>
        ))
      )}
    </div>
  );
}