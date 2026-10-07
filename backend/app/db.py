import os

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase base de todos los modelos de la base de datos."""


def get_database_url() -> str:
    """Lee DATABASE_URL y la adapta al driver psycopg (v3)."""
    url = os.environ["DATABASE_URL"]
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def get_engine() -> Engine:
    return create_engine(get_database_url())
