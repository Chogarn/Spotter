"""Entrada en calor con cronómetro y "Finalizar" (decisión 122)."""

from datetime import date

import pytest

from app.enums import PlanStatus
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)


@pytest.fixture
def semana(api):
    return crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)


def calor(semana, dia=1):
    return f"/weeks/{semana}/days/{dia}/warmup"


def test_sin_hacer_no_tiene_minutos(api, semana):
    assert api.get(f"/weeks/{semana}/days/1").json()["warmup_minutes"] is None


def test_finalizar_guarda_los_minutos(api, semana):
    api.post(f"/weeks/{semana}/days/1/start")
    res = api.put(calor(semana), json={"minutes": 8})
    assert res.status_code == 200 and res.json()["warmup_minutes"] == 8
    assert api.get(f"/weeks/{semana}/days/1").json()["warmup_minutes"] == 8


def test_minutos_fuera_de_rango(api, semana):
    assert api.put(calor(semana), json={"minutes": 0}).status_code == 422
    assert api.put(calor(semana), json={"minutes": 181}).status_code == 422


def test_un_dia_sin_entrada_en_calor_no_la_guarda(api, semana):
    assert api.put(calor(semana, dia=2), json={"minutes": 5}).status_code == 409


def test_detenido_no_se_guarda(api, semana):
    api.post(f"/weeks/{semana}/days/1/start")
    api.post(f"/weeks/{semana}/days/1/pause")
    assert api.put(calor(semana), json={"minutes": 5}).status_code == 409


def test_reiniciar_la_borra(api, semana):
    api.post(f"/weeks/{semana}/days/1/start")
    api.put(calor(semana), json={"minutes": 6})
    api.post(f"/weeks/{semana}/days/1/restart")
    assert api.get(f"/weeks/{semana}/days/1").json()["warmup_minutes"] is None
