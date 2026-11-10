"""Detener, retomar y reiniciar el día en el modo entrenar (decisión 121)."""

from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.enums import PlanStatus
from app.models import WorkoutSession
from app.routers.weeks import measured_minutes
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)


@pytest.fixture
def semana(api):
    return crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)


def ruta(semana, accion, dia=1):
    return f"/weeks/{semana}/days/{dia}/{accion}"


def press(api, semana):
    return api.get(f"/weeks/{semana}/days/1").json()["exercises"][0]


def test_detener_y_retomar(api, semana):
    api.post(ruta(semana, "start"))
    detenido = api.post(ruta(semana, "pause")).json()
    assert detenido["paused_at"] is not None
    # La semana sigue sabiendo cuál es el día, pero avisa que está detenido.
    activa = api.get("/weeks/active").json()
    assert activa["in_progress_day"] == 1 and activa["in_progress_paused"] is True
    assert api.get(f"/weeks/{semana}/days/1").json()["paused_at"] is not None

    retomado = api.post(ruta(semana, "resume")).json()
    assert retomado["paused_at"] is None
    assert api.get("/weeks/active").json()["in_progress_paused"] is False


def test_detenido_no_se_registra(api, semana):
    api.post(ruta(semana, "start"))
    api.post(ruta(semana, "pause"))
    serie = press(api, semana)["sets"][0]["id"]
    assert api.post(ruta(semana, f"sets/{serie}/done")).status_code == 409
    api.post(ruta(semana, "resume"))
    assert api.post(ruta(semana, f"sets/{serie}/done")).status_code == 200


def test_no_se_detiene_un_dia_sin_empezar(api, semana):
    assert api.post(ruta(semana, "pause")).status_code == 409
    assert api.post(ruta(semana, "restart")).status_code == 409


def test_lo_detenido_no_cuenta_en_la_duracion(api, semana):
    api.post(ruta(semana, "start"))
    with api.session() as db:
        sesion = db.scalar(select(WorkoutSession))
        inicio = datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc)
        sesion.started_at = inicio
        sesion.finished_at = inicio + timedelta(minutes=60)
        sesion.paused_seconds = 15 * 60
        assert measured_minutes(sesion) == 45


def test_completar_un_dia_detenido_lo_retoma_y_lo_cierra(api, semana):
    api.post(ruta(semana, "start"))
    api.post(ruta(semana, "pause"))
    cerrado = api.post(ruta(semana, "complete")).json()
    assert cerrado["finished_at"] is not None and cerrado["paused_at"] is None


def test_reiniciar_deja_el_dia_sin_empezar(api, semana):
    api.post(ruta(semana, "start"))
    ejercicio = press(api, semana)
    api.post(ruta(semana, f"exercises/{ejercicio['id']}/done"))
    assert all(s["real"] for s in press(api, semana)["sets"])
    api.post(ruta(semana, "pause"))

    reiniciado = api.post(ruta(semana, "restart")).json()
    assert reiniciado["paused_at"] is None and reiniciado["paused_seconds"] == 0
    assert reiniciado["started_at"] is None
    # Deja de estar en curso: la píldora desaparece y Entrenar vuelve a ofrecer "Empezar".
    assert api.get("/weeks/active").json()["in_progress_day"] is None
    despues = press(api, semana)
    assert not despues["completed"] and not any(s["real"] for s in despues["sets"])
    # El plan no cambió.
    assert [s["reps"] for s in despues["sets"]] == [s["reps"] for s in ejercicio["sets"]]
