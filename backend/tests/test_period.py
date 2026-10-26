"""Resumen de un día, un mes o un año (Progreso), juntando todas las rutinas."""

from datetime import date, datetime, timezone

from sqlalchemy import select

from app.enums import PlanStatus
from app.deps import DEV_USER_EMAIL
from app.models import PlanDay, SetEntry, User, WorkoutSession
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)


def entrenar(api, semana, n, momento, reps=10, peso=50):
    """Deja la primera serie del press del día n hecha y el día completado en el instante dado.
    Se escribe directo en la base: las semanas cerradas no admiten registros por la API."""
    with api.session() as db:
        user = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
        dia = db.scalar(select(PlanDay).where(PlanDay.week_plan_id == semana, PlanDay.day_index == n))
        sesion = WorkoutSession(user_id=user.id, plan_day_id=dia.id, finished_at=momento)
        db.add(sesion)
        db.flush()
        press = next((e for e in dia.exercises if e.exercise.name == "Press de banca con barra"), None)
        if press is not None:
            serie = press.sets[0]
            db.add(
                SetEntry(
                    session_id=sesion.id,
                    plan_exercise_id=press.id,
                    plan_set_id=serie.id,
                    exercise_id=press.exercise_id,
                    set_number=1,
                    reps=reps,
                    weight_kg=peso,
                )
            )
        db.commit()


def utc(y, m, d, h=12):
    return datetime(y, m, d, h, tzinfo=timezone.utc)


def periodo(api, tipo, fecha, tz=0):
    respuesta = api.get(f"/progress/period?period={tipo}&date={fecha}&tz={tz}")
    assert respuesta.status_code == 200
    return respuesta.json()


def test_sin_entrenamientos_todo_da_cero(api):
    cuerpo = periodo(api, "month", "2026-10-15")

    assert cuerpo["days_trained"] == 0
    assert cuerpo["kg_moved"] == 0
    assert cuerpo["first_date"] is None
    assert cuerpo["exercises"] == []
    assert len(cuerpo["buckets"]) == 31


def test_el_dia_trae_lo_hecho_ese_dia(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, semana, 1, utc(2026, 10, 7), reps=10, peso=50)

    cuerpo = periodo(api, "day", "2026-10-07")

    assert (cuerpo["start"], cuerpo["end"]) == ("2026-10-07", "2026-10-07")
    assert cuerpo["days_trained"] == 1
    assert cuerpo["sets_done"] == 1
    assert cuerpo["kg_moved"] == 500
    assert cuerpo["buckets"] == []
    assert [s["title"] for s in cuerpo["sessions"]] == ["Torso A"]
    assert cuerpo["exercises"] == [
        {"name": "Press de banca con barra", "kind": "strength", "sets_done": 1, "best_weight_kg": 50}
    ]
    assert periodo(api, "day", "2026-10-08")["days_trained"] == 0


def test_el_mes_suma_los_dias_y_da_una_barra_por_dia(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, semana, 1, utc(2026, 10, 7), reps=10, peso=50)
    entrenar(api, semana, 2, utc(2026, 10, 20), reps=5, peso=60)  # el día 2 no tiene press: 0 kg
    sept = crear_semana(api, date(2026, 9, 7))
    entrenar(api, sept, 1, utc(2026, 9, 9), reps=8, peso=40)

    octubre = periodo(api, "month", "2026-10-31")

    assert (octubre["start"], octubre["end"]) == ("2026-10-01", "2026-10-31")
    assert octubre["days_trained"] == 2
    assert octubre["kg_moved"] == 500
    assert octubre["first_date"] == "2026-09-09"
    barra = {b["start"]: b for b in octubre["buckets"]}
    assert barra["2026-10-07"]["days_trained"] == 1 and barra["2026-10-07"]["kg_moved"] == 500
    assert barra["2026-10-08"]["days_trained"] == 0


def test_el_año_junta_las_rutinas_y_da_una_barra_por_mes(api):
    a = crear_semana(api, date(2026, 9, 7))
    b = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, a, 1, utc(2026, 9, 9), reps=8, peso=40)
    entrenar(api, b, 1, utc(2026, 10, 7), reps=10, peso=50)

    anio = periodo(api, "year", "2026-03-01")

    assert anio["days_trained"] == 2
    assert anio["kg_moved"] == 8 * 40 + 10 * 50
    assert [x["label"] for x in anio["buckets"]][8:10] == ["sep", "oct"]
    assert anio["exercises"][0]["sets_done"] == 2
    assert anio["exercises"][0]["best_weight_kg"] == 50
    assert periodo(api, "year", "2025-06-01")["days_trained"] == 0


def test_la_zona_horaria_mueve_el_dia(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, semana, 1, utc(2026, 10, 8, h=1))  # 22:00 del 7 en Argentina

    assert periodo(api, "day", "2026-10-07", tz=-180)["days_trained"] == 1
    assert periodo(api, "day", "2026-10-08", tz=-180)["days_trained"] == 0


def test_un_dia_sin_completar_no_cuenta(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, semana, 1, utc(2026, 10, 7))
    with api.session() as db:
        db.scalar(select(WorkoutSession)).finished_at = None
        db.commit()

    assert periodo(api, "month", "2026-10-01")["days_trained"] == 0


def musculos(api, tipo, fecha, tz=0):
    respuesta = api.get(f"/progress/muscles?period={tipo}&date={fecha}&tz={tz}")
    assert respuesta.status_code == 200
    return respuesta.json()


def series(cuerpo):
    return {m["muscle"]: (m["sets"], m["previous_sets"]) for m in cuerpo["muscles"]}


def test_los_musculos_del_mes_cuentan_las_series_y_comparan_con_el_mes_anterior(api):
    sept = crear_semana(api, date(2026, 9, 7))
    octu = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, sept, 1, utc(2026, 9, 9))
    entrenar(api, octu, 1, utc(2026, 10, 7))
    entrenar(api, octu, 1, utc(2026, 10, 14))

    cuerpo = musculos(api, "month", "2026-10-20")

    assert len(cuerpo["muscles"]) == 6
    assert series(cuerpo)["chest"] == (2, 1)
    assert series(cuerpo)["back"] == (0, 0)
    assert cuerpo["first_date"] == "2026-09-09"


def test_el_dia_no_tiene_minimo_y_el_mes_pasado_lo_escala_a_sus_dias(api):
    crear_semana(api, date(2026, 9, 7))

    assert musculos(api, "day", "2026-09-10")["minimum"] is None
    assert musculos(api, "month", "2026-09-10")["minimum"] == round(10 * 30 / 7)  # septiembre entero
    assert musculos(api, "year", "2025-01-01")["minimum"] == round(10 * 365 / 7)


def test_los_musculos_del_dia_respetan_la_zona_horaria(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    entrenar(api, semana, 1, utc(2026, 10, 8, h=1))  # 22:00 del 7 en Argentina

    assert series(musculos(api, "day", "2026-10-07", tz=-180))["chest"][0] == 1
    assert series(musculos(api, "day", "2026-10-08", tz=-180))["chest"][0] == 0
