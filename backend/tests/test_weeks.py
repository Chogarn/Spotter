from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai.plan_writer import write_plan
from app.ai.routine import DayProposal, ExerciseProposal, RoutineProposal, SetProposal
from app.db import Base, get_db
from app.deps import DEV_USER_EMAIL
from app.enums import PlanStatus
from app.main import app
from app.models import User


def fuerza(nombre, sets=4, reps=10, rest=120):
    return ExerciseProposal(
        name=nombre, kind="strength", region="upper", direction="push", primary_muscle="chest",
        mechanic="compound", equipment="barbell", level="intermedio", rest_seconds=rest,
        execution_notes="bajar lento", reason="base",
        sets=[SetProposal(reps=reps - i, target_weight_kg=50 + 5 * i) for i in range(sets)],
    )


def plancha():
    return ExerciseProposal(
        name="Plancha", kind="isometric", region="core", direction="none", primary_muscle="core",
        mechanic="isolation", equipment="bodyweight", level="principiante", rest_seconds=60,
        sets=[SetProposal(duration_seconds=45) for _ in range(3)],
    )


def cardio():
    return ExerciseProposal(
        name="Cinta", kind="cardio", region="full_body", direction="none", primary_muscle="full_body",
        mechanic="compound", equipment="machine", level="principiante",
        sets=[SetProposal(duration_minutes=30)],
    )


def rutina():
    return RoutineProposal(days=[
        DayProposal(title="Torso A", mobility_notes="movilidad de hombros",
                    exercises=[fuerza("Press de banca"), plancha()]),
        DayProposal(title="Pierna A", exercises=[fuerza("Sentadilla"), cardio()]),
    ])


@pytest.fixture
def api():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(engine, expire_on_commit=False)

    def override_get_db():
        with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    client.session = Session
    client.get("/profile")  # crea el usuario de desarrollo
    yield client
    app.dependency_overrides.clear()


def crear_semana(api, start, status=PlanStatus.CLOSED, email=DEV_USER_EMAIL):
    with api.session() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, password_hash="x", name="otro")
            db.add(user)
            db.commit()
        week = write_plan(db, user.id, rutina())
        week.week_start = start
        week.status = status
        if status == PlanStatus.CLOSED:
            week.closed_at = datetime(2026, 10, 1, tzinfo=timezone.utc)
        db.commit()
        return week.id


def test_sin_semanas_la_lista_esta_vacia(api):
    assert api.get("/weeks").json() == []


def test_mis_rutinas_lista_de_la_mas_nueva_a_la_mas_vieja_con_su_numero(api):
    primera = crear_semana(api, date(2026, 9, 1))
    segunda = crear_semana(api, date(2026, 9, 8))
    tercera = crear_semana(api, date(2026, 9, 15), status=PlanStatus.ACTIVE)

    lista = api.get("/weeks").json()

    assert [(s["id"], s["number"], s["status"]) for s in lista] == [
        (tercera, 3, "active"),
        (segunda, 2, "closed"),
        (primera, 1, "closed"),
    ]
    assert all(s["day_count"] == 2 for s in lista)
    assert lista[2]["closed_at"] is not None
    assert lista[0]["closed_at"] is None


def test_el_numero_sigue_el_orden_de_activacion_y_no_el_id(api):
    nueva_por_id = crear_semana(api, date(2026, 9, 20))
    vieja_por_id = crear_semana(api, date(2026, 9, 1))  # id mayor, pero se activó antes

    numeros = {s["id"]: s["number"] for s in api.get("/weeks").json()}

    assert numeros[vieja_por_id] == 1
    assert numeros[nueva_por_id] == 2


def test_active_no_se_confunde_con_un_id(api):
    crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    assert api.get("/weeks/active").status_code == 200


def test_la_semana_lista_sus_dias_con_cantidad_de_ejercicios_y_duracion(api):
    semana = crear_semana(api, date(2026, 9, 1))

    detalle = api.get(f"/weeks/{semana}").json()

    assert detalle["number"] == 1
    assert detalle["status"] == "closed"
    assert [(d["day_index"], d["title"], d["exercise_count"]) for d in detalle["days"]] == [
        (1, "Torso A", 2),
        (2, "Pierna A", 2),
    ]
    # Día 1: press = 34 reps (10+9+8+7) x 3 s + 3 descansos de 120 s = 462 s; plancha = 3 x 45 s + 2 descansos
    # de 60 s = 255 s; en total 717 s = 11,95 min, más 1,5 de cambio y 7,5 de movilidad = 20,95 -> 21.
    assert detalle["days"][0]["minutes"] == 21
    # Día 2: sentadilla 462 s = 7,7 min + cardio 30 min + 1,5 de cambio = 39,2 -> 39.
    assert detalle["days"][1]["minutes"] == 39


def test_el_dia_trae_los_ejercicios_en_orden_con_sus_series(api):
    semana = crear_semana(api, date(2026, 9, 1))

    dia = api.get(f"/weeks/{semana}/days/1").json()

    assert dia["title"] == "Torso A"
    assert dia["week_number"] == 1
    assert dia["mobility_notes"] == "movilidad de hombros"
    assert [e["name"] for e in dia["exercises"]] == ["Press de banca", "Plancha"]
    press = dia["exercises"][0]
    assert press["kind"] == "strength"
    assert press["rest_seconds"] == 120
    assert press["execution_notes"] == "bajar lento"
    assert [(s["set_number"], s["reps"], s["target_weight_kg"]) for s in press["sets"]] == [
        (1, 10, 50.0), (2, 9, 55.0), (3, 8, 60.0), (4, 7, 65.0),
    ]


def test_los_isometricos_van_en_segundos_y_el_cardio_en_minutos(api):
    semana = crear_semana(api, date(2026, 9, 1))

    plancha_ = api.get(f"/weeks/{semana}/days/1").json()["exercises"][1]
    cinta = api.get(f"/weeks/{semana}/days/2").json()["exercises"][1]

    assert plancha_["kind"] == "isometric"
    assert [s["duration_seconds"] for s in plancha_["sets"]] == [45, 45, 45]
    assert plancha_["sets"][0]["reps"] is None
    assert cinta["kind"] == "cardio"
    assert cinta["sets"][0]["duration_minutes"] == 30
    assert cinta["sets"][0]["duration_seconds"] is None


def test_la_semana_o_el_dia_inexistentes_dan_404(api):
    semana = crear_semana(api, date(2026, 9, 1))
    assert api.get("/weeks/999").status_code == 404
    assert api.get(f"/weeks/{semana}/days/9").status_code == 404
    assert api.get("/weeks/999/days/1").status_code == 404


def test_no_se_puede_ver_la_semana_de_otro_usuario(api):
    ajena = crear_semana(api, date(2026, 9, 1), email="otro@spotter.local")

    assert api.get(f"/weeks/{ajena}").status_code == 404
    assert api.get(f"/weeks/{ajena}/days/1").status_code == 404
    assert api.get("/weeks").json() == []
