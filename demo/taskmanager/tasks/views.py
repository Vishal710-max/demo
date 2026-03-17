# taskmanager/tasks/views.py
# ============================================================
# Django Views — REST API Endpoints
#
# FLASK → DJANGO CONVERSION NOTE:
#
#   Flask used two Blueprint files:
#     routes/auth_routes.py  → register, login, profile views
#     routes/task_routes.py  → dashboard, tasks CRUD views
#
#   Django consolidates both into this single views.py.
#   Each Flask @app.route() becomes a Django view function.
#
#   Key differences:
#     Flask:  @auth_bp.route("/register", methods=["POST"])
#     Django: def register(request): ...  (mapped in urls.py)
#
#     Flask:  return jsonify({...}), 200
#     Django: return JsonResponse({...}, status=200)
#
#     Flask:  request.get_json()
#     Django: json.loads(request.body)
#
#     Flask:  request.args.get("page")
#     Django: request.GET.get("page")
#
#     Flask:  request.headers.get("Authorization")
#     Django: request.META.get("HTTP_AUTHORIZATION")
#
#   All business logic, validation rules, and error messages
#   are IDENTICAL to the Flask version.
# ============================================================

import json
import datetime

import bcrypt
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .utils import get_user_id_from_request
from .models import (
    create_user, get_user_by_email, get_user_by_id,
    create_task, get_all_tasks, get_tasks_paginated,
    get_task_by_id, update_task, delete_task,
    toggle_task_status, get_dashboard_stats,
)


# ============================================================
# ROOT — health check
# Flask equivalent: @app.route("/")
# ============================================================

@csrf_exempt
def index(request):
    """
    Simple health-check endpoint.
    Flask equivalent: @app.route("/") → return {"message": "..."}
    """
    return JsonResponse({"message": "Smart Task Manager API is running!"})


# ============================================================
# AUTH VIEWS
# Flask equivalent: routes/auth_routes.py
# ============================================================

