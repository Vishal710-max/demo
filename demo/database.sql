-- ============================================================
-- Smart Task & Productivity Manager — Django Version
-- MySQL Database Schema
--
-- This schema is IDENTICAL to the Flask project schema.
-- The same database can be used by both Flask and Django
-- because Django models use Meta.db_table to keep the
-- original table names "users" and "tasks".
--
-- Run this ONCE to create the database and tables:
--   mysql -u root -p < database.sql
-- ============================================================

-- Step 1: Create and select the database
CREATE DATABASE IF NOT EXISTS smart_task_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_task_db;

-- ============================================================
-- Table 1: users
-- ============================================================
-- Django model: taskmanager/tasks/models.py → class User
-- Meta.db_table = "users"  ← keeps this exact table name
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,         -- bcrypt hash
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table 2: tasks
-- ============================================================
-- Django model: taskmanager/tasks/models.py → class Task
-- Meta.db_table = "tasks"  ← keeps this exact table name
-- user_id column matches ForeignKey(db_column="user_id")
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    priority    ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status      ENUM('Pending', 'Completed')  DEFAULT 'Pending',
    due_date    DATE,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    user_id     INT          NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- IMPORTANT NOTE FOR DJANGO MIGRATIONS
-- ============================================================
-- After running this SQL file, Django's migrate command will
-- try to create these tables again. To prevent conflicts,
-- run migrations using --fake-initial:
--
--   python manage.py migrate --fake-initial
--
-- This tells Django "the tables already exist, just record
-- them in the migrations history without trying to CREATE them."
-- ============================================================
