# taskmanager/urls.py
# ============================================================
# Root URL Configuration
#
# FLASK → DJANGO CONVERSION NOTE:
#   Flask used app.register_blueprint(auth_bp) and
#   app.register_blueprint(task_bp) in app.py.
#
#   Django equivalent:
#     - This root urls.py includes the app's urls.py
#     - taskmanager/tasks/urls.py defines every endpoint
#     - include("") with prefix "" keeps all URLs at root level
#       so /register, /login, /tasks etc. remain unchanged.
# ============================================================

from django.urls import path, include

urlpatterns = [
    # Include all task/auth routes at the root level (no prefix)
    # This preserves the exact same URL structure as Flask:
    #   /register, /login, /profile, /dashboard, /tasks, /tasks/<id>
    path("", include("taskmanager.tasks.urls")),
]
