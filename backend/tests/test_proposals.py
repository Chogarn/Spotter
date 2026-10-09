import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai import gemini
from app.ai.plan_writer import normalize_name
from app.db import Base, get_db
from app.enums import PlanStatus, ProposalStatus
from app.main import app
from app.models import AiCall, Exercise, PlanDay, PlanExercise, PlanProposal, PlanSet, WeekPlan

PERFIL = {
    "name": "Bruno", "age": 30, "weight_kg": "80.5", "height_cm": 178, "sex": None,
    "limitations": None,
    "accept_legal_notice": True,
}
ELECCION = {"goal": "masa", "level": "principiante"}
GRANDES = [
    ("Press de banca", "chest", "upper", "push"),
    ("Remo con barra", "back", "upper", "pull"),
    ("Press militar", "shoulders", "upper", "push"),
    ("Sentadilla", "quadriceps", "lower", "none"),
    ("Peso muerto rumano", "hamstrings", "lower", "none"),
    ("Hip thrust", "glutes", "lower", "none"),
]


def ejercicio(nombre, musculo, region, direccion, sets=5):
    return {
        "name": nombre, "kind": "strength", "region": region, "direction": direccion,
        "primary_muscle": musculo, "secondary_muscles": [], "mechanic": "compound",
        "equipment": "barbell", "level": "principiante", "rest_seconds": 120,
        "execution_notes": "bajar lento", "reason": "ejercicio base",
        "sets": [{"reps": 10, "target_weight_kg": 40.5} for _ in range(sets)],
    }


def rutina(dias=2, **cambios):
    dia = {"title": "Cuerpo completo", "mobility_notes": None,
           "exercises": [ejercicio(*g) for g in GRANDES]}
    return {"days": [dia for _ in range(dias)], "notices": [], **cambios}


class GeminiFalso:
    """Devuelve las respuestas en orden y cuenta cuántas veces lo llamaron."""

    def __init__(self, respuestas):
        self.respuestas = list(respuestas)
        self.llamadas = 0
        self.prompts = []
        self.interactions = self

    def create(self, **kwargs):
        self.llamadas += 1
        self.prompts.append(kwargs["input"])
        respuesta = self.respuestas.pop(0)
        if isinstance(respuesta, Exception):
            raise respuesta
        texto = respuesta if isinstance(respuesta, str) else json.dumps(respuesta)
        return type("R", (), {"output_text": texto})()


@pytest.fixture
def entorno(monkeypatch):
    for nombre, valor in {
        "GEMINI_API_KEY": "k", "GEMINI_MODEL": "m", "GEMINI_RPM_LIMIT": "12", "GEMINI_DAILY_LIMIT": "400",
    }.items():
        monkeypatch.setenv(nombre, valor)


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
    yield client
    app.dependency_overrides.clear()


def con_perfil(api):
    assert api.put("/profile", json=PERFIL).status_code == 200


def usar_gemini(monkeypatch, *respuestas):
    falso = GeminiFalso(respuestas)
    monkeypatch.setattr(gemini, "get_client", lambda api_key: falso)
    return falso


def contar(api, modelo):
    with api.session() as db:
        return db.scalar(select(func.count()).select_from(modelo))


# --- generar ---


def test_generar_guarda_una_propuesta_pendiente_sin_tocar_el_plan(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())

    response = api.post("/proposals/generate", json=ELECCION)

    assert response.status_code == 201
    cuerpo = response.json()
    assert cuerpo["status"] == "pending"
    assert cuerpo["kind"] == "generate"
    assert len(cuerpo["routine"]["days"]) == 2
    assert contar(api, WeekPlan) == 0  # el plan no se toca hasta aceptar
    assert contar(api, AiCall) == 1


