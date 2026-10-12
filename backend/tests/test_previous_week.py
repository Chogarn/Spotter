""""Semana pasada" en el día: lo realizado en ese ejercicio la semana cerrada anterior de la rutina."""

from datetime import date

from sqlalchemy import select

from app.ai.plan_writer import write_plan
from app.ai.routine import DayProposal, RoutineProposal
from app.enums import PlanStatus
from app.models import Routine, WeekPlan
from tests.test_weeks import api, crear_semana, fuerza, plancha  # noqa: F401  (fixture y ayudantes)


def ejercicios(api, semana, dia):
    return {e["name"]: e for e in api.get(f"/weeks/{semana}/days/{dia}").json()["exercises"]}


def semana_con_registro(api):
    """Semana 1 activa: en el press, la serie 1 editada (6 reps, 52,5 kg) y la 2 marcada como
    planificada; la plancha sin registrar. Después se cierra."""
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    press = ejercicios(api, semana, 1)["Press de banca"]
    series = [s["id"] for s in press["sets"]]
    base = f"/weeks/{semana}/days/1/sets"
    assert api.put(f"{base}/{series[0]}", json={"reps": 6, "weight_kg": 52.5}).status_code == 200
    assert api.post(f"{base}/{series[1]}/done").status_code == 200
    assert api.post(f"/weeks/{semana}/close").status_code == 200
    return semana


def semana_activa(api, dias):
    """Una semana activa de la misma rutina con los días que se indiquen."""
    with api.session() as db:
        routine = db.scalar(select(Routine))
        user_id = routine.user_id
        week = write_plan(db, user_id, RoutineProposal(days=dias), routine)
        week.week_start = date(2026, 9, 8)
        db.commit()
        return week.id


def real(reps, kg):
    return {"reps": reps, "duration_minutes": None, "duration_seconds": None, "weight_kg": kg}


def test_la_primera_semana_no_tiene_semana_pasada(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)

    assert all(e["previous"] is None for e in ejercicios(api, semana, 1).values())


def test_trae_lo_realizado_serie_por_serie_y_vacio_lo_no_registrado(api):
    semana_con_registro(api)
    nueva = crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE)

    dia = ejercicios(api, nueva, 1)

    # La serie 2 se marcó como hecha: copia lo planificado (9 reps con 55 kg).
    assert dia["Press de banca"]["previous"] == [real(6, 52.5), real(9, 55.0), None, None]
    # Estaba en la semana anterior pero no se registró nada: series vacías, no None.
    assert dia["Plancha"]["previous"] == [None, None, None]


def test_se_busca_por_ejercicio_aunque_cambie_de_dia_y_uno_nuevo_no_tiene(api):
    semana_con_registro(api)
    nueva = semana_activa(api, [
        DayProposal(title="Espalda", exercises=[fuerza("Remo con barra")]),
        DayProposal(title="Empuje", exercises=[fuerza("Press de banca")]),
    ])

    assert ejercicios(api, nueva, 1)["Remo con barra"]["previous"] is None
    assert ejercicios(api, nueva, 2)["Press de banca"]["previous"][0] == real(6, 52.5)


def test_una_semana_vieja_compara_con_la_anterior_a_ella_no_con_la_ultima(api):
    primera = semana_con_registro(api)
    segunda = crear_semana(api, date(2026, 9, 8))  # cerrada, sin nada registrado

    assert ejercicios(api, primera, 1)["Press de banca"]["previous"] is None
    assert ejercicios(api, segunda, 1)["Press de banca"]["previous"][0] == real(6, 52.5)


def test_marcar_el_ejercicio_devuelve_tambien_la_semana_pasada(api):
    semana_con_registro(api)
    nueva = crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE)
    press = ejercicios(api, nueva, 1)["Press de banca"]

    hecho = api.post(f"/weeks/{nueva}/days/1/exercises/{press['id']}/done").json()

    assert hecho["previous"][0] == real(6, 52.5)


def test_otra_rutina_no_cuenta_como_semana_pasada(api):
    semana_con_registro(api)
    with api.session() as db:
        user_id = db.scalar(select(WeekPlan)).user_id
        otra = Routine(user_id=user_id, name="Masa", goal="masa", level="intermedio")
        db.add(otra)
        db.commit()
        otra_id = otra.id
    nueva = crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE, rutina_id=otra_id)

    assert ejercicios(api, nueva, 1)["Press de banca"]["previous"] is None
