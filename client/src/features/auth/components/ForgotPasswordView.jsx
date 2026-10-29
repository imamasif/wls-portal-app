import React, { useState } from 'react';
import {
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Group,
  Box,
  Notification,
  Alert
} from '@mantine/core';
import { IconMail, IconArrowLeft, IconCheck, IconX, IconKey, IconExternalLink } from '@tabler/icons-react';
import { requestPasswordReset } from '../api/authApi';

export function ForgotPasswordView({ onBackToLogin, onOpenResetToken }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setDevResetUrl(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await requestPasswordReset(cleanEmail);
      setSuccessMsg(res.message || 'If an account exists with this email, password reset instructions have been sent.');
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit password reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractTokenFromUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('resetToken') || parsed.searchParams.get('token');
    } catch (e) {
      return null;
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
            <IconKey size={32} color="#0f766e" />
          </Box>
          <Title order={2} ta="center" c="#1e293b" fw={700} style={{ letterSpacing: '-0.5px' }}>
            Forgot Password
          </Title>
          <Text size="sm" c="dimmed" ta="center" maw={400}>
            Enter your account email below and we'll send you a secure link to reset your password.
          </Text>
        </Stack>

        {errorMsg && (
          <Notification icon={<IconX size={16} />} color="red" mb="lg" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Notification>
        )}

        {successMsg && (
          <Alert icon={<IconCheck size={18} />} title="Reset Instructions Sent" color="teal" radius="md" mb="lg">
            <Text size="sm">{successMsg}</Text>
            {devResetUrl && (
              <Box mt="md" p="xs" style={{ background: '#f0fdfa', borderRadius: '6px', border: '1px dashed #0f766e' }}>
                <Text size="xs" fw={700} c="teal.9" mb={4}>
                  🛠️ Developer / Testing Notice (Simulated Email):
                </Text>
                <Text size="xs" c="dimmed" mb={8}>
                  Since SMTP is not configured in local environment, you can click below to test the reset form directly:
                </Text>
                <Button
                  size="xs"
                  color="teal"
                  variant="light"
                  rightSection={<IconExternalLink size={14} />}
                  onClick={() => {
                    const token = extractTokenFromUrl(devResetUrl);
                    if (token && onOpenResetToken) {
                      onOpenResetToken(token);
                    } else {
                      window.location.href = devResetUrl;
                    }
                  }}
                >
                  Open Reset Password Form
                </Button>
              </Box>
            )}
          </Alert>
        )}

        {!successMsg ? (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Registered Email Address"
                placeholder="you@example.com"
                type="email"
                required
                leftSection={<IconMail size={16} color="gray" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                size="md"
                fullWidth
                loading={loading}
                mt="md"
                style={{
                  background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                  fontWeight: 600
                }}
              >
                Send Reset Link
              </Button>
            </Stack>
          </form>
        ) : (
          <Button
            variant="light"
            color="teal"
            fullWidth
            onClick={() => {
              setSuccessMsg(null);
              setEmail('');
            }}
            mb="md"
          >
            Send Another Reset Link
          </Button>
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
      </Paper>
    </Box>
  );
}
