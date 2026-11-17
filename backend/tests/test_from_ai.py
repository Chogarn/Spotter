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


def test_los_grupos_de_series_se_expanden_en_una_fila_por_serie():
    """Decisión 145: la IA escribe "4 series de 10 con 50 kg" y el código arma las 4 filas."""
    ejercicio = fuerza("Press de banca con barra", sets=[{"n": 4, "reps": 10, "target_weight_kg": 50}])
    series = from_ai(semana(ejercicio)).days[0].exercises[0].sets

    assert len(series) == 4
    assert all((s.reps, s.target_weight_kg) == (10, 50) for s in series)


def test_una_piramide_son_grupos_de_una_serie():
    piramide = [
        {"n": 1, "reps": 10, "target_weight_kg": 50},
        {"n": 1, "reps": 8, "target_weight_kg": 55},
        {"n": 2, "reps": 6, "target_weight_kg": 60},
    ]
    series = from_ai(semana(fuerza("Press de banca con barra", sets=piramide))).days[0].exercises[0].sets

    assert [(s.reps, s.target_weight_kg) for s in series] == [(10, 50), (8, 55), (6, 60), (6, 60)]


def test_sin_n_cuenta_como_una_serie():
    series = from_ai(semana(fuerza("Press de banca con barra"))).days[0].exercises[0].sets
    assert len(series) == 1


def test_mas_de_diez_series_en_total_se_rechaza():
    with pytest.raises(ValidationError):
        semana(fuerza("Press de banca con barra", sets=[{"n": 6, "reps": 10}, {"n": 5, "reps": 8}]))