@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    """
    POST /register — Create a new user account.

    Flask equivalent:
        @auth_bp.route("/register", methods=["POST"])
        def register(): ...

    Changes:
        request.get_json()   → json.loads(request.body)
        jsonify({...}), 201  → JsonResponse({...}, status=201)
        bcrypt.generate_password_hash()  → bcrypt.hashpw()
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Validate required fields — same rules as Flask
    name     = data.get("name",     "").strip()
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return JsonResponse(
            {"error": "Name, email, and password are required"}, status=400
        )

    if len(password) < 6:
        return JsonResponse(
            {"error": "Password must be at least 6 characters"}, status=400
        )

    # Check for duplicate email — same logic as Flask
    if get_user_by_email(email):
        return JsonResponse(
            {"error": "Email is already registered"}, status=409
        )

    # Hash the password with bcrypt — same algorithm as Flask's flask-bcrypt
    # bcrypt.hashpw() produces the same $2b$ format hashes
    hashed_pw = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user_id = create_user(name, email, hashed_pw)

    return JsonResponse(
        {"message": "Registration successful! Please login.", "user_id": user_id},
        status=201
    )


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """
    POST /login — Authenticate user and return JWT token.

    Flask equivalent:
        @auth_bp.route("/login", methods=["POST"])
        def login(): ...

    Changes:
        flask_bcrypt.check_password_hash()  → bcrypt.checkpw()
        datetime.datetime.utcnow()          → same (unchanged)
        jwt.encode()                        → same (unchanged)
        Config.SECRET_KEY                   → settings.JWT_SECRET_KEY
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return JsonResponse(
            {"error": "Email and password are required"}, status=400
        )

    # Find user by email — same as Flask
    user = get_user_by_email(email)
    if not user:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    # Verify password against bcrypt hash — compatible with Flask's hashes
    password_matches = bcrypt.checkpw(
        password.encode("utf-8"),
        user["password"].encode("utf-8")
    )
    if not password_matches:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    # Create JWT token — identical logic to Flask
    expiry = datetime.datetime.utcnow() + datetime.timedelta(
        seconds=settings.JWT_EXPIRY_SECONDS
    )
    token = jwt.encode(
        {"user_id": user["id"], "exp": expiry},
        settings.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    return JsonResponse({
        "message": "Login successful",
        "token"  : token,
        "user"   : {
            "id"   : user["id"],
            "name" : user["name"],
            "email": user["email"],
        }
    }, status=200)


@csrf_exempt
@require_http_methods(["GET"])
def profile(request):
    """
    GET /profile — Return logged-in user's info.

    Flask equivalent:
        @auth_bp.route("/profile", methods=["GET"])
        def profile(): ...
    """
    user_id = get_user_id_from_request(request)
    if not user_id:
        return JsonResponse(
            {"error": "Unauthorized. Please login first."}, status=401
        )

    user = get_user_by_id(user_id)
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    return JsonResponse({"user": user}, status=200)


# ============================================================
# TASK VIEWS
# Flask equivalent: routes/task_routes.py
# ============================================================

@csrf_exempt
@require_http_methods(["GET"])
def dashboard(request):
    """
    GET /dashboard — Return task summary stats.

    Flask equivalent:
        @task_bp.route("/dashboard", methods=["GET"])
        def dashboard(): ...
    """
    user_id = get_user_id_from_request(request)
    if not user_id:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    stats = get_dashboard_stats(user_id)
    return JsonResponse({"stats": stats}, status=200)


@csrf_exempt
def tasks_list(request):
    """
    GET  /tasks  — Paginated task list (or full list if ?all=true)
    POST /tasks  — Create a new task

    FLASK → DJANGO CONVERSION NOTE:
        Flask used separate @route decorators for GET and POST.
        Django uses one view function and dispatches on request.method.
        This is equivalent — same URLs, same logic.

        Flask: request.args.get("page")
        Django: request.GET.get("page")  ← same query params, different syntax
    """
    user_id = get_user_id_from_request(request)
    if not user_id:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    # ---- GET /tasks ----
    if request.method == "GET":

        # ?all=true → skip pagination, return everything (used for export)
        if request.GET.get("all") == "true":
            tasks = get_all_tasks(user_id)
            return JsonResponse({"tasks": tasks}, status=200)

        # Pagination parameters — same validation as Flask
        try:
            page     = int(request.GET.get("page",     1))
            per_page = int(request.GET.get("per_page", 10))
        except ValueError:
            return JsonResponse(
                {"error": "page and per_page must be integers"}, status=400
            )

        page     = max(1, page)
        per_page = max(1, min(per_page, 100))

        status_filter = request.GET.get("status")   # optional filter

        result = get_tasks_paginated(user_id, page, per_page, status_filter)
        return JsonResponse(result, status=200)

    # ---- POST /tasks ----
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        title = data.get("title", "").strip()
        if not title:
            return JsonResponse({"error": "Task title is required"}, status=400)

        description = data.get("description", "")
        priority    = data.get("priority", "Medium")
        due_date    = data.get("due_date") or None

        if priority not in ["Low", "Medium", "High"]:
            return JsonResponse(
                {"error": "Priority must be Low, Medium, or High"}, status=400
            )

        task_id = create_task(title, description, priority, due_date, user_id)
        return JsonResponse(
            {"message": "Task created successfully", "task_id": task_id},
            status=201
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def task_detail(request, task_id):
    """
    GET    /tasks/<task_id>  — Get a single task
    PUT    /tasks/<task_id>  — Update a task
    DELETE /tasks/<task_id>  — Delete a task

    FLASK → DJANGO CONVERSION NOTE:
        Flask had three separate @route functions for GET/PUT/DELETE.
        Django combines them in one view and dispatches on request.method.

        Flask: @task_bp.route("/tasks/<int:task_id>", methods=["GET"])
        Django: path("tasks/<int:task_id>/", task_detail) in urls.py
    """
    user_id = get_user_id_from_request(request)
    if not user_id:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    # ---- GET /tasks/<id> ----
    if request.method == "GET":
        task = get_task_by_id(task_id, user_id)
        if not task:
            return JsonResponse({"error": "Task not found"}, status=404)
        return JsonResponse({"task": task}, status=200)

    # ---- PUT /tasks/<id> ----
    if request.method == "PUT":
        existing = get_task_by_id(task_id, user_id)
        if not existing:
            return JsonResponse({"error": "Task not found"}, status=404)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        # Use existing values as fallback — same as Flask
        title       = data.get("title",       existing["title"])
        description = data.get("description", existing["description"])
        priority    = data.get("priority",    existing["priority"])
        status      = data.get("status",      existing["status"])
        due_date    = data.get("due_date",    existing["due_date"]) or None

        if priority not in ["Low", "Medium", "High"]:
            return JsonResponse({"error": "Invalid priority"}, status=400)
        if status not in ["Pending", "Completed"]:
            return JsonResponse({"error": "Invalid status"}, status=400)

        success = update_task(
            task_id, user_id, title, description, priority, status, due_date
        )
        if success:
            return JsonResponse({"message": "Task updated successfully"}, status=200)
        return JsonResponse({"error": "Failed to update task"}, status=500)

    # ---- DELETE /tasks/<id> ----
    if request.method == "DELETE":
        success = delete_task(task_id, user_id)
        if success:
            return JsonResponse({"message": "Task deleted successfully"}, status=200)
        return JsonResponse({"error": "Task not found"}, status=404)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@require_http_methods(["PATCH"])
def task_toggle(request, task_id):
    """
    PATCH /tasks/<task_id>/toggle — Toggle task status.

    Flask equivalent:
        @task_bp.route("/tasks/<int:task_id>/toggle", methods=["PATCH"])
        def toggle_task(task_id): ...
    """
    user_id = get_user_id_from_request(request)
    if not user_id:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    success = toggle_task_status(task_id, user_id)
    if success:
        return JsonResponse({"message": "Task status updated"}, status=200)
    return JsonResponse({"error": "Task not found"}, status=404)
