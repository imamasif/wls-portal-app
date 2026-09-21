import React, { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { 
  Paper, 
  TextInput, 
  Select, 
  Button, 
  Title, 
  Text, 
  Container, 
  Stack, 
  Group, 
  Box, 
  Notification,
  PasswordInput
} from '@mantine/core';
import { IconUserEdit, IconCheck, IconX, IconLock } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { PhoneListInput } from '@/components/common/PhoneListInput';
import { ProfilePictureUploader } from '@/components/common/ProfilePictureUploader';
import { LocationSelector } from '@/components/common/LocationSelector';
import { SocialMediaSection } from '@/components/common/SocialMediaSection';
import { UserGender } from '@/types/user'; 

export function EditProfileCard({ targetUser, onCancel, onSaveSuccess }) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'SUPER_USER';

  const [formData, setFormData] = useState({
    profilePictureUrl: '',
    name: '',
    email: '',
    gender: '',
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
  
  // Password Management State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const sanitizeE164 = (val) => {
    if (!val) return '';
    const clean = val.replace(/[^\d+]/g, '');
    return clean.startsWith('+') ? clean : `+${clean}`;
  };

  useEffect(() => {
    if (targetUser) {
      setFormData({
        profilePictureUrl: targetUser.profilePictureUrl || '',
        name: targetUser.name || '',
        email: targetUser.email || '',
        gender: targetUser.gender || '',
        profession: targetUser.profession || '',
        education: targetUser.education || '',
        driveFolderPath: targetUser.driveFolderPath || targetUser.drive || '',
        causeContribution: targetUser.causeContribution || ''
      });

      if (Array.isArray(targetUser.socialMedia) && targetUser.socialMedia.length > 0) {
        setSocialMedia(targetUser.socialMedia.map((s) => ({ ...s })));
      } else {
        setSocialMedia([{ platform: 'LinkedIn', handleUrl: '' }]);
      }

      // SANITIZE HERE: Clean phones to pure E.164 format (+14165550199) immediately upon load
      if (Array.isArray(targetUser.phones) && targetUser.phones.length > 0) {
        setPhones(targetUser.phones.map((p) => ({ ...p, number: sanitizeE164(p.number) })));
      } else if (targetUser.phone) {
        setPhones([{ number: sanitizeE164(targetUser.phone), type: 'Mobile', isPrimary: true }]);
      } else {
        setPhones([{ number: '', type: 'Mobile', isPrimary: true }]);
      }

      setSelectedCountryCode(targetUser.countryCode || 'CA');
      setSelectedStateCode(targetUser.stateCode || 'ON');
      setSelectedCity(targetUser.city || '');
    }
  }, [targetUser]);

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

  const handlePasswordUpdate = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      const targetId = targetUser._id || targetUser.id;
      const res = await fetch(`/api/users/${targetId}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          isAdminReset: isAdmin
        }),
      });

      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const errorData = await res.json();
        setPasswordMsg({ type: 'error', text: errorData.message || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Server error while updating password.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const countryObj = Country.getCountryByCode(selectedCountryCode);
    const stateObj = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode);
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
        
        setTimeout(() => {
          if (onSaveSuccess) onSaveSuccess(resData);
        }, 1200);
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
    <Container size={750} my={20}>
      <Paper radius="md" p={35} withBorder shadow="xl" bg="white">
        <Group justify="space-between" mb="lg">
          <Group gap="sm">
            <Box p="xs" bg="blue.0" style={{ borderRadius: '50%' }}>
              <IconUserEdit size={24} color="var(--mantine-color-blue-7)" />
            </Box>
            <Title order={3} c="blue.8">
              Edit Profile: {formData.name || formData.email}
            </Title>
          </Group>
          {onCancel && (
            <Button variant="subtle" color="gray" onClick={onCancel} size="xs">
              ✕ Close
            </Button>
          )}
        </Group>

        {statusMessage && (
          <Notification 
            icon={statusMessage.type === 'error' ? <IconX size={16} /> : <IconCheck size={16} />}
            color={statusMessage.type === 'error' ? 'red' : 'green'}
            mb="md"
            onClose={() => setStatusMessage(null)}
          >
            {statusMessage.text}
          </Notification>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Box>
              <Text size="sm" fw={500} mb={5}>Profile Picture</Text>
              <ProfilePictureUploader
                value={formData.profilePictureUrl}
                name={formData.name || formData.email}
                onChange={(newUrl) => setFormData({ ...formData, profilePictureUrl: newUrl })}
              />
            </Box>

            <Group grow preventGrowOverflow={false}>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextInput
                label="Email Address"
                placeholder="email@example.com"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Group>

            {/* Gender Select Field */}
            <Select
              label="Gender"
              placeholder="Select gender"
              data={[
                { value: UserGender.MALE, label: 'Male' },
                { value: UserGender.FEMALE, label: 'Female' },
              ]}
              value={formData.gender}
              onChange={(val) => setFormData({ ...formData, gender: val || '' })}
            />

            <Box>
              <PhoneListInput phones={phones} onChange={setPhones} />
            </Box>

            <Group grow preventGrowOverflow={false}>
              <TextInput
                label="Profession"
                placeholder="e.g. Software Engineer"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              />
              <TextInput
                label="Highest Education"
                placeholder="e.g. Bachelor of Science"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
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
              placeholder="https://drive.google.com/..."
              value={formData.driveFolderPath}
              onChange={(e) => setFormData({ ...formData, driveFolderPath: e.target.value })}
            />

            <TextInput
              label="How I Can Help in Cause"
              placeholder="Describe your willingness or skills to support community goals..."
              value={formData.causeContribution}
              onChange={(e) => setFormData({ ...formData, causeContribution: e.target.value })}
            />

            {/* Dynamic Social Media Section using unified SocialMediaSection component */}
            <Box p="lg" style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }}>
              <SocialMediaSection
                socialMedia={socialMedia}
                onChange={handleSocialChange}
                onAdd={handleAddSocial}
                onRemove={handleRemoveSocial}
              />
            </Box>

            {/* Change / Reset Password Collapsible Section */}
            <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
              <Button
                variant="subtle"
                color="blue"
                leftSection={<IconLock size={16} />}
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                p={0}
              >
                {showPasswordSection ? 'Hide Password Settings' : 'Change / Reset Password'}
              </Button>

              {showPasswordSection && (
                <Paper mt="sm" p="md" bg="gray.0" withBorder radius="sm">
                  <Stack gap="sm">
                    {passwordMsg && (
                      <Notification 
                        color={passwordMsg.type === 'success' ? 'green' : 'red'} 
                        onClose={() => setPasswordMsg(null)}
                      >
                        {passwordMsg.text}
                      </Notification>
                    )}

                    {!isAdmin && (
                      <PasswordInput
                        label="Current Password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    )}

                    <Group grow preventGrowOverflow={false}>
                      <PasswordInput
                        label="New Password"
                        placeholder="Min 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <PasswordInput
                        label="Confirm New Password"
                        placeholder="Re-enter password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </Group>

                    <Button 
                      size="sm" 
                      color="blue" 
                      onClick={handlePasswordUpdate} 
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {isAdmin ? 'Reset User Password' : 'Update Password'}
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Box>

            {/* Form Action Buttons */}
            <Group justify="flex-end" mt="xl">
              {onCancel && (
                <Button variant="default" onClick={onCancel} disabled={saving}>
                  Cancel
                </Button>
              )}
              <Button type="submit" color="blue" loading={saving}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}