"""La IA escribe solo el nombre, las series, el descanso y el motivo; el tipo y las etiquetas los
pone el catálogo (`from_ai`)."""

from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.ai.catalog import UnknownExercises, find, from_ai
from app.ai.plan_writer import normalize_name
from app.ai.routine import AiRoutine
from app.enums import ExerciseKind, Muscle


def semana(*ejercicios):
    return AiRoutine.model_validate({"days": [{"title": "Cuerpo completo", "exercises": list(ejercicios)}]})


def fuerza(nombre, **extra):
    return {"name": nombre, "rest_seconds": 90, "reason": "Base.", "sets": [{"reps": 10, "target_weight_kg": 40}], **extra}


def test_el_esquema_que_se_le_pide_a_la_ia_no_tiene_etiquetas():
    campos = AiRoutine.model_json_schema()["$defs"]["AiExercise"]["properties"]
    assert set(campos) == {"name", "execution_notes", "rest_seconds", "reason", "sets"}


def test_las_etiquetas_y_el_tipo_salen_del_catalogo():
    catalogo = find("Press de banca con barra")
    ejercicio = from_ai(semana(fuerza("press de banca con barra"))).days[0].exercises[0]

    assert ejercicio.name == catalogo.name  # el nombre exacto del catálogo
    assert ejercicio.kind == ExerciseKind.STRENGTH
    assert ejercicio.primary_muscle == Muscle.CHEST
    assert ejercicio.secondary_muscles == list(catalogo.secondary_muscles)
    assert (ejercicio.equipment, ejercicio.level) == (catalogo.equipment, catalogo.level)
    assert (ejercicio.rest_seconds, ejercicio.reason) == (90, "Base.")
    assert ejercicio.sets[0].target_weight_kg == 40


def test_si_la_ia_igual_manda_etiquetas_se_ignoran():
    con_etiquetas = fuerza("Press de banca con barra", primary_muscle="calves", kind="cardio")
    ejercicio = from_ai(semana(con_etiquetas)).days[0].exercises[0]

    assert ejercicio.primary_muscle == Muscle.CHEST
    assert ejercicio.kind == ExerciseKind.STRENGTH


def test_un_nombre_inventado_se_rechaza_con_su_nombre():
    with pytest.raises(UnknownExercises) as error:
        from_ai(semana(fuerza("Press de banca con barra"), fuerza("Remo galáctico"), fuerza("Remo galáctico")))

    assert error.value.names == ["Remo galáctico"]
    assert '"Remo galáctico"' in str(error.value)


def test_un_ejercicio_viejo_de_la_semana_anterior_usa_sus_etiquetas_guardadas():
    viejo = SimpleNamespace(
        name="Remo galáctico", kind="strength", region="upper", direction="pull", primary_muscle="back",
        secondary_muscles=["biceps"], mechanic="compound", equipment="machine", level="intermedio",
    )
    ejercicio = from_ai(
        semana(fuerza("remo galactico")), {normalize_name("Remo galáctico"): viejo}
    ).days[0].exercises[0]

    assert ejercicio.name == "Remo galáctico"
    assert ejercicio.primary_muscle == Muscle.BACK
    assert ejercicio.secondary_muscles == [Muscle.BICEPS]


def test_las_series_tienen_que_medirse_como_pide_el_tipo_del_catalogo():
    cardio = next(n for n in ("Cinta", "Cinta de correr", "Bicicleta fija") if find(n) and find(n).kind == ExerciseKind.CARDIO)
    with pytest.raises(ValidationError):
        from_ai(semana(fuerza(cardio)))  # un cardio con repeticiones y peso
