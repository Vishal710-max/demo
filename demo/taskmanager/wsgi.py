# taskmanager/wsgi.py
# WSGI entry point for production deployment (e.g. gunicorn, uWSGI)
# Flask equivalent: there was no explicit wsgi.py — Flask ran via app.run()
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskmanager.settings")
application = get_wsgi_application()
