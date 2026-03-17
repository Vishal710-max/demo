# taskmanager/tasks/utils.py
# ============================================================
# Shared Utility Functions
#
# FLASK → DJANGO CONVERSION NOTE:
#   In Flask, get_current_user() was duplicated in both
#   auth_routes.py and task_routes.py.
#
#   In Django we centralise it here in utils.py and import
#   it into views.py. This is cleaner and avoids repetition.
#
#   The logic is IDENTICAL to Flask — reads the Authorization
#   header, splits out the Bearer token, decodes it with PyJWT.
# ============================================================

import jwt
from django.conf import settings


def get_user_id_from_request(request):
    """
    Extract and verify the JWT token from the Authorization header.

    Flask equivalent (in both auth_routes.py and task_routes.py):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")

    Django equivalent:
        request.META contains headers — "Authorization" becomes
        "HTTP_AUTHORIZATION" in Django's META dict.

    Returns:
        user_id (int) if token is valid
        None if token is missing, expired, or invalid
    """
    # Django stores headers in request.META with HTTP_ prefix
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,   # from settings.py (was Config.SECRET_KEY)
            algorithms=["HS256"]
        )
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None   # token expired
    except jwt.InvalidTokenError:
        return None   # token malformed or tampered
