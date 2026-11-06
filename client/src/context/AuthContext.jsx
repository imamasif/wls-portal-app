import React, { createContext, useContext, useState } from "react";
import { safeStorage } from "../utils/safeStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = safeStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to parse saved user from storage:", e);
      return null;
    }
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
      safeStorage.setItem("user", JSON.stringify(data));
      setShowAuthModal(false);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err.message);
      setUser(null);
      safeStorage.removeItem("user");
      throw err; // Re-throw to allow AuthModal to display error UI
    }
  };

  const logout = () => {
    // 1. Clear local storage items safely
    safeStorage.clear();
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch (e) {
      console.warn("sessionStorage.clear failed:", e);
    }

    // 2. Reset React user state
    setUser(null);
  };

  const saveUserData = (userData) => {
    setUser(userData);
    safeStorage.setItem("user", JSON.stringify(userData));
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
