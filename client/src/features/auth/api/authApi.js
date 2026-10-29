// client/src/features/auth/api/authApi.js

const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/api${cleanPath}`;
};

const parseResponse = async (res, defaultErrMsg) => {
  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && (data.error || data.message)) {
      throw new Error(data.error || data.message);
    }
    if (res.status === 404) {
      throw new Error('API service endpoint not found (404). Please ensure the backend server is running.');
    }
    if (res.status >= 500) {
      throw new Error(`Server temporarily unavailable (${res.status}). Please try again in a moment.`);
    }
    throw new Error(defaultErrMsg || `Request failed with status ${res.status}`);
  }

  if (!data) {
    try {
      const text = await res.text();
      return { message: text };
    } catch (e) {
      return {};
    }
  }

  return data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(getApiUrl('/users/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await parseResponse(res, 'Authentication failed');
};

export const registerUser = async (userData) => {
  const res = await fetch(getApiUrl('/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await parseResponse(res, 'Registration failed');
};

export const requestPasswordReset = async (email) => {
  const res = await fetch(getApiUrl('/users/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return await parseResponse(res, 'Failed to request password reset');
};

export const verifyResetToken = async (token) => {
  const res = await fetch(getApiUrl(`/users/verify-reset-token/${encodeURIComponent(token)}`));
  return await parseResponse(res, 'Password reset token is invalid or expired');
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(getApiUrl('/users/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  return await parseResponse(res, 'Failed to reset password');
};
