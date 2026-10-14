"""Embeddings (RAG, decisión 58): pasan por los topes y se registran antes de llamar."""

import math

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai import gemini
from app.ai.gemini import (
    EMBED_BATCH_SIZE,
    AiConfigError,
    AiLimitError,
    AiSettings,
    EmbeddingSettings,
    embed_texts,
    load_embedding_settings,
    reserve_call,
)
from app.db import Base
from app.enums import AiCallKind
from app.models import EMBEDDING_DIM, AiCall, User


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
    """Devuelve un vector distinto por texto, sin normalizar, de la dimensión indicada."""

    def __init__(self, error=None, dim=EMBEDDING_DIM):
        self.pedidos: list[dict] = []
        self._error, self._dim = error, dim
        self.models = self

    def embed_content(self, model, contents, config):
        self.pedidos.append({"model": model, "n": len(contents), "config": config})
        if self._error:
            raise self._error
        filas = []
        for i, _ in enumerate(contents):
            valores = [0.0] * self._dim
            valores[i % self._dim] = 3.0  # largo 3: hay que normalizarlo
            filas.append(type("E", (), {"values": valores})())
        return type("R", (), {"embeddings": filas})()


def entorno(monkeypatch, cliente, rpm="80", dia="800"):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    monkeypatch.setenv("GEMINI_EMBEDDING_RPM_LIMIT", rpm)
    monkeypatch.setenv("GEMINI_EMBEDDING_DAILY_LIMIT", dia)
    monkeypatch.setattr(gemini, "get_client", lambda api_key: cliente)


def test_devuelve_un_vector_normalizado_por_texto(db, monkeypatch):
    cliente = ClienteFalso()
    entorno(monkeypatch, cliente)
    vectores = embed_texts(db, 1, ["a", "b"], "RETRIEVAL_DOCUMENT")
    assert len(vectores) == 2
    for v in vectores:
        assert len(v) == EMBEDDING_DIM
        assert math.isclose(math.sqrt(sum(x * x for x in v)), 1.0)
    assert cliente.pedidos[0]["config"] == {
        "task_type": "RETRIEVAL_DOCUMENT",
        "output_dimensionality": EMBEDDING_DIM,
    }


def test_queda_registrado_como_embed_con_su_modelo(db, monkeypatch):
    entorno(monkeypatch, ClienteFalso())
    embed_texts(db, 1, ["a"], "RETRIEVAL_QUERY")
    fila = db.query(AiCall).one()
    assert fila.kind == AiCallKind.EMBED
    assert fila.model == "gemini-embedding-001"
    assert fila.succeeded is True


def test_los_textos_se_parten_en_pedidos_y_cada_uno_cuenta(db, monkeypatch):
    cliente = ClienteFalso()
    entorno(monkeypatch, cliente, rpm="500", dia="5000")
    n = EMBED_BATCH_SIZE * 2 + 5
    vectores = embed_texts(db, 1, [f"t{i}" for i in range(n)], "RETRIEVAL_DOCUMENT")
    assert len(vectores) == n
    assert [p["n"] for p in cliente.pedidos] == [EMBED_BATCH_SIZE, EMBED_BATCH_SIZE, 5]
    # Google cuenta cada texto como un pedido: una fila de ai_calls por texto.
    assert db.query(AiCall).count() == n


def test_sin_textos_no_llama(db, monkeypatch):
    cliente = ClienteFalso()
    entorno(monkeypatch, cliente)
    assert embed_texts(db, 1, [], "RETRIEVAL_DOCUMENT") == []
    assert cliente.pedidos == [] and db.query(AiCall).count() == 0


def test_el_tope_por_minuto_corta_antes_de_llamar(db, monkeypatch):
    cliente = ClienteFalso()
    entorno(monkeypatch, cliente, rpm="1")
    embed_texts(db, 1, ["a"], "RETRIEVAL_QUERY")
    with pytest.raises(AiLimitError) as error:
        embed_texts(db, 1, ["b"], "RETRIEVAL_QUERY")
    assert error.value.scope == "minute"
    assert len(cliente.pedidos) == 1  # el segundo nunca se envió


def test_un_lote_que_no_entra_en_el_tope_no_se_envia_ni_se_registra(db, monkeypatch):
    cliente = ClienteFalso()
    entorno(monkeypatch, cliente, rpm="3")
    with pytest.raises(AiLimitError) as error:
        embed_texts(db, 1, ["a", "b", "c", "d"], "RETRIEVAL_DOCUMENT")
    assert error.value.scope == "minute"
    assert cliente.pedidos == [] and db.query(AiCall).count() == 0


def test_el_tope_diario_cuenta_textos_no_pedidos(db, monkeypatch):
    cliente = ClienteFalso()
    entorno(monkeypatch, cliente, dia="5")
    embed_texts(db, 1, ["a", "b", "c"], "RETRIEVAL_DOCUMENT")  # 3 de 5
    with pytest.raises(AiLimitError) as error:
        embed_texts(db, 1, ["d", "e", "f"], "RETRIEVAL_DOCUMENT")  # 3 más pasaría de 5
    assert error.value.scope == "day"


def test_los_embeddings_no_gastan_el_tope_de_generacion(db):
    """Cada modelo tiene su propio límite: 100 embeddings no le quitan lugar a la generación."""
    generacion = AiSettings(api_key="k", model="gen", daily_limit=1, rpm_limit=1)
    embeddings = EmbeddingSettings(api_key="k", model="emb", daily_limit=500, rpm_limit=500)
    for _ in range(100):
        reserve_call(db, 1, AiCallKind.EMBED, embeddings)
    reserve_call(db, 1, AiCallKind.GENERATE, generacion)  # no levanta AiLimitError
    with pytest.raises(AiLimitError):
        reserve_call(db, 1, AiCallKind.GENERATE, generacion)


def test_si_falla_queda_contada_como_no_exitosa(db, monkeypatch):
    entorno(monkeypatch, ClienteFalso(error=RuntimeError("cayó")))
    with pytest.raises(RuntimeError):
        embed_texts(db, 1, ["a"], "RETRIEVAL_DOCUMENT")
    assert db.query(AiCall).one().succeeded is False


def test_un_embedding_de_otra_dimension_se_rechaza(db, monkeypatch):
    entorno(monkeypatch, ClienteFalso(dim=10))
    with pytest.raises(ValueError):
        embed_texts(db, 1, ["a"], "RETRIEVAL_DOCUMENT")
    assert db.query(AiCall).one().succeeded is False


@pytest.mark.parametrize(
    "faltante",
    [
        "GEMINI_API_KEY",
        "GEMINI_EMBEDDING_MODEL",
        "GEMINI_EMBEDDING_RPM_LIMIT",
        "GEMINI_EMBEDDING_DAILY_LIMIT",
    ],
)
def test_sin_configuracion_no_se_llama(monkeypatch, faltante):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("GEMINI_EMBEDDING_MODEL", "m")
    monkeypatch.setenv("GEMINI_EMBEDDING_RPM_LIMIT", "80")
    monkeypatch.setenv("GEMINI_EMBEDDING_DAILY_LIMIT", "800")
    monkeypatch.delenv(faltante)
    with pytest.raises(AiConfigError):
        load_embedding_settings()
