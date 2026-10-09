"""Cerrar semana: pasa a cerrada, no borra nada y no se puede repetir."""

from datetime import date

from sqlalchemy import func, select

from app.enums import PlanStatus
from app.models import PlanDay, WeekPlan
from tests.test_weeks import api, crear_semana  # noqa: F401


def test_cierra_la_semana_activa_y_fija_closed_at(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)

    res = api.post(f"/weeks/{semana}/close")

    assert res.status_code == 200
    assert res.json()["status"] == "closed"
    assert res.json()["closed_at"] is not None
    assert api.get("/weeks/active").status_code == 404


def test_cerrar_con_dias_sin_hacer_no_borra_nada(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)

    api.post(f"/weeks/{semana}/close")

    with api.session() as db:
        assert db.scalar(select(func.count()).select_from(PlanDay)) == 2
    estados = [d["state"] for d in api.get(f"/weeks/{semana}").json()["days"]]
    assert estados == ["pending", "pending"]


def test_cerrar_dos_veces_da_409(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    api.post(f"/weeks/{semana}/close")

    assert api.post(f"/weeks/{semana}/close").status_code == 409


def test_no_se_puede_cerrar_una_semana_ajena_ni_inexistente(api):
    ajena = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE, email="otro@x.com")

    assert api.post(f"/weeks/{ajena}/close").status_code == 404
    assert api.post("/weeks/9999/close").status_code == 404
    with api.session() as db:
        assert db.get(WeekPlan, ajena).status == PlanStatus.ACTIVE
