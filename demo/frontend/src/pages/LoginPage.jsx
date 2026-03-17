// src/pages/LoginPage.jsx
// ============================================
// Login Page
// Features:
//   - 3-attempt lockout with countdown timer
//   - Toastify notifications for success / failure
// ============================================

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser } from "../services/api";
import { useAuth } from "../components/AuthContext";

// Lockout settings
const MAX_ATTEMPTS   = 3;    // lock after this many failures
const LOCKOUT_SECS   = 30;   // seconds to lock the form

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  // Lockout state
  const [attempts,        setAttempts]        = useState(0);
  const [lockedOut,       setLockedOut]        = useState(false);
  const [lockTimer,       setLockTimer]        = useState(0);   // seconds remaining
  const timerRef = useRef(null);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ---- Lockout countdown effect ----
  useEffect(() => {
    if (lockedOut && lockTimer > 0) {
      timerRef.current = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            // Timer finished — unlock the form
            clearInterval(timerRef.current);
            setLockedOut(false);
            setAttempts(0);
            toast.info("🔓 Account unlocked. You may try again.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    // Cleanup interval when component unmounts
    return () => clearInterval(timerRef.current);
  }, [lockedOut]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block submission if locked out
    if (lockedOut) {
      toast.error(`🔒 Too many attempts. Wait ${lockTimer}s to try again.`);
      return;
    }

    setLoading(true);

    try {
      const response       = await loginUser(email, password);
      const { token, user } = response.data;

      // Successful login — reset attempts and redirect
      setAttempts(0);
      login(user, token);
      toast.success(`👋 Welcome back, ${user.name}!`);
      navigate("/dashboard");

    } catch (err) {
      const msg        = err.response?.data?.error || "Login failed. Please try again.";
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const remaining = MAX_ATTEMPTS - newAttempts;

      if (newAttempts >= MAX_ATTEMPTS) {
        // --- Trigger lockout ---
        setLockedOut(true);
        setLockTimer(LOCKOUT_SECS);
        toast.error(
          `🔒 Account locked for ${LOCKOUT_SECS} seconds after ${MAX_ATTEMPTS} failed attempts.`,
          { autoClose: 6000 }
        );
      } else {
        // --- Warn about remaining attempts ---
        toast.error(
          `❌ ${msg} — ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`,
          { autoClose: 4000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">✓</div>
          <h1>Welcome Back</h1>
          <p>Sign in to manage your tasks</p>
        </div>

        {/* ---- Lockout Banner ---- */}
        {lockedOut && (
          <div className="lockout-banner">
            <div className="lockout-icon">🔒</div>
            <div className="lockout-text">
              <strong>Account Temporarily Locked</strong>
              <p>Too many failed attempts. Please wait:</p>
            </div>
            <div className="lockout-timer">{lockTimer}s</div>
          </div>
        )}

        {/* ---- Attempts Warning (shown after 1st fail) ---- */}
        {!lockedOut && attempts > 0 && (
          <div className="attempts-warning">
            ⚠ {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts > 1 ? "s" : ""} remaining
            before lockout
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={lockedOut}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={lockedOut}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-full ${lockedOut ? "btn-locked" : ""}`}
            disabled={loading || lockedOut}
          >
            {lockedOut
              ? `🔒 Locked — wait ${lockTimer}s`
              : loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
