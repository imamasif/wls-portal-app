import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Persists updates to both state/localStorage AND the MongoDB database API
  const saveUserData = async (userData) => {
    try {
      // 1. Update React local state & Local Storage immediately (optimistic update)
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // 2. Persist to MongoDB backend via Express endpoint
      const response = await fetch(`/api/users/${userData.id || userData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.warn('Backend update failed, falling back to local state only.');
        return;
      }

      const updatedUserFromDb = await response.json();
      
      // 3. Sync state with full DB payload returned by server
      setUser(updatedUserFromDb);
      localStorage.setItem('user', JSON.stringify(updatedUserFromDb));
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