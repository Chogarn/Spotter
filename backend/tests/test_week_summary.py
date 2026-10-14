"""Resumen de una semana para la pantalla Progreso (#28)."""

from datetime import date

from sqlalchemy import select

from app.ai.plan_writer import write_plan
from app.ai.routine import DayProposal, RoutineProposal
from app.enums import PlanStatus
from app.models import Routine, WeekPlan
from tests.test_weeks import api, crear_semana, fuerza  # noqa: F401  (fixture y ayudantes)


def dia(api, semana, n):
    return {e["name"]: e for e in api.get(f"/weeks/{semana}/days/{n}").json()["exercises"]}


def resumen(api, semana):
    respuesta = api.get(f"/weeks/{semana}/summary")
    assert respuesta.status_code == 200
    return respuesta.json()


def resultado(cuerpo, nombre):
    return next(e["signal"] for e in cuerpo["exercises"] if e["name"] == nombre)


def test_la_semana_en_curso_cuenta_lo_registrado_hasta_ahora(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    press = dia(api, semana, 1)["Press de banca con barra"]["sets"]
    base = f"/weeks/{semana}/days/1/sets"
    # Plan del press: 10 × 50 y 9 × 55. Las dos series superan lo planificado.
    api.put(f"{base}/{press[0]['id']}", json={"reps": 12, "weight_kg": 50})
    api.put(f"{base}/{press[1]['id']}", json={"reps": 10, "weight_kg": 55})
    api.post(f"/weeks/{semana}/days/1/complete")
    cinta = dia(api, semana, 2)["Cinta"]["sets"][0]
    api.post(f"/weeks/{semana}/days/2/sets/{cinta['id']}/done")

    cuerpo = resumen(api, semana)

    assert cuerpo["status"] == "active"
    assert cuerpo["closed_at"] is None
    assert cuerpo["day_states"] == ["completed", "partial"]
    assert cuerpo["days_completed"] == 1
    assert (cuerpo["sets_done"], cuerpo["sets_planned"]) == (3, 12)
    assert cuerpo["kg_moved"] == 12 * 50 + 10 * 55
    assert cuerpo["cardio_minutes"] == 30
    assert resultado(cuerpo, "Press de banca con barra") == "superó"
    assert resultado(cuerpo, "Plancha") == "sin registrar"
    assert resultado(cuerpo, "Cinta") == "cumplió"


def test_una_semana_sin_registros_da_ceros(api):
    semana = crear_semana(api, date(2026, 9, 1))

    cuerpo = resumen(api, semana)

    assert cuerpo["days_completed"] == 0
    assert (cuerpo["sets_done"], cuerpo["kg_moved"], cuerpo["cardio_minutes"]) == (0, 0, 0)
    assert all(e["signal"] == "sin registrar" for e in cuerpo["exercises"])
    assert cuerpo["ai_summary"] is None
    assert cuerpo["closing_note"] is None


def test_trae_el_comentario_y_el_resumen_de_la_semana_siguiente(api):
    primera = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    api.post(f"/weeks/{primera}/close", json={"note": "Me costó el remo"})
    segunda = crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE)
    with api.session() as db:
        db.get(WeekPlan, segunda).ai_summary = "Subí la sentadilla"
        db.commit()

    cuerpo = resumen(api, primera)

    assert cuerpo["status"] == "closed"
    assert cuerpo["closed_at"] is not None
    assert cuerpo["closing_note"] == "Me costó el remo"
    assert cuerpo["ai_summary"] == "Subí la sentadilla"
    assert resumen(api, segunda)["ai_summary"] is None  # todavía no hay semana siguiente


def test_un_ejercicio_repetido_en_la_semana_aparece_una_vez(api):
    crear_semana(api, date(2026, 9, 1))
    with api.session() as db:
        routine = db.scalar(select(Routine))
        week = write_plan(
            db,
            routine.user_id,
            RoutineProposal(days=[
                DayProposal(title="A", exercises=[fuerza("Press de banca con barra"), fuerza("Remo")]),
                DayProposal(title="B", exercises=[fuerza("Press de banca con barra"), fuerza("Remo")]),
            ]),
            routine,
        )
        week.week_start = date(2026, 9, 8)
        db.commit()
        semana = week.id

    nombres = [e["name"] for e in resumen(api, semana)["exercises"]]

    assert sorted(nombres) == ["Press de banca con barra", "Remo"]


def test_la_semana_de_otro_usuario_da_404(api):
    ajena = crear_semana(api, date(2026, 9, 1), email="otro@spotter.local")

    assert api.get(f"/weeks/{ajena}/summary").status_code == 404
    assert api.get("/weeks/999/summary").status_code == 404
