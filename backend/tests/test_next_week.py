"""Semana nueva (#27): al continuar una rutina, lo real de la semana anterior viaja a la IA."""

from sqlalchemy import select

from app.enums import PlanStatus
from app.models import AiCall, SetEntry, WeekPlan, WorkoutSession
from tests.test_routines import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    cerrar_activa,
    con_perfil,
    entorno,
    generar_y_aceptar,
    rutina,
    usar_gemini,
)


def completar_y_cerrar(api, reales):
    """Registra el primer ejercicio del Día 1 de la semana activa (con las repeticiones dadas) y la cierra."""
    with api.session() as db:
        week = db.scalars(select(WeekPlan).where(WeekPlan.status == PlanStatus.ACTIVE)).one()
        day = week.days[0]
        session = WorkoutSession(user_id=week.user_id, plan_day_id=day.id)
        db.add(session)
        db.flush()
        plan_ex = day.exercises[0]
        for plan_set, reps in zip(plan_ex.sets, reales):
            db.add(SetEntry(
                session_id=session.id, plan_exercise_id=plan_ex.id, plan_set_id=plan_set.id,
                exercise_id=plan_ex.exercise_id, set_number=plan_set.set_number,
                reps=reps, weight_kg=40.5,
            ))
        db.commit()
    cerrar_activa(api)


def test_continuar_manda_lo_real_y_guarda_el_resumen(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    completar_y_cerrar(api, [12, 12, 12, 12, 12])  # el plan pedía 10 repeticiones
    rutina_id = api.get("/routines").json()[0]["id"]
    falso = usar_gemini(monkeypatch, rutina(summary="Subió el press de banca; el Día 2 no se hizo."))

    respuesta = api.post("/proposals/generate", json={"routine_id": rutina_id})

    assert respuesta.status_code == 201
    assert respuesta.json()["kind"] == "week_close"
    assert respuesta.json()["routine"]["summary"].startswith("Subió el press")
    prompt = falso.prompts[0]
    assert "Semana anterior de esta rutina" in prompt
    assert "Press de banca [fuerza] — señal: superó" in prompt
    assert "no hecho (nada registrado)" in prompt
    with api.session() as db:
        assert db.scalars(select(AiCall.kind).order_by(AiCall.id.desc())).first().value == "week_close"

    api.post(f"/proposals/{respuesta.json()['id']}/accept")
    with api.session() as db:
        semana = db.scalars(select(WeekPlan).where(WeekPlan.status == PlanStatus.ACTIVE)).one()
        assert semana.ai_summary.startswith("Subió el press")
        assert semana.routine_id == rutina_id


def test_la_primera_semana_no_lleva_semana_anterior(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    api.post("/proposals/generate", json={"goal": "fuerza", "level": "avanzado"})

    assert "primera semana de esta rutina" in falso.prompts[0]
    assert "Semana anterior de esta rutina (" not in falso.prompts[0]


def test_la_pendiente_de_semana_nueva_se_ve_y_la_nueva_reemplaza_a_la_anterior(
    api, entorno, monkeypatch
):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    rutina_id = api.get("/routines").json()[0]["id"]
    usar_gemini(monkeypatch, rutina(), rutina())

    primera = api.post("/proposals/generate", json={"routine_id": rutina_id}).json()
    assert api.get("/proposals/pending").json()["id"] == primera["id"]
    segunda = api.post("/proposals/generate", json={"routine_id": rutina_id}).json()

    assert api.get("/proposals/pending").json()["id"] == segunda["id"]
    assert api.get(f"/proposals/{primera['id']}").json()["status"] == "discarded"
