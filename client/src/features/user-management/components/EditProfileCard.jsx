import React, { useState, useRef } from 'react';
import styles from './EditProfileCard.module.css';

export function EditProfileCard({ targetUser, onCancel, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    profilePictureUrl: targetUser?.profilePictureUrl || '',
    name: targetUser?.name || '',
    email: targetUser?.email || '',
    profession: targetUser?.profession || '',
    education: targetUser?.education || '',
    country: targetUser?.country || 'Canada',
    state: targetUser?.state || '',
    city: targetUser?.city || '',
    driveFolderPath: targetUser?.driveFolderPath || targetUser?.drive || '',
    causeContribution: targetUser?.causeContribution || '',
    socialMedia: targetUser?.socialMedia || [
      { platform: 'LinkedIn', handleUrl: '' },
      { platform: 'YouTube', handleUrl: '' }
    ]
  });

  const [saving, setSaving] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePictureUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Handlers
  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access webcam. Please check browser permissions.');
      setShowCameraModal(false);
    }
  };

  const captureCameraPhoto = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setFormData((prev) => ({ ...prev, profilePictureUrl: dataUrl }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setShowCameraModal(false);
  };

  // Social Array Handlers
  const handleAddSocial = () => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { platform: 'LinkedIn', handleUrl: '' }]
    }));
  };

  const handleRemoveSocial = (index) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const handleSocialChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.socialMedia];
      updated[index][field] = value;
      return { ...prev, socialMedia: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${targetUser._id || targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok && onSaveSuccess) {
        onSaveSuccess(formData);
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Edit Profile: {targetUser.name || targetUser.email}
        </h3>
        <button type="button" onClick={onCancel} className={styles.closeBtn}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Profile Picture */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Profile Picture</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            {formData.profilePictureUrl ? (
              <img src={formData.profilePictureUrl} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' }}>
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#334155' }}>
                📁 Upload File
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={startCamera} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                📷 Use Camera
              </button>
            </div>
          </div>
        </div>

        {/* Live Camera Modal */}
        {showCameraModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '300px', height: '225px', borderRadius: '8px', background: '#000' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={captureCameraPhoto} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Take Photo</button>
                <button type="button" onClick={stopCamera} style={{ background: '#cbd5e1', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Name & Email */}
        <div className={styles.rowTwo}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full Name</label>
            <input type="text" className={styles.input} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email *</label>
            <input type="email" className={styles.input} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
        </div>

        {/* Profession & Education */}
        <div className={styles.rowTwo}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Profession</label>
            <input type="text" className={styles.input} value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Highest Education</label>
            <input type="text" className={styles.input} value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} />
          </div>
        </div>

        {/* Location Row */}
        <div className={styles.rowThree}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Country</label>
            <select className={styles.input} value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}>
              <option value="Canada">Canada</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Pakistan">Pakistan</option>
              <option value="India">India</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>State / Province</label>
            <input type="text" className={styles.input} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>City</label>
            <input type="text" className={styles.input} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          </div>
        </div>

        {/* Drive URL */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Google Drive Folder URL</label>
          <input type="text" className={styles.input} value={formData.driveFolderPath} onChange={(e) => setFormData({ ...formData, driveFolderPath: e.target.value })} />
        </div>

        {/* Cause Contribution */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>How I Can Help in Cause</label>
          <textarea className={styles.input} rows={3} value={formData.causeContribution} onChange={(e) => setFormData({ ...formData, causeContribution: e.target.value })} />
        </div>

        {/* Social Media Accounts */}
        <div className={styles.fieldGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className={styles.label} style={{ margin: 0 }}>Social Media Accounts</label>
            <button type="button" onClick={handleAddSocial} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>+ Add Handle</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {formData.socialMedia.map((sm, index) => (
              <div key={index} className={styles.socialRow}>
                <select value={sm.platform} onChange={(e) => handleSocialChange(index, 'platform', e.target.value)} className={`${styles.input} ${styles.socialSelect}`}>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Twitter">Twitter / X</option>
                  <option value="GitHub">GitHub</option>
                </select>
                <input type="text" placeholder="https://..." value={sm.handleUrl} onChange={(e) => handleSocialChange(index, 'handleUrl', e.target.value)} className={`${styles.input} ${styles.socialInput}`} />
                <button type="button" onClick={() => handleRemoveSocial(index)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" disabled={saving} className={styles.saveBtn}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}