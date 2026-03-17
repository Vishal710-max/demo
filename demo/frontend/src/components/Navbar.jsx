// src/components/Navbar.jsx
// ============================================
// Navigation Bar Component
// Shows app name, nav links, and logout button
// ============================================

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">✓</span>
        <Link to="/dashboard" className="brand-text">TaskFlow</Link>
      </div>

      {user && (
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/tasks"     className="nav-link">My Tasks</Link>
          <span className="nav-user">👤 {user.name}</span>
          <button onClick={handleLogout} className="btn btn-outline-sm">Logout</button>
        </div>
      )}
    </nav>
  );
}
