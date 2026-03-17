// src/pages/TasksPage.jsx
// ============================================
// Tasks Management Page
// Features: CRUD, Due Date Warnings, Pagination,
//           Export CSV + JSON, Toastify notifications
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getTasks, getAllTasksForExport,
  createTask, updateTask, deleteTask, toggleTask
} from "../services/api";

// ============================================
// HELPERS
// ============================================

// Returns "overdue" | "due-today" | "due-soon" | null
function getDueDateStatus(dueDateStr, taskStatus) {
  if (!dueDateStr || taskStatus === "Completed") return null;
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate  = new Date(dueDateStr + "T00:00:00");
  const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return "overdue";
  if (diffDays === 0) return "due-today";
  if (diffDays === 1) return "due-soon";
  return null;
}

// Export tasks array as CSV file download
function downloadCSV(tasks) {
  if (!tasks.length) { toast.warning("No tasks to export!"); return; }
  const headers = ["ID","Title","Description","Priority","Status","Due Date","Created At"];
  const rows    = tasks.map(t => [
    t.id,
    `"${(t.title       || "").replace(/"/g,'""')}"`,
    `"${(t.description || "").replace(/"/g,'""')}"`,
    t.priority, t.status, t.due_date || "", t.created_at || ""
  ]);
  const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `tasks_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("📥 CSV exported successfully!");
}

// Export tasks array as JSON file download
function downloadJSON(tasks) {
  if (!tasks.length) { toast.warning("No tasks to export!"); return; }
  const json = JSON.stringify(tasks, null, 2);  // pretty-print with 2 spaces
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `tasks_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("📥 JSON exported successfully!");
}


