"""Una sola generación a la vez por persona, y qué devuelve aceptar (decisión 67)."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.ai import generate
from app.enums import AiCallKind
from app.models import AiCall, User
from test_proposals import (  # noqa: F401  (fixtures y ayudas del flujo de propuestas)
    ELECCION,
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)


def usuario_id(api):
    with api.session() as db:
        return db.scalar(select(User)).id


def test_si_ya_se_esta_generando_no_deja_pedir_otra(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())
    # Lo que queda marcado mientras la primera sigue esperando a la IA.
    generate._running.add(usuario_id(api))
    try:
        respuesta = api.post("/proposals/generate", json=ELECCION)
    finally:
        generate._running.discard(usuario_id(api))

    assert respuesta.status_code == 409
    assert "se está generando" in respuesta.json()["detail"]
    assert falso.llamadas == 0  # no se llamó a la IA: no se gastó cuota


def test_una_llamada_en_curso_de_otra_pestana_tambien_bloquea(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina())
    with api.session() as db:
        db.add(
            AiCall(
                user_id=usuario_id(api),
                kind=AiCallKind.GENERATE,
                model="m",
                succeeded=None,  # sin terminar
                created_at=datetime.now(timezone.utc) - timedelta(seconds=20),
            )
        )
        db.commit()

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 409
    assert falso.llamadas == 0


def test_una_llamada_vieja_sin_cerrar_no_bloquea_para_siempre(api, entorno, monkeypatch):
    """Si la app se cayó en el medio, la fila queda sin cerrar: pasado el margen, se destraba."""
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    with api.session() as db:
        db.add(
            AiCall(
                user_id=usuario_id(api),
                kind=AiCallKind.GENERATE,
                model="m",
                succeeded=None,
                created_at=datetime.now(timezone.utc)
                - timedelta(seconds=generate.IN_PROGRESS_SECONDS + 60),
            )
        )
        db.commit()

    assert api.post("/proposals/generate", json=ELECCION).status_code == 201


def test_una_llamada_ya_terminada_no_bloquea(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    with api.session() as db:
        db.add(
            AiCall(
                user_id=usuario_id(api),
                kind=AiCallKind.GENERATE,
                model="m",
                succeeded=True,
                created_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    assert api.post("/proposals/generate", json=ELECCION).status_code == 201


def test_despues_de_terminar_o_fallar_se_puede_volver_a_generar(api, entorno, monkeypatch):
    con_perfil(api)
    # La primera falla (la IA se cae); la segunda sale bien: el candado se soltó.
    usar_gemini(monkeypatch, RuntimeError("caída"), rutina())

    assert api.post("/proposals/generate", json=ELECCION).status_code == 502
    assert usuario_id(api) not in generate._running
    assert api.post("/proposals/generate", json=ELECCION).status_code == 201


def test_aceptar_devuelve_que_semana_y_rutina_quedaron_creadas(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    propuesta = api.post("/proposals/generate", json=ELECCION).json()

    aceptada = api.post(f"/proposals/{propuesta['id']}/accept").json()

    assert aceptada["status"] == "accepted"
    assert aceptada["week_number"] == 1
    assert aceptada["routine_name"]
    semana = api.get(f"/weeks/{aceptada['week_id']}").json()
    assert semana["routine_id"] == aceptada["routine_id"]
    assert len(semana["days"]) == len(aceptada["routine"]["days"])


def test_antes_de_aceptar_esos_datos_no_vienen(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())

    propuesta = api.post("/proposals/generate", json=ELECCION).json()

    assert propuesta["week_id"] is None and propuesta["routine_id"] is None
