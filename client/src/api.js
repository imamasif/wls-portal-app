// src/api.js
// const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; //[cite: 16]
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const fetchApi = async (endpoint, options = {}) => {
  // Ensure we don't duplicate '/api' if BASE_URL already ends with '/api' or endpoint starts with '/api'
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${BASE_URL}${cleanEndpoint}`;

  if (BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
    url = `${BASE_URL.replace(/\/api$/, '')}${cleanEndpoint}`;
  }

  const defaultHeaders = {};
  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error (${response.status}): ${text.slice(0, 100)}`);
  }

  return response.json();
};