def test_los_avisos_viajan_con_la_propuesta_y_no_la_bloquean(api, entorno, monkeypatch):
    con_perfil(api)
    corta = rutina()
    corta["days"] = [
        {**d, "exercises": [ejercicio(*g, sets=2) for g in GRANDES]} for d in corta["days"]
    ]  # 4 series por grupo: por debajo de las 10 de R3
    usar_gemini(monkeypatch, corta)

    cuerpo = api.post("/proposals/generate", json=ELECCION).json()

    assert "R3" in {w["rule"] for w in cuerpo["warnings"]}
    assert cuerpo["status"] == "pending"


def test_sin_perfil_no_se_puede_generar(api, entorno, monkeypatch):
    falso = usar_gemini(monkeypatch, rutina())
    assert api.post("/proposals/generate", json=ELECCION).status_code == 409
    assert falso.llamadas == 0


def test_con_una_semana_activa_no_se_genera(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina(), rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()
    assert api.post(f"/proposals/{propuesta['id']}/accept").status_code == 200

    falso = usar_gemini(monkeypatch, rutina())
    assert api.post("/proposals/generate", json=ELECCION).status_code == 409
    assert falso.llamadas == 0


def test_sin_configuracion_devuelve_503(api, monkeypatch):
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    con_perfil(api)
    assert api.post("/proposals/generate", json=ELECCION).status_code == 503


def test_con_el_tope_alcanzado_devuelve_429_y_no_llama(api, entorno, monkeypatch):
    monkeypatch.setenv("GEMINI_RPM_LIMIT", "1")
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina(), rutina())
    assert api.post("/proposals/generate", json=ELECCION).status_code == 201

    response = api.post("/proposals/generate", json=ELECCION)

    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"
    assert falso.llamadas == 1


def test_si_gemini_falla_devuelve_502(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, RuntimeError("timeout"))
    assert api.post("/proposals/generate", json=ELECCION).status_code == 502
    assert contar(api, PlanProposal) == 0


# --- reintento ---


def test_respuesta_invalida_se_reintenta_una_vez(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, "esto no es json", rutina())

    response = api.post("/proposals/generate", json=ELECCION)

    assert response.status_code == 201
    assert falso.llamadas == 2
    assert contar(api, AiCall) == 2  # cada intento cuenta en los topes
    assert "# Corrección" in falso.prompts[1]  # el reintento le cuenta qué falló
    assert "# Corrección" not in falso.prompts[0]


def test_un_error_de_reglas_tambien_reintenta(api, entorno, monkeypatch):
    con_perfil(api)
    un_dia = rutina(dias=1)  # R11 y R1: una semana de un día
    falso = usar_gemini(monkeypatch, un_dia, rutina())

    assert api.post("/proposals/generate", json=ELECCION).status_code == 201
    assert falso.llamadas == 2
    assert "R11" in falso.prompts[1]


def test_dos_respuestas_invalidas_no_guardan_nada(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, "basura", rutina(dias=1))

    response = api.post("/proposals/generate", json=ELECCION)

    assert response.status_code == 502
    assert falso.llamadas == 2
    assert contar(api, PlanProposal) == 0
    assert contar(api, AiCall) == 2


# --- una sola pendiente ---


def test_generar_de_nuevo_descarta_la_propuesta_pendiente_anterior(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina(), rutina())
    primera = api.post("/proposals/generate", json=ELECCION).json()
    segunda = api.post("/proposals/generate", json=ELECCION).json()

    assert api.get(f"/proposals/{primera['id']}").json()["status"] == "discarded"
    assert api.get(f"/proposals/{segunda['id']}").json()["status"] == "pending"


