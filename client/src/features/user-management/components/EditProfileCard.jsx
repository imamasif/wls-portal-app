import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { PhoneListInput } from '../../../components/common/PhoneListInput';
import { ProfilePictureUploader } from '../../../components/common/ProfilePictureUploader';
import { LocationSelector } from '../../../components/common/LocationSelector';
import styles from './EditProfileCard.module.css';

export function EditProfileCard({ targetUser, onCancel, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    profilePictureUrl: '',
    name: '',
    email: '',
    profession: '',
    education: '',
    driveFolderPath: '',
    causeContribution: '',
    socialMedia: []
  });

  const [phones, setPhones] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-sync all state fields when targetUser changes or opens
  useEffect(() => {
    if (targetUser) {
      setFormData({
        profilePictureUrl: targetUser.profilePictureUrl || '',
        name: targetUser.name || '',
        email: targetUser.email || '',
        profession: targetUser.profession || '',
        education: targetUser.education || '',
        driveFolderPath: targetUser.driveFolderPath || targetUser.drive || '',
        causeContribution: targetUser.causeContribution || '',
        socialMedia: targetUser.socialMedia?.length
          ? targetUser.socialMedia
          : [{ platform: 'LinkedIn', handleUrl: '' }]
      });

      // Synchronize Phone Array
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);

    const payload = {
      ...formData,
      phones,
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

      if (res.ok && onSaveSuccess) {
        const resData = await res.json();
        onSaveSuccess(resData);
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
        <h3 className={styles.title}>Edit Profile: {formData.name || formData.email}</h3>
        <button type="button" onClick={onCancel} className={styles.closeBtn}>✕</button>
      </div>

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

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" disabled={saving} className={styles.saveBtn}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}