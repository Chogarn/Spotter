"""Evolución de un ejercicio por fecha, acumulando todas las rutinas (decisión 69)."""

from datetime import date

from sqlalchemy import select

from app.deps import DEV_USER_EMAIL
from app.enums import Goal, Level, PlanStatus
from app.models import Routine, User
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)

PRESS = "Press de banca con barra"


def nueva_rutina(api, nombre, goal):
    with api.session() as db:
        user = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
        rutina = Routine(user_id=user.id, name=nombre, goal=goal, level=Level.INTERMEDIO)
        db.add(rutina)
        db.commit()
        return rutina.id


def ejercicio_id(api, nombre=PRESS):
    lista = api.get("/exercises").json()
    return next(e["id"] for e in lista if e["name"] == nombre)


def registrar_press(api, semana, kilos):
    series = {e["name"]: e for e in api.get(f"/weeks/{semana}/days/1").json()["exercises"]}
    serie = series[PRESS]["sets"][0]
    resultado = api.put(f"/weeks/{semana}/days/1/sets/{serie['id']}", json={"reps": 8, "weight_kg": kilos})
    assert resultado.status_code == 200


def semana_con_peso(api, inicio, kilos, rutina_id=None):
    """Una semana en curso con `kilos` registrados, que se cierra: la persona tiene una activa a la vez."""
    semana = crear_semana(api, inicio, status=PlanStatus.ACTIVE, rutina_id=rutina_id)
    registrar_press(api, semana, kilos)
    assert api.post(f"/weeks/{semana}/close").status_code == 200
    return semana


def test_acumula_el_ejercicio_de_varias_rutinas_en_orden_de_fecha(api):
    fuerza = nueva_rutina(api, "Fuerza · desde el 1/9", Goal.FUERZA)
    masa = nueva_rutina(api, "Masa · desde el 15/9", Goal.MASA)
    semana_con_peso(api, date(2026, 9, 1), 50, rutina_id=fuerza)
    semana_con_peso(api, date(2026, 9, 8), 55, rutina_id=fuerza)
    semana_con_peso(api, date(2026, 9, 15), 60, rutina_id=masa)

    cuerpo = api.get(f"/exercises/{ejercicio_id(api)}/history").json()

    assert cuerpo["unit"] == "kg"
    assert [p["value"] for p in cuerpo["points"]] == [50.0, 55.0, 60.0]
    assert [p["routine_name"] for p in cuerpo["points"]] == [
        "Fuerza · desde el 1/9",
        "Fuerza · desde el 1/9",
        "Masa · desde el 15/9",
    ]
    assert [p["week_start"] for p in cuerpo["points"]] == ["2026-09-01", "2026-09-08", "2026-09-15"]
    # El número de semana cuenta dentro de cada rutina.
    assert [p["number"] for p in cuerpo["points"]] == [1, 2, 1]
    assert cuerpo["record"] == 60.0
    assert (cuerpo["first_value"], cuerpo["last_value"]) == (50.0, 60.0)
    assert cuerpo["weeks_with_data"] == 3
    assert cuerpo["routines_count"] == 2


def test_una_semana_sin_registros_queda_como_punto_vacio_sin_inventar(api):
    a = nueva_rutina(api, "A", Goal.FUERZA)
    semana_con_peso(api, date(2026, 9, 1), 50, rutina_id=a)
    crear_semana(api, date(2026, 9, 8), rutina_id=a)  # cerrada, sin registrar nada
    semana_con_peso(api, date(2026, 9, 15), 60, rutina_id=a)

    cuerpo = api.get(f"/exercises/{ejercicio_id(api)}/history").json()

    assert [p["value"] for p in cuerpo["points"]] == [50.0, None, 60.0]
    assert cuerpo["weeks_with_data"] == 2


def test_la_lista_trae_los_ejercicios_de_todas_las_rutinas_con_sus_semanas(api):
    a = nueva_rutina(api, "A", Goal.FUERZA)
    b = nueva_rutina(api, "B", Goal.MASA)
    crear_semana(api, date(2026, 9, 1), rutina_id=a)
    crear_semana(api, date(2026, 9, 8), rutina_id=b)

    lista = api.get("/exercises").json()
    por_nombre = {e["name"]: e for e in lista}

    assert set(por_nombre) == {PRESS, "Plancha", "Sentadilla con barra", "Cinta"}
    assert por_nombre[PRESS]["weeks_count"] == 2
    assert [e["name"] for e in lista] == sorted((e["name"] for e in lista), key=str.lower)


def test_no_mezcla_las_semanas_de_otra_persona(api):
    mia = nueva_rutina(api, "Mía", Goal.FUERZA)
    semana_con_peso(api, date(2026, 9, 1), 50, rutina_id=mia)
    # Otra persona entrena el mismo ejercicio (misma fila de ejercicio) con otro peso.
    crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE, email="otro@x.com")

    cuerpo = api.get(f"/exercises/{ejercicio_id(api)}/history").json()

    assert [p["value"] for p in cuerpo["points"]] == [50.0]
    assert next(e for e in api.get("/exercises").json() if e["name"] == PRESS)["weeks_count"] == 1


def test_un_ejercicio_que_no_figura_en_mis_semanas_da_404(api):
    crear_semana(api, date(2026, 9, 1))

    assert api.get("/exercises/99999/history").status_code == 404


def test_isometrico_en_segundos_y_cardio_en_minutos_cada_uno_en_su_unidad(api):
    semana = crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    dia1 = {e["name"]: e for e in api.get(f"/weeks/{semana}/days/1").json()["exercises"]}
    api.put(
        f"/weeks/{semana}/days/1/sets/{dia1['Plancha']['sets'][0]['id']}",
        json={"duration_seconds": 50},
    )
    dia2 = {e["name"]: e for e in api.get(f"/weeks/{semana}/days/2").json()["exercises"]}
    api.post(f"/weeks/{semana}/days/2/sets/{dia2['Cinta']['sets'][0]['id']}/done")

    plancha = api.get(f"/exercises/{ejercicio_id(api, 'Plancha')}/history").json()
    cinta = api.get(f"/exercises/{ejercicio_id(api, 'Cinta')}/history").json()

    assert (plancha["unit"], plancha["record"]) == ("s", 50.0)
    assert (cinta["unit"], cinta["record"]) == ("min", 30.0)
