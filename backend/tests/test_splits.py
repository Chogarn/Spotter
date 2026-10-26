"""Compatibilidad y validación de las estructuras semanales elegidas (decisión 91)."""

from copy import deepcopy

from app.ai.routine import RoutineProposal
from app.ai.rules import validate_routine
from app.ai.splits import compatible_splits
from app.enums import Goal, Level, RoutineSplit
from tests.test_proposals import (
    GRANDES,
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)


def grupos_por_split(split: RoutineSplit, dia: int) -> set[str]:
    if split == RoutineSplit.FULL_BODY:
        return {grupo[1] for grupo in GRANDES}
    if split == RoutineSplit.UPPER_LOWER:
        return {"chest", "back", "shoulders"} if dia % 2 == 0 else {"quadriceps", "hamstrings", "glutes"}
    fase = dia % 3
    return (
        {"chest", "shoulders"}
        if fase == 0
        else {"back"}
        if fase == 1
        else {"quadriceps", "hamstrings", "glutes"}
    )


def propuesta(split: RoutineSplit, days: int) -> RoutineProposal:
    result = deepcopy(rutina(dias=days))
    result["days"] = [deepcopy(result["days"][0]) for _ in range(days)]
    for index, day in enumerate(result["days"]):
        groups = grupos_por_split(split, index)
        day["exercises"] = [exercise for exercise in day["exercises"] if exercise["primary_muscle"] in groups]
    return RoutineProposal.model_validate(result)


def test_matriz_de_opciones_y_combinaciones_incompatibles():
    assert compatible_splits(2, Level.PRINCIPIANTE, Goal.MASA) == (RoutineSplit.FULL_BODY,)
    assert compatible_splits(3, Level.PRINCIPIANTE, Goal.FUERZA) == (RoutineSplit.FULL_BODY,)
    assert compatible_splits(3, Level.INTERMEDIO, Goal.FUERZA) == (RoutineSplit.FULL_BODY,)
    assert compatible_splits(2, Level.INTERMEDIO, Goal.MASA) == (RoutineSplit.FULL_BODY,)
    assert compatible_splits(2, Level.INTERMEDIO, Goal.FUERZA) == (
        RoutineSplit.FULL_BODY,
        RoutineSplit.UPPER_LOWER,
    )
    assert compatible_splits(4, Level.AVANZADO, Goal.MASA) == (
        RoutineSplit.FULL_BODY,
        RoutineSplit.UPPER_LOWER,
    )
    assert compatible_splits(5, Level.INTERMEDIO, Goal.FUERZA) == (
        RoutineSplit.FULL_BODY,
        RoutineSplit.UPPER_LOWER,
    )
    assert compatible_splits(6, Level.AVANZADO, Goal.FUERZA) == (
        RoutineSplit.FULL_BODY,
        RoutineSplit.UPPER_LOWER,
        RoutineSplit.PPL,
    )


def test_cada_split_valida_su_secuencia_de_grupos():
    casos = [
        (RoutineSplit.FULL_BODY, Goal.FUERZA, Level.PRINCIPIANTE, 2),
        (RoutineSplit.UPPER_LOWER, Goal.FUERZA, Level.INTERMEDIO, 4),
        (RoutineSplit.PPL, Goal.FUERZA, Level.AVANZADO, 6),
    ]
    for split, goal, level, days in casos:
        resultado = validate_routine(propuesta(split, days), goal, level, days=days, split=split)
        assert not resultado.errors, (split, resultado.errors)


def test_split_incompatible_se_rechaza_antes_de_llamar_a_gemini(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina(dias=3))

    respuesta = api.post(
        "/proposals/generate",
        json={"goal": "fuerza", "level": "avanzado", "days": 3, "split": "ppl"},
    )

    assert respuesta.status_code == 422
    assert falso.llamadas == 0


def test_split_elegido_viaja_al_prompt_y_queda_guardado_al_aceptar(api, entorno, monkeypatch):
    con_perfil(api)
    upper_lower = deepcopy(rutina(dias=2))
    upper_lower["days"] = [deepcopy(upper_lower["days"][0]) for _ in range(2)]
    upper_lower["days"][0]["exercises"] = [e for e in upper_lower["days"][0]["exercises"] if e["primary_muscle"] in {"chest", "back", "shoulders"}]
    upper_lower["days"][1]["exercises"] = [e for e in upper_lower["days"][1]["exercises"] if e["primary_muscle"] in {"quadriceps", "hamstrings", "glutes"}]
    falso = usar_gemini(monkeypatch, upper_lower)

    propuesta_out = api.post(
        "/proposals/generate",
        json={"goal": "fuerza", "level": "avanzado", "days": 2, "split": "upper_lower"},
    )

    assert propuesta_out.status_code == 201
    cuerpo = propuesta_out.json()
    assert cuerpo["split"] == "upper_lower"
    assert "Estructura elegida: torso y pierna" in falso.prompts[0]
    assert api.post(f"/proposals/{cuerpo['id']}/accept").status_code == 200
    assert api.get("/routines").json()[0]["split_type"] == "upper_lower"


def test_un_dia_que_no_trabaja_los_grupos_de_su_foco_es_aviso_y_no_rechazo():
    # Torso/pierna de 4 días con el Día 3 (torso) sin hombros como músculo principal.
    ruti = propuesta(RoutineSplit.UPPER_LOWER, 4)
    ruti.days[2].exercises = [e for e in ruti.days[2].exercises if e.primary_muscle.value != "shoulders"]

    resultado = validate_routine(
        ruti, Goal.FUERZA, Level.INTERMEDIO, days=4, split=RoutineSplit.UPPER_LOWER
    )

    assert not [e for e in resultado.errors if e.rule == "Split"]
    assert any(i.rule == "Split" and "Hombros" in i.message for i in resultado.warnings)
    assert any(i.rule == "Split" for i in resultado.soft_issues)  # se pide de nuevo una vez
