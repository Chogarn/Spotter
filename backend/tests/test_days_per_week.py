"""El usuario elige cuántos días por semana entrena (decisión 52)."""

from sqlalchemy import select

from app.ai.prompt import days_text
from app.ai.routine import RoutineProposal
from app.ai.rules import allowed_days, validate_routine
from app.enums import Goal, Level
from app.models import Routine
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)


def generar(api, cuerpo):
    return api.post("/proposals/generate", json=cuerpo)


def dias_de_la_rutina(api):
    with api.session() as db:
        return db.scalar(select(Routine.days_per_week))


# --- qué se puede elegir ---


def test_principiante_elige_2_o_3_y_el_resto_de_2_a_6():
    assert allowed_days(Level.PRINCIPIANTE) == (2, 3)
    assert allowed_days(Level.INTERMEDIO) == (2, 3, 4, 5, 6)


def test_los_dias_son_obligatorios_y_van_de_2_a_6(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    assert generar(api, {"goal": "fuerza", "level": "avanzado"}).status_code == 422
    assert generar(api, {"goal": "fuerza", "level": "avanzado", "days": 1, "minutes": 60}).status_code == 422
    assert generar(api, {"goal": "fuerza", "level": "avanzado", "days": 7, "minutes": 60}).status_code == 422
    assert falso.llamadas == 0


def test_un_principiante_no_puede_elegir_4_y_no_se_llama_a_la_ia(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina(dias=4))

    respuesta = generar(api, {"goal": "masa", "level": "principiante", "days": 4, "minutes": 60})

    assert respuesta.status_code == 422
    assert "2 a 3" in respuesta.json()["detail"]
    assert falso.llamadas == 0


# --- la IA tiene que respetarlos ---


def test_el_prompt_pide_exactamente_los_dias_elegidos():
    assert "exactamente 4 días" in days_text(4)


def test_una_rutina_con_otra_cantidad_de_dias_se_rechaza():
    propuesta = RoutineProposal.model_validate(rutina(dias=3))

    resultado = validate_routine(propuesta, Goal.FUERZA, Level.AVANZADO, days=2)

    assert any(e.rule == "Días" for e in resultado.errors)
    assert not any(e.rule == "Días" for e in validate_routine(propuesta, Goal.FUERZA, Level.AVANZADO, 3).errors)


def test_si_la_ia_trae_otra_cantidad_reintenta(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina(dias=2), rutina(dias=3))

    respuesta = generar(api, {"goal": "fuerza", "level": "avanzado", "days": 3, "minutes": 60})

    assert respuesta.status_code == 201
    assert falso.llamadas == 2
    assert len(respuesta.json()["routine"]["days"]) == 3


# --- se guardan en la rutina ---


def test_al_aceptar_la_rutina_nueva_guarda_los_dias(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina(dias=3))
    propuesta = generar(api, {"goal": "fuerza", "level": "avanzado", "days": 3, "minutes": 60}).json()

    assert dias_de_la_rutina(api) is None  # la rutina nace recién al aceptar
    assert api.post(f"/proposals/{propuesta['id']}/accept").status_code == 200

    assert dias_de_la_rutina(api) == 3
    assert api.get("/routines").json()[0]["days_per_week"] == 3


def test_al_continuar_con_otra_cantidad_la_rutina_se_actualiza(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina(dias=2), rutina(dias=4))
    primera = generar(api, {"goal": "fuerza", "level": "avanzado", "days": 2, "minutes": 60}).json()
    api.post(f"/proposals/{primera['id']}/accept")
    semana = api.get("/weeks/active").json()["id"]
    api.post(f"/weeks/{semana}/close")
    rutina_id = api.get("/routines").json()[0]["id"]

    segunda = generar(api, {"routine_id": rutina_id, "days": 4, "minutes": 60}).json()
    assert dias_de_la_rutina(api) == 2  # todavía no se aceptó
    api.post(f"/proposals/{segunda['id']}/accept")

    assert api.get(f"/routines/{rutina_id}").json()["days_per_week"] == 4
