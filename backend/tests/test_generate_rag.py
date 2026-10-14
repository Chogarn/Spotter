"""Generar rutina con RAG (decisión 58): una llamada de embedding y después la de generación."""

import pytest
from sqlalchemy import select

from app.ai import gemini
from app.ai.catalog import canonicalize, load_catalog
from app.ai.prompt import build_prompt, catalog_block
from app.ai.routine import RoutineProposal
from app.ai.rules import catalog_problems, validate_routine
from app.enums import AiCallKind, Goal, Level
from app.models import EMBEDDING_DIM, AiCall, Exercise, Profile
from test_proposals import (  # noqa: F401  (fixtures y ayudas del flujo de propuestas)
    ELECCION,
    GeminiFalso,
    api,
    con_perfil,
    GRANDES,
    entorno,
    ejercicio,
    rutina,
)

CATALOGO = list(load_catalog())


class ClienteConEmbeddings(GeminiFalso):
    """Responde a generación (`interactions.create`) y a embeddings (`models.embed_content`)."""

    def __init__(self, respuestas, error_embedding=None):
        super().__init__(respuestas)
        self.models = self
        self.textos_embebidos = []
        self._error_embedding = error_embedding

    def embed_content(self, model, contents, config):
        self.textos_embebidos += list(contents)
        if self._error_embedding:
            raise self._error_embedding
        filas = []
        for _ in contents:
            valores = [0.0] * EMBEDDING_DIM
            valores[0] = 1.0
            filas.append(type("E", (), {"values": valores})())
        return type("R", (), {"embeddings": filas})()


@pytest.fixture
def con_embeddings(entorno, monkeypatch):
    monkeypatch.setenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    monkeypatch.setenv("GEMINI_EMBEDDING_RPM_LIMIT", "80")
    monkeypatch.setenv("GEMINI_EMBEDDING_DAILY_LIMIT", "800")


def usar(monkeypatch, cliente):
    monkeypatch.setattr(gemini, "get_client", lambda api_key: cliente)
    return cliente


def tipos_de_llamada(api):
    with api.session() as db:
        return sorted(c.kind.value for c in db.scalars(select(AiCall)))


# --- el bloque de ejercicios ---


def test_el_bloque_lista_solo_los_candidatos_agrupados_por_musculo():
    elegidos = [e for e in CATALOGO if e.id in ("press_banca_barra", "remo_barra", "plancha")]
    bloque = catalog_block(elegidos)
    assert "## Pecho (primary_muscle: chest)" in bloque
    assert "## Espalda (primary_muscle: back)" in bloque
    assert "## Core (primary_muscle: core)" in bloque
    assert "Press de banca con barra | kind=strength region=upper direction=push" in bloque
    assert "Sentadilla con barra" not in bloque
    assert len([l for l in bloque.splitlines() if l.startswith("- ")]) == 3


def test_sin_candidatos_el_prompt_lleva_el_catalogo_entero():
    from decimal import Decimal

    perfil = Profile(user_id=1, age=30, weight_kg=Decimal("80"), height_cm=178, sex=None, limitations=None)
    texto = build_prompt(perfil, Goal.MASA, Level.PRINCIPIANTE)
    assert "{{" not in texto
    assert all(e.name in texto for e in CATALOGO)


# --- el flujo completo ---


def test_con_embeddings_hay_una_llamada_de_embedding_y_despues_la_de_generacion(
    api, con_embeddings, monkeypatch
):
    con_perfil(api)
    cliente = usar(monkeypatch, ClienteConEmbeddings([rutina()]))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert tipos_de_llamada(api) == ["embed", "generate"]
    assert len(cliente.textos_embebidos) == 1  # la consulta de la persona, no el catálogo
    assert "principiante" in cliente.textos_embebidos[0]
    assert cliente.llamadas == 1  # una sola generación


def test_el_prompt_de_un_principiante_no_ofrece_ejercicios_de_otro_nivel(
    api, con_embeddings, monkeypatch
):
    con_perfil(api)
    cliente = usar(monkeypatch, ClienteConEmbeddings([rutina()]))
    api.post("/proposals/generate", json=ELECCION)

    prompt = cliente.prompts[0]
    assert "{{" not in prompt
    assert "Ejercicios disponibles" in prompt
    assert "Press de pecho en máquina" in prompt  # principiante
    assert "Dominadas con bajada lenta" not in prompt  # intermedio
    assert "Sentadilla frontal con barra" not in prompt  # avanzado
    assert "Trote en cinta" not in prompt  # masa no lleva cardio


def test_si_el_embedding_falla_la_rutina_se_genera_igual(api, con_embeddings, monkeypatch):
    con_perfil(api)
    cliente = usar(
        monkeypatch, ClienteConEmbeddings([rutina()], error_embedding=RuntimeError("cayó"))
    )

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert "Press de pecho en máquina" in cliente.prompts[0]  # todo lo permitido por nivel
    assert tipos_de_llamada(api) == ["embed", "generate"]  # el intento quedó contado
    with api.session() as db:
        fallida = db.scalars(select(AiCall).where(AiCall.kind == AiCallKind.EMBED)).one()
        assert fallida.succeeded is False


