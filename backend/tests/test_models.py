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
    "plan_proposals",
    "ai_calls",
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


def _restricciones_check(tabla):
    return {c.name for c in Base.metadata.tables[tabla].constraints if c.name}


def test_una_serie_se_mide_en_repeticiones_o_en_minutos():
    assert "ck_plan_sets_reps_or_duration" in _restricciones_check("plan_sets")
    assert "ck_set_entries_reps_or_duration" in _restricciones_check("set_entries")


def test_el_cardio_se_registra_en_minutos_y_sin_peso():
    plan = Base.metadata.tables["plan_sets"]
    real = Base.metadata.tables["set_entries"]
    assert "duration_minutes" in plan.c and "duration_minutes" in real.c
    assert plan.c.reps.nullable and real.c.reps.nullable
    assert real.c.weight_kg.nullable


def test_el_ejercicio_tiene_tipo_fuerza_o_cardio():
    assert "kind" in Base.metadata.tables["exercises"].c


def test_el_perfil_no_pide_dias_ni_duracion_de_la_sesion():
    columnas = set(Base.metadata.tables["profiles"].c.keys())
    assert "days_per_week" not in columnas
    assert "session_minutes" not in columnas


def test_el_ejercicio_lleva_las_etiquetas_cerradas_de_r13():
    tabla = Base.metadata.tables["exercises"]
    etiquetas = {
        "region", "direction", "primary_muscle", "secondary_muscles",
        "mechanic", "equipment", "level",
    }
    assert etiquetas <= set(tabla.c.keys())
    for nombre in etiquetas:
        assert not tabla.c[nombre].nullable, nombre


def test_el_descanso_es_un_campo_propio_y_opcional_del_ejercicio_planificado():
    tabla = Base.metadata.tables["plan_exercises"]
    assert "rest_seconds" in tabla.c
    assert tabla.c.rest_seconds.nullable
    assert "ck_plan_exercises_rest" in {c.name for c in tabla.constraints if c.name}


def test_el_dia_puede_llevar_un_texto_de_movilidad_y_equilibrio():
    tabla = Base.metadata.tables["plan_days"]
    assert "mobility_notes" in tabla.c
    assert tabla.c.mobility_notes.nullable


def test_database_url_usa_el_driver_psycopg(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db:5432/spotter")
    assert get_database_url() == "postgresql+psycopg://u:p@db:5432/spotter"


def _checks(tabla):
    from sqlalchemy import CheckConstraint

    return {c.name: str(c.sqltext) for c in tabla.constraints if isinstance(c, CheckConstraint)}


def test_una_serie_planificada_se_mide_en_repeticiones_minutos_o_segundos():
    for nombre in ("plan_sets", "set_entries"):
        columnas = Base.metadata.tables[nombre].c
        assert "duration_seconds" in columnas
        checks = _checks(Base.metadata.tables[nombre])
        assert "duration_seconds" in checks[f"ck_{nombre}_reps_or_duration"]


def test_el_tipo_de_ejercicio_incluye_el_isometrico():
    tabla = Base.metadata.tables["exercises"]
    assert set(tabla.c.kind.type.enums) == {"strength", "cardio", "isometric"}
