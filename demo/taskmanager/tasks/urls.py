# taskmanager/tasks/urls.py
# ============================================================
# App-Level URL Routing
#
# FLASK → DJANGO CONVERSION NOTE:
#
#   Flask used @blueprint.route() decorators directly on functions:
#     @auth_bp.route("/register", methods=["POST"])
#     @task_bp.route("/tasks/<int:task_id>", methods=["GET"])
#
#   Django separates URL patterns from view functions.
#   URLs are defined here; views live in views.py.
#   The result is IDENTICAL endpoint paths — the React frontend
#   does not need any changes.
#
#   Flask URL param syntax  →  Django URL param syntax:
#     <int:task_id>         →  <int:task_id>   (same!)
#
#   All original endpoints preserved:
#     POST   /register
#     POST   /login
#     GET    /profile
#     GET    /dashboard
#     GET    /tasks              (paginated)
#     GET    /tasks?all=true     (export)
#     POST   /tasks
#     GET    /tasks/<id>
#     PUT    /tasks/<id>
#     DELETE /tasks/<id>
#     PATCH  /tasks/<id>/toggle
# ============================================================

from django.urls import path
from . import views

urlpatterns = [

    # ---- Health check ----
    # Flask: @app.route("/")
    path("", views.index, name="index"),

    # ---- Authentication ----
    # Flask: @auth_bp.route("/register", methods=["POST"])
    path("register", views.register, name="register"),

    # Flask: @auth_bp.route("/login", methods=["POST"])
    path("login", views.login, name="login"),

    # Flask: @auth_bp.route("/profile", methods=["GET"])
    path("profile", views.profile, name="profile"),

    # ---- Dashboard ----
    # Flask: @task_bp.route("/dashboard", methods=["GET"])
    path("dashboard", views.dashboard, name="dashboard"),

    # ---- Tasks CRUD ----
    # Flask: @task_bp.route("/tasks", methods=["GET", "POST"])
    # Handles both GET (list/paginate) and POST (create)
    path("tasks", views.tasks_list, name="tasks-list"),

    # Flask: @task_bp.route("/tasks/<int:task_id>", methods=["GET","PUT","DELETE"])
    # Handles GET (retrieve), PUT (update), DELETE (delete)
    path("tasks/<int:task_id>", views.task_detail, name="task-detail"),

    # Flask: @task_bp.route("/tasks/<int:task_id>/toggle", methods=["PATCH"])
    path("tasks/<int:task_id>/toggle", views.task_toggle, name="task-toggle"),
]
