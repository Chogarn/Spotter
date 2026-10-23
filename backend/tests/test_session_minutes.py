"""El usuario elige cuánto dura cada sesión y se mide cuánto tarda (decisión 82)."""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.ai.prompt import minutes_text
from app.ai.routine import RoutineProposal
from app.ai.rules import allowed_minutes, validate_routine
from app.enums import Goal, Level
from app.models import Routine, WorkoutSession
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)
from tests.test_weeks import crear_semana
from app.enums import PlanStatus


def generar(api, cuerpo):
    return api.post("/proposals/generate", json=cuerpo)


# --- qué se puede elegir ---


def test_las_opciones_dependen_del_nivel():
    assert allowed_minutes(Level.PRINCIPIANTE) == (40, 60)
    assert allowed_minutes(Level.INTERMEDIO) == (40, 60, 80)
    assert allowed_minutes(Level.AVANZADO) == (40, 60, 80, 100, 120)


def test_un_principiante_no_puede_elegir_90_y_no_se_llama_a_la_ia(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    respuesta = generar(api, {"goal": "masa", "level": "principiante", "days": 2, "minutes": 90})

    assert respuesta.status_code == 422
    assert "40 a 60" in respuesta.json()["detail"]
    assert falso.llamadas == 0


def test_los_minutos_son_obligatorios_y_de_20_en_20(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())

    sin = generar(api, {"goal": "masa", "level": "intermedio", "days": 2})
    raro = generar(api, {"goal": "masa", "level": "intermedio", "days": 2, "minutes": 50})

    assert sin.status_code == 422
    assert raro.status_code == 422


def test_el_prompt_le_dice_a_la_ia_que_el_tiempo_manda():
    texto = minutes_text(45)
    assert "45 minutos" in texto
    assert "nunca alargues" in texto


# --- el tiempo elegido es la referencia ---


def test_r34_compara_con_el_tiempo_elegido():
    # La rutina de prueba dura ~80 min por día: con 45 elegidos, se pasa.
    larga = RoutineProposal.model_validate(rutina())

    con_45 = validate_routine(larga, Goal.MASA, Level.INTERMEDIO, minutes=45)
    con_80 = validate_routine(larga, Goal.MASA, Level.INTERMEDIO, minutes=80)

    assert any(w.rule == "R34" and "elegiste 45" in w.message for w in con_45.warnings)
    assert not any(w.rule == "R34" for w in con_80.warnings)


# --- se guarda en la rutina ---


def test_al_aceptar_la_rutina_guarda_el_tiempo(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = generar(
        api, {"goal": "masa", "level": "principiante", "days": 2, "minutes": 40}
    ).json()

    assert api.post(f"/proposals/{propuesta['id']}/accept").status_code == 200

    with api.session() as db:
        assert db.scalar(select(Routine.session_minutes)) == 40
    assert api.get("/routines").json()[0]["session_minutes"] == 40


# --- el contador de la sesión ---


def semana_activa(api):
    return crear_semana(api, date(2026, 10, 1), status=PlanStatus.ACTIVE)


def sesion(api):
    with api.session() as db:
        return db.scalar(select(WorkoutSession))


def test_empezar_el_dia_guarda_la_hora_y_no_la_cambia_al_repetir(api):
    semana = semana_activa(api)

    primera = api.post(f"/weeks/{semana}/days/1/start")
    segunda = api.post(f"/weeks/{semana}/days/1/start")

    assert primera.status_code == 200
    assert primera.json()["started_at"] is not None
    assert segunda.json()["started_at"][:26] == primera.json()["started_at"][:26]
    assert api.get(f"/weeks/{semana}/days/1").json()["started_at"][:26] == primera.json()["started_at"][:26]


def test_no_se_puede_empezar_un_dia_completado(api):
    semana = semana_activa(api)
    api.post(f"/weeks/{semana}/days/1/start")
    api.post(f"/weeks/{semana}/days/1/complete")

    assert api.post(f"/weeks/{semana}/days/1/start").status_code == 409


def test_reabrir_el_dia_vacia_el_inicio(api):
    semana = semana_activa(api)
    api.post(f"/weeks/{semana}/days/1/start")
    api.post(f"/weeks/{semana}/days/1/complete")

    api.post(f"/weeks/{semana}/days/1/reopen")

    assert api.get(f"/weeks/{semana}/days/1").json()["started_at"] is None


def ajustar(api, inicio_hace_min):
    """Pone la hora de inicio unos minutos antes de la de fin, para medir sin esperar."""
    with api.session() as db:
        s = db.scalar(select(WorkoutSession))
        s.started_at = s.finished_at - timedelta(minutes=inicio_hace_min)
        db.commit()


def test_el_resumen_semanal_trae_la_duracion_total_y_por_dia(api):
    semana = semana_activa(api)
    api.post(f"/weeks/{semana}/days/1/start")
    api.post(f"/weeks/{semana}/days/1/complete")
    ajustar(api, 52)

    resumen = api.get(f"/weeks/{semana}/summary").json()

    assert resumen["day_durations"] == [52, None]
    assert resumen["duration_minutes"] == 52


def test_sin_medir_la_duracion_es_nula(api):
    semana = semana_activa(api)
    api.post(f"/weeks/{semana}/days/1/complete")  # sin "Empezar día"

    resumen = api.get(f"/weeks/{semana}/summary").json()

    assert resumen["duration_minutes"] is None
    assert resumen["day_durations"] == [None, None]


def test_el_calendario_trae_lo_que_tardo(api):
    semana = semana_activa(api)
    api.post(f"/weeks/{semana}/days/1/start")
    api.post(f"/weeks/{semana}/days/1/complete")
    ajustar(api, 47)
    ahora = datetime.now(timezone.utc)

    calendario = api.get(f"/calendar?month={ahora:%Y-%m}").json()

    assert calendario["sessions"][0]["duration_minutes"] == 47


def test_la_semana_activa_dice_que_dia_esta_empezado(api):
    semana = semana_activa(api)
    assert api.get("/weeks/active").json()["in_progress_day"] is None

    api.post(f"/weeks/{semana}/days/2/start")
    assert api.get("/weeks/active").json()["in_progress_day"] == 2

    api.post(f"/weeks/{semana}/days/2/complete")
    assert api.get("/weeks/active").json()["in_progress_day"] is None
