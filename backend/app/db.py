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


def engine_options() -> dict:
    """Ajustes del motor. En Vercel (VERCEL=1) la base se alcanza por la dirección con pool de Neon
    (pgbouncer en modo transacción): no admite sentencias preparadas, y cada instancia de la función
    tiene que usar pocas conexiones."""
    if os.environ.get("VERCEL"):
        return {
            "connect_args": {"prepare_threshold": None},
            "pool_size": 2,
            "max_overflow": 2,
            "pool_recycle": 300,
            "pool_pre_ping": True,
        }
    return {}


def get_engine() -> Engine:
    return create_engine(get_database_url(), **engine_options())


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    # Perezoso: así los tests que no tocan la base no necesitan DATABASE_URL.
    return sessionmaker(get_engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Dependencia de FastAPI: una sesión por pedido."""
    with get_sessionmaker()() as session:
        yield session
