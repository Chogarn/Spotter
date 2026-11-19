"""Eliminar una semana sin registros (decisión 150): solo la última de la rutina, que no sea la
única, sin nada registrado y sin una propuesta de esa rutina sin resolver."""

from sqlalchemy import func, select

from app.models import PlanDay, PlanExercise, PlanSet, Routine, WeekPlan, WorkoutSession
from tests.test_routines import cerrar_activa, generar_y_aceptar
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)


def filas(api, *modelos):
    with api.session() as db:
        return [db.scalar(select(func.count()).select_from(m)) for m in modelos]


def dos_semanas(api, monkeypatch):
    """Una rutina con la semana 1 cerrada y la semana 2 en curso. Devuelve (rutina, semana 1, semana 2)."""
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    rutina_id = api.get("/routines").json()[0]["id"]
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json={"routine_id": rutina_id, "days": 3, "minutes": 60})
    assert api.post(f"/proposals/{propuesta.json()['id']}/accept").status_code == 200
    semanas = api.get(f"/routines/{rutina_id}").json()["weeks"]  # de la más nueva a la más vieja
    return rutina_id, semanas[1]["id"], semanas[0]["id"]


def test_la_ultima_semana_cerrada_sin_registros_se_elimina(api, entorno, monkeypatch):
    rutina_id, primera, segunda = dos_semanas(api, monkeypatch)
    cerrar_activa(api)  # la semana 2 se cierra sin entrenar: el caso de las pruebas
    assert api.get(f"/weeks/{segunda}").json()["deletable"] is True
    antes = filas(api, WeekPlan, PlanDay, PlanExercise, PlanSet)

    res = api.delete(f"/weeks/{segunda}")

    assert res.status_code == 204
    assert api.get(f"/weeks/{segunda}").status_code == 404
    detalle = api.get(f"/routines/{rutina_id}").json()
    assert [w["id"] for w in detalle["weeks"]] == [primera]
    despues = filas(api, WeekPlan, PlanDay, PlanExercise, PlanSet)
    assert despues[0] == antes[0] - 1
    assert all(d < a for d, a in zip(despues[1:], antes[1:]))
    assert filas(api, Routine) == [1]


def test_la_semana_anterior_vuelve_a_ser_la_ultima_y_se_puede_continuar(api, entorno, monkeypatch):
    rutina_id, _, segunda = dos_semanas(api, monkeypatch)
    cerrar_activa(api)
    assert api.delete(f"/weeks/{segunda}").status_code == 204
    usar_gemini(monkeypatch, rutina())

    res = api.post("/proposals/generate", json={"routine_id": rutina_id, "days": 3, "minutes": 60})

    assert res.status_code == 201


def test_una_semana_en_curso_sin_registros_tambien_se_elimina(api, entorno, monkeypatch):
    rutina_id, primera, segunda = dos_semanas(api, monkeypatch)
    assert api.get(f"/weeks/{segunda}").json()["status"] == "active"

    assert api.delete(f"/weeks/{segunda}").status_code == 204
    assert api.get("/weeks/active").status_code == 404
    rutina_ = api.get("/routines").json()[0]
    assert rutina_["has_active_week"] is False
    assert rutina_["week_count"] == 1
    assert api.get(f"/weeks/{primera}").status_code == 200


def test_la_unica_semana_de_una_rutina_no_se_elimina(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    semana = api.get("/routines").json()[0]
    unica = api.get(f"/routines/{semana['id']}").json()["weeks"][0]["id"]

    assert api.get(f"/weeks/{unica}").json()["deletable"] is False
    res = api.delete(f"/weeks/{unica}")

    assert res.status_code == 409
    assert "única semana" in res.json()["detail"]
    assert api.get(f"/weeks/{unica}").status_code == 200


def test_una_semana_que_no_es_la_ultima_no_se_elimina(api, entorno, monkeypatch):
    _, primera, _ = dos_semanas(api, monkeypatch)

    res = api.delete(f"/weeks/{primera}")

    assert res.status_code == 409
    assert "última" in res.json()["detail"]
    assert api.get(f"/weeks/{primera}").json()["deletable"] is False


def test_con_una_serie_hecha_no_se_elimina(api, entorno, monkeypatch):
    _, _, segunda = dos_semanas(api, monkeypatch)
    serie = api.get(f"/weeks/{segunda}/days/1").json()["exercises"][0]["sets"][0]["id"]
    assert api.post(f"/weeks/{segunda}/days/1/sets/{serie}/done").status_code == 200

    res = api.delete(f"/weeks/{segunda}")

    assert res.status_code == 409
    assert "registros" in res.json()["detail"]
    assert api.get(f"/weeks/{segunda}").json()["deletable"] is False


def test_un_dia_completado_cuenta_como_registro(api, entorno, monkeypatch):
    _, _, segunda = dos_semanas(api, monkeypatch)
    assert api.post(f"/weeks/{segunda}/days/1/complete").status_code == 200

    assert api.delete(f"/weeks/{segunda}").status_code == 409


def test_un_dia_reabierto_queda_vacio_y_su_sesion_no_queda_suelta(api, entorno, monkeypatch):
    _, _, segunda = dos_semanas(api, monkeypatch)
    api.post(f"/weeks/{segunda}/days/1/complete")
    assert api.post(f"/weeks/{segunda}/days/1/reopen").status_code == 200
    assert filas(api, WorkoutSession) == [1]

    assert api.delete(f"/weeks/{segunda}").status_code == 204
    assert filas(api, WorkoutSession) == [0]


def test_con_una_propuesta_sin_resolver_de_la_rutina_no_se_elimina(api, entorno, monkeypatch):
    rutina_id, _, segunda = dos_semanas(api, monkeypatch)
    cerrar_activa(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json={"routine_id": rutina_id, "days": 3, "minutes": 60})
    assert propuesta.status_code == 201

    res = api.delete(f"/weeks/{segunda}")

    assert res.status_code == 409
    assert "propuesta" in res.json()["detail"]

    api.post(f"/proposals/{propuesta.json()['id']}/discard")
    assert api.delete(f"/weeks/{segunda}").status_code == 204


def test_eliminar_una_semana_inexistente_o_ajena_da_404(api, entorno, monkeypatch):
    from datetime import date

    from app.enums import Goal, PlanStatus
    from app.models import User

    con_perfil(api)
    with api.session() as db:
        otro = User(email="otro@x.com", password_hash="x", name="otro")
        db.add(otro)
        db.flush()
        ajena = Routine(user_id=otro.id, name="Ajena", goal=Goal.MASA, level="intermedio")
        db.add(ajena)
        db.flush()
        semana = WeekPlan(
            user_id=otro.id, routine_id=ajena.id, week_start=date(2026, 11, 1), status=PlanStatus.CLOSED
        )
        db.add(semana)
        db.commit()
        ajena_id = semana.id

    assert api.delete("/weeks/999").status_code == 404
    assert api.delete(f"/weeks/{ajena_id}").status_code == 404
    with api.session() as db:
        assert db.get(WeekPlan, ajena_id) is not None
