import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './AuthModal.module.css';

export function EditProfileModal({ onSave }) {
  const { showEditModal, setShowEditModal, userToEdit, setUserToEdit, setCurrentUser, currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    profilePictureUrl: '',
    city: '',
    country: '',
    driveFolderPath: '',
    socialMedia: []
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || '',
        profilePictureUrl: userToEdit.profilePictureUrl || '',
        city: userToEdit.city || '',
        country: userToEdit.country || '',
        driveFolderPath: userToEdit.driveFolderPath || '',
        socialMedia: userToEdit.socialMedia || []
      });
    }
  }, [userToEdit]);

  if (!showEditModal || !userToEdit) return null;

  const handleSocialChange = (index, field, value) => {
    const updated = [...formData.socialMedia];
    updated[index][field] = value;
    setFormData({ ...formData, socialMedia: updated });
  };

  const addSocialHandle = () => {
    setFormData({
      ...formData,
      socialMedia: [...formData.socialMedia, { platform: 'YouTube', handleUrl: '' }]
    });
  };

  const removeSocialHandle = (index) => {
    const updated = formData.socialMedia.filter((_, i) => i !== index);
    setFormData({ ...formData, socialMedia: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedUser = { ...userToEdit, ...formData };
    
    if (userToEdit.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }
    if (onSave) onSave(updatedUser);
    setShowEditModal(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit User Profile</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className={styles.label}>Full Name *</label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={styles.label}>Profile Picture URL</label>
            <input
              type="url"
              className="form-input"
              style={{ width: '100%' }}
              placeholder="https://example.com/photo.jpg"
              value={formData.profilePictureUrl}
              onChange={(e) => setFormData({ ...formData, profilePictureUrl: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className={styles.label}>City</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className={styles.label}>Country</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>Shared Google Drive Folder Path (Full Access)</label>
            <input
              type="url"
              className="form-input"
              style={{ width: '100%' }}
              placeholder="https://drive.google.com/drive/folders/..."
              value={formData.driveFolderPath}
              onChange={(e) => setFormData({ ...formData, driveFolderPath: e.target.value })}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className={styles.label} style={{ margin: 0 }}>Social Media Accounts (Multiple Supported)</label>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={addSocialHandle}
              >
                + Add Handle
              </button>
            </div>

            {formData.socialMedia.map((sm, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  className="form-select"
                  value={sm.platform}
                  onChange={(e) => handleSocialChange(idx, 'platform', e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Twitter X">Twitter X</option>
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Profile URL or @handle"
                  value={sm.handleUrl}
                  onChange={(e) => handleSocialChange(idx, 'handleUrl', e.target.value)}
                />
                <button
                  type="button"
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer' }}
                  onClick={() => removeSocialHandle(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn-secondary" style={{ background: '#0284c7', color: '#fff', border: 'none' }}>
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}