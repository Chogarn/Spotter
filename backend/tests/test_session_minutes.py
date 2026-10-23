"""El campo histórico de duración está apagado; se mide cuánto tarda la sesión (decisión 90)."""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.ai.prompt import minutes_text
from app.ai.routine import RoutineProposal
from app.ai.rules import allowed_minutes, exercise_count_hint, validate_routine
from app.enums import Goal, Level
from app.models import Routine, WorkoutSession
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    GRANDES,
    api,
    con_perfil,
    ejercicio,
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
    assert allowed_minutes(Level.AVANZADO) == (40, 60, 80)


def test_los_minutos_historicos_no_restringen_ni_se_envian_como_objetivo(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    respuesta = generar(api, {"goal": "masa", "level": "principiante", "days": 2, "minutes": 90})

    assert respuesta.status_code == 201
    assert falso.llamadas == 1
    assert "no elige minutos" in falso.prompts[0]


def test_minutos_historicos_irregulares_no_rechazan_generacion(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())

    raro = generar(api, {"goal": "masa", "level": "intermedio", "days": 2, "minutes": 50})

    assert raro.status_code == 201


def test_el_prompt_ignora_un_valor_historico_de_sesion():
    texto = minutes_text(45)
    assert "R18 es orientativa" in texto
    assert "45" not in texto


# --- el tiempo elegido es la referencia ---


def test_r34_usa_la_referencia_aunque_haya_minutos_historicos():
    # La rutina dura ~66 min, dentro de la referencia de 60 ±15 min para masa intermedia.
    larga = RoutineProposal.model_validate(rutina())  # ~66 min por día

    con_45 = validate_routine(larga, Goal.MASA, Level.INTERMEDIO, minutes=45)
    con_60 = validate_routine(larga, Goal.MASA, Level.INTERMEDIO, minutes=60)

    assert not any(w.rule == "R34" for w in con_45.warnings)
    assert not any(w.rule == "R34" for w in con_60.warnings)


# --- se guarda en la rutina ---


def test_al_aceptar_no_se_guarda_el_tiempo_historico_como_preferencia(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = generar(
        api, {"goal": "masa", "level": "principiante", "days": 2, "minutes": 60}
    ).json()

    assert api.post(f"/proposals/{propuesta['id']}/accept").status_code == 200

    with api.session() as db:
        assert db.scalar(select(Routine.session_minutes)) is None
    assert api.get("/routines").json()[0]["session_minutes"] is None


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


# --- la duración es informativa, no se persigue (decisión 90) ---


def con_series(sets):
    base = rutina()
    base["days"] = [
        {**d, "exercises": [ejercicio(*g, sets=sets) for g in GRANDES]} for d in base["days"]
    ]
    return base


ELEGIDO = {"goal": "masa", "level": "principiante", "days": 2, "minutes": 60}


def test_la_duracion_no_se_pasa_como_objetivo_a_gemini():
    texto = minutes_text(60)
    assert "no elige minutos" in texto
    assert "60" not in texto
    assert exercise_count_hint(40) == 5 and exercise_count_hint(80) == 9


def test_la_duracion_corta_avisa_sin_reintentar(api, entorno, monkeypatch):
    con_perfil(api)
    # 2 series por ejercicio queda debajo de la referencia, pero el usuario no eligió un límite.
    falso = usar_gemini(monkeypatch, con_series(2))

    respuesta = generar(api, ELEGIDO)

    assert respuesta.status_code == 201
    assert falso.llamadas == 1
    assert any(w["rule"] == "R34" for w in respuesta.json()["warnings"])


def test_la_duracion_larga_avisa_sin_reintentar(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, con_series(6), con_series(4))  # 6 series: ~96 min

    respuesta = generar(api, ELEGIDO)

    assert respuesta.status_code == 201
    assert falso.llamadas == 1
    assert any(w["rule"] == "R34" for w in respuesta.json()["warnings"])


def test_la_duracion_corta_se_acepta_con_aviso_y_no_reintenta(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, con_series(2), con_series(2))

    respuesta = generar(api, ELEGIDO)

    assert respuesta.status_code == 201
    assert falso.llamadas == 1
    assert any(w["rule"] == "R34" for w in respuesta.json()["warnings"])


def test_la_duracion_dentro_de_la_referencia_no_genera_aviso(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, con_series(4))

    respuesta = generar(api, ELEGIDO)

    assert respuesta.status_code == 201
    assert falso.llamadas == 1
