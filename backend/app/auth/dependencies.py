from app.auth.auth_helper import AuthHelper


# Singleton
_auth_service = AuthHelper()


def get_auth_service() -> AuthHelper:
    return _auth_service
