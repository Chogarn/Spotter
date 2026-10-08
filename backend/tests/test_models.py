from sqlalchemy import UniqueConstraint

from app.db import Base, get_database_url
from app import models  # noqa: F401  (registra las tablas en Base.metadata)

TABLAS_ESPERADAS = {
    "users",
    "profiles",
    "exercises",
    "week_plans",
    "plan_days",
    "plan_exercises",
    "plan_sets",
    "workout_sessions",
    "set_entries",
}


def test_los_modelos_definen_las_tablas_del_nucleo():
    assert set(Base.metadata.tables) == TABLAS_ESPERADAS


def test_el_nombre_normalizado_del_ejercicio_es_unico():
    tabla = Base.metadata.tables["exercises"]
    assert tabla.c.name_normalized.unique


def test_un_ejercicio_planificado_no_repite_el_numero_de_serie():
    tabla = Base.metadata.tables["plan_sets"]
    unicas = [
        {c.name for c in constraint.columns}
        for constraint in tabla.constraints
        if isinstance(constraint, UniqueConstraint)
    ]
    assert {"plan_exercise_id", "set_number"} in unicas


def test_el_ejercicio_planificado_ya_no_guarda_series_ni_pesos():
    columnas = set(Base.metadata.tables["plan_exercises"].c.keys())
    assert not columnas & {"sets", "reps", "target_weight_kg"}
    assert "execution_notes" in columnas


def test_database_url_usa_el_driver_psycopg(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db:5432/spotter")
    assert get_database_url() == "postgresql+psycopg://u:p@db:5432/spotter"
