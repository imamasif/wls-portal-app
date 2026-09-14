import React, { useState } from 'react';
import './UserAdminControls.css';

export function UserAdminControls({ targetUser, currentUser, onRefresh }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [radarReason, setRadarReason] = useState(targetUser?.radarReason || '');

  const toggleStatus = async () => {
    await fetch(`/api/users/${targetUser._id || targetUser.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !targetUser.isActive, performerEmail: currentUser?.email })
    });
    if (onRefresh) onRefresh();
  };

  const handleToggleRadar = async (enable) => {
    await fetch(`/api/users/${targetUser._id || targetUser.id}/radar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ underRadar: enable, radarReason, performerEmail: currentUser?.email })
    });
    setShowRadarModal(false);
    if (onRefresh) onRefresh();
  };

  const handleDelete = async () => {
    await fetch(`/api/users/${targetUser._id || targetUser.id}`, { method: 'DELETE' });
    setShowDeleteModal(false);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="admin-controls-card">
      <div className="admin-actions-group">
        <button
          type="button"
          onClick={toggleStatus}
          className={`btn-action ${targetUser.isActive !== false ? 'btn-status-active' : 'btn-status-inactive'}`}
        >
          {targetUser.isActive !== false ? 'Active (Click to Disable)' : 'Inactive (Click to Enable)'}
        </button>

        <button
          type="button"
          onClick={() => setShowRadarModal(true)}
          className={`btn-action ${targetUser.underRadar ? 'btn-radar-active' : 'btn-radar-off'}`}
        >
          {targetUser.underRadar ? '📡 Under Radar (Active)' : '📡 Mark Under Radar'}
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="btn-action btn-danger"
        >
          🗑 Delete User
        </button>
      </div>

      {targetUser.underRadar && (
        <div className="radar-banner">
          <strong>Radar Reason:</strong> {targetUser.radarReason || 'No reason specified'}
        </div>
      )}

      <div className="audit-section">
        <h5 className="audit-title">Audit Trail</h5>
        <div className="audit-list-box">
          {targetUser.auditTrail && targetUser.auditTrail.length > 0 ? (
            targetUser.auditTrail.map((log, i) => (
              <div key={i} className="audit-item">
                <strong className="audit-action">{log.action}</strong> by {log.performedBy} on {new Date(log.performedAt).toLocaleString()}
                {log.details && <div className="audit-details">{log.details}</div>}
              </div>
            ))
          ) : (
            <div className="audit-empty">No audit records.</div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4 className="modal-title">Confirm Deletion</h4>
            <p className="modal-text">Are you sure you want to permanently delete user <strong>{targetUser.email}</strong>? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-modal btn-cancel">No, Cancel</button>
              <button type="button" onClick={handleDelete} className="btn-modal btn-danger">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {showRadarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4 className="modal-title">Configure Radar Status</h4>
            <textarea
              placeholder="Specify reason for activity tracking..."
              value={radarReason}
              onChange={(e) => setRadarReason(e.target.value)}
              className="radar-textarea"
            />
            <div className="modal-actions">
              {targetUser.underRadar && (
                <button type="button" onClick={() => handleToggleRadar(false)} className="btn-modal btn-text-danger">Remove Radar</button>
              )}
              <button type="button" onClick={() => setShowRadarModal(false)} className="btn-modal btn-cancel">Cancel</button>
              <button type="button" onClick={() => handleToggleRadar(true)} className="btn-modal btn-primary">Save Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}