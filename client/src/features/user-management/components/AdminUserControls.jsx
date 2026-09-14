import React, { useState } from 'react';
import { isSuperUserRole } from '../../../types/user';
import styles from './AdminUserControls.module.css';

export function AdminUserControls({ targetUser, currentUser, onUserUpdated, compact = false }) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isSuperUserRole(currentUser?.role)) return null;

  const targetId = targetUser?._id || targetUser?.id;
  const isSelf = Boolean(currentUser && (currentUser._id || currentUser.id) === targetId);

  const handleToggleStatus = async (e) => {
    if (e) e.stopPropagation();
    const newStatus = targetUser.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    if (!window.confirm(`Mark ${targetUser.name || 'this user'} as ${newStatus}?`)) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/users/${targetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (onUserUpdated) onUserUpdated({ ...targetUser, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleRadar = async (e) => {
    if (e) e.stopPropagation();
    const isCurrentlyRadar = targetUser.isUnderRadar;
    let radarComment = targetUser.radarComment || '';

    if (!isCurrentlyRadar) {
      const input = window.prompt('Enter comment/reason for Under Radar status:', radarComment);
      if (input === null) return;
      radarComment = input;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/users/${targetId}/radar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUnderRadar: !isCurrentlyRadar, radarComment }),
      });
      if (res.ok) {
        if (onUserUpdated) onUserUpdated({ ...targetUser, isUnderRadar: !isCurrentlyRadar, radarComment });
      }
    } catch (err) {
      console.error('Failed to toggle radar:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete user ${targetUser.name || targetUser.email}?`)) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/users/${targetId}`, { method: 'DELETE' });
      if (res.ok && onUserUpdated) {
        onUserUpdated(null, { deletedId: targetId });
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          onClick={handleToggleStatus}
          disabled={isUpdating || isSelf}
          className={targetUser.status === 'INACTIVE' ? styles.btnCompactInactive : styles.btnCompactActive}
        >
          {targetUser.status === 'INACTIVE' ? 'Inactive' : 'Active'}
        </button>

        <button
          onClick={handleToggleRadar}
          disabled={isUpdating}
          className={targetUser.isUnderRadar ? styles.btnCompactRadarActive : styles.btnCompactRadar}
          title={targetUser.radarComment ? `Comment: ${targetUser.radarComment}` : 'Toggle Radar'}
        >
          {targetUser.isUnderRadar ? '📡 On' : '📡 Radar'}
        </button>

        {!isSelf && (
          <button
            onClick={handleDeleteUser}
            disabled={isUpdating}
            className={styles.btnCompactDelete}
            title="Delete User"
          >
            🗑️
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={handleToggleStatus}
          disabled={isUpdating || isSelf}
          className={targetUser.status === 'INACTIVE' ? styles.btnFullInactive : styles.btnFullActive}
          style={{ opacity: isSelf ? 0.6 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
        >
          ● {targetUser.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
        </button>

        <button
          onClick={handleToggleRadar}
          disabled={isUpdating}
          className={targetUser.isUnderRadar ? styles.btnFullRadarActive : styles.btnFullRadar}
        >
          📡 {targetUser.isUnderRadar ? 'Radar Active' : 'Radar Off'}
        </button>

        {!isSelf && (
          <button
            onClick={handleDeleteUser}
            disabled={isUpdating}
            className={styles.btnFullDelete}
          >
            🗑️ Delete
          </button>
        )}
      </div>

      {targetUser.isUnderRadar && (
        <div className={styles.radarCommentBox}>
          <strong className={styles.radarCommentTitle}>📡 Under Radar Reason:</strong>
          <p className={styles.radarCommentText}>
            {targetUser.radarComment || 'No comments specified.'}
          </p>
        </div>
      )}
    </div>
  );
}