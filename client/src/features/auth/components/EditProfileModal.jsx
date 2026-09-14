// EditProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { SocialMediaSection } from './SocialMediaSection';
import styles from './AuthModal.module.css';

export function EditProfileModal({ onSave }) {
  const { showEditModal, setShowEditModal, userToEdit, user: currentUser, saveUserData } = useAuth();
  
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
    
    // Pass updated user through saveUserData to sync AuthContext and localStorage
    if (userToEdit.email === currentUser?.email || userToEdit._id === currentUser?._id) {
      saveUserData(updatedUser);
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

          <SocialMediaSection
            socialMedia={formData.socialMedia}
            onChange={handleSocialChange}
            onAdd={addSocialHandle}
            onRemove={removeSocialHandle}
          />

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