import os
from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


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


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    # Perezoso: así los tests que no tocan la base no necesitan DATABASE_URL.
    return sessionmaker(get_engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Dependencia de FastAPI: una sesión por pedido."""
    with get_sessionmaker()() as session:
        yield session
