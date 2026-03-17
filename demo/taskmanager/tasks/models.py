# taskmanager/tasks/models.py
# ============================================================
# Django ORM Models
#
# FLASK → DJANGO CONVERSION NOTE:
#   Flask used raw SQL via mysql.connector in models.py.
#   Every function manually opened a connection, executed SQL,
#   and closed the connection.
#
#   Django equivalent:
#     - We define Model classes that map to database tables.
#     - Django's ORM generates and runs SQL automatically.
#     - No manual connection management needed.
#
#   CRITICAL — keeping the same table names:
#     Flask created tables named "users" and "tasks".
#     Django would default to "tasks_user" and "tasks_task".
#     We override this with Meta.db_table so the SAME MySQL
#     database works for both Flask and Django without any
#     data migration.
#
#   CRITICAL — keeping the same column names:
#     Django uses "id" by default (same as Flask).
#     All other field names match exactly: name, email,
#     password, title, description, priority, status,
#     due_date, created_at, user_id.
# ============================================================

import math
from django.db import models


# ============================================================
# USER MODEL
# Flask equivalent: users table + create_user(), get_user_by_email(),
#                   get_user_by_id() functions in models.py
# ============================================================

class User(models.Model):
    """
    Stores registered user accounts.
    Password is stored as a bcrypt hash — never plain text.
    """
    name       = models.CharField(max_length=100)
    email      = models.EmailField(max_length=150, unique=True)
    password   = models.CharField(max_length=255)   # bcrypt hash
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # IMPORTANT: keeps the table name "users" — same as Flask
        db_table = "users"

    def __str__(self):
        return f"{self.name} <{self.email}>"

    def to_dict(self):
        """Return a plain dict (like Flask's dictionary=True cursor)."""
        return {
            "id"        : self.id,
            "name"      : self.name,
            "email"     : self.email,
            "password"  : self.password,
            "created_at": str(self.created_at),
        }


# ============================================================
# TASK MODEL
# Flask equivalent: tasks table + all task functions in models.py
# ============================================================

class Task(models.Model):
    """
    Stores tasks belonging to a user.
    user_id is a ForeignKey — same as the SQL FOREIGN KEY in Flask.
    """

    # Priority choices — same ENUM values as Flask
    PRIORITY_LOW    = "Low"
    PRIORITY_MEDIUM = "Medium"
    PRIORITY_HIGH   = "High"
    PRIORITY_CHOICES = [
        (PRIORITY_LOW,    "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH,   "High"),
    ]

    # Status choices — same ENUM values as Flask
    STATUS_PENDING   = "Pending"
    STATUS_COMPLETED = "Completed"
    STATUS_CHOICES = [
        (STATUS_PENDING,   "Pending"),
        (STATUS_COMPLETED, "Completed"),
    ]

    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    priority    = models.CharField(max_length=10, choices=PRIORITY_CHOICES,
                                   default=PRIORITY_MEDIUM)
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES,
                                   default=STATUS_PENDING)
    due_date    = models.DateField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    # Flask equivalent: user_id INT NOT NULL FOREIGN KEY REFERENCES users(id)
    # Django creates a "user_id" column automatically for ForeignKey fields.
    # db_column="user_id" ensures the exact same column name.
    user        = models.ForeignKey(
        User,
        on_delete=models.CASCADE,   # ON DELETE CASCADE — same as Flask schema
        db_column="user_id",
        related_name="tasks"
    )

    class Meta:
        # IMPORTANT: keeps the table name "tasks" — same as Flask
        db_table = "tasks"

    def __str__(self):
        return self.title

    def to_dict(self):
        """
        Return a plain dict suitable for JSON serialisation.
        Flask equivalent: _serialize_task() function in models.py
        Converts date/datetime objects to strings.
        """
        return {
            "id"         : self.id,
            "title"      : self.title,
            "description": self.description,
            "priority"   : self.priority,
            "status"     : self.status,
            "due_date"   : str(self.due_date)   if self.due_date   else None,
            "created_at" : str(self.created_at) if self.created_at else None,
            "user_id"    : self.user_id,
        }


# ============================================================
# QUERY HELPER FUNCTIONS
# These replace the standalone functions in Flask's models.py.
# They use Django ORM instead of raw SQL but produce the
# same results.
# ============================================================

# ---- User helpers ----

def create_user(name, email, hashed_password):
    """
    Flask equivalent:
        INSERT INTO users (name, email, password) VALUES (...)
    """
    user = User.objects.create(
        name=name, email=email, password=hashed_password
    )
    return user.id


