import React, { useState } from 'react';
import { API_BASE } from '../../../config/constants';

export function SessionBuilderView({ onCreated }) {
  const [sessionTitle, setSessionTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [videoClipUrl, setVideoClipUrl] = useState('');
  const [pdfResourceUrl, setPdfResourceUrl] = useState('');

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !dateTime.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sessionTitle, dateTime, videoClipUrl, pdfResourceUrl })
      });
      if (res.ok) {
        if (onCreated) onCreated();
      }
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: '22px' }}>WLS Session Builder</h2>
      <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Session Title *</label>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%' }}
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Date & Time *</label>
          <input
            type="datetime-local"
            className="form-input"
            style={{ width: '100%' }}
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Video Clip URL</label>
          <input
            type="url"
            className="form-input"
            style={{ width: '100%' }}
            value={videoClipUrl}
            onChange={(e) => setVideoClipUrl(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>PDF Resource URL</label>
          <input
            type="url"
            className="form-input"
            style={{ width: '100%' }}
            value={pdfResourceUrl}
            onChange={(e) => setPdfResourceUrl(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '12px' }}>
          Save WLS Session
        </button>
      </form>
    </div>
  );
}