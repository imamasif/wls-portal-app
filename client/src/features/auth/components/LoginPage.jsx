import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  TextInput, 
  PasswordInput, 
  Button, 
  Title, 
  Text, 
  Stack, 
  Group, 
  Box,
  Notification
} from '@mantine/core';
import { IconLock, IconCheck, IconX, IconMail } from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetPasswordView } from './ResetPasswordView';

export function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  
  // Views: 'login' | 'register' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  const [activeResetToken, setActiveResetToken] = useState('');

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Check URL on load for resetToken
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken') || params.get('token');
    if (token) {
      setActiveResetToken(token);
      setView('reset');
    }
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await login({ email: cleanEmail, password });
      if (res && res.success !== false) {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => onSuccess && onSuccess(), 800);
      } else {
        setErrorMsg('Invalid email or password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Render Register View
  if (view === 'register') {
    return (
      <RegisterPage 
        onSwitchToLogin={() => { 
          setView('login'); 
          setErrorMsg(null); 
          setSuccessMsg(null); 
        }} 
        onSuccess={onSuccess} 
      />
    );
  }

  // Render Forgot Password View
  if (view === 'forgot') {
    return (
      <ForgotPasswordView
        onBackToLogin={() => {
          setView('login');
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        onOpenResetToken={(token) => {
          setActiveResetToken(token);
          setView('reset');
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
      />
    );
  }

  // Render Reset Password View
  if (view === 'reset') {
    return (
      <ResetPasswordView
        token={activeResetToken}
        onBackToLogin={() => {
          // Clean token from URL
          if (window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          setView('login');
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        onResetSuccess={() => {
          if (window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          setView('login');
          setSuccessMsg('Password reset successfully! You can now log in with your new password.');
        }}
      />
    );
  }

  // Render Standard Sign In View
  return (
    <Box maw={900} w="100%" mx="auto" my={40}>
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
            <IconLock size={32} color="#334155" />
          </Box>
          <Title order={2} ta="center" c="#1e293b" fw={700} style={{ letterSpacing: '-0.5px' }}>
            Sign In to Portal
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Enter your credentials to access the portal.
          </Text>
        </Stack>

        {errorMsg && (
          <Notification icon={<IconX size={16} />} color="red" mb="lg" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Notification>
        )}

        {successMsg && (
          <Notification icon={<IconCheck size={16} />} color="teal" mb="lg" onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Notification>
        )}

        <form onSubmit={handleSignIn}>
          <Stack gap="md">
            <TextInput
              label="Email Address"
              placeholder="john@example.com"
              type="email"
              required
              leftSection={<IconMail size={16} color="gray" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Box>
              <Group justify="space-between" mb={4}>
                <Text component="label" size="sm" fw={500} c="#1e293b">
                  Password
                </Text>
                <Text 
                  size="xs" 
                  c="teal.7" 
                  fw={600} 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => { 
                    setView('forgot'); 
                    setErrorMsg(null); 
                    setSuccessMsg(null); 
                  }}
                >
                  Forgot password?
                </Text>
              </Group>
              <PasswordInput
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>

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
              Sign In
            </Button>

            <Group justify="center" mt="md" pt="md" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Text size="sm" c="dimmed">Don't have an account?</Text>
              <Text 
                size="sm" 
                c="teal.7" 
                fw={600} 
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { 
                  setView('register'); 
                  setErrorMsg(null); 
                  setSuccessMsg(null); 
                }}
              >
                Register now
              </Text>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
