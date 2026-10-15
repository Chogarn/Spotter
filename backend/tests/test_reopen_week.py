"""Reabrir una semana cerrada (decisión 66): con sus seguridades."""

from datetime import date

from sqlalchemy import select

from app.enums import PlanStatus, ProposalKind, ProposalStatus
from app.models import PlanProposal, User, WeekPlan
from tests.test_weeks import api, crear_semana  # noqa: F401


def estado(api, semana_id):
    with api.session() as db:
        w = db.get(WeekPlan, semana_id)
        return w.status, w.closed_at, w.closing_note


def proponer(api, estado_propuesta=ProposalStatus.PENDING, tipo=ProposalKind.WEEK_CLOSE):
    with api.session() as db:
        user = db.scalar(select(User))
        db.add(
            PlanProposal(
                user_id=user.id,
                kind=tipo,
                status=estado_propuesta,
                proposed_changes={"routine": {"days": []}},
            )
        )
        db.commit()


def test_reabre_la_semana_cerrada_y_borra_el_comentario(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    api.post(f"/weeks/{semana}/close", json={"note": "me sentí cansado"})
    assert estado(api, semana)[0] == PlanStatus.CLOSED

    res = api.post(f"/weeks/{semana}/reopen")

    assert res.status_code == 200
    assert res.json()["status"] == "active"
    assert res.json()["closed_at"] is None
    assert estado(api, semana) == (PlanStatus.ACTIVE, None, None)
    assert api.get("/weeks/active").json()["id"] == semana


def test_no_borra_lo_registrado(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    antes = api.get(f"/weeks/{semana}").json()["days"]
    api.post(f"/weeks/{semana}/close")

    api.post(f"/weeks/{semana}/reopen")

    assert api.get(f"/weeks/{semana}").json()["days"] == antes


def test_una_semana_en_curso_no_se_reabre(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)

    assert api.post(f"/weeks/{semana}/reopen").status_code == 409


def test_solo_se_reabre_la_ultima_semana_de_la_rutina(api):
    vieja = crear_semana(api, date(2026, 9, 1))
    nueva = crear_semana(api, date(2026, 9, 8))

    res = api.post(f"/weeks/{vieja}/reopen")

    assert res.status_code == 409
    assert "última semana" in res.json()["detail"]
    assert api.post(f"/weeks/{nueva}/reopen").status_code == 200


def test_no_se_reabre_si_hay_otra_semana_en_curso(api):
    cerrada = crear_semana(api, date(2026, 9, 1))
    crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE)

    # La cerrada ya no es la última de su rutina: se rechaza por eso o por la semana en curso.
    assert api.post(f"/weeks/{cerrada}/reopen").status_code == 409


def test_no_se_reabre_si_hay_una_propuesta_sin_revisar(api):
    semana = crear_semana(api, date(2026, 9, 1))
    proponer(api)

    res = api.post(f"/weeks/{semana}/reopen")

    assert res.status_code == 409
    assert "propuesta sin revisar" in res.json()["detail"]
    assert estado(api, semana)[0] == PlanStatus.CLOSED


def test_una_propuesta_ya_resuelta_no_bloquea(api):
    semana = crear_semana(api, date(2026, 9, 1))
    proponer(api, estado_propuesta=ProposalStatus.DISCARDED)

    assert api.post(f"/weeks/{semana}/reopen").status_code == 200


def test_no_se_reabre_una_semana_ajena_ni_inexistente(api):
    ajena = crear_semana(api, date(2026, 9, 1), email="otro@x.com")

    assert api.post(f"/weeks/{ajena}/reopen").status_code == 404
    assert api.post("/weeks/9999/reopen").status_code == 404
    assert estado(api, ajena)[0] == PlanStatus.CLOSED


def test_se_puede_cerrar_y_reabrir_varias_veces(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)

    for _ in range(2):
        assert api.post(f"/weeks/{semana}/close").status_code == 200
        assert api.post(f"/weeks/{semana}/reopen").status_code == 200

    assert estado(api, semana)[0] == PlanStatus.ACTIVE
