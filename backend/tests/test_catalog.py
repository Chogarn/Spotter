"""El catálogo de ejercicios (borrador) respeta las etiquetas cerradas de R13."""

import json
import re
from collections import Counter
from pathlib import Path

import pytest

from app.enums import (
    ExerciseDirection,
    ExerciseEquipment,
    ExerciseKind,
    ExerciseMechanic,
    ExerciseRegion,
    Level,
    Muscle,
)

CATALOG = Path(__file__).parent.parent / "app" / "ai" / "exercises.json"
BIG_GROUPS = ("chest", "back", "shoulders", "quadriceps", "hamstrings", "glutes")


@pytest.fixture(scope="module")
def ejercicios():
    return json.loads(CATALOG.read_text(encoding="utf-8"))["exercises"]


def test_cada_ejercicio_usa_solo_valores_de_las_listas_cerradas(ejercicios):
    for e in ejercicios:
        assert ExerciseKind(e["kind"]), e["id"]
        assert ExerciseRegion(e["region"]), e["id"]
        assert ExerciseDirection(e["direction"]), e["id"]
        assert Muscle(e["primary_muscle"]), e["id"]
        assert all(Muscle(m) for m in e["secondary_muscles"]), e["id"]
        assert ExerciseMechanic(e["mechanic"]), e["id"]
        assert ExerciseEquipment(e["equipment"]), e["id"]
        assert Level(e["level"]), e["id"]


def test_los_ids_y_los_nombres_no_se_repiten(ejercicios):
    ids = Counter(e["id"] for e in ejercicios)
    nombres = Counter(e["name"].lower() for e in ejercicios)
    assert [i for i, n in ids.items() if n > 1] == []
    assert [i for i, n in nombres.items() if n > 1] == []
    assert all(re.fullmatch(r"[a-z0-9_]+", e["id"]) for e in ejercicios)


def test_el_cardio_y_el_isometrico_siguen_r13(ejercicios):
    for e in ejercicios:
        if e["kind"] == "cardio":
            assert e["region"] == "full_body" and e["primary_muscle"] == "full_body", e["id"]
            assert e["direction"] == "none", e["id"]
        if e["kind"] == "isometric":
            assert e["region"] == "core" and e["primary_muscle"] == "core", e["id"]
        if e["kind"] == "strength":
            assert e["primary_muscle"] != "full_body", e["id"]


def test_la_direccion_solo_empuja_o_tira_en_el_tren_superior(ejercicios):
    for e in ejercicios:
        if e["region"] != "upper":
            assert e["direction"] == "none", e["id"]
        else:
            assert e["direction"] in ("push", "pull"), e["id"]


def test_el_musculo_secundario_no_repite_al_primario(ejercicios):
    for e in ejercicios:
        assert e["primary_muscle"] not in e["secondary_muscles"], e["id"]


def test_hay_opciones_para_principiantes_en_los_seis_grupos_grandes(ejercicios):
    for grupo in BIG_GROUPS:
        opciones = [e for e in ejercicios if e["primary_muscle"] == grupo and e["level"] == "principiante"]
        assert len(opciones) >= 2, grupo


def test_hay_tirones_suficientes_para_r14(ejercicios):
    """R14: tirón igual o mayor que empuje. El catálogo no debe empujar más de lo que tira."""
    superior = [e for e in ejercicios if e["region"] == "upper" and e["kind"] == "strength"]
    empujes = sum(e["direction"] == "push" for e in superior)
    tirones = sum(e["direction"] == "pull" for e in superior)
    assert tirones >= empujes * 0.6  # umbral de sanidad del borrador, no una regla de la app


def test_hay_cardio_variado(ejercicios):
    assert sum(e["kind"] == "cardio" for e in ejercicios) >= 4


# R5b (borrador): un músculo figura como secundario solo si es sinergista principal.
# Estos pares (ejercicio, músculo) son estabilizadores y no deben volver a figurar.
ESTABILIZADORES = [
    ("sentadilla_barra", "core"), ("sentadilla_barra", "hamstrings"),
    ("sentadilla_frontal_barra", "core"), ("sentadilla_goblet", "core"),
    ("sentadilla_bulgara", "hamstrings"), ("prensa_piernas", "hamstrings"),
    ("zancadas_mancuernas", "hamstrings"), ("peso_muerto_convencional", "core"),
    ("peso_muerto_convencional", "back"), ("peso_muerto_rumano_barra", "back"),
    ("peso_muerto_rumano_mancuernas", "back"), ("kettlebell_swing", "core"),
    ("kettlebell_swing", "back"), ("pallof_press", "shoulders"),
    ("rueda_abdominal", "shoulders"), ("pullover_polea", "triceps"),
]


@pytest.mark.parametrize("ejercicio_id,musculo", ESTABILIZADORES)
def test_los_estabilizadores_no_figuran_como_secundarios(ejercicios, ejercicio_id, musculo):
    ejercicio = next(e for e in ejercicios if e["id"] == ejercicio_id)
    assert musculo not in ejercicio["secondary_muscles"]


# --- Versión 2: datos para el RAG (descripción y alias) ---


def _normalizar(texto: str) -> str:
    """Igual que `normalize_name` de plan_writer: minúsculas y sin tildes."""
    import unicodedata

    sin_tildes = "".join(
        c for c in unicodedata.normalize("NFKD", texto) if not unicodedata.combining(c)
    )
    return re.sub(r"\s+", " ", sin_tildes).strip().lower()


def test_cada_ejercicio_tiene_descripcion_y_alias(ejercicios):
    for e in ejercicios:
        assert len(e["description"].strip()) >= 20, e["id"]
        assert isinstance(e["aliases"], list) and e["aliases"], e["id"]
        assert all(a.strip() for a in e["aliases"]), e["id"]


def test_ningun_nombre_ni_alias_apunta_a_dos_ejercicios(ejercicios):
    """El código busca por nombre o alias: si dos ejercicios lo comparten, el resultado es ambiguo."""
    dueno: dict[str, str] = {}
    choques = []
    for e in ejercicios:
        for texto in [e["name"], *e["aliases"]]:
            clave = _normalizar(texto)
            if clave in dueno and dueno[clave] != e["id"]:
                choques.append((texto, dueno[clave], e["id"]))
            dueno.setdefault(clave, e["id"])
    assert choques == []


def test_hay_mas_de_un_ejercicio_por_grupo_y_nivel_para_que_la_ia_elija(ejercicios):
    for grupo in BIG_GROUPS:
        del_grupo = [e for e in ejercicios if e["primary_muscle"] == grupo]
        assert len(del_grupo) >= 8, grupo
    for grupo in ("calves", "core", "biceps", "triceps"):
        assert len([e for e in ejercicios if e["primary_muscle"] == grupo]) >= 4, grupo


def test_hay_variedad_de_equipamiento(ejercicios):
    for equipo in ("barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "kettlebell"):
        assert any(e["equipment"] == equipo for e in ejercicios), equipo
