# taskmanager/settings.py
# ============================================================
# Django Settings for Smart Task & Productivity Manager
#
# FLASK → DJANGO CONVERSION NOTE:
#   Flask used a separate config.py with a Config class.
#   Django centralises all configuration here in settings.py.
#   The database, secret key, CORS, and JWT settings that
#   lived in config.py are all configured in this one file.
# ============================================================

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# SECURITY
# ============================================================
# Flask equivalent: Config.SECRET_KEY
# Used internally by Django AND by PyJWT to sign tokens
SECRET_KEY = "college_project_secret_key_2025"   # ← change in production

# Flask equivalent: app.run(debug=True)
DEBUG = True

# Allowed hosts — add your domain name here in production
ALLOWED_HOSTS = ["*"]


# ============================================================
# JWT TOKEN SETTINGS
# (same values as Flask config.py)
# ============================================================
JWT_SECRET_KEY      = SECRET_KEY   # same key used to sign tokens
JWT_EXPIRY_SECONDS  = 86400        # 24 hours — same as before


# ============================================================
# INSTALLED APPS
# ============================================================
# Flask equivalent: app.register_blueprint()
# In Django, each feature is an "app" registered here.
# "tasks" is our custom app that replaces auth_routes + task_routes.
INSTALLED_APPS = [
    "django.contrib.contenttypes",  # required by Django internals
    "django.contrib.staticfiles",   # serves CSS/JS files
    "corsheaders",                  # Flask-CORS equivalent
    "taskmanager.tasks",            # our task + auth app
]


# ============================================================
# MIDDLEWARE
# ============================================================
# FLASK equivalent: CORS(app, ...) — CorsMiddleware replaces it.
# Middleware runs on every request before it reaches the view.
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # must be FIRST
    "django.middleware.common.CommonMiddleware",
]

# CORS — allow the React frontend (port 3000) to call Django (port 8000)
# Flask equivalent: CORS(app, resources={r"/*": {"origins": "*"}})
CORS_ALLOW_ALL_ORIGINS = True

# Django's CSRF protection is disabled here because we use JWT,
# not session cookies. JWT tokens are verified on every request instead.
CSRF_COOKIE_SECURE         = False
SESSION_COOKIE_SECURE      = False


# ============================================================
# URL CONFIGURATION
# ============================================================
# Flask equivalent: app.register_blueprint(auth_bp) etc.
# This points Django to the root urls.py file.
ROOT_URLCONF = "taskmanager.urls"


# ============================================================
# TEMPLATES
# ============================================================
# Not used for this API-only backend (React is the frontend),
# but required for Django to start without errors.
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS":    [BASE_DIR / "taskmanager" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
            ],
        },
    },
]


# ============================================================
# DATABASE (MySQL)
# ============================================================
# FLASK EQUIVALENT:
#   database.py used mysql.connector.connect(host=..., user=..., ...)
#   models.py called get_connection() manually before every query.
#
# DJANGO EQUIVALENT:
#   Django's ORM manages connections automatically.
#   We declare the connection once here and Django handles
#   opening/closing connections per request.
#
# NOTE: The table names are kept identical to the Flask project
#       using Meta.db_table = "users" / "tasks" in models.py.
#       This means the same MySQL database works for both.
# ============================================================
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.mysql",
        "NAME":     "smart_task_db",    # same database as Flask project
        "USER":     "root",             # ← your MySQL username
        "PASSWORD": "system",                 # ← your MySQL password
        "HOST":     "localhost",
        "PORT":     "3306",
        "OPTIONS": {
            "charset": "utf8mb4",
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}


# ============================================================
# PASSWORD HASHING
# ============================================================
# Flask used flask-bcrypt explicitly in views.
# Django has built-in password hashers but we keep using
# bcrypt manually in views.py to stay 100% compatible with
# existing hashed passwords in the database.
PASSWORD_HASHERS = []   # we handle hashing manually with bcrypt


# ============================================================
# STATIC FILES (CSS, JS)
# ============================================================
STATIC_URL       = "/static/"
STATICFILES_DIRS = [BASE_DIR / "taskmanager" / "static"]


# ============================================================
# INTERNATIONALISATION
# ============================================================
LANGUAGE_CODE = "en-us"
TIME_ZONE     = "UTC"
USE_I18N      = False
USE_TZ        = False    # matches Flask behaviour (naive datetimes)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
