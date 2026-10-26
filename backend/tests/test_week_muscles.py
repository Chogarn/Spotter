"""Series hechas por grupo muscular en la última semana, para el radar de Estadísticas."""

from datetime import date

from app.enums import PlanStatus
from tests.test_weeks import api, crear_semana, fuerza  # noqa: F401  (fixture y ayudantes)


def musculos(api):
    respuesta = api.get("/weeks/muscles")
    assert respuesta.status_code == 200
    return respuesta.json()


def series(cuerpo):
    return {m["muscle"]: m["sets"] for m in cuerpo["muscles"]}


def hacer_press(api, semana, cuantas):
    """Marca como hechas las primeras series del press de banca del día 1."""
    dia = api.get(f"/weeks/{semana}/days/1").json()["exercises"]
    press = next(e for e in dia if e["name"] == "Press de banca con barra")
    for s in press["sets"][:cuantas]:
        api.post(f"/weeks/{semana}/days/1/sets/{s['id']}/done")


def test_sin_semanas_responde_404(api):
    assert api.get("/weeks/muscles").status_code == 404


def test_cuenta_solo_las_series_hechas_de_los_seis_grupos_grandes(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    hacer_press(api, semana, 3)
    # La plancha (core) y la cinta (cardio) no son grupos grandes: no entran.
    plancha = next(
        e for e in api.get(f"/weeks/{semana}/days/1").json()["exercises"] if e["name"] == "Plancha"
    )
    api.post(f"/weeks/{semana}/days/1/sets/{plancha['sets'][0]['id']}/done")

    cuerpo = musculos(api)

    assert cuerpo["week_id"] == semana
    assert cuerpo["minimum"] == 10
    assert [m["muscle"] for m in cuerpo["muscles"]] == [
        "chest", "back", "shoulders", "quadriceps", "hamstrings", "glutes",
    ]
    assert series(cuerpo) == {
        "chest": 3, "back": 0, "shoulders": 0, "quadriceps": 0, "hamstrings": 0, "glutes": 0,
    }
    assert cuerpo["has_previous"] is False
    assert all(m["previous_sets"] is None for m in cuerpo["muscles"])
    # Los complementos van aparte (para el mapa muscular): la plancha cuenta como core.
    assert {m["muscle"]: m["sets"] for m in cuerpo["others"]} == {
        "biceps": 0, "triceps": 0, "calves": 0, "core": 1, "adductors": 0, "forearm": 0, "tibialis": 0,
    }


def test_compara_con_la_semana_cerrada_anterior_de_la_rutina(api):
    primera = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    hacer_press(api, primera, 4)
    api.post(f"/weeks/{primera}/close", json={})
    segunda = crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE)
    hacer_press(api, segunda, 2)

    cuerpo = musculos(api)

    assert cuerpo["week_id"] == segunda
    assert cuerpo["number"] == 2
    assert cuerpo["has_previous"] is True
    pecho = next(m for m in cuerpo["muscles"] if m["muscle"] == "chest")
    assert (pecho["sets"], pecho["previous_sets"]) == (2, 4)


def test_sin_semana_activa_usa_la_ultima_cerrada(api):
    primera = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    hacer_press(api, primera, 1)
    api.post(f"/weeks/{primera}/close", json={})
    segunda = crear_semana(api, date(2026, 9, 8), status=PlanStatus.ACTIVE)
    hacer_press(api, segunda, 3)
    api.post(f"/weeks/{segunda}/close", json={})

    cuerpo = musculos(api)

    assert cuerpo["week_id"] == segunda
    assert cuerpo["status"] == "closed"
    assert series(cuerpo)["chest"] == 3


def test_no_mezcla_las_series_de_otro_usuario(api):
    crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE, email="otro@example.com")

    assert api.get("/weeks/muscles").status_code == 404
