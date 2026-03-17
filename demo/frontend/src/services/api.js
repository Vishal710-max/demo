// src/services/api.js
// ============================================
// Axios API Service — all HTTP calls go here
// ============================================

import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- AUTH ----
export const registerUser = (name, email, password) =>
  api.post("/register", { name, email, password });

export const loginUser = (email, password) =>
  api.post("/login", { email, password });

export const getProfile = () => api.get("/profile");

// ---- DASHBOARD ----
export const getDashboard = () => api.get("/dashboard");

// ---- TASKS (paginated) ----
// page and per_page are passed as query params
// status is optional filter: "Pending" | "Completed" | "" (all)
export const getTasks = (page = 1, perPage = 10, status = "") => {
  const params = { page, per_page: perPage };
  if (status) params.status = status;
  return api.get("/tasks", { params });
};

// Fetch ALL tasks — used only for CSV / JSON export
export const getAllTasksForExport = () =>
  api.get("/tasks", { params: { all: "true" } });

export const getTask    = (id)           => api.get(`/tasks/${id}`);
export const createTask = (taskData)     => api.post("/tasks", taskData);
export const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
export const deleteTask = (id)           => api.delete(`/tasks/${id}`);
export const toggleTask = (id)           => api.patch(`/tasks/${id}/toggle`);

export default api;
