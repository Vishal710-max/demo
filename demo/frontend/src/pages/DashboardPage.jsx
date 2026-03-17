// src/pages/DashboardPage.jsx
// ============================================
// Dashboard Page
// Shows task summary stats + Chart + Quick Actions
// ============================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboard, getTasks } from "../services/api";
import { useAuth } from "../components/AuthContext";

// ----------------------------------------
// Mini Donut Chart (pure SVG, no library needed)
// Draws a donut chart for Pending vs Completed tasks
// ----------------------------------------
function DonutChart({ completed, pending, total }) {
  const size   = 160;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = 58;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;

  // If no tasks, show empty grey ring
  if (total === 0) {
    return (
      <div className="chart-container">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        </svg>
        <div className="chart-center-label">
          <span className="chart-num">0</span>
          <span className="chart-sub">tasks</span>
        </div>
      </div>
    );
  }

  const completedFrac = completed / total;
  const pendingFrac   = pending   / total;

  // SVG arcs drawn as stroked circles with dasharray offsets
  // Completed slice (indigo) starts at top (rotate -90deg)
  const completedDash = completedFrac * circumference;
  const pendingDash   = pendingFrac   * circumference;
  const pendingOffset = circumference - completedDash; // offset after completed slice

  return (
    <div className="chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {/* Completed slice */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={stroke}
          strokeDasharray={`${completedDash} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Pending slice */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={stroke}
          strokeDasharray={`${pendingDash} ${circumference}`}
          strokeDashoffset={-completedDash}
          strokeLinecap="round"
        />
      </svg>
      {/* Center label */}
      <div className="chart-center-label">
        <span className="chart-num">{total}</span>
        <span className="chart-sub">tasks</span>
      </div>
    </div>
  );
}

// ----------------------------------------
// Priority Bar Chart (pure CSS bars)
// ----------------------------------------
function PriorityBars({ tasks }) {
  const high   = tasks.filter(t => t.priority === "High").length;
  const medium = tasks.filter(t => t.priority === "Medium").length;
  const low    = tasks.filter(t => t.priority === "Low").length;
  const max    = Math.max(high, medium, low, 1);

  const bars = [
    { label: "High",   count: high,   color: "#ef4444" },
    { label: "Medium", count: medium, color: "#f59e0b" },
    { label: "Low",    count: low,    color: "#10b981" },
  ];

  return (
    <div className="priority-bars">
      {bars.map(bar => (
        <div key={bar.label} className="pbar-row">
          <span className="pbar-label">{bar.label}</span>
          <div className="pbar-track">
            <div
              className="pbar-fill"
              style={{
                width:      `${(bar.count / max) * 100}%`,
                background: bar.color,
              }}
            />
          </div>
          <span className="pbar-count">{bar.count}</span>
        </div>
      ))}
    </div>
  );
}


// ----------------------------------------
// Main Dashboard Component
// ----------------------------------------
export default function DashboardPage() {
  const [stats,   setStats]   = useState(null);
  const [tasks,   setTasks]   = useState([]);   // needed for priority chart
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const { user } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch both dashboard stats and full task list in parallel
        const [statsRes, tasksRes] = await Promise.all([getDashboard(), getTasks()]);
        setStats(statsRes.data.stats);
        setTasks(tasksRes.data.tasks);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const completionPercent =
    stats && stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome back, <strong>{user?.name}</strong>!</p>
        </div>
        <Link to="/tasks" state={{ openForm: true }} className="btn btn-primary">+ Add New Task</Link>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading dashboard...</div>}

      {!loading && stats && (
        <>
          {/* ---- Stat Cards ---- */}
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
            </div>
            <div className="stat-card stat-completed">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-number">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <span className="stat-number">{stats.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>

          {/* ---- Charts Row ---- */}
          <div className="charts-row">
            {/* Donut chart card */}
            <div className="chart-card">
              <h3 className="chart-title">Task Status</h3>
              <div className="donut-wrap">
                <DonutChart
                  completed={stats.completed}
                  pending={stats.pending}
                  total={stats.total}
                />
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#4f46e5" }}></span>
                    <span>Completed ({stats.completed})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#f59e0b" }}></span>
                    <span>Pending ({stats.pending})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority breakdown card */}
            <div className="chart-card">
              <h3 className="chart-title">Tasks by Priority</h3>
              {tasks.length > 0
                ? <PriorityBars tasks={tasks} />
                : <p className="chart-empty">No tasks yet</p>
              }
            </div>
          </div>

          {/* ---- Progress Bar ---- */}
          <div className="progress-card">
            <div className="progress-header">
              <h3>Overall Progress</h3>
              <span className="progress-percent">{completionPercent}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="progress-label">{stats.completed} of {stats.total} tasks completed</p>
          </div>

          {/* ---- Quick Actions ---- */}
          <div className="quick-action-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/tasks" className="btn btn-primary">View All Tasks</Link>
              <Link to="/tasks" state={{ openForm: true }} className="btn btn-secondary">+ Create Task</Link>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && stats && stats.total === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No tasks yet!</h3>
          <p>Create your first task to get started.</p>
          <Link to="/tasks" state={{ openForm: true }} className="btn btn-primary">Create First Task</Link>
        </div>
      )}
    </div>
  );
}
