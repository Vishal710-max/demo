// src/components/AuthContext.jsx
// ============================================
// Authentication Context
// Provides user login state to the whole app
// ============================================

import { createContext, useContext, useState, useEffect } from "react";

// Create the context
const AuthContext = createContext(null);

// AuthProvider wraps the entire app and provides auth state
export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);   // logged-in user object
  const [token, setToken] = useState(null);   // JWT token

  // On app load, restore user from localStorage (so refresh doesn't log out)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser  = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Call this after a successful login
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Call this to log out
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access to auth context
export function useAuth() {
  return useContext(AuthContext);
}