// ============================================
// TASK FORM (Add / Edit)
// ============================================
function TaskForm({ onSubmit, onCancel, initialData = null }) {
  const [title,       setTitle]       = useState(initialData?.title       || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority,    setPriority]    = useState(initialData?.priority    || "Medium");
  const [status,      setStatus]      = useState(initialData?.status      || "Pending");
  const [dueDate,     setDueDate]     = useState(initialData?.due_date    || "");
  const isEditing = !!initialData;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, description, priority, status, due_date: dueDate });
  };

  return (
    <div className="form-card">
      <h3>{isEditing ? "✏️ Edit Task" : "➕ Add New Task"}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Task Title *</label>
          <input type="text" placeholder="What needs to be done?"
            value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea placeholder="Add details (optional)" rows={3}
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          {isEditing && (
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Save Changes" : "Add Task"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}


// ============================================
// PRIORITY BADGE
// ============================================
function PriorityBadge({ priority }) {
  const map = { High: "badge badge-high", Medium: "badge badge-medium", Low: "badge badge-low" };
  return <span className={map[priority] || "badge"}>{priority}</span>;
}


// ============================================
// DUE DATE BADGE
// ============================================
function DueDateBadge({ dueDateStr, status }) {
  const ds = getDueDateStatus(dueDateStr, status);
  if (!dueDateStr) return <span className="task-date">—</span>;
  return (
    <div className="due-date-cell">
      <span className="task-date">{dueDateStr}</span>
      {ds === "overdue"   && <span className="due-tag due-overdue">⚠ Overdue</span>}
      {ds === "due-today" && <span className="due-tag due-today">🔔 Today</span>}
      {ds === "due-soon"  && <span className="due-tag due-soon">📅 Tomorrow</span>}
    </div>
  );
}


// ============================================
// PAGINATION CONTROLS
// ============================================
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page number array — always show first, last, and 2 around current
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="pagination">
      {/* Previous button */}
      <button
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        ‹ Prev
      </button>

      {/* Page number buttons */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="page-dots">…</span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === page ? "page-btn-active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}

      {/* Next button */}
      <button
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next ›
      </button>
    </div>
  );
}


// ============================================
// MAIN TASKS PAGE
// ============================================
export default function TasksPage() {
  const location = useLocation();

  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(location.state?.openForm === true);
  const [editingTask, setEditingTask] = useState(null);
  const [filter,      setFilter]      = useState("All");

  // Pagination state
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalTasks,  setTotalTasks]  = useState(0);
  const PER_PAGE = 10;

  // ---- Fetch page of tasks ----
  const fetchTasks = useCallback(async (currentPage = page, currentFilter = filter) => {
    setLoading(true);
    try {
      const statusParam = currentFilter === "All" ? "" : currentFilter;
      const res = await getTasks(currentPage, PER_PAGE, statusParam);
      setTasks(res.data.tasks);
      setTotalPages(res.data.total_pages);
      setTotalTasks(res.data.total);

      // After loading, warn about any overdue tasks on current page
      const overdueTasks = res.data.tasks.filter(
        t => getDueDateStatus(t.due_date, t.status) === "overdue"
      );
      if (overdueTasks.length > 0) {
        toast.warn(
          `⚠ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""} on this page!`,
          { toastId: "overdue-warn", autoClose: 5000 }
        );
      }
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  // Reload when page or filter changes
  useEffect(() => { fetchTasks(page, filter); }, [page, filter]);

  // When filter changes reset to page 1
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  // ---- EXPORT (fetches ALL tasks, not just current page) ----
  const handleExport = async (format) => {
    try {
      const res  = await getAllTasksForExport();
      const all  = res.data.tasks;
      if (format === "csv")  downloadCSV(all);
      if (format === "json") downloadJSON(all);
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  // ---- CREATE ----
  const handleCreate = async (taskData) => {
    try {
      await createTask(taskData);
      toast.success("✅ Task created successfully!");
      setShowForm(false);
      fetchTasks(1, filter);   // go back to page 1 after adding
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create task.");
    }
  };

  // ---- UPDATE ----
  const handleUpdate = async (taskData) => {
    try {
      await updateTask(editingTask.id, taskData);
      toast.success("✏️ Task updated successfully!");
      setEditingTask(null);
      fetchTasks(page, filter);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update task.");
    }
  };

  // ---- DELETE ----
  const handleDelete = async (taskId, taskTitle) => {
    if (!window.confirm(`Delete "${taskTitle}"? This cannot be undone.`)) return;
    try {
      await deleteTask(taskId);
      toast.success("🗑️ Task deleted.");
      // If deleting last item on a page > 1, go back one page
      const newPage = tasks.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      fetchTasks(newPage, filter);
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  // ---- TOGGLE STATUS ----
  const handleToggle = async (task) => {
    try {
      await toggleTask(task.id);
      const newStatus = task.status === "Pending" ? "Completed" : "Pending";
      toast.info(
        newStatus === "Completed"
          ? `✅ "${task.title}" marked complete!`
          : `🔄 "${task.title}" moved back to pending.`
      );
      fetchTasks(page, filter);
    } catch {
      toast.error("Failed to update task status.");
    }
  };

  return (
    <div className="page">
      {/* ---- Page Header ---- */}
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="subtitle">{totalTasks} tasks total</p>
        </div>
        <div className="header-actions">
          {/* Export dropdown group */}
          <div className="export-group">
            <button className="btn btn-secondary" onClick={() => handleExport("csv")}
              title="Download all tasks as CSV">
              ⬇ CSV
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport("json")}
              title="Download all tasks as JSON">
              ⬇ JSON
            </button>
          </div>
          {!showForm && !editingTask && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* ---- Add / Edit Forms ---- */}
      {showForm && (
        <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}
      {editingTask && (
        <TaskForm
          initialData={editingTask}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {/* ---- Filter Tabs ---- */}
      <div className="filter-tabs">
        {["All", "Pending", "Completed"].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => handleFilterChange(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ---- Loading ---- */}
      {loading && <div className="loading">Loading tasks...</div>}

      {/* ---- Tasks Table ---- */}
      {!loading && tasks.length > 0 && (
        <>
          <div className="table-container">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Done</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const dueSt    = getDueDateStatus(task.due_date, task.status);
                  const rowClass = [
                    task.status === "Completed" ? "row-completed" : "",
                    dueSt === "overdue"         ? "row-overdue"   : "",
                    dueSt === "due-today"       ? "row-due-today" : "",
                  ].filter(Boolean).join(" ");

                  return (
                    <tr key={task.id} className={rowClass}>
                      <td>
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={task.status === "Completed"}
                          onChange={() => handleToggle(task)}
                          title="Toggle complete"
                        />
                      </td>
                      <td>
                        <div className="task-title">{task.title}</div>
                        {task.description && (
                          <div className="task-desc">{task.description}</div>
                        )}
                      </td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td><DueDateBadge dueDateStr={task.due_date} status={task.status} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-sm btn-edit"
                            onClick={() => { setEditingTask(task); setShowForm(false); }}>
                            Edit
                          </button>
                          <button className="btn btn-sm btn-delete"
                            onClick={() => handleDelete(task.id, task.title)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---- Pagination info + controls ---- */}
          <div className="pagination-wrapper">
            <span className="pagination-info">
              Page {page} of {totalPages} &nbsp;·&nbsp; {totalTasks} task{totalTasks !== 1 ? "s" : ""}
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ---- Empty State ---- */}
      {!loading && tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No {filter !== "All" ? filter.toLowerCase() : ""} tasks found</h3>
          <p>{filter === "All" ? "Add your first task to get started!" : `No ${filter.toLowerCase()} tasks right now.`}</p>
        </div>
      )}
    </div>
  );
}
