export const API_BASE = 'http://localhost:5000/api';

export const SYSTEM_ROLES = [
  { value: 'SUPER_USER', label: 'SUPER USER' },
  { value: 'WLS_ADMIN', label: 'WLS ADMIN' },
  { value: 'USER', label: 'USER' }
];

// Kept for backward compatibility with existing code
export const ROLES = ['SUPER_USER', 'WLS_ADMIN', 'USER'];