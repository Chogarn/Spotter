"""El registro de generaciones (decisión 141): una fila por intento, con códigos y sin texto."""

from sqlalchemy import select

from app.models import GenerationLog
from tests.test_pesos import ELECCION, sin_peso
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)


def filas(api) -> list[GenerationLog]:
    with api.session() as db:
        return list(db.scalars(select(GenerationLog).order_by(GenerationLog.id)))


def test_una_rutina_limpia_deja_una_fila_ok_y_mostrada(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())

    assert api.post("/proposals/generate", json=ELECCION).status_code == 201

    (fila,) = filas(api)
    assert (fila.kind, fila.goal, fila.level, fila.days) == ("generate", "masa", "principiante", 3)
    assert (fila.attempt, fila.outcome, fila.shown) == (1, "ok", True)
    assert fila.codes == []
    assert fila.duration_ms >= 0


def test_el_reintento_por_pesos_deja_dos_filas(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, sin_peso(rutina()), rutina())

    assert api.post("/proposals/generate", json=ELECCION).status_code == 201

    primera, segunda = filas(api)
    assert (primera.attempt, primera.outcome, primera.shown) == (1, "reintentada", False)
    assert "Peso" in primera.codes
    assert (segunda.attempt, segunda.outcome, segunda.shown) == (2, "ok", True)


def test_si_el_reintento_falla_se_muestra_la_primera_con_su_aviso(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, sin_peso(rutina()), RuntimeError("la IA no respondió"))

    assert api.post("/proposals/generate", json=ELECCION).status_code == 201

    primera, segunda = filas(api)
    assert (primera.outcome, primera.shown) == ("ok_con_avisos", True)
    assert "Peso" in primera.codes
    assert (segunda.outcome, segunda.codes, segunda.shown) == ("error_ia", ["IA"], False)


def test_una_rutina_rechazada_guarda_los_codigos_y_no_los_mensajes(api, entorno, monkeypatch):
    con_perfil(api)
    mala = rutina()
    mala["days"][0]["exercises"][0]["name"] = "Salto del treadmill inventado"
    usar_gemini(monkeypatch, mala, mala)

    assert api.post("/proposals/generate", json=ELECCION).status_code == 502

    primera, segunda = filas(api)
    assert primera.outcome == segunda.outcome == "rechazada"
    assert "Catálogo" in primera.codes
    assert not any(f.shown for f in (primera, segunda))
    assert all("treadmill" not in c for f in (primera, segunda) for c in f.codes)  # solo códigos


def test_un_json_invalido_queda_como_json(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, {"days": "no es una lista"}, {"days": "no es una lista"})

    assert api.post("/proposals/generate", json=ELECCION).status_code == 502

    assert [f.codes for f in filas(api)] == [["JSON"], ["JSON"]]


def test_si_la_ia_se_cae_en_el_primer_intento_queda_error_ia(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, RuntimeError("503 high demand"))

    assert api.post("/proposals/generate", json=ELECCION).status_code == 502

    (fila,) = filas(api)
    assert (fila.outcome, fila.codes, fila.shown) == ("error_ia", ["IA_saturada"], False)
