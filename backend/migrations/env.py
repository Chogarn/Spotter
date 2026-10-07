from logging.config import fileConfig

from alembic import context

from app import models  # noqa: F401  (registra las tablas en Base.metadata)
from app.db import Base, get_database_url, get_engine

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Alembic compara estos modelos con la base para generar las migraciones.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Genera el SQL sin conectarse a la base."""
    context.configure(
        url=get_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Aplica las migraciones conectándose a DATABASE_URL."""
    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