def test_si_la_nueva_falla_la_anterior_sigue_pendiente(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    primera = api.post("/proposals/generate", json=ELECCION).json()
    usar_gemini(monkeypatch, RuntimeError("caída"))
    assert api.post("/proposals/generate", json=ELECCION).status_code == 502

    assert api.get(f"/proposals/{primera['id']}").json()["status"] == "pending"


def test_generar_sin_objetivo_o_sin_nivel_da_422_y_no_llama_a_la_ia(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    assert api.post("/proposals/generate").status_code == 422
    assert api.post("/proposals/generate", json={"goal": "masa"}).status_code == 422
    assert api.post("/proposals/generate", json={"level": "avanzado"}).status_code == 422
    assert api.post("/proposals/generate", json={"goal": "volar", "level": "avanzado"}).status_code == 422
    assert falso.llamadas == 0
    assert contar(api, AiCall) == 0


def test_el_prompt_lleva_lo_elegido_y_la_semana_lo_guarda_al_aceptar(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    propuesta = api.post(
        "/proposals/generate", json={"goal": "fuerza", "level": "avanzado"}
    ).json()

    assert "Nivel: avanzado" in falso.prompts[0]
    assert "Objetivo: fuerza (ganar fuerza)" in falso.prompts[0]
    assert "gimnasio completo" in falso.prompts[0]
    api.post(f"/proposals/{propuesta['id']}/accept")
    with api.session() as db:
        semana = db.scalars(select(WeekPlan)).one()
        assert semana.routine.goal.value == "fuerza"
        assert semana.routine.level.value == "avanzado"


# --- ver, aceptar, descartar ---


def test_ver_una_propuesta_inexistente_da_404(api):
    assert api.get("/proposals/999").status_code == 404


def test_aceptar_crea_la_semana_los_dias_los_ejercicios_y_las_series(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()

    response = api.post(f"/proposals/{propuesta['id']}/accept")

    assert response.status_code == 200
    assert response.json()["status"] == "accepted"
    with api.session() as db:
        semana = db.scalars(select(WeekPlan)).one()
        assert semana.status == PlanStatus.ACTIVE
        assert semana.origin.value == "generated"
        assert [d.day_index for d in semana.days] == [1, 2]
        assert len(semana.days[0].exercises) == 6
        primero = semana.days[0].exercises[0]
        assert primero.position == 1
        assert primero.rest_seconds == 120
        assert [s.set_number for s in primero.sets] == [1, 2, 3, 4, 5]
        assert float(primero.sets[0].target_weight_kg) == 40.5
        guardada = db.get(PlanProposal, propuesta["id"])
        assert guardada.status == ProposalStatus.ACCEPTED
        assert guardada.week_plan_id == semana.id
        assert guardada.resolved_at is not None


def test_un_ejercicio_repetido_en_la_semana_no_se_duplica(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())  # los 6 ejercicios se repiten en los 2 días
    propuesta = api.post("/proposals/generate", json=ELECCION).json()
    api.post(f"/proposals/{propuesta['id']}/accept")

    assert contar(api, Exercise) == 6
    assert contar(api, PlanExercise) == 12


def test_un_ejercicio_que_ya_existia_conserva_sus_etiquetas(api, entorno, monkeypatch):
    con_perfil(api)
    with api.session() as db:
        db.add(Exercise(
            name="Press de Banca", name_normalized="press de banca", kind="strength", region="upper",
            direction="push", primary_muscle="chest", secondary_muscles=["triceps"],
            mechanic="compound", equipment="dumbbell", level="avanzado",
        ))
        db.commit()
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()
    api.post(f"/proposals/{propuesta['id']}/accept")

    with api.session() as db:
        press = db.scalars(select(Exercise).where(Exercise.name_normalized == "press de banca")).one()
        assert press.equipment.value == "dumbbell"  # no se pisó con la etiqueta de la IA
        assert contar(api, Exercise) == 6


def test_aceptar_o_descartar_dos_veces_da_409(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina(), rutina())
    a = api.post("/proposals/generate", json=ELECCION).json()
    api.post(f"/proposals/{a['id']}/accept")
    assert api.post(f"/proposals/{a['id']}/accept").status_code == 409
    assert api.post(f"/proposals/{a['id']}/discard").status_code == 409


def test_descartar_no_toca_el_plan(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()

    response = api.post(f"/proposals/{propuesta['id']}/discard")

    assert response.status_code == 200
    assert response.json()["status"] == "discarded"
    assert contar(api, WeekPlan) == 0
    assert contar(api, Exercise) == 0


def test_no_se_acepta_si_ya_hay_otra_semana_activa(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina(), rutina())
    primera = api.post("/proposals/generate", json=ELECCION).json()
    segunda = api.post("/proposals/generate", json=ELECCION).json()  # descarta la primera
    assert api.post(f"/proposals/{segunda['id']}/accept").status_code == 200
    with api.session() as db:  # una pendiente creada a mano mientras hay semana activa
        db.add(PlanProposal(user_id=1, kind="generate", proposed_changes={"routine": rutina()}))
        db.commit()
        otra = db.scalars(select(PlanProposal).where(PlanProposal.status == ProposalStatus.PENDING)).one()
        otra_id = otra.id

    assert api.post(f"/proposals/{otra_id}/accept").status_code == 409
    assert contar(api, WeekPlan) == 1
    assert primera["id"] != segunda["id"]


def test_si_falla_despues_de_insertar_no_queda_un_plan_a_medias(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()

    from sqlalchemy.orm import Session

    real_flush = Session.flush

    def flush_y_romper(self, *args, **kwargs):
        real_flush(self, *args, **kwargs)  # las filas YA se insertaron en la transacción
        raise RuntimeError("falló a mitad")

    with monkeypatch.context() as m:
        m.setattr(Session, "flush", flush_y_romper)
        with pytest.raises(RuntimeError):
            api.post(f"/proposals/{propuesta['id']}/accept")

    assert contar(api, WeekPlan) == 0
    assert contar(api, PlanDay) == 0
    assert contar(api, PlanExercise) == 0
    assert contar(api, PlanSet) == 0
    assert contar(api, Exercise) == 0
    with api.session() as db:
        assert db.get(PlanProposal, propuesta["id"]).status == ProposalStatus.PENDING


# --- semana activa y duración por día ---


def test_la_propuesta_trae_la_duracion_estimada_de_cada_dia(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    cuerpo = api.post("/proposals/generate", json=ELECCION).json()

    # 6 ejercicios de 5 series x 10 reps con 120 s de descanso y 5 cambios de 1,5 min.
    assert cuerpo["day_minutes"] == [70, 70]
    assert api.get(f"/proposals/{cuerpo['id']}").json()["day_minutes"] == [70, 70]


def test_sin_semana_activa_el_endpoint_da_404(api):
    assert api.get("/weeks/active").status_code == 404


def test_la_semana_activa_lista_los_dias_en_orden(api, entorno, monkeypatch):
    con_perfil(api)
    dos_dias = rutina()
    dos_dias["days"][1] = {**dos_dias["days"][1], "title": "Pierna"}
    usar_gemini(monkeypatch, dos_dias)
    propuesta = api.post("/proposals/generate", json=ELECCION).json()
    api.post(f"/proposals/{propuesta['id']}/accept")

    response = api.get("/weeks/active")

    assert response.status_code == 200
    dias = response.json()["days"]
    assert [(d["day_index"], d["title"]) for d in dias] == [(1, "Cuerpo completo"), (2, "Pierna")]


def test_descartar_no_crea_semana_activa(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()
    api.post(f"/proposals/{propuesta['id']}/discard")
    assert api.get("/weeks/active").status_code == 404


# --- normalizar nombres ---


@pytest.mark.parametrize(
    "nombre,esperado",
    [
        ("Press de Banca", "press de banca"),
        ("  Press   de   banca ", "press de banca"),
        ("Sentadilla Búlgara", "sentadilla bulgara"),
        ("PESO MUERTO RUMANO", "peso muerto rumano"),
    ],
)
def test_normalize_name(nombre, esperado):
    assert normalize_name(nombre) == esperado
