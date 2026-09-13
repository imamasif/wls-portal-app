import React from 'react';
import styles from './AuthModal.module.css';

export function SocialMediaSection({ socialMedia, onChange, onAdd, onRemove }) {
  return (
    <div className={styles.formGroup}>
      <div className={styles.socialHeaderRow}>
        <label style={{ margin: 0 }}>Social Media Accounts</label>
        <button
          type="button"
          className={styles.btnGreenAddSocial}
          onClick={onAdd}
        >
          + Add Handle
        </button>
      </div>

      {socialMedia.map((sm, idx) => (
        <div key={idx} className={styles.socialRow} style={{ marginTop: '6px' }}>
          <select
            value={sm.platform}
            onChange={(e) => onChange(idx, 'platform', e.target.value)}
          >
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
            <option value="Facebook">Facebook</option>
            <option value="Twitter X">Twitter X</option>
            <option value="Instagram">Instagram</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Profile URL or @handle"
            value={sm.handleUrl}
            onChange={(e) => onChange(idx, 'handleUrl', e.target.value)}
          />
          <button
            type="button"
            className={styles.btnRemoveSocial}
            onClick={() => onRemove(idx)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}