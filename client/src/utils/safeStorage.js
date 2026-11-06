/**
 * Safe localStorage wrapper that handles Private/Incognito browsing mode,
 * disabled cookies, quota limits, and non-browser environments gracefully.
 */
const inMemoryFallback = new Map();

export const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (err) {
      console.warn(`[safeStorage] localStorage.getItem failed for "${key}":`, err);
    }
    return inMemoryFallback.has(key) ? inMemoryFallback.get(key) : null;
  },

  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, String(value));
        return;
      }
    } catch (err) {
      console.warn(`[safeStorage] localStorage.setItem failed for "${key}":`, err);
    }
    inMemoryFallback.set(key, String(value));
  },

  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[safeStorage] localStorage.removeItem failed for "${key}":`, err);
    }
    inMemoryFallback.delete(key);
  },

  clear: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (err) {
      console.warn('[safeStorage] localStorage.clear failed:', err);
    }
    inMemoryFallback.clear();
  }
};
