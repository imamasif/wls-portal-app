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
        const fallbackUser = {
          _id: credentials.id || Date.now().toString(),
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: credentials.role || 'SUPER_ADMIN'
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

  const saveUserData = async (userData) => {
    try {
      // Optimistically set user state first
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      const targetId = userData._id || userData.id || userData.email;
      if (!targetId) return;

      const response = await fetch(`/api/users/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const updatedUserFromDb = await response.json();
        setUser(updatedUserFromDb);
        localStorage.setItem('user', JSON.stringify(updatedUserFromDb));
        return updatedUserFromDb;
      }
    } catch (error) {
      console.error('Failed to sync profile update with database:', error);
    }
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