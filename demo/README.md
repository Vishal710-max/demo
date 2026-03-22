# ✅ Smart Task & Productivity Manager — Django Version

**Migrated from Flask to Django · Same features · Same UI · Same database**

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

---


|---|---|---|
| Framework | `Flask` | `Django 4.2` |
| CORS | `Flask-CORS` | `django-cors-headers` |
| Password hashing | `Flask-Bcrypt` | `bcrypt` (same algorithm) |
| Database driver | `mysql-connector-python` | `mysqlclient` |
| Route decorators | `@app.route()` | `path()` in `urls.py` |
| Raw SQL queries | `cursor.execute()` | Django ORM |
| JSON response | `jsonify({})` | `JsonResponse({})` |
| Read request body | `request.get_json()` | `json.loads(request.body)` |
| Query params | `request.args.get()` | `request.GET.get()` |
| Request headers | `request.headers.get()` | `request.META.get("HTTP_...")` |
| Config file | `config.py` class | `settings.py` |
| Blueprints | `auth_routes.py` + `task_routes.py` | Single `views.py` |
| Server port | `5000` | `8000` |

> Everything else is **unchanged**: React frontend, CSS, JWT tokens, bcrypt hashes,
> database schema, table names, all API endpoints, and all business logic.

---

## Project Structure

```
smart-task-manager-django/
│
├── manage.py                          ← Django CLI entry point
├── requirements.txt                   ← Python dependencies
├── database.sql                       ← MySQL schema (same as Flask)
├── README.md
│
├── taskmanager/                       ← Django project package
│   ├── __init__.py
│   ├── settings.py                    ← All configuration (replaces config.py)
│   ├── urls.py                        ← Root URL router
│   ├── wsgi.py                        ← Production WSGI server entry
│   ├── asgi.py                        ← Production ASGI server entry
│   │
│   └── tasks/                         ← The main Django app
│       ├── __init__.py
│       ├── models.py                  ← Django ORM models + query helpers
│       ├── views.py                   ← All 9 API endpoints
│       ├── urls.py                    ← URL → view mapping
│       └── utils.py                   ← Shared JWT helper
│
└── frontend/                          ← React + Vite (100% unchanged)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── AuthContext.jsx
        │   └── Navbar.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   └── TasksPage.jsx
        └── services/
            └── api.js                 ← Only change: port 5000 → 8000
```

---

## API Endpoints (Identical to Flask)

| Method | Endpoint | Description | Auth |
|:---:|---|---|:---:|
| `GET` | `/` | Health check | ❌ |
| `POST` | `/register` | Create account | ❌ |
| `POST` | `/login` | Login, get JWT token | ❌ |
| `GET` | `/profile` | Get current user | ✅ |
| `GET` | `/dashboard` | Task stats | ✅ |
| `GET` | `/tasks` | Paginated tasks | ✅ |
| `GET` | `/tasks?all=true` | All tasks (export) | ✅ |
| `POST` | `/tasks` | Create task | ✅ |
| `GET` | `/tasks/<id>` | Get one task | ✅ |
| `PUT` | `/tasks/<id>` | Update task | ✅ |
| `DELETE` | `/tasks/<id>` | Delete task | ✅ |
| `PATCH` | `/tasks/<id>/toggle` | Toggle status | ✅ |

---

## Prerequisites

- Python 3.8+
- Node.js 18+
- MySQL 8.0+
- pip and npm

---

## Setup & Run

### Step 1 — Create the MySQL database

```bash
mysql -u root -p < database.sql
```

This creates the `smart_task_db` database with `users` and `tasks` tables.

---

### Step 2 — Configure database credentials

Open `taskmanager/settings.py` and update:

```python
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.mysql",
        "NAME":     "smart_task_db",
        "USER":     "root",           # ← your MySQL username
        "PASSWORD": "yourpassword",   # ← your MySQL password
        "HOST":     "localhost",
        "PORT":     "3306",
    }
}
```

Also update `SECRET_KEY` to a long random string before going to production.

---

### Step 3 — Install Python dependencies

```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

---

### Step 4 — Run Django migrations

```bash
# If the database tables were created by database.sql (already exist):
python manage.py makemigrations tasks
python manage.py migrate --fake-initial

# If starting with a fresh empty database:
python manage.py makemigrations tasks
python manage.py migrate
```

> **`--fake-initial`** tells Django the tables already exist and to just
> record the migration without trying to CREATE TABLE again.

---

### Step 5 — Start the Django backend

```bash
python manage.py runserver
```

✅ Backend running at: **http://localhost:8000**

Test it:
```bash
curl http://localhost:8000/
# Expected: {"message": "Smart Task Manager API is running!"}
```

---

### Step 6 — Start the React frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running at: **http://localhost:3000**

---

### Step 7 — Open the app

Navigate to **http://localhost:3000** and use the app exactly as before.

---

## Detailed Conversion Notes

### 1. Routes → URLs + Views

**Flask** combined route declaration and logic in one place:
```python
# Flask: routes/auth_routes.py
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    ...
    return jsonify({"message": "..."}), 201