def test_sin_configuracion_de_embeddings_no_se_llama_y_se_genera_igual(api, entorno, monkeypatch):
    con_perfil(api)
    cliente = usar(monkeypatch, ClienteConEmbeddings([rutina()]))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert cliente.textos_embebidos == []
    assert tipos_de_llamada(api) == ["generate"]


# --- el catálogo se hace cumplir (paso 8) ---


def rutina_con(reemplazos: dict[str, dict]):
    """La rutina de prueba, cambiando por nombre algunos ejercicios por otros."""
    base = rutina()
    for dia in base["days"]:
        dia["exercises"] = [reemplazos.get(e["name"], e) for e in dia["exercises"]]
    return base


def inventado():
    return ejercicio("Sentadilla con tres patas", "quadriceps", "lower", "none")


def test_un_ejercicio_inventado_se_rechaza_y_se_reintenta(api, entorno, monkeypatch):
    con_perfil(api)
    cliente = usar(
        monkeypatch,
        ClienteConEmbeddings([rutina_con({"Sentadilla con barra": inventado()}), rutina()]),
    )

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert cliente.llamadas == 2
    assert "Sentadilla con tres patas" in cliente.prompts[1]  # la corrección nombra el problema
    assert "no están en la lista de ejercicios disponibles" in cliente.prompts[1]


def test_si_insiste_con_ejercicios_inventados_no_se_guarda_nada(api, entorno, monkeypatch):
    con_perfil(api)
    mala = rutina_con({"Sentadilla con barra": inventado()})
    usar(monkeypatch, ClienteConEmbeddings([mala, mala]))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 502
    with api.session() as db:
        from app.models import PlanProposal

        assert db.scalars(select(PlanProposal)).first() is None


def test_un_alias_se_acepta_y_queda_con_el_nombre_y_las_etiquetas_del_catalogo(
    api, entorno, monkeypatch
):
    con_perfil(api)
    # "lagartijas" es alias de "Flexiones de brazos"; la IA además se equivoca en las etiquetas.
    alias = ejercicio("lagartijas", "triceps", "upper", "push")
    alias["equipment"] = "machine"
    usar(monkeypatch, ClienteConEmbeddings([rutina_con({"Press de banca con barra": alias})]))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    primero = respuesta.json()["routine"]["days"][0]["exercises"][0]
    assert primero["name"] == "Flexiones de brazos"
    assert primero["primary_muscle"] == "chest"  # lo que dice el catálogo, no la IA
    assert primero["equipment"] == "bodyweight"
    assert primero["level"] == "principiante"


def test_al_aceptar_la_tabla_de_ejercicios_usa_los_nombres_del_catalogo(api, entorno, monkeypatch):
    con_perfil(api)
    alias = ejercicio("lagartijas", "chest", "upper", "push")
    usar(monkeypatch, ClienteConEmbeddings([rutina_con({"Press de banca con barra": alias})]))
    propuesta = api.post("/proposals/generate", json=ELECCION).json()

    assert api.post(f"/proposals/{propuesta['id']}/accept").status_code == 200

    with api.session() as db:
        nombres = {e.name for e in db.scalars(select(Exercise))}
    assert "Flexiones de brazos" in nombres
    assert "lagartijas" not in nombres


def test_un_ejercicio_con_otro_tipo_que_el_del_catalogo_se_rechaza(api, entorno, monkeypatch):
    con_perfil(api)
    # "Trote en cinta" es cardio: la IA lo manda como fuerza (con repeticiones).
    mal_tipo = ejercicio("Trote en cinta", "chest", "upper", "push")
    usar(monkeypatch, ClienteConEmbeddings([rutina_con({"Press de banca con barra": mal_tipo})] * 2))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 502


# --- las funciones por separado ---


def test_los_ejercicios_de_la_semana_anterior_se_pueden_mantener_aunque_sean_viejos():
    propuesta = RoutineProposal.model_validate(
        rutina_con({"Sentadilla con barra": inventado()})
    )
    assert catalog_problems(propuesta) != []
    assert catalog_problems(propuesta, extra_names=["sentadilla con tres patas"]) == []


def test_sin_pedir_catalogo_validate_routine_no_lo_exige():
    propuesta = RoutineProposal.model_validate(rutina_con({"Sentadilla con barra": inventado()}))
    sin = validate_routine(propuesta, Goal.MASA, Level.PRINCIPIANTE)
    con = validate_routine(propuesta, Goal.MASA, Level.PRINCIPIANTE, catalog_extra_names=[])
    assert not any(e.rule == "Catálogo" for e in sin.errors)
    assert any(e.rule == "Catálogo" for e in con.errors)


def test_canonicalize_no_toca_lo_que_no_esta_en_el_catalogo():
    propuesta = RoutineProposal.model_validate(rutina_con({"Sentadilla con barra": inventado()}))
    nombres = [e.name for d in canonicalize(propuesta).days for e in d.exercises]
    assert "Sentadilla con tres patas" in nombres
