"""Evolución de un ejercicio a lo largo de las semanas de una rutina (#62)."""

from datetime import date

from sqlalchemy import select

from app.enums import PlanStatus
from app.models import Routine, User
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)


def dia(api, semana, n):
    return {e["name"]: e for e in api.get(f"/weeks/{semana}/days/{n}").json()["exercises"]}


def rutina_id(api):
    return api.get("/routines").json()[0]["id"]


def ejercicios(api):
    return {e["name"]: e for e in api.get(f"/routines/{rutina_id(api)}/exercises").json()}


def historial(api, nombre):
    respuesta = api.get(f"/routines/{rutina_id(api)}/exercises/{ejercicios(api)[nombre]['id']}/history")
    assert respuesta.status_code == 200
    return respuesta.json()


def semana_activa(api, inicio):
    return crear_semana(api, inicio, status=PlanStatus.ACTIVE)


def test_la_rutina_lista_sus_ejercicios_en_el_orden_en_que_aparecen(api):
    crear_semana(api, date(2026, 9, 1))

    nombres = [e["name"] for e in api.get(f"/routines/{rutina_id(api)}/exercises").json()]

    assert nombres == ["Press de banca", "Plancha", "Sentadilla", "Cinta"]


def test_fuerza_mayor_peso_por_semana_sin_inventar_las_vacias(api):
    # Semana 1: una serie editada (52,5 kg) y otra marcada como planificada (9 × 55).
    primera = semana_activa(api, date(2026, 9, 1))
    series = dia(api, primera, 1)["Press de banca"]["sets"]
    api.put(f"/weeks/{primera}/days/1/sets/{series[0]['id']}", json={"reps": 10, "weight_kg": 52.5})
    api.post(f"/weeks/{primera}/days/1/sets/{series[1]['id']}/done")
    api.post(f"/weeks/{primera}/close")
    # Semana 2: cerrada sin registrar nada.
    crear_semana(api, date(2026, 9, 8))
    # Semana 3, en curso: 60 kg.
    tercera = semana_activa(api, date(2026, 9, 15))
    serie = dia(api, tercera, 1)["Press de banca"]["sets"][0]
    api.put(f"/weeks/{tercera}/days/1/sets/{serie['id']}", json={"reps": 8, "weight_kg": 60})

    cuerpo = historial(api, "Press de banca")

    assert cuerpo["unit"] == "kg"
    assert [(s["number"], s["value"]) for s in cuerpo["weeks"]] == [(1, 55.0), (2, None), (3, 60.0)]
    assert [s["status"] for s in cuerpo["weeks"]] == ["closed", "closed", "active"]
    assert cuerpo["record"] == 60.0


def test_isometrico_en_segundos_y_cardio_en_minutos(api):
    semana = semana_activa(api, date(2026, 9, 1))
    plancha = dia(api, semana, 1)["Plancha"]["sets"][0]
    api.put(f"/weeks/{semana}/days/1/sets/{plancha['id']}", json={"duration_seconds": 50})
    cinta = dia(api, semana, 2)["Cinta"]["sets"][0]
    api.post(f"/weeks/{semana}/days/2/sets/{cinta['id']}/done")

    plancha_hist = historial(api, "Plancha")
    cinta_hist = historial(api, "Cinta")

    assert (plancha_hist["unit"], plancha_hist["record"]) == ("s", 50.0)
    assert (cinta_hist["unit"], cinta_hist["record"]) == ("min", 30.0)


def test_sin_registros_no_hay_record(api):
    crear_semana(api, date(2026, 9, 1))

    cuerpo = historial(api, "Sentadilla")

    assert cuerpo["record"] is None
    assert all(s["value"] is None for s in cuerpo["weeks"])


def test_ejercicio_fuera_de_la_rutina_o_rutina_ajena_da_404(api):
    crear_semana(api, date(2026, 9, 1))
    propia = rutina_id(api)
    crear_semana(api, date(2026, 9, 1), email="otro@spotter.local")
    with api.session() as db:
        ajena = db.scalar(
            select(Routine.id).join(User).where(User.email == "otro@spotter.local")
        )

    assert api.get(f"/routines/{propia}/exercises/999/history").status_code == 404
    assert api.get(f"/routines/{ajena}/exercises").status_code == 404