```

**Django** separates them into two files:
```python
# Django: tasks/urls.py
path("register", views.register, name="register"),

# Django: tasks/views.py
@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = json.loads(request.body)
    ...
    return JsonResponse({"message": "..."}, status=201)
```

---

### 2. Blueprints → Single App

**Flask** used two separate Blueprint files:
```
routes/auth_routes.py  → /register, /login, /profile
routes/task_routes.py  → /tasks, /dashboard
```

**Django** puts everything in one `views.py` inside the `tasks` app.
The `tasks/urls.py` maps every URL to the right function.

---

### 3. Raw SQL → Django ORM

**Flask** — manual connection management:
```python
# Flask: models.py
def get_all_tasks(user_id):
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM tasks WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,)
    )
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    return tasks
```

**Django** — ORM handles connections automatically:
```python
# Django: models.py
def get_all_tasks(user_id):
    tasks = Task.objects.filter(user_id=user_id).order_by("-created_at")
    return [t.to_dict() for t in tasks]
```

---

### 4. Pagination — SQL LIMIT/OFFSET preserved

**Flask** used raw SQL:
```python
# Flask
cursor.execute(
    "SELECT * FROM tasks WHERE user_id = %s LIMIT %s OFFSET %s",
    (user_id, per_page, offset)
)
```

**Django** ORM slicing produces identical SQL:
```python
# Django — generates the same LIMIT/OFFSET SQL
qs = Task.objects.filter(user_id=user_id).order_by("-created_at")
tasks = qs[offset : offset + per_page]
```

---

### 5. Password Hashing — 100% Compatible

Both Flask and Django use the **bcrypt** library with the same `$2b$` hash format.
A password registered through Flask can be verified through Django and vice versa.

```python
# Flask (flask-bcrypt)
hashed = bcrypt.generate_password_hash(password).decode("utf-8")
bcrypt.check_password_hash(stored_hash, password)

# Django (bcrypt directly)
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode("utf-8")
bcrypt.checkpw(password.encode(), stored_hash.encode())
```

---

### 6. JWT Tokens — Unchanged

The same `PyJWT` library, same `SECRET_KEY`, same 24-hour expiry.
Tokens issued by Flask are valid in Django and vice versa.

---

### 7. Table Names — Unchanged

Django would normally name tables `tasks_user` and `tasks_task`.
We override this with `Meta.db_table` to keep the original names:

```python
class User(models.Model):
    class Meta:
        db_table = "users"   # keeps Flask's table name

class Task(models.Model):
    class Meta:
        db_table = "tasks"   # keeps Flask's table name
```

---

### 8. CSRF Protection

Django has built-in CSRF protection for form submissions.
Since this API uses **JWT tokens** (not session cookies), CSRF is not needed.
Every view uses `@csrf_exempt` to disable it for API endpoints.
The JWT token itself secures every protected request.

---

### 9. Frontend — Only One Line Changed

The entire React frontend is reused without modification.
The only change is the backend port in `api.js`:

```js
// Before (Flask)
const API_URL = "http://localhost:5000";

// After (Django)
const API_URL = "http://localhost:8000";
```

All pages, components, CSS, Toastify notifications, the lockout system,
pagination controls, CSV/JSON export, and due date warnings are identical.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `django.db.utils.OperationalError` | Check MySQL credentials in `settings.py` |
| `ModuleNotFoundError: No module named 'MySQLdb'` | Run `pip install mysqlclient` |
| `Table already exists` during migrate | Use `python manage.py migrate --fake-initial` |
| `CORS error` in browser | Make sure Django is running on port 8000 |
| `401 Unauthorized` on all requests | Token expired — log out and log in again |
| `npm: command not found` | Install Node.js from nodejs.org |
| Port 8000 already in use | Run `python manage.py runserver 8001` and update `api.js` |

---

## Running Both Versions Side by Side

You can run Flask and Django simultaneously pointing at the same MySQL database:

```
Flask  → http://localhost:5000  (python app.py)
Django → http://localhost:8000  (python manage.py runserver)
MySQL  → localhost:3306         (shared smart_task_db)
React  → http://localhost:3000  (npm run dev — points to whichever backend)
```

Switch between backends by changing the port in `frontend/src/services/api.js`.

---

*Smart Task & Productivity Manager — Django Migration · College Full-Stack Project*
