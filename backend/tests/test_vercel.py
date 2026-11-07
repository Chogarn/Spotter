"""Despliegue en Vercel: entrada bajo /api, IP real del login y ajustes de conexión."""

from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.db import engine_options
from app.login_limit import client_ip


def pedido(headers: dict[str, str], host: str = "10.0.0.1"):
    """Lo mínimo de un Request que lee client_ip."""
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))


def test_la_entrada_de_vercel_sirve_la_api_bajo_api():
    from app.vercel_entry import app

    cliente = TestClient(app)
    assert cliente.get("/api/health").json() == {"status": "ok"}
    # Sin el prefijo no existe: Vercel siempre manda /api/...
    assert cliente.get("/health").status_code == 404


def test_la_entrada_de_vercel_no_publica_la_documentacion():
    from app.vercel_entry import app

    cliente = TestClient(app)
    assert cliente.get("/docs").status_code == 404
    assert cliente.get("/openapi.json").status_code == 404


def test_fuera_de_vercel_la_ip_ignora_x_forwarded_for(monkeypatch):
    monkeypatch.delenv("VERCEL", raising=False)
    assert client_ip(pedido({"x-forwarded-for": "9.9.9.9"})) == "10.0.0.1"


def test_en_vercel_la_ip_sale_de_x_forwarded_for(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    assert client_ip(pedido({"x-forwarded-for": "9.9.9.9"})) == "9.9.9.9"


def test_en_vercel_toma_la_primera_ip_de_la_lista(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    assert client_ip(pedido({"x-forwarded-for": "9.9.9.9, 1.1.1.1"})) == "9.9.9.9"


def test_en_vercel_sin_encabezado_usa_la_conexion(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    assert client_ip(pedido({})) == "10.0.0.1"


def test_fuera_de_vercel_el_motor_no_cambia(monkeypatch):
    monkeypatch.delenv("VERCEL", raising=False)
    assert engine_options() == {}


def test_en_vercel_el_motor_apaga_las_sentencias_preparadas_y_limita_el_pool(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    opciones = engine_options()
    assert opciones["connect_args"] == {"prepare_threshold": None}
    assert opciones["pool_size"] == 2
    assert opciones["pool_pre_ping"] is True
