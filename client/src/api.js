const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error (${response.status}): ${text.slice(0, 100)}`);
  }

  return response.json();
};