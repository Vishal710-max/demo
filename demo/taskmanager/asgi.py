# taskmanager/asgi.py
# ASGI entry point for async-capable servers (e.g. Daphne, Uvicorn)
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskmanager.settings")
application = get_asgi_application()
