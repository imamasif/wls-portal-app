import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Country, State } from 'country-state-city';
import { LocationSelector } from './LocationSelector';
import { SocialMediaSection } from './SocialMediaSection';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const { user, showAuthModal, setShowAuthModal, login, saveUserData } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(!user);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('');
  const [drive, setDrive] = useState('');
  const [causeContribution, setCauseContribution] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [socialMedia, setSocialMedia] = useState([{ platform: 'LinkedIn', handleUrl: '' }]);

  // Camera / Photo States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (showAuthModal && user) {
      setIsLoginMode(false);
      setName(user.name || '');
      setEmail(user.email || '');
      setProfession(user.profession || '');
      setEducation(user.education || '');
      setSelectedCountryCode(user.countryCode || 'CA');
      setSelectedStateCode(user.stateCode || 'ON');
      setSelectedCity(user.city || '');
      setDrive(user.drive || user.driveFolderPath || '');
      setCauseContribution(user.causeContribution || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
      setSocialMedia(user.socialMedia?.length ? user.socialMedia : [{ platform: 'LinkedIn', handleUrl: '' }]);
    } else if (showAuthModal && !user) {
      setIsLoginMode(true);
    }
  }, [user, showAuthModal]);

  // Camera helpers
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const captureSnap = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setProfilePictureUrl(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({
        email: loginEmail,
        password: loginPassword,
        role: 'SUPER_ADMIN'
      });
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
      _id: user?._id,
      name: name || email.split('@')[0],
      email,
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
      // If targetId exists, update user via PUT, otherwise create via POST
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
      } else {
        const errRes = await response.json();
        console.error('Failed to submit profile:', errRes);
      }
    } catch (err) {
      console.error('API Error submitting user profile:', err);
    }
  };

  const handleSocialChange = (index, field, value) => {
    const updated = [...socialMedia];
    updated[index][field] = value;
    setSocialMedia(updated);
  };

  const addSocialHandle = () => {
    setSocialMedia([...socialMedia, { platform: 'LinkedIn', handleUrl: '' }]);
  };

  const removeSocialHandle = (index) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };

  if (!showAuthModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{isLoginMode ? 'Sign In' : (user ? 'Edit Profile' : 'Register')}</h3>
          <button className={styles.closeBtn} onClick={() => { stopCamera(); setShowAuthModal(false); }}>✕</button>
        </div>

        {!user && (
          <div className={styles.toggleTabs}>
            <button
              type="button"
              className={isLoginMode ? styles.activeTab : styles.tab}
              onClick={() => setIsLoginMode(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={!isLoginMode ? styles.activeTab : styles.tab}
              onClick={() => setIsLoginMode(false)}
            >
              Register
            </button>
          </div>
        )}
        
        {isLoginMode ? (
          <form onSubmit={handleLoginSubmit} className={styles.formContainer}>
            <div className={styles.lockIconBanner}>
              <div className={styles.lockCircle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Secure Admin Access</span>
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.modalActions}>
              <button type="submit" className={styles.btnSave}>Log In</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className={styles.formContainer}>
            {/* Profile Picture Section */}
            <div className={styles.formGroup}>
              <label>Profile Picture</label>
              <div className={styles.avatarSection}>
                <div className={styles.avatarPreviewContainer}>
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Avatar Preview" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>👤</div>
                  )}
                </div>
                <div className={styles.avatarButtons}>
                  <label className={styles.btnUploadDevice}>
                    📁 Upload File
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setProfilePictureUrl(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {!isCameraOpen ? (
                    <button type="button" className={styles.btnCamera} onClick={startCamera}>
                      📷 Use Camera
                    </button>
                  ) : (
                    <button type="button" className={styles.btnSnap} onClick={captureSnap}>
                      📸 Capture Snap
                    </button>
                  )}
                </div>
              </div>

              {isCameraOpen && (
                <div className={styles.cameraBox}>
                  <video ref={videoRef} autoPlay playsInline className={styles.videoStream} />
                  <button type="button" className={styles.btnCloseCamera} onClick={stopCamera}>
                    Close Camera
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Profession</label>
                <input
                  type="text"
                  placeholder="Profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Highest Education</label>
                <input
                  type="text"
                  placeholder="Highest Education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
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
              <input
                type="text"
                placeholder="Google Drive Folder URL"
                value={drive}
                onChange={(e) => setDrive(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>How I Can Help in Cause</label>
              <textarea
                placeholder="How I Can Help in Cause"
                value={causeContribution}
                onChange={(e) => setCauseContribution(e.target.value)}
              />
            </div>

            <SocialMediaSection
              socialMedia={socialMedia}
              onChange={handleSocialChange}
              onAdd={addSocialHandle}
              onRemove={removeSocialHandle}
            />

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnCancel} onClick={() => { stopCamera(); setShowAuthModal(false); }}>Cancel</button>
              <button type="submit" className={styles.btnSave}>Save Profile</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}