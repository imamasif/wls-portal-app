import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { PhoneListInput } from '../../../components/common/PhoneListInput';
import { ProfilePictureUploader } from '../../../components/common/ProfilePictureUploader';
import { LocationSelector } from '../../../components/common/LocationSelector';
import styles from './EditProfileCard.module.css';

const PLATFORM_OPTIONS = ['LinkedIn', 'Facebook', 'Twitter', 'YouTube', 'Instagram', 'Other'];

export function EditProfileCard({ targetUser, onCancel, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    profilePictureUrl: '',
    name: '',
    email: '',
    profession: '',
    education: '',
    driveFolderPath: '',
    causeContribution: ''
  });

  const [socialMedia, setSocialMedia] = useState([]);
  const [phones, setPhones] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (targetUser) {
      setFormData({
        profilePictureUrl: targetUser.profilePictureUrl || '',
        name: targetUser.name || '',
        email: targetUser.email || '',
        profession: targetUser.profession || '',
        education: targetUser.education || '',
        driveFolderPath: targetUser.driveFolderPath || targetUser.drive || '',
        causeContribution: targetUser.causeContribution || ''
      });

      // Initialize Social Media array from user data or empty list
      if (Array.isArray(targetUser.socialMedia) && targetUser.socialMedia.length > 0) {
        setSocialMedia(targetUser.socialMedia.map((s) => ({ ...s })));
      } else {
        setSocialMedia([{ platform: 'LinkedIn', handleUrl: '' }]);
      }

      // Synchronize Phones Array
      if (Array.isArray(targetUser.phones) && targetUser.phones.length > 0) {
        setPhones(targetUser.phones.map((p) => ({ ...p })));
      } else if (targetUser.phone) {
        setPhones([{ number: targetUser.phone, type: 'Mobile', isPrimary: true }]);
      } else {
        setPhones([{ number: '', type: 'Mobile', isPrimary: true }]);
      }

      // Synchronize Location
      setSelectedCountryCode(targetUser.countryCode || 'CA');
      setSelectedStateCode(targetUser.stateCode || 'ON');
      setSelectedCity(targetUser.city || '');
    }
  }, [targetUser]);

  // Social Media handlers
  const handleAddSocial = () => {
    setSocialMedia([...socialMedia, { platform: 'LinkedIn', handleUrl: '' }]);
  };

  const handleRemoveSocial = (index) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };

  const handleSocialChange = (index, field, value) => {
    const updated = [...socialMedia];
    updated[index][field] = value;
    setSocialMedia(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);

    // Filter out blank inputs before saving
    const validSocialMedia = socialMedia.filter((item) => item.handleUrl.trim() !== '');

    const payload = {
      ...formData,
      phones,
      socialMedia: validSocialMedia,
      country: countryObj ? countryObj.name : selectedCountryCode,
      countryCode: selectedCountryCode,
      state: stateObj ? stateObj.name : selectedStateCode,
      stateCode: selectedStateCode,
      city: selectedCity
    };

    try {
      const targetId = targetUser._id || targetUser.id;
      const res = await fetch(`/api/users/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        setStatusMessage({ type: 'success', text: 'Changes saved successfully!' });
        
        // Wait 1.5 seconds so user sees the success banner before switching views
        setTimeout(() => {
          if (onSaveSuccess) onSaveSuccess(resData);
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update user profile.' });
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
      setStatusMessage({ type: 'error', text: 'Server error while saving changes.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Edit Profile: {formData.name || formData.email}</h3>
        <button type="button" onClick={onCancel} className={styles.closeBtn}>✕</button>
      </div>

      {/* Prominent Success / Error Banner */}
      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 700,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
        }}>
          {statusMessage.type === 'success' ? '✅ ' : '❌ '}{statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Profile Picture</label>
          <ProfilePictureUploader
            value={formData.profilePictureUrl}
            name={formData.name || formData.email}
            onChange={(newUrl) => setFormData({ ...formData, profilePictureUrl: newUrl })}
          />
        </div>

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

        <div className={styles.fieldGroup}>
          <PhoneListInput phones={phones} onChange={setPhones} />
        </div>

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

        <LocationSelector
          selectedCountryCode={selectedCountryCode}
          setSelectedCountryCode={setSelectedCountryCode}
          selectedStateCode={selectedStateCode}
          setSelectedStateCode={setSelectedStateCode}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
        />

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Google Drive Folder URL</label>
          <input type="text" className={styles.input} value={formData.driveFolderPath} onChange={(e) => setFormData({ ...formData, driveFolderPath: e.target.value })} />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>How I Can Help in Cause</label>
          <textarea className={styles.input} rows={3} value={formData.causeContribution} onChange={(e) => setFormData({ ...formData, causeContribution: e.target.value })} />
        </div>

        {/* Dynamic Social Media List matching Phone Input component style */}
        <div className={styles.fieldGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className={styles.label} style={{ margin: 0 }}>Social Media Handles</label>
            <button
              type="button"
              onClick={handleAddSocial}
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              + Add Social
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {socialMedia.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  className={styles.input}
                  value={item.platform}
                  onChange={(e) => handleSocialChange(idx, 'platform', e.target.value)}
                  style={{ width: '130px', flexShrink: 0 }}
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <input
                  type="text"
                  className={styles.input}
                  placeholder={`https://${item.platform.toLowerCase()}.com/username`}
                  value={item.handleUrl}
                  onChange={(e) => handleSocialChange(idx, 'handleUrl', e.target.value)}
                  style={{ flex: 1 }}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveSocial(idx)}
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}