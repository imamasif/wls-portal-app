import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  TextInput, 
  PasswordInput, 
  Textarea, 
  Alert, 
  SegmentedControl, 
  Stack, 
  Group, 
  Text, 
  ThemeIcon,
  Box,
  Divider,
  Paper
} from '@mantine/core';
import { 
  IconAlertCircle, 
  IconLogin, 
  IconUserPlus, 
  IconLock, 
  IconMail,
  IconUser,
  IconWorld,
  IconBriefcase,
  IconSchool, // <-- Changed from IconAcademic
  IconFolder,
  IconHeartHandshake
} from '@tabler/icons-react';
import { Country, State } from 'country-state-city';
import { useAuth } from '../../../context/AuthContext';
import { LocationSelector } from '../../../components/common/LocationSelector';
import { PhoneListInput } from '../../../components/common/PhoneListInput';
import { SocialMediaSection } from '../../../components/common/SocialMediaSection';
import { ProfilePictureUploader } from '../../../components/common/ProfilePictureUploader';

export function AuthModal() {
  const { user, showAuthModal, setShowAuthModal, login, saveUserData } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(!user);

  // Authentication & Feedback States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setAuthError('');
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
      setAuthError('');
      if (user && !isLoginMode) {
        populateUserForm(user);
      } else if (!user && !isLoginMode) {
        resetRegistrationForm();
      } else {
        setIsLoginMode(true);
      }
    }
  }, [user, showAuthModal, isLoginMode]);

  const handleTabSwitch = (value) => {
    const toLogin = value === 'login';
    setIsLoginMode(toLogin);
    setAuthError('');
    if (!toLogin && !user) {
      resetRegistrationForm();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      await login({ email: loginEmail, password: loginPassword, role: 'SUPER_USER' });
      setLoginEmail('');
      setLoginPassword('');
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
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
    setAuthError('');

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
      ...(password && { password }),
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
      setLoading(true);
      const url = targetId ? `/api/users/${targetId}` : `/api/users`;
      const method = targetId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (response.ok) {
        saveUserData(resData);
        setShowAuthModal(false);
      } else {
        setAuthError(resData.error || 'Failed to submit registration request.');
      }
    } catch (err) {
      setAuthError('Server error occurred during processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={showAuthModal}
      onClose={() => {
        setAuthError('');
        setShowAuthModal(false);
      }}
      title={
        <Text fw={700} size="lg">
          {isLoginMode ? 'Sign In' : user ? 'Edit Profile' : 'Register Account'}
        </Text>
      }
      centered
      radius="md"
      size={isLoginMode ? 'sm' : 'lg'}
      padding="xl"
    >
      <Stack spacing="md">
        {/* Top Visual Branding Header */}
        {!user && (
          <Group justify="center" align="center" my="xs">
            <ThemeIcon
              size={54}
              radius="xl"
              variant="light"
              color={isLoginMode ? 'indigo' : 'teal'}
            >
              {isLoginMode ? <IconLogin size={28} /> : <IconUserPlus size={28} />}
            </ThemeIcon>
          </Group>
        )}

        {/* Mantine Mode Navigation Tabs */}
        {!user && (
          <SegmentedControl
            fullWidth
            value={isLoginMode ? 'login' : 'register'}
            onChange={handleTabSwitch}
            data={[
              { label: 'Sign In', value: 'login' },
              { label: 'Register', value: 'register' }
            ]}
            color="indigo"
            mb="xs"
            radius="md"
          />
        )}

        {/* Global Failure Alert Banner */}
        {authError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Authentication Error"
            color="red"
            variant="filled"
            withCloseButton
            onClose={() => setAuthError('')}
            radius="md"
          >
            {authError}
          </Alert>
        )}

        {/* ==================== LOGIN FORM ==================== */}
        {isLoginMode ? (
          <Box component="form" onSubmit={handleLoginSubmit}>
            <Stack spacing="md">
              <TextInput
                label="Email Address"
                placeholder="name@company.com"
                icon={<IconMail size={16} />}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                radius="md"
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                icon={<IconLock size={16} />}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                radius="md"
              />

              <Button 
                type="submit" 
                fullWidth 
                loading={loading} 
                mt="sm" 
                radius="md"
                color="indigo"
                size="md"
              >
                Sign In
              </Button>
            </Stack>
          </Box>
        ) : (
          /* ==================== REGISTER / EDIT FORM ==================== */
          <Box component="form" onSubmit={handleRegisterSubmit}>
            <Stack spacing="md">
              {passwordError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Password Requirement Failed"
                  color="red"
                  variant="outline"
                  radius="md"
                >
                  {passwordError}
                </Alert>
              )}

              <Paper withBorder p="md" radius="md" bg="gray.0">
  <Stack align="center" spacing="xs">
    <Text size="sm" fw={600}>
      Profile Photo
    </Text>
    <ProfilePictureUploader
      value={profilePictureUrl}
      name={name || email}
      onChange={setProfilePictureUrl}
    />
  </Stack>
</Paper>

              <Group grow align="flex-start">
                <TextInput
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<IconUser size={16} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  radius="md"
                />

                <TextInput
                  label="Email Address"
                  placeholder="name@company.com"
                  icon={<IconMail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  radius="md"
                />
              </Group>

              {!user && (
                <Group grow align="flex-start">
                  <PasswordInput
                    label="Password"
                    placeholder="Min 8 chars, 1 upper, 1 num"
                    icon={<IconLock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    radius="md"
                  />
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    icon={<IconLock size={16} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    radius="md"
                  />
                </Group>
              )}

              <PhoneListInput phones={phones} onChange={setPhones} />

              <Group grow align="flex-start">
                <TextInput
                  label="Profession"
                  placeholder="Software Engineer"
                  icon={<IconBriefcase size={16} />}
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  radius="md"
                />
                <TextInput
                  label="Highest Education"
                  placeholder="B.Sc. Computer Science"
  icon={<IconSchool size={16} />} // <-- Updated here
  value={education}
  onChange={(e) => setEducation(e.target.value)}
  radius="md"
                />
              </Group>

              <LocationSelector
                selectedCountryCode={selectedCountryCode}
                setSelectedCountryCode={setSelectedCountryCode}
                selectedStateCode={selectedStateCode}
                setSelectedStateCode={setSelectedStateCode}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
              />

              <TextInput
                label="Google Drive Folder URL"
                placeholder="https://drive.google.com/drive/folders/..."
                icon={<IconFolder size={16} />}
                value={drive}
                onChange={(e) => setDrive(e.target.value)}
                radius="md"
              />

              <Textarea
                label="How I Can Help in Cause"
                placeholder="Describe your capabilities, skills, or available support..."
                icon={<IconHeartHandshake size={16} />}
                value={causeContribution}
                onChange={(e) => setCauseContribution(e.target.value)}
                minRows={2}
                radius="md"
              />

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

              <Divider my="xs" />

              <Group position="right">
                <Button variant="default" onClick={() => setShowAuthModal(false)} radius="md">
                  Cancel
                </Button>
                <Button type="submit" loading={loading} color="teal" radius="md">
                  {user ? 'Save Profile' : 'Register Account'}
                </Button>
              </Group>
            </Stack>
          </Box>
        )}
      </Stack>
    </Modal>
  );
}