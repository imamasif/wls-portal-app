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
  
  // Registration State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const resetRegistrationForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
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
      await login({ email: loginEmail, password: loginPassword, role: 'SUPER_USER' });
      setLoginEmail('');
      setLoginPassword('');
      setShowAuthModal(false);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const validatePassword = () => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Run password rules if this is a new registration
    if (!user) {
      const err = validatePassword();
      if (err) {
        setPasswordError(err);
        return;
      }
    }

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
    const targetId = user?._id || user?.id;

    const payload = {
      ...(user?._id && { _id: user._id }),
      name: name || email.split('@')[0],
      email,
      ...(password && { password }), // Include password in payload for registration
      phones,
      role: user?.role || 'SUPER_USER',
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

        {/* Beautiful Icon Banner in Middle */}
        {!user && (
          <div className={styles.iconContainer}>
            {isLoginMode ? (
              <div className={`${styles.authIconCircle} ${styles.loginIconBg}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.authSvgIcon}
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
            ) : (
              <div className={`${styles.authIconCircle} ${styles.registerIconBg}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.authSvgIcon}
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
            )}
          </div>
        )}

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
            {passwordError && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', fontSize: '13px', border: '1px solid #fecaca' }}>
                ⚠️ {passwordError}
              </div>
            )}

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

            {/* Added Password Fields for Registration */}
            {!user && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>
            )}

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
              <button type="submit" className={styles.btnSave}>
                {user ? 'Save Profile' : 'Register Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}