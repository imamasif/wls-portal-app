// src/components/auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  TextInput, 
  PasswordInput, 
  Select, 
  Textarea, 
  Button, 
  Title, 
  Text, 
  Container, 
  Stack, 
  Group, 
  Box, 
  Notification,
  Badge,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Loader
} from '@mantine/core';
import { 
  IconUserPlus, 
  IconCheck, 
  IconX,
  IconRobot,
  IconShieldLock,
  IconRefresh
} from '@tabler/icons-react';
import { Country, State } from 'country-state-city';
import { LocationSelector } from '@/components/common/LocationSelector';
import { ProfilePictureUploader } from '@/components/common/ProfilePictureUploader';
import { PhoneListInput } from '@/components/common/PhoneListInput';
import { SocialMediaSection } from '@/components/common/SocialMediaSection';

export function RegisterPage({ onSwitchToLogin, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    profession: '',
    education: '',
    causeContribution: '',
    driveFolderPath: '',
    profilePictureUrl: ''
  });

  const [phones, setPhones] = useState([
    { number: '', type: 'Mobile', isPrimary: true }
  ]);

  const [socialMedia, setSocialMedia] = useState([
    { platform: 'LinkedIn', handleUrl: '' }
  ]);

  const [selectedCountryCode, setSelectedCountryCode] = useState('CA');
  const [selectedStateCode, setSelectedStateCode] = useState('ON');
  const [selectedCity, setSelectedCity] = useState('Toronto');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Anti-Bot Robot Check CAPTCHA state
  const [captchaData, setCaptchaData] = useState({ token: '', svg: '' });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await fetch('/api/users/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaData({ token: data.captchaToken, svg: data.captchaSvg });
        setCaptchaInput('');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSocialChange = (index, field, value) => {
    const updated = [...socialMedia];
    updated[index][field] = value;
    setSocialMedia(updated);
  };

  const handleAddSocial = () => {
    setSocialMedia([...socialMedia, { platform: 'LinkedIn', handleUrl: '' }]);
  };

  const handleRemoveSocial = (index) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!captchaInput.trim()) {
      setErrorMsg('Please enter the Anti-Robot security verification characters.');
      return;
    }

    setLoading(true);

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
    const validSocialMedia = socialMedia.filter((item) => item.handleUrl.trim() !== '');

    const payload = {
      name: formData.name,
      email: formData.email,
      phones,
      password: formData.password,
      gender: formData.gender,
      profession: formData.profession,
      education: formData.education,
      causeContribution: formData.causeContribution,
      driveFolderPath: formData.driveFolderPath,
      profilePictureUrl: formData.profilePictureUrl,
      socialMedia: validSocialMedia,
      country: countryObj ? countryObj.name : 'Canada',
      countryCode: selectedCountryCode,
      state: stateObj ? stateObj.name : '',
      stateCode: selectedStateCode,
      city: selectedCity,
      captchaToken: captchaData.token,
      captchaAnswer: captchaInput.trim()
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (onSuccess) onSuccess(data);
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Failed to register account.');
        fetchCaptcha();
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg('Server error connecting to registration service.');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maw={1150} w="100%" mx="auto" my={40} style={{ fontSize: '14px' }}>
      <Paper 
        radius="lg" 
        p={50} 
        withBorder 
        shadow="xl" 
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f4f6f9 100%)',
          borderColor: '#d2d6dc',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.08), 0 8px 12px -6px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Stack align="center" mb={40}>
          <Box 
            p="md" 
            style={{ 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            <IconUserPlus size={32} color="#334155" />
          </Box>
          <Title order={2} ta="center" c="#1e293b" fw={700} style={{ letterSpacing: '-0.5px' }}>
            Create Your Portal Account
          </Title>
          <Text size="sm" c="dimmed" ta="center" maw={600}>
            Join the IIPC Learning Portal ecosystem. Please complete your professional credentials below.
          </Text>
        </Stack>

        {errorMsg && (
          <Notification icon={<IconX size={16} />} color="red" mb="xl" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Notification>
        )}

        {successMsg && (
          <Notification icon={<IconCheck size={16} />} color="green" mb="xl">
            {successMsg}
          </Notification>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Profile Picture Uploader */}
            <Box>
              <Text size="sm" fw={600} mb={8}>Profile Picture</Text>
              <ProfilePictureUploader
                value={formData.profilePictureUrl}
                name={formData.name || formData.email}
                onChange={(newUrl) => setFormData({ ...formData, profilePictureUrl: newUrl })}
              />
            </Box>

            <Group grow preventGrowOverflow={false} wrap="wrap" align="flex-start" gap="lg">
              <TextInput
                label="Full Name"
                placeholder="John Doe"
                size="sm"
                required
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextInput
                label="Email Address"
                placeholder="john@example.com"
                type="email"
                size="sm"
                required
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Group>

            <Group grow preventGrowOverflow={false} wrap="wrap" align="flex-start" gap="lg">
              <Select
                label="Gender"
                placeholder="Select gender"
                size="sm"
                data={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                  { value: 'Prefer not to say', label: 'Prefer not to say' }
                ]}
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.gender}
                onChange={(val) => setFormData({ ...formData, gender: val || '' })}
              />
              <Box style={{ flex: 1, minWidth: '260px' }} />
            </Group>

            {/* Phone List Input Container */}
            <Box p="lg" style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }}>
              <PhoneListInput phones={phones} onChange={setPhones} />
            </Box>
            
            <Group grow preventGrowOverflow={false} wrap="wrap" align="flex-start" gap="lg">
              <TextInput
                label="Profession"
                placeholder="e.g. Solution Architect / Engineer"
                size="sm"
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              />
              <TextInput
                label="Highest Education"
                placeholder="e.g. Master of Science"
                size="sm"
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              />
            </Group>

            <Group grow preventGrowOverflow={false} wrap="wrap" align="flex-start" gap="lg">
              <PasswordInput
                label="Password"
                placeholder="Min 6 characters"
                size="sm"
                required
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Re-enter password"
                size="sm"
                required
                style={{ flex: 1, minWidth: '260px' }}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </Group>

            <Box p="lg" style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }}>
              <LocationSelector
                selectedCountryCode={selectedCountryCode}
                setSelectedCountryCode={setSelectedCountryCode}
                selectedStateCode={selectedStateCode}
                setSelectedStateCode={setSelectedStateCode}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
              />
            </Box>

            <TextInput
              label="Google Drive Shared Folder URL"
              placeholder="https://drive.google.com/drive/folders/..."
              size="sm"
              value={formData.driveFolderPath}
              onChange={(e) => setFormData({ ...formData, driveFolderPath: e.target.value })}
            />

            <Textarea
              label="How I Can Help in the Cause"
              placeholder="Describe your expertise, volunteer interests, or willingness to support community goals..."
              size="sm"
              minRows={3}
              autosize
              value={formData.causeContribution}
              onChange={(e) => setFormData({ ...formData, causeContribution: e.target.value })}
            />

            {/* Social Media Section Component Integration */}
            <Box p="lg" style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }}>
              <SocialMediaSection
                socialMedia={socialMedia}
                onChange={handleSocialChange}
                onAdd={handleAddSocial}
                onRemove={handleRemoveSocial}
              />
            </Box>

            {/* ROBOT CHECK / ANTI-BOT CAPTCHA VERIFICATION */}
            <Paper 
              p="md" 
              radius="md" 
              withBorder 
              style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderColor: '#cbd5e1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="xl" color="teal" variant="light">
                    <IconRobot size={18} />
                  </ThemeIcon>
                  <Text fw={700} size="sm" c="gray.8">
                    Security Check: Human Verification
                  </Text>
                </Group>
                <Badge color="teal" variant="light" size="sm">
                  Anti-Bot Protected
                </Badge>
              </Group>
              
              <Text size="xs" c="dimmed" mb="sm">
                To prevent automated robot spam and ensure genuine student/member accounts, please enter the security characters shown below.
              </Text>

              <Group align="flex-end" gap="md" wrap="wrap">
                <Box style={{ position: 'relative', display: 'inline-block' }}>
                  {captchaData.svg ? (
                    <img 
                      src={captchaData.svg} 
                      alt="Security CAPTCHA" 
                      style={{ 
                        display: 'block', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)' 
                      }} 
                    />
                  ) : (
                    <Box 
                      style={{ 
                        width: 190, 
                        height: 55, 
                        background: '#e2e8f0', 
                        borderRadius: 8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Text size="xs" c="dimmed">Loading security code...</Text>
                    </Box>
                  )}
                </Box>

                <Tooltip label="Get a new security code" withArrow>
                  <ActionIcon 
                    variant="light" 
                    color="teal" 
                    size="lg" 
                    radius="md" 
                    loading={captchaLoading} 
                    onClick={fetchCaptcha}
                    aria-label="Refresh Security Code"
                    style={{ marginBottom: '2px' }}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>

                <TextInput
                  placeholder="Enter 5 characters"
                  required
                  size="sm"
                  leftSection={<IconShieldLock size={16} />}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ flex: 1, minWidth: '170px', maxWidth: '250px' }}
                  styles={{
                    input: {
                      letterSpacing: '3px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontFamily: 'monospace, Courier, sans-serif'
                    }
                  }}
                />
              </Group>
            </Paper>

           <Group justify="space-between" mt="xl" pt="lg" style={{ borderTop: '1px solid #e2e8f0' }}>
  {onSwitchToLogin && (
    <Button variant="subtle" color="gray" size="sm" onClick={onSwitchToLogin}>
      &larr; Already have an account? Sign In
    </Button>
  )}
  
  <Button 
    type="submit" 
    size="sm" 
    loading={loading} 
    leftSection={<IconCheck size={18} stroke={2.5} />}
    style={{ 
      paddingLeft: '20px',
      paddingRight: '20px',
      background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
    }}
  >
    Register
  </Button>
</Group>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}