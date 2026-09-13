import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Country, State } from 'country-state-city';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const { user, showAuthModal, setShowAuthModal, saveUserData } = useAuth();

  // Controlled form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('');
  const [causeContribution, setCauseContribution] = useState('');
  const [driveFolderPath, setDriveFolderPath] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // Pre-fill form when editing profile
  useEffect(() => {
    if (user && showAuthModal) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfession(user.profession || '');
      setEducation(user.education || "Bachelor's Degree");
      setSelectedCountryCode(user.countryCode || 'CA');
      setSelectedStateCode(user.stateCode || 'ON');
      setSelectedCity(user.city || '');
      setCauseContribution(user.causeContribution || '');
      setDriveFolderPath(user.driveFolderPath || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
    }
  }, [user, showAuthModal]);

  if (!showAuthModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);

    const updatedUserData = {
      ...user,
      id: user?.id || Date.now().toString(),
      name: name || 'Syed Imam',
      email,
      role: user?.role || 'SUPER_USER',
      profession,
      education,
      country: countryObj ? countryObj.name : selectedCountryCode,
      countryCode: selectedCountryCode,
      state: stateObj ? stateObj.name : selectedStateCode,
      stateCode: selectedStateCode,
      city: selectedCity,
      causeContribution,
      driveFolderPath,
      profilePictureUrl: profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0284c7&color=fff`
    };

    saveUserData(updatedUserData);
    setShowAuthModal(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{user ? 'Edit Profile Details' : 'Sign In / Register'}</h3>
          <button className={styles.closeBtn} onClick={() => setShowAuthModal(false)}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label>Profession / Role Title</label>
            <input type="text" value={profession} placeholder="e.g. Senior Solution Architect" onChange={(e) => setProfession(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>Highest Education</label>
            <input type="text" value={education} placeholder="e.g. Master's in Computer Science" onChange={(e) => setEducation(e.target.value)} />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>City</label>
              <input type="text" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>State / Province Code</label>
              <input type="text" value={selectedStateCode} onChange={(e) => setSelectedStateCode(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Drive Shared Folder Link</label>
            <input type="url" value={driveFolderPath} placeholder="https://drive.google.com/..." onChange={(e) => setDriveFolderPath(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>How I Can Help in Cause</label>
            <textarea value={causeContribution} rows={3} onChange={(e) => setCauseContribution(e.target.value)} />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={() => setShowAuthModal(false)}>Cancel</button>
            <button type="submit" className={styles.btnSave}>Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
}