def get_user_by_email(email):
    """
    Flask equivalent:
        SELECT * FROM users WHERE email = %s
    Returns a dict or None.
    """
    try:
        user = User.objects.get(email=email)
        return user.to_dict()
    except User.DoesNotExist:
        return None


def get_user_by_id(user_id):
    """
    Flask equivalent:
        SELECT id, name, email, created_at FROM users WHERE id = %s
    Returns a dict or None (password excluded).
    """
    try:
        user = User.objects.get(id=user_id)
        return {
            "id"        : user.id,
            "name"      : user.name,
            "email"     : user.email,
            "created_at": str(user.created_at),
        }
    except User.DoesNotExist:
        return None


# ---- Task helpers ----

def create_task(title, description, priority, due_date, user_id):
    """
    Flask equivalent:
        INSERT INTO tasks (title, description, priority, due_date, user_id)
        VALUES (...)
    """
    task = Task.objects.create(
        title=title,
        description=description or "",
        priority=priority,
        due_date=due_date or None,
        user_id=user_id,
    )
    return task.id


def get_all_tasks(user_id):
    """
    Flask equivalent:
        SELECT * FROM tasks WHERE user_id = %s ORDER BY created_at DESC
    Returns full list (no pagination) — used for CSV/JSON export.
    """
    tasks = Task.objects.filter(user_id=user_id).order_by("-created_at")
    return [t.to_dict() for t in tasks]


def get_tasks_paginated(user_id, page=1, per_page=10, status_filter=None):
    """
    Flask equivalent:
        SELECT * FROM tasks WHERE user_id = %s [AND status = %s]
        ORDER BY created_at DESC LIMIT %s OFFSET %s

    Django ORM does LIMIT/OFFSET via queryset slicing:
        qs[offset : offset + per_page]
    """
    qs = Task.objects.filter(user_id=user_id)

    # Apply optional status filter
    if status_filter in ("Pending", "Completed"):
        qs = qs.filter(status=status_filter)

    qs = qs.order_by("-created_at")

    total  = qs.count()                          # SELECT COUNT(*)
    offset = (page - 1) * per_page
    tasks  = qs[offset : offset + per_page]      # LIMIT / OFFSET via slicing

    return {
        "tasks"      : [t.to_dict() for t in tasks],
        "total"      : total,
        "page"       : page,
        "per_page"   : per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 1,
    }


def get_task_by_id(task_id, user_id):
    """
    Flask equivalent:
        SELECT * FROM tasks WHERE id = %s AND user_id = %s
    Returns a dict or None.
    """
    try:
        task = Task.objects.get(id=task_id, user_id=user_id)
        return task.to_dict()
    except Task.DoesNotExist:
        return None


def update_task(task_id, user_id, title, description, priority, status, due_date):
    """
    Flask equivalent:
        UPDATE tasks SET title=%s, description=%s, priority=%s,
        status=%s, due_date=%s WHERE id=%s AND user_id=%s
    Returns True if successful.
    """
    updated = Task.objects.filter(id=task_id, user_id=user_id).update(
        title=title,
        description=description or "",
        priority=priority,
        status=status,
        due_date=due_date or None,
    )
    return updated > 0   # True if at least one row was updated


def delete_task(task_id, user_id):
    """
    Flask equivalent:
        DELETE FROM tasks WHERE id = %s AND user_id = %s
    Returns True if a row was deleted.
    """
    deleted, _ = Task.objects.filter(id=task_id, user_id=user_id).delete()
    return deleted > 0


def toggle_task_status(task_id, user_id):
    """
    Flask equivalent:
        UPDATE tasks SET status = IF(status='Pending','Completed','Pending')
        WHERE id = %s AND user_id = %s

    Django has no IF() shorthand, so we fetch then update.
    The result is identical.
    """
    try:
        task = Task.objects.get(id=task_id, user_id=user_id)
        task.status = (
            Task.STATUS_COMPLETED
            if task.status == Task.STATUS_PENDING
            else Task.STATUS_PENDING
        )
        task.save(update_fields=["status"])
        return True
    except Task.DoesNotExist:
        return False


def get_dashboard_stats(user_id):
    """
    Flask equivalent: three separate COUNT(*) queries.
    Django ORM version uses .count() — same SQL under the hood.
    """
    total     = Task.objects.filter(user_id=user_id).count()
    completed = Task.objects.filter(user_id=user_id, status="Completed").count()
    pending   = Task.objects.filter(user_id=user_id, status="Pending").count()
    return {"total": total, "completed": completed, "pending": pending}
