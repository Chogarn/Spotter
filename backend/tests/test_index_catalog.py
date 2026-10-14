"""El script que indexa el catálogo: idempotente, retoma y limpia huérfanos."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai import gemini
from app.ai.catalog import load_catalog, text_hash
from app.ai.gemini import EMBED_BATCH_SIZE, AiLimitError
from app.db import Base
from app.models import EMBEDDING_DIM, AiCall, CatalogEmbedding, User
from app.scripts.index_catalog import exercises_to_index, index_catalog

MODELO = "gemini-embedding-001"


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(User(id=1, email="a@a", password_hash="x", name="t"))
        session.commit()
        yield session


class ClienteFalso:
    def __init__(self):
        self.pedidos = 0
        self.models = self

    def embed_content(self, model, contents, config):
        self.pedidos += 1
        filas = []
        for i, _ in enumerate(contents):
            valores = [0.0] * EMBEDDING_DIM
            valores[i] = 1.0
            filas.append(type("E", (), {"values": valores})())
        return type("R", (), {"embeddings": filas})()


@pytest.fixture
def cliente(monkeypatch):
    c = ClienteFalso()
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("GEMINI_EMBEDDING_MODEL", MODELO)
    # Topes holgados: acá se prueba el indexado, no los topes (eso está en test_embeddings.py).
    monkeypatch.setenv("GEMINI_EMBEDDING_RPM_LIMIT", "500")
    monkeypatch.setenv("GEMINI_EMBEDDING_DAILY_LIMIT", "5000")
    monkeypatch.setattr(gemini, "get_client", lambda api_key: c)
    return c


def test_la_primera_corrida_indexa_todo_el_catalogo(db, cliente):
    n = len(load_catalog())
    resultado = index_catalog(db, 1)
    assert resultado.indexed == n and resultado.unchanged == 0
    assert db.query(CatalogEmbedding).count() == n
    assert cliente.pedidos == -(-n // EMBED_BATCH_SIZE)
    assert db.query(AiCall).count() == n  # una fila por texto: así lo cuenta Google


def test_la_segunda_corrida_no_llama_a_gemini(db, cliente):
    index_catalog(db, 1)
    pedidos = cliente.pedidos
    resultado = index_catalog(db, 1)
    assert resultado.indexed == 0
    assert cliente.pedidos == pedidos


def test_solo_se_reindexa_lo_que_cambio(db, cliente):
    index_catalog(db, 1)
    fila = db.query(CatalogEmbedding).first()
    fila.text_hash = "viejo"
    db.commit()
    pendientes, sin_cambios = exercises_to_index(db, MODELO)
    assert [e.id for e in pendientes] == [fila.catalog_id]
    assert sin_cambios == len(load_catalog()) - 1
    assert index_catalog(db, 1).indexed == 1
    assert db.get(CatalogEmbedding, fila.catalog_id).text_hash == text_hash(
        next(e for e in load_catalog() if e.id == fila.catalog_id)
    )


def test_otro_modelo_obliga_a_reindexar_todo(db, cliente):
    index_catalog(db, 1)
    pendientes, _ = exercises_to_index(db, "otro-modelo")
    assert len(pendientes) == len(load_catalog())


def test_borra_los_vectores_de_ejercicios_que_ya_no_estan(db, cliente):
    index_catalog(db, 1)
    db.add(
        CatalogEmbedding(
            catalog_id="ejercicio_quitado",
            text_hash="x",
            model=MODELO,
            embedding=[0.0] * EMBEDDING_DIM,
        )
    )
    db.commit()
    assert index_catalog(db, 1).removed == 1
    assert db.get(CatalogEmbedding, "ejercicio_quitado") is None


def test_si_un_pedido_falla_lo_ya_guardado_se_conserva(db, cliente, monkeypatch):
    # Tope de 60 textos por minuto: el primer lote (50) entra y el segundo (50 más) se rechaza.
    monkeypatch.setenv("GEMINI_EMBEDDING_RPM_LIMIT", "60")
    with pytest.raises(AiLimitError):
        index_catalog(db, 1)
    assert db.query(CatalogEmbedding).count() == EMBED_BATCH_SIZE
    # La corrida siguiente completa lo que falta, sin repetir lo hecho.
    monkeypatch.setenv("GEMINI_EMBEDDING_RPM_LIMIT", "500")
    resultado = index_catalog(db, 1)
    assert resultado.unchanged == EMBED_BATCH_SIZE
    assert db.query(CatalogEmbedding).count() == len(load_catalog())
