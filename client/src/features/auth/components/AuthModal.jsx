import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Country, State, City } from 'country-state-city';
import { 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Lock, 
  X, 
  User, 
  CheckCircle2
} from 'lucide-react';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const { user, showAuthModal, setShowAuthModal, saveUserData, login } = useAuth();

  const [activeTab, setActiveTab] = useState('login');

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // Location States
  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('');

  // Drive & Cause
  const [drive, setDrive] = useState('');
  const [causeContribution, setCauseContribution] = useState('');
  const [socialMedia, setSocialMedia] = useState([{ platform: 'LinkedIn', handleUrl: '' }]);

  // Camera & Image Upload States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const videoRef = useRef(null);

  // Declare stopCamera FIRST to avoid Temporal Dead Zone errors
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Helper function to clear all registration & profile fields completely
  const resetFormFields = useCallback(() => {
    setLoginEmail('');
    setLoginPassword('');
    setName('');
    setEmail('');
    setPassword('');
    setProfession('');
    setEducation('');
    setProfilePictureUrl('');
    setSelectedCountryCode('CA');
    setSelectedStateCode('ON');
    setSelectedCity('');
    setDrive('');
    setCauseContribution('');
    setSocialMedia([{ platform: 'LinkedIn', handleUrl: '' }]);
    stopCamera();
  }, [stopCamera]);

  // Run on Modal open/close or user state change
  useEffect(() => {
    if (showAuthModal) {
      if (user) {
        // Populate fields if Editing Profile
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
        setSocialMedia(
          user.socialMedia && user.socialMedia.length > 0
            ? user.socialMedia
            : [{ platform: 'LinkedIn', handleUrl: '' }]
        );
      } else {
        // Reset everything cleanly for new Sign In / Registration
        resetFormFields();
      }
    } else {
      // Clear states when modal closes
      resetFormFields();
    }
  }, [user, showAuthModal, resetFormFields]);

  // Turn off camera stream when modal closes
  useEffect(() => {
    if (!showAuthModal && isCameraActive) {
      stopCamera();
    }
  }, [showAuthModal, isCameraActive, stopCamera]);

  if (!showAuthModal) return null;

  // --- GOOGLE DRIVE UPLOAD LOGIC ---
  const uploadToGoogleDrive = async (fileBlob, fileName) => {
    setUploadingImage(true);
    try {
      const folderId = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID;
      const metadata = {
        name: fileName,
        mimeType: fileBlob.type || 'image/jpeg',
        parents: folderId ? [folderId] : []
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', fileBlob);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_GOOGLE_API_KEY}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        const driveUrl = `https://lh3.googleusercontent.com/d/${data.id}=s400`;
        setProfilePictureUrl(driveUrl);
      } else {
        const localPreview = URL.createObjectURL(fileBlob);
        setProfilePictureUrl(localPreview);
      }
    } catch (err) {
      console.warn('Google Drive API skipped, using local preview fallback.');
      const localPreview = URL.createObjectURL(fileBlob);
      setProfilePictureUrl(localPreview);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- FILE SELECTION HANDLER ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadToGoogleDrive(file, `avatar_${Date.now()}_${file.name}`);
    }
  };

  // --- CAMERA CAPTURE HANDLERS ---
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access device camera.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        uploadToGoogleDrive(blob, `snapshot_${Date.now()}.jpg`);
        stopCamera();
      }, 'image/jpeg');
    }
  };

  // --- SOCIAL MEDIA HANDLERS ---
  const handleSocialChange = (index, field, value) => {
    const updated = [...socialMedia];
    updated[index][field] = value;
    setSocialMedia(updated);
  };

  const addSocialField = () => {
    setSocialMedia([...socialMedia, { platform: 'Twitter/X', handleUrl: '' }]);
  };

  const removeSocialField = (index) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login({
      id: user?.id || user?._id || Date.now().toString(),
      email: loginEmail,
      name: loginEmail.split('@')[0],
      role: 'SUPER_ADMIN'
    });
    resetFormFields();
    setShowAuthModal(false);
  };

  const handleRegisterSubmit = async (e) => {
  e.preventDefault();

  const countryObj = Country.getCountryByCode(selectedCountryCode);
  const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);

  // Use valid MongoDB _id string directly from authenticated user context
  const targetId = user?._id || user?.id;

  if (!targetId) {
    console.error('No valid User Mongo ID found.');
    return;
  }

  const payload = {
    id: targetId,
    name: name || email.split('@')[0],
    email,
    role: user?.role || 'SUPER_ADMIN', // Retain user role (e.g. SUPER_ADMIN)
    profession,
    education,
    country: countryObj ? countryObj.name : selectedCountryCode,
    countryCode: selectedCountryCode,
    state: stateObj ? stateObj.name : selectedStateCode,
    stateCode: selectedStateCode,
    city: selectedCity,
    driveFolderPath: drive,
    causeContribution,
    profilePictureUrl,
    socialMedia: socialMedia.filter((s) => s.handleUrl && s.handleUrl.trim() !== '')
  };

  try {
    const response = await fetch(`/api/users/${targetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const updatedUserRecord = await response.json();
      
      // Update Context with updated database object
      saveUserData(updatedUserRecord);
      resetFormFields();
      setShowAuthModal(false);
    } else {
      const errRes = await response.json();
      console.error('Failed to update user profile:', errRes);
    }
  } catch (err) {
    console.error('API Error updating user profile:', err);
  }
};

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(selectedCountryCode);
  const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>{user ? 'Edit Profile Details' : activeTab === 'login' ? 'Sign In' : 'Register'}</h3>
          <button className={styles.closeBtn} onClick={() => setShowAuthModal(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        {!user && (
          <div className={styles.toggleTabs}>
            <button
              type="button"
              className={activeTab === 'login' ? styles.activeTab : styles.tab}
              onClick={() => {
                resetFormFields();
                setActiveTab('login');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={activeTab === 'register' ? styles.activeTab : styles.tab}
              onClick={() => {
                resetFormFields();
                setActiveTab('register');
              }}
            >
              Register
            </button>
          </div>
        )}

        {/* --- SIGN IN VIEW --- */}
        {!user && activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className={styles.formContainer}>
            <div className={styles.lockIconBanner}>
              <div className={styles.lockCircle}>
                <Lock size={22} />
              </div>
              <p>Enter your credentials to access your account.</p>
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnCancel} onClick={() => setShowAuthModal(false)}>
                Cancel
              </button>
              <button type="submit" className={styles.btnSave}>
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* --- REGISTER / EDIT VIEW --- */}
        {(user || activeTab === 'register') && (
          <form onSubmit={handleRegisterSubmit} className={styles.formContainer}>
            
            {/* PROFILE PICTURE DEVICE / CAMERA CONTROLS */}
            <div className={styles.avatarSection}>
              <div className={styles.avatarPreviewContainer}>
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile Avatar" className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User size={36} color="#94a3b8" />
                  </div>
                )}
                {uploadingImage && <div className={styles.uploadingOverlay}>Uploading...</div>}
              </div>

              <div className={styles.avatarButtons}>
                <label className={styles.btnUploadDevice}>
                  <Upload size={16} /> Device Upload
                  <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                </label>

                {!isCameraActive ? (
                  <button type="button" className={styles.btnCamera} onClick={startCamera}>
                    <Camera size={16} /> Take Photo
                  </button>
                ) : (
                  <button type="button" className={styles.btnSnap} onClick={capturePhoto}>
                    <CheckCircle2 size={16} /> Snap Photo
                  </button>
                )}
              </div>
            </div>

            {/* LIVE CAMERA FEED MODAL */}
            {isCameraActive && (
              <div className={styles.cameraBox}>
                <video ref={videoRef} autoPlay playsInline className={styles.videoStream} />
                <button type="button" className={styles.btnCloseCamera} onClick={stopCamera}>
                  Cancel Camera
                </button>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!user && (
              <div className={styles.formGroup}>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Profession / Role Title</label>
                <input
                  type="text"
                  value={profession}
                  placeholder="e.g. Solution Architect"
                  onChange={(e) => setProfession(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Highest Education</label>
                <input
                  type="text"
                  value={education}
                  placeholder="e.g. Master's Degree"
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>
            </div>

            {/* LOCATION CONTROLS */}
            <div className={styles.formRow3}>
              <div className={styles.formGroup}>
                <label>Country</label>
                <select
                  value={selectedCountryCode}
                  onChange={(e) => {
                    setSelectedCountryCode(e.target.value);
                    setSelectedStateCode('');
                    setSelectedCity('');
                  }}
                >
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>State / Province</label>
                <select
                  value={selectedStateCode}
                  onChange={(e) => {
                    setSelectedStateCode(e.target.value);
                    setSelectedCity('');
                  }}
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>City</label>
                {cities.length > 0 ? (
                  <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                    <option value="">Select City</option>
                    {cities.map((ct) => (
                      <option key={ct.name} value={ct.name}>{ct.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter City"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Drive Shared Folder Link</label>
              <input
                type="url"
                value={drive}
                placeholder="https://drive.google.com/drive/folders/..."
                onChange={(e) => setDrive(e.target.value)}
              />
            </div>

            {/* SOCIAL MEDIA SECTION */}
            <div className={styles.formGroup}>
              <div className={styles.socialHeaderRow}>
                <label>Social Media Handles</label>
                <button type="button" className={styles.btnGreenAddSocial} onClick={addSocialField}>
                  <Plus size={14} /> Add Social Link
                </button>
              </div>

              {socialMedia.map((item, index) => (
                <div key={index} className={styles.socialRow}>
                  <select
                    value={item.platform}
                    onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Twitter/X">Twitter/X</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Handle or Profile URL"
                    value={item.handleUrl}
                    onChange={(e) => handleSocialChange(index, 'handleUrl', e.target.value)}
                  />

                  {socialMedia.length > 1 && (
                    <button type="button" className={styles.btnRemoveSocial} onClick={() => removeSocialField(index)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.formGroup}>
              <label>How I Can Help in Cause</label>
              <textarea
                value={causeContribution}
                rows={3}
                placeholder="Share how you can contribute..."
                onChange={(e) => setCauseContribution(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnCancel} onClick={() => setShowAuthModal(false)}>
                Cancel
              </button>
              <button type="submit" className={styles.btnSave}>
                {user ? 'Save Changes' : 'Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}