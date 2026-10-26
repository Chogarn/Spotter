"""Recuperación del catálogo: filtros fijos del código + orden por similitud (decisión 58)."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai import retrieve
from app.ai.catalog import find, load_catalog
from app.ai.gemini import AiLimitError
from app.ai.retrieve import PER_GROUP, query_text, retrieve_candidates
from app.db import Base
from app.enums import ExerciseKind, Goal, Level, Muscle
from app.models import EMBEDDING_DIM, CatalogEmbedding, User

CATALOGO = list(load_catalog())


def base_vector(i: int) -> list[float]:
    v = [0.0] * EMBEDDING_DIM
    v[i] = 1.0
    return v


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(User(id=1, email="a@a", password_hash="x", name="t"))
        # Cada ejercicio del catálogo es un eje distinto: la consulta "apunta" a los que quiera.
        for i, e in enumerate(CATALOGO):
            session.add(
                CatalogEmbedding(
                    catalog_id=e.id, text_hash="h", model="m", embedding=base_vector(i)
                )
            )
        session.commit()
        yield session


def consulta(monkeypatch, *ids: str):
    """La consulta se parece a los ejercicios indicados (y a ninguno más)."""
    v = [0.0] * EMBEDDING_DIM
    for catalog_id in ids:
        v[next(i for i, e in enumerate(CATALOGO) if e.id == catalog_id)] = 1.0
    monkeypatch.setattr(retrieve, "embed_texts", lambda db, uid, texts, task: [v])


def test_el_principiante_no_ve_ejercicios_de_nivel_mas_alto(db, monkeypatch):
    consulta(monkeypatch, "dominadas")  # "dominadas" es avanzado y es lo más parecido
    r = retrieve_candidates(db, 1, Goal.MASA, Level.PRINCIPIANTE)
    assert r.ranked
    assert r.exercises and all(e.level == Level.PRINCIPIANTE for e in r.exercises)
    assert "dominadas" not in {e.id for e in r.exercises}


def test_el_intermedio_ve_principiante_e_intermedio_pero_no_avanzado(db, monkeypatch):
    consulta(monkeypatch, "press_banca_barra")
    r = retrieve_candidates(db, 1, Goal.MASA, Level.INTERMEDIO)
    niveles = {e.level for e in r.exercises}
    assert niveles == {Level.PRINCIPIANTE, Level.INTERMEDIO}


def test_el_avanzado_puede_ver_todo(db, monkeypatch):
    consulta(monkeypatch, "dominadas")
    r = retrieve_candidates(db, 1, Goal.MASA, Level.AVANZADO, per_group=100)
    assert "dominadas" in {e.id for e in r.exercises}


@pytest.mark.parametrize("goal", [Goal.MASA, Goal.FUERZA])
def test_masa_y_fuerza_no_llevan_cardio(db, monkeypatch, goal):
    consulta(monkeypatch, "cinta_trote")
    r = retrieve_candidates(db, 1, goal, Level.INTERMEDIO)
    assert all(e.kind != ExerciseKind.CARDIO for e in r.exercises)


@pytest.mark.parametrize(
    "goal", [Goal.PERDER_GRASA, Goal.MANTENERME_ACTIVO]
)
def test_los_objetivos_con_aerobico_si_llevan_cardio(db, monkeypatch, goal):
    consulta(monkeypatch, "cinta_trote")
    r = retrieve_candidates(db, 1, goal, Level.INTERMEDIO)
    assert any(e.kind == ExerciseKind.CARDIO for e in r.exercises)


def test_los_mas_parecidos_de_cada_grupo_quedan_primero_y_hay_tope_por_grupo(db, monkeypatch):
    pecho = [e.id for e in CATALOGO if e.primary_muscle == Muscle.CHEST and e.level == Level.PRINCIPIANTE]
    elegidos = pecho[-2:]  # los últimos del catálogo: sin la consulta no serían los primeros
    consulta(monkeypatch, *elegidos)
    r = retrieve_candidates(db, 1, Goal.MASA, Level.PRINCIPIANTE, per_group=2)
    del_pecho = [e.id for e in r.exercises if e.primary_muscle == Muscle.CHEST]
    assert set(del_pecho) == set(elegidos)
    assert len(del_pecho) == 2


def test_todos_los_grupos_grandes_quedan_cubiertos(db, monkeypatch):
    consulta(monkeypatch, "press_banca_barra")  # la consulta solo se parece a un ejercicio de pecho
    r = retrieve_candidates(db, 1, Goal.MASA, Level.INTERMEDIO)
    grupos = {e.primary_muscle for e in r.exercises}
    for grande in (Muscle.CHEST, Muscle.BACK, Muscle.SHOULDERS,
                   Muscle.QUADRICEPS, Muscle.HAMSTRINGS, Muscle.GLUTES):
        assert grande in grupos


def test_el_tope_por_grupo_por_defecto(db, monkeypatch):
    consulta(monkeypatch, "press_banca_barra")
    r = retrieve_candidates(db, 1, Goal.MASA, Level.INTERMEDIO)
    for musculo in Muscle:
        assert sum(e.primary_muscle == musculo for e in r.exercises) <= PER_GROUP


def test_los_ejercicios_de_la_semana_anterior_se_conservan(db, monkeypatch):
    # Ningún tope los dejaría entrar: la consulta apunta a otra cosa y per_group es 1.
    consulta(monkeypatch, "press_banca_barra")
    pedido = "Curl de bíceps con barra"
    r = retrieve_candidates(db, 1, Goal.MASA, Level.INTERMEDIO, keep_names=[pedido], per_group=1)
    assert find(pedido).id in {e.id for e in r.exercises}


def test_si_el_tope_de_embeddings_se_alcanzo_se_devuelve_todo_lo_permitido(db, monkeypatch):
    def tope(*args, **kwargs):
        raise AiLimitError("minute", 80)

    monkeypatch.setattr(retrieve, "embed_texts", tope)
    r = retrieve_candidates(db, 1, Goal.MASA, Level.PRINCIPIANTE)
    assert not r.ranked
    esperado = {e.id for e in CATALOGO if e.level == Level.PRINCIPIANTE and e.kind != ExerciseKind.CARDIO}
    assert {e.id for e in r.exercises} == esperado  # los filtros fijos siguen valiendo


def test_si_el_catalogo_no_esta_indexado_no_se_cae(db, monkeypatch):
    db.query(CatalogEmbedding).delete()
    db.commit()
    consulta(monkeypatch, "press_banca_barra")
    r = retrieve_candidates(db, 1, Goal.MASA, Level.INTERMEDIO)
    assert not r.ranked and r.reason == "el catálogo no está indexado"
    assert r.exercises


def test_la_consulta_lleva_objetivo_y_nivel_pero_no_las_limitaciones():
    """Un vector mide parecido, no "evitar": "rodilla" subiría la sentadilla (decisión 58)."""
    texto = query_text(Goal.MASA, Level.PRINCIPIANTE)
    assert "principiante" in texto and "masa" in texto
    assert "rodilla" not in texto and "limitaciones" not in texto
    assert "retrieve_candidates" in retrieve.__dict__
    import inspect

    assert "limitations" not in inspect.signature(retrieve_candidates).parameters
