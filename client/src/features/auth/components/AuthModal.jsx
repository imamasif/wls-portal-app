import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Country, State } from 'country-state-city';
import { LocationSelector } from '../../../components/common/LocationSelector';
import { PhoneListInput } from '../../../components/common/PhoneListInput';
import { SocialMediaSection } from '../../../components/common/SocialMediaSection';
import { ProfilePictureUploader } from '../../../components/common/ProfilePictureUploader';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const { user, showAuthModal, setShowAuthModal, login, saveUserData } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(!user);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phones, setPhones] = useState([{ number: '', type: 'Mobile', isPrimary: true }]);
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('');
  const [drive, setDrive] = useState('');
  const [causeContribution, setCauseContribution] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [socialMedia, setSocialMedia] = useState([{ platform: 'LinkedIn', handleUrl: '' }]);

  // Reset form fields to completely blank state for registration
  const resetRegistrationForm = () => {
    setName('');
    setEmail('');
    setPhones([{ number: '', type: 'Mobile', isPrimary: true }]);
    setProfession('');
    setEducation('');
    setSelectedCountryCode('CA');
    setSelectedStateCode('ON');
    setSelectedCity('');
    setDrive('');
    setCauseContribution('');
    setProfilePictureUrl('');
    setSocialMedia([{ platform: 'LinkedIn', handleUrl: '' }]);
  };

  // Populate form with existing user state if editing profile
  const populateUserForm = (userData) => {
    setName(userData.name || '');
    setEmail(userData.email || '');
    setPhones(
      userData.phones && userData.phones.length > 0
        ? userData.phones.map((p) => ({ ...p }))
        : userData.phone
        ? [{ number: userData.phone, type: 'Mobile', isPrimary: true }]
        : [{ number: '', type: 'Mobile', isPrimary: true }]
    );
    setProfession(userData.profession || '');
    setEducation(userData.education || '');
    setSelectedCountryCode(userData.countryCode || 'CA');
    setSelectedStateCode(userData.stateCode || 'ON');
    setSelectedCity(userData.city || '');
    setDrive(userData.driveFolderPath || userData.drive || '');
    setCauseContribution(userData.causeContribution || '');
    setProfilePictureUrl(userData.profilePictureUrl || '');
    setSocialMedia(userData.socialMedia?.length ? userData.socialMedia : [{ platform: 'LinkedIn', handleUrl: '' }]);
  };

  useEffect(() => {
    if (showAuthModal) {
      if (user && !isLoginMode) {
        populateUserForm(user);
      } else if (!user && !isLoginMode) {
        resetRegistrationForm();
      } else {
        setIsLoginMode(true);
      }
    }
  }, [user, showAuthModal, isLoginMode]);

  const handleTabSwitch = (toLogin) => {
    setIsLoginMode(toLogin);
    if (!toLogin && !user) {
      resetRegistrationForm();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email: loginEmail, password: loginPassword, role: 'SUPER_ADMIN' });
      setLoginEmail('');
      setLoginPassword('');
      setShowAuthModal(false);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
    const targetId = user?._id || user?.id;

    const payload = {
      ...(user?._id && { _id: user._id }),
      name: name || email.split('@')[0],
      email,
      phones,
      role: user?.role || 'SUPER_ADMIN',
      profession,
      education,
      country: countryObj ? countryObj.name : selectedCountryCode,
      countryCode: selectedCountryCode,
      state: stateObj ? stateObj.name : selectedStateCode,
      stateCode: selectedStateCode,
      city: selectedCity,
      driveFolderPath: drive,
      drive,
      causeContribution,
      profilePictureUrl,
      socialMedia: socialMedia.filter((s) => s.handleUrl && s.handleUrl.trim() !== '')
    };

    try {
      const url = targetId ? `/api/users/${targetId}` : `/api/users`;
      const method = targetId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedUserRecord = await response.json();
        saveUserData(updatedUserRecord);
        setShowAuthModal(false);
      }
    } catch (err) {
      console.error('API Error submitting user profile:', err);
    }
  };

  if (!showAuthModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{isLoginMode ? 'Sign In' : (user ? 'Edit Profile' : 'Register')}</h3>
          <button className={styles.closeBtn} onClick={() => setShowAuthModal(false)}>✕</button>
        </div>

        {!user && (
          <div className={styles.toggleTabs}>
            <button
              type="button"
              className={isLoginMode ? styles.activeTab : styles.tab}
              onClick={() => handleTabSwitch(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={!isLoginMode ? styles.activeTab : styles.tab}
              onClick={() => handleTabSwitch(false)}
            >
              Register
            </button>
          </div>
        )}
        
        {isLoginMode ? (
          <form onSubmit={handleLoginSubmit} className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            </div>
            <div className={styles.modalActions}>
              <button type="submit" className={styles.btnSave}>Log In</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label>Profile Picture</label>
              <ProfilePictureUploader value={profilePictureUrl} name={name || email} onChange={setProfilePictureUrl} />
            </div>

            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <PhoneListInput phones={phones} onChange={setPhones} />

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Profession</label>
                <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Highest Education</label>
                <input type="text" value={education} onChange={(e) => setEducation(e.target.value)} />
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

            <div className={styles.formGroup}>
              <label>Google Drive Folder URL</label>
              <input type="text" value={drive} onChange={(e) => setDrive(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label>How I Can Help in Cause</label>
              <textarea value={causeContribution} onChange={(e) => setCauseContribution(e.target.value)} />
            </div>

            <SocialMediaSection
              socialMedia={socialMedia}
              onChange={(i, f, v) => {
                const updated = [...socialMedia];
                updated[i][f] = v;
                setSocialMedia(updated);
              }}
              onAdd={() => setSocialMedia([...socialMedia, { platform: 'LinkedIn', handleUrl: '' }])}
              onRemove={(i) => setSocialMedia(socialMedia.filter((_, idx) => idx !== i))}
            />

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnCancel} onClick={() => setShowAuthModal(false)}>Cancel</button>
              <button type="submit" className={styles.btnSave}>Save Profile</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}