"""Calendario de entrenamientos: histórico, de todas las rutinas, por día local."""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.deps import DEV_USER_EMAIL
from app.enums import PlanStatus
from app.models import PlanDay, User, WorkoutSession
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)


def completar(api, week_id, day_index, momento, email=DEV_USER_EMAIL):
    """Deja el día como completado en el instante dado (UTC)."""
    with api.session() as db:
        user = db.scalar(select(User).where(User.email == email))
        day = db.scalar(select(PlanDay).where(PlanDay.week_plan_id == week_id, PlanDay.day_index == day_index))
        db.add(WorkoutSession(user_id=user.id, plan_day_id=day.id, finished_at=momento))
        db.commit()


def utc(y, m, d, h=12, mi=0):
    return datetime(y, m, d, h, mi, tzinfo=timezone.utc)


def test_sin_entrenamientos_el_calendario_esta_vacio(api):
    data = api.get("/calendar?month=2026-10").json()

    assert data["sessions"] == []
    assert data["first_month"] is None
    assert data["total_days"] == 0
    assert data["month_days"] == 0


def test_marca_el_dia_completado_con_su_dia_del_plan(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    completar(api, semana, 1, utc(2026, 10, 7))

    data = api.get("/calendar?month=2026-10").json()

    assert data["total_days"] == 1
    assert data["month_days"] == 1
    assert data["first_month"] == "2026-10"
    [s] = data["sessions"]
    assert s["local_date"] == "2026-10-07"
    assert s["day_index"] == 1
    assert s["title"] == "Torso A"
    assert s["week_id"] == semana
    assert s["week_number"] == 1
    assert s["routine_name"] == "Fuerza"


def test_es_historico_junta_meses_y_dice_el_primero(api):
    vieja = crear_semana(api, date(2026, 8, 3))
    nueva = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    completar(api, vieja, 1, utc(2026, 8, 5))
    completar(api, nueva, 1, utc(2026, 10, 7))

    octubre = api.get("/calendar?month=2026-10").json()
    agosto = api.get("/calendar?month=2026-08").json()
    septiembre = api.get("/calendar?month=2026-09").json()

    assert octubre["first_month"] == agosto["first_month"] == "2026-08"
    assert octubre["total_days"] == 2
    assert [s["local_date"] for s in octubre["sessions"]] == ["2026-10-07"]
    assert [s["local_date"] for s in agosto["sessions"]] == ["2026-08-05"]
    assert septiembre["sessions"] == []
    assert septiembre["month_days"] == 0


def test_dos_dias_completados_el_mismo_dia_cuentan_un_solo_dia(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    completar(api, semana, 1, utc(2026, 10, 7, 10))
    completar(api, semana, 2, utc(2026, 10, 7, 18))

    data = api.get("/calendar?month=2026-10").json()

    assert len(data["sessions"]) == 2  # el detalle trae las dos
    assert data["month_days"] == 1  # pero es un solo día entrenado
    assert data["total_days"] == 1


def test_un_dia_reabierto_no_cuenta(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    with api.session() as db:
        user = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
        day = db.scalar(select(PlanDay).where(PlanDay.week_plan_id == semana, PlanDay.day_index == 1))
        db.add(WorkoutSession(user_id=user.id, plan_day_id=day.id, finished_at=None))
        db.commit()

    assert api.get("/calendar?month=2026-10").json()["total_days"] == 0


def test_el_dia_depende_de_la_zona_horaria(api):
    semana = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    # 01:30 UTC del 8 es las 22:30 del 7 en Argentina (UTC-3).
    completar(api, semana, 1, utc(2026, 10, 8, 1, 30))

    utc_data = api.get("/calendar?month=2026-10&tz=0").json()
    arg_data = api.get("/calendar?month=2026-10&tz=-180").json()

    assert utc_data["sessions"][0]["local_date"] == "2026-10-08"
    assert arg_data["sessions"][0]["local_date"] == "2026-10-07"


def test_el_borde_de_mes_usa_el_dia_local(api):
    semana = crear_semana(api, date(2026, 10, 26), PlanStatus.ACTIVE)
    # 02:00 UTC del 1 de noviembre es el 31 de octubre a las 23:00 en Argentina.
    completar(api, semana, 1, utc(2026, 11, 1, 2, 0))

    octubre = api.get("/calendar?month=2026-10&tz=-180").json()
    noviembre = api.get("/calendar?month=2026-11&tz=-180").json()

    assert [s["local_date"] for s in octubre["sessions"]] == ["2026-10-31"]
    assert noviembre["sessions"] == []
    assert noviembre["first_month"] == "2026-10"


def test_no_muestra_los_entrenamientos_de_otra_persona(api):
    mia = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE)
    ajena = crear_semana(api, date(2026, 10, 5), PlanStatus.ACTIVE, email="otra@example.test")
    completar(api, mia, 1, utc(2026, 10, 6))
    completar(api, ajena, 1, utc(2026, 10, 9), email="otra@example.test")

    data = api.get("/calendar?month=2026-10").json()

    assert [s["local_date"] for s in data["sessions"]] == ["2026-10-06"]
    assert data["total_days"] == 1


def test_un_mes_mal_escrito_devuelve_422(api):
    for malo in ("2026-13", "26-10", "octubre", "2026-1"):
        assert api.get(f"/calendar?month={malo}").status_code == 422
