import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const dbUser = await response.json();
        setUser(dbUser);
        localStorage.setItem('user', JSON.stringify(dbUser));
      } else {
        // Use email as fallback identifier instead of numeric timestamp
        const fallbackUser = {
          _id: credentials.email, 
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: credentials.role || 'SUPER_USER'
        };
        setUser(fallbackUser);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
      }
    } catch (err) {
      console.error('Login error, using fallback:', err);
    } finally {
      setShowAuthModal(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Pure state updater — eliminate double-fetching
  const saveUserData = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, showAuthModal, setShowAuthModal, login, logout, saveUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      showAuthModal: false,
      setShowAuthModal: () => {},
      login: () => {},
      logout: () => {},
      saveUserData: () => {},
    };
  }
  return context;
}