import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = async (credentials) => {
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      setShowAuthModal(false);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err.message);
      setUser(null);
      localStorage.removeItem("user");
      throw err; // Re-throw to allow AuthModal to display error UI
    }
  };

  const logout = () => {
    // 1. Clear local/session storage items related to user and token
    localStorage.clear(); // Or clear specifically what your app uses
    sessionStorage.clear();

    // 2. Clear any Axios/Fetch global authorization headers if configured
    // delete axios.defaults.headers.common['Authorization'];

    // 3. Reset React user state

    setUser(null);
  };

  const saveUserData = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        showAuthModal,
        setShowAuthModal,
        login,
        logout,
        saveUserData,
      }}
    >
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
