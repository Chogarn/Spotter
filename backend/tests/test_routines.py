"""Rutinas: se crean al aceptar la primera semana, agrupan sus semanas y se pueden renombrar."""

from datetime import date

from sqlalchemy import func, select

from app.enums import Goal, PlanStatus
from app.models import Routine
from app.routines import auto_name
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    con_perfil,
    contar,
    entorno,
    rutina,
    usar_gemini,
)

NUEVA = {"goal": "fuerza", "level": "avanzado"}


def generar_y_aceptar(api, monkeypatch, cuerpo=NUEVA):
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=cuerpo)
    assert propuesta.status_code == 201
    aceptada = api.post(f"/proposals/{propuesta.json()['id']}/accept")
    assert aceptada.status_code == 200
    return propuesta.json()["id"]


def cerrar_activa(api):
    semana = api.get("/weeks/active").json()["id"]
    assert api.post(f"/weeks/{semana}/close").status_code == 200


# --- nombre automático ---


def test_el_nombre_lleva_el_objetivo_y_la_fecha():
    assert auto_name(Goal.FUERZA, date(2026, 10, 9), set()) == "Fuerza · desde el 9/10"
    assert auto_name(Goal.PERDER_GRASA, date(2026, 1, 15), set()) == "Perder grasa · desde el 15/1"


def test_el_numero_se_suma_solo_si_el_nombre_se_repite():
    base = "Fuerza · desde el 9/10"
    assert auto_name(Goal.FUERZA, date(2026, 10, 9), {base}) == f"{base} 2"
    assert auto_name(Goal.FUERZA, date(2026, 10, 9), {base, f"{base} 2"}) == f"{base} 3"
    assert auto_name(Goal.FUERZA, date(2026, 10, 9), {"otra"}) == base


# --- empezar una rutina nueva ---


def test_generar_no_crea_la_rutina_hasta_aceptar(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())

    propuesta = api.post("/proposals/generate", json=NUEVA).json()
    assert contar(api, Routine) == 0

    api.post(f"/proposals/{propuesta['id']}/discard")
    assert contar(api, Routine) == 0


def test_aceptar_crea_la_rutina_con_lo_elegido_y_cuelga_la_semana(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)

    rutinas = api.get("/routines").json()

    assert len(rutinas) == 1
    assert rutinas[0]["goal"] == "fuerza"
    assert rutinas[0]["level"] == "avanzado"
    assert rutinas[0]["name"].startswith("Fuerza · desde el ")
    assert rutinas[0]["week_count"] == 1
    assert rutinas[0]["has_active_week"] is True
    detalle = api.get(f"/routines/{rutinas[0]['id']}").json()
    assert [(w["number"], w["status"]) for w in detalle["weeks"]] == [(1, "active")]


def test_dos_rutinas_iguales_el_mismo_dia_se_distinguen_con_un_numero(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    generar_y_aceptar(api, monkeypatch)

    nombres = sorted(r["name"] for r in api.get("/routines").json())

    assert len(nombres) == 2
    assert nombres[1] == f"{nombres[0]} 2"


# --- continuar una rutina ---


def test_continuar_hereda_objetivo_y_nivel_y_suma_la_semana_a_la_misma_rutina(
    api, entorno, monkeypatch
):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    rutina_id = api.get("/routines").json()[0]["id"]
    falso = usar_gemini(monkeypatch, rutina())

    propuesta = api.post("/proposals/generate", json={"routine_id": rutina_id})
    assert propuesta.status_code == 201
    assert "Nivel: avanzado" in falso.prompts[0]
    assert "Objetivo: fuerza (ganar fuerza)" in falso.prompts[0]
    api.post(f"/proposals/{propuesta.json()['id']}/accept")

    assert contar(api, Routine) == 1
    detalle = api.get(f"/routines/{rutina_id}").json()
    assert [(w["number"], w["status"]) for w in detalle["weeks"]] == [(2, "active"), (1, "closed")]


def test_la_numeracion_de_semanas_es_por_rutina(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    generar_y_aceptar(api, monkeypatch, {"goal": "masa", "level": "intermedio"})

    semana = api.get("/weeks/active").json()["id"]

    assert api.get(f"/weeks/{semana}").json()["number"] == 1  # primera de su rutina


def test_continuar_una_rutina_inexistente_o_ajena_da_404_y_no_llama_a_la_ia(
    api, entorno, monkeypatch
):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())
    with api.session() as db:
        from app.models import User

        otro = User(email="otro@x.com", password_hash="x", name="otro")
        db.add(otro)
        db.flush()
        ajena = Routine(user_id=otro.id, name="Ajena", goal=Goal.MASA, level="intermedio")
        db.add(ajena)
        db.commit()
        ajena_id = ajena.id

    assert api.post("/proposals/generate", json={"routine_id": 999}).status_code == 404
    assert api.post("/proposals/generate", json={"routine_id": ajena_id}).status_code == 404
    assert falso.llamadas == 0


def test_no_se_mezcla_una_rutina_existente_con_objetivo_o_nivel(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())

    cuerpos = [{"routine_id": 1, "goal": "masa"}, {"routine_id": 1, "level": "avanzado"}, {}]
    for cuerpo in cuerpos:
        assert api.post("/proposals/generate", json=cuerpo).status_code == 422
    assert falso.llamadas == 0


# --- lista, detalle y nombre ---


def test_la_lista_va_de_la_mas_nueva_a_la_mas_vieja_y_marca_la_que_tiene_semana_activa(
    api, entorno, monkeypatch
):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    cerrar_activa(api)
    generar_y_aceptar(api, monkeypatch, {"goal": "mantenerme_activo", "level": "principiante"})

    lista = api.get("/routines").json()

    assert [(r["goal"], r["has_active_week"]) for r in lista] == [
        ("mantenerme_activo", True),
        ("fuerza", False),
    ]


def test_cambiar_el_nombre(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    rutina_id = api.get("/routines").json()[0]["id"]

    respuesta = api.patch(f"/routines/{rutina_id}", json={"name": "  Mi rutina de fuerza  "})

    assert respuesta.status_code == 200
    assert api.get(f"/routines/{rutina_id}").json()["name"] == "Mi rutina de fuerza"
    assert api.patch(f"/routines/{rutina_id}", json={"name": "   "}).status_code == 422
    assert api.patch(f"/routines/{rutina_id}", json={"name": ""}).status_code == 422
    assert api.patch("/routines/999", json={"name": "x"}).status_code == 404


def test_la_semana_sabe_a_que_rutina_pertenece(api, entorno, monkeypatch):
    con_perfil(api)
    generar_y_aceptar(api, monkeypatch)
    rutina_ = api.get("/routines").json()[0]
    semana = api.get("/weeks/active").json()["id"]

    detalle = api.get(f"/weeks/{semana}").json()

    assert detalle["routine_id"] == rutina_["id"]
    assert detalle["routine_name"] == rutina_["name"]


# --- ver la propuesta pendiente ---


def test_sin_propuesta_pendiente_da_404(api, entorno, monkeypatch):
    con_perfil(api)

    assert api.get("/proposals/pending").status_code == 404


def test_la_propuesta_pendiente_se_puede_volver_a_ver_hasta_que_se_resuelve(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=NUEVA).json()

    pendiente = api.get("/proposals/pending")
    assert pendiente.status_code == 200
    assert pendiente.json()["id"] == propuesta["id"]

    api.post(f"/proposals/{propuesta['id']}/discard")
    assert api.get("/proposals/pending").status_code == 404
