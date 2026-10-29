import React, { useState, useEffect } from 'react';
import {
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Group,
  Box,
  Notification,
  Alert,
  Loader
} from '@mantine/core';
import { IconLock, IconCheck, IconX, IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import { verifyResetToken, resetPassword } from '../api/authApi';

export function ResetPasswordView({ token, onBackToLogin, onResetSuccess }) {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tokenError, setTokenError] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      if (!token) {
        if (isMounted) {
          setVerifying(false);
          setTokenValid(false);
          setTokenError('No password reset token was provided.');
        }
        return;
      }

      try {
        const res = await verifyResetToken(token);
        if (isMounted) {
          setTokenValid(true);
          setUserEmail(res.email || '');
          setVerifying(false);
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setTokenError(err.message || 'Password reset link is invalid or has expired.');
          setVerifying(false);
        }
      }
    };

    checkToken();
    return () => { isMounted = false; };
  }, [token]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(token, newPassword);
      setSuccessMsg(res.message || 'Password reset successfully!');
      setTimeout(() => {
        if (onResetSuccess) onResetSuccess();
        else if (onBackToLogin) onBackToLogin();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maw={550} w="100%" mx="auto" my={40}>
      <Paper
        radius="lg"
        p={40}
        withBorder
        shadow="xl"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f4f6f9 100%)',
          borderColor: '#d2d6dc',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Stack align="center" mb="xl">
          <Box
            p="md"
            style={{
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            <IconLock size={32} color="#0f766e" />
          </Box>
          <Title order={2} ta="center" c="#1e293b" fw={700} style={{ letterSpacing: '-0.5px' }}>
            Set New Password
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            {userEmail ? `Resetting password for: ${userEmail}` : 'Enter your new secure password below.'}
          </Text>
        </Stack>

        {verifying && (
          <Stack align="center" py="xl">
            <Loader color="teal" size="md" />
            <Text size="sm" c="dimmed">Verifying reset token...</Text>
          </Stack>
        )}

        {!verifying && !tokenValid && (
          <Stack gap="md">
            <Alert icon={<IconAlertTriangle size={18} />} title="Invalid Reset Link" color="red" radius="md">
              {tokenError || 'This password reset link is invalid or has expired.'}
            </Alert>
            <Button variant="outline" color="teal" fullWidth onClick={onBackToLogin}>
              Return to Sign In & Request New Link
            </Button>
          </Stack>
        )}

        {!verifying && tokenValid && (
          <>
            {errorMsg && (
              <Notification icon={<IconX size={16} />} color="red" mb="lg" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </Notification>
            )}

            {successMsg && (
              <Notification icon={<IconCheck size={16} />} color="teal" mb="lg">
                {successMsg} Redirecting to Sign In...
              </Notification>
            )}

            {!successMsg && (
              <form onSubmit={handleResetSubmit}>
                <Stack gap="md">
                  <PasswordInput
                    label="New Password"
                    placeholder="At least 8 characters"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Re-type new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <Button
                    type="submit"
                    size="md"
                    fullWidth
                    loading={submitting}
                    mt="md"
                    style={{
                      background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                      fontWeight: 600
                    }}
                  >
                    Update Password
                  </Button>
                </Stack>
              </form>
            )}

            <Group justify="center" mt="xl" pt="md" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                leftSection={<IconArrowLeft size={16} />}
                onClick={onBackToLogin}
              >
                Back to Sign In
              </Button>
            </Group>
          </>
        )}
      </Paper>
    </Box>
  );
}
