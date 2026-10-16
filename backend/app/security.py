"""Contraseñas y sesión: hash de la contraseña y token JWT que viaja en una cookie httpOnly.

- La contraseña nunca se guarda: solo su hash (argon2, con sal propia y lento a propósito).
- La sesión es un JWT firmado con `JWT_SECRET` (sin valor por defecto: si falta, no hay sesión).
- El token vive en una cookie `httpOnly`: el JavaScript de la página no puede leerlo.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

COOKIE_NAME = "spotter_session"
SESSION_DAYS = 7
ALGORITHM = "HS256"

_hasher = PasswordHasher()
# Para que "el email no existe" tarde lo mismo que "la contraseña es incorrecta".
_DUMMY_HASH = _hasher.hash("no-es-la-contraseña-de-nadie")


class SessionConfigError(Exception):
    """Falta JWT_SECRET: no se puede firmar ni leer una sesión."""


def jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET", "")
    if not secret:
        raise SessionConfigError
    return secret


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """False también si el hash no es un hash real (por ejemplo, el texto de relleno viejo)."""
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError, ValueError):
        return False


def burn_time() -> None:
    """Gasta lo mismo que una verificación real (email desconocido)."""
    verify_password("x", _DUMMY_HASH)


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    claims = {"sub": str(user_id), "iat": now, "exp": now + timedelta(days=SESSION_DAYS)}
    return jwt.encode(claims, jwt_secret(), algorithm=ALGORITHM)


def read_token(token: str) -> int | None:
    """El id del usuario, o None si el token no es válido, está vencido o fue alterado."""
    try:
        claims = jwt.decode(token, jwt_secret(), algorithms=[ALGORITHM])
        return int(claims["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def read_session(token: str) -> tuple[int, int] | None:
    """(id del usuario, cuándo se emitió el token en segundos), o None si no es válido."""
    try:
        claims = jwt.decode(token, jwt_secret(), algorithms=[ALGORITHM])
        return int(claims["sub"]), int(claims["iat"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def cookie_secure() -> bool:
    """En producción con HTTPS la cookie va con Secure (COOKIE_SECURE=true)."""
    return os.environ.get("COOKIE_SECURE", "false").lower() == "true"
