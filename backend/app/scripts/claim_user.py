"""Reclama el usuario de desarrollo: lo convierte en una cuenta real (una sola vez).

Antes del login, todo lo que se hizo en desarrollo quedó en el usuario `dev@spotter.local`
(perfil, rutinas y, sobre todo, las filas de `ai_calls`, que no se pueden borrar). Este script
le pone un email, un nombre y una contraseña reales SIN cambiar su id, así que todo lo que
cuelga de él sigue ahí.

Uso (la contraseña se escribe por teclado: no queda en el historial ni en ningún archivo):

    docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.claim_user
"""

import getpass
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_sessionmaker
from app.deps import DEV_USER_EMAIL
from app.models import User
from app.schemas import RegisterIn
from app.security import hash_password


class ClaimError(Exception):
    """No se puede reclamar: el mensaje dice por qué."""


def claim_dev_user(db: Session, email: str, name: str, password: str) -> User:
    """Cambia email, nombre y contraseña del usuario de desarrollo. No hace commit."""
    # Las mismas reglas que el registro (email válido, contraseña de 8 a 128, nombre).
    datos = RegisterIn(email=email, password=password, name=name)

    dev = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
    if dev is None:
        # Tras reclamarlo su email ya no es el de desarrollo: se distingue de "nunca existió".
        if db.scalar(select(User).where(User.password_hash.like("$argon2%"))) is not None:
            raise ClaimError("El usuario de desarrollo ya fue reclamado: ya hay una cuenta con contraseña real.")
        raise ClaimError("No existe el usuario de desarrollo: no hay nada que reclamar.")
    if dev.password_hash.startswith("$argon2"):
        raise ClaimError("El usuario de desarrollo ya fue reclamado: ya tiene una contraseña real.")
    if db.scalar(select(User).where(User.email == datos.email)) is not None:
        raise ClaimError(f"El email {datos.email} ya lo usa otra cuenta.")

    dev.email = datos.email
    dev.name = datos.name
    dev.password_hash = hash_password(datos.password)
    return dev


def main() -> int:
    print("Reclamar el usuario de desarrollo (se hace una sola vez).")
    email = input("Email: ").strip()
    name = input("Nombre: ").strip()
    password = getpass.getpass("Contraseña (mínimo 8 caracteres): ")
    if getpass.getpass("Repetí la contraseña: ") != password:
        print("Las contraseñas no coinciden. No se cambió nada.")
        return 1

    with get_sessionmaker()() as db:
        try:
            user = claim_dev_user(db, email, name, password)
        except ClaimError as error:
            print(f"No se cambió nada: {error}")
            return 1
        except ValueError as error:  # datos inválidos (email, contraseña corta...)
            print(f"No se cambió nada: {error}")
            return 1
        db.commit()
        print(f"Listo: la cuenta {user.email} ({user.name}) ya tiene contraseña. Iniciá sesión en /login.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
