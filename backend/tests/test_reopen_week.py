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


# --- reopenable: el botón solo aparece cuando se puede reabrir (decisión 151) ---


def rutina_nueva(api):
    from app.enums import Goal, Level
    from app.models import Routine
    from tests.test_weeks import DEV_USER_EMAIL

    with api.session() as db:
        user = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
        rutina_ = Routine(user_id=user.id, name="Masa", goal=Goal.MASA, level=Level.INTERMEDIO)
        db.add(rutina_)
        db.commit()
        return rutina_.id


def reabrible(api, semana):
    return api.get(f"/weeks/{semana}").json()["reopenable"]


def test_la_ultima_semana_cerrada_de_la_rutina_actual_es_reabrible(api):
    semana = crear_semana(api, date(2026, 9, 1))

    assert reabrible(api, semana) is True


def test_una_semana_en_curso_no_es_reabrible(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)

    assert reabrible(api, semana) is False


def test_una_semana_que_no_es_la_ultima_no_es_reabrible(api):
    vieja = crear_semana(api, date(2026, 9, 1))
    nueva = crear_semana(api, date(2026, 9, 8))

    assert reabrible(api, vieja) is False
    assert reabrible(api, nueva) is True


def test_una_semana_de_una_rutina_anterior_no_es_reabrible(api):
    vieja = crear_semana(api, date(2026, 9, 1))
    otra = rutina_nueva(api)
    crear_semana(api, date(2026, 9, 8), rutina_id=otra)

    assert reabrible(api, vieja) is False


def test_con_otra_semana_en_curso_en_la_rutina_nueva_la_vieja_no_es_reabrible(api):
    # El caso real: la rutina anterior con su última semana sin hacer, y una semana en curso en la actual.
    vieja = crear_semana(api, date(2026, 9, 1))
    otra = rutina_nueva(api)
    crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE, rutina_id=otra)

    assert reabrible(api, vieja) is False
    assert api.post(f"/weeks/{vieja}/reopen").status_code == 409


def test_con_una_propuesta_sin_revisar_no_es_reabrible(api):
    semana = crear_semana(api, date(2026, 9, 1))
    proponer(api)

    assert reabrible(api, semana) is False


def test_reopenable_coincide_con_lo_que_responde_reabrir(api):
    semana = crear_semana(api, date(2026, 9, 1))
    assert reabrible(api, semana) is True

    assert api.post(f"/weeks/{semana}/reopen").status_code == 200
    # Ya en curso: deja de ser reabrible.
    assert reabrible(api, semana) is False
