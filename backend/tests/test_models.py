from app.db import Base, get_database_url
from app import models  # noqa: F401  (registra las tablas en Base.metadata)

TABLAS_ESPERADAS = {
    "users",
    "profiles",
    "exercises",
    "week_plans",
    "plan_days",
    "plan_exercises",
    "workout_sessions",
    "set_entries",
}


def test_los_modelos_definen_las_tablas_del_nucleo():
    assert set(Base.metadata.tables) == TABLAS_ESPERADAS


def test_el_nombre_normalizado_del_ejercicio_es_unico():
    tabla = Base.metadata.tables["exercises"]
    assert tabla.c.name_normalized.unique


def test_database_url_usa_el_driver_psycopg(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db:5432/spotter")
    assert get_database_url() == "postgresql+psycopg://u:p@db:5432/spotter"
