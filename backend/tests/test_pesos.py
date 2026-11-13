"""Los pesos orientativos de la rutina: si faltan en la mayoría de los ejercicios con carga, se reintenta."""

from copy import deepcopy

from app.ai.routine import RoutineProposal
from app.ai.rules import validate_routine, weight_issues
from app.enums import Goal, Level
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)

ELECCION = {"goal": "masa", "level": "principiante", "days": 3}


def sin_peso(datos: dict, cuantos: int | None = None) -> dict:
    """Copia de la rutina con los pesos vaciados en los primeros `cuantos` ejercicios de cada día (todos si no se pide)."""
    copia = deepcopy(datos)
    for dia in copia["days"]:
        for ejercicio in dia["exercises"][:cuantos]:
            for serie in ejercicio["sets"]:
                serie["target_weight_kg"] = None
    return copia


def como_modelo(datos: dict) -> RoutineProposal:
    return RoutineProposal.model_validate(datos)


# --- la regla ---


def test_con_todos_los_pesos_no_hay_aviso():
    assert weight_issues(como_modelo(rutina())) == []


def test_sin_ningun_peso_se_avisa_con_la_cuenta_y_ejemplos():
    (mensaje,) = weight_issues(como_modelo(sin_peso(rutina())))
    assert "18 de 18 ejercicios con carga externa" in mensaje  # 3 días x 6 grupos grandes
    assert "Press de banca con barra" in mensaje


def test_la_mitad_justa_sin_peso_todavia_no_alcanza_para_avisar():
    # 3 de los 6 ejercicios de cada día sin peso: no es "la mayoría".
    assert weight_issues(como_modelo(sin_peso(rutina(), cuantos=3))) == []
    # 4 de 6: sí.
    assert len(weight_issues(como_modelo(sin_peso(rutina(), cuantos=4)))) == 1


def test_el_peso_corporal_y_las_bandas_no_llevan_peso():
    datos = sin_peso(rutina())
    for dia in datos["days"]:
        for ejercicio in dia["exercises"]:
            ejercicio["equipment"] = "bodyweight"
    assert weight_issues(como_modelo(datos)) == []


def test_validate_routine_lo_deja_como_aviso_y_como_pedido_de_reintento():
    resultado = validate_routine(
        como_modelo(sin_peso(rutina())), Goal.MASA, Level.PRINCIPIANTE, days=3
    )

    assert not [e for e in resultado.errors if e.rule == "Peso"]  # no rechaza
    assert any(i.rule == "Peso" for i in resultado.warnings)
    assert any(i.rule == "Peso" for i in resultado.soft_issues)  # se pide de nuevo una vez


# --- el reintento en la generación ---


def avisos_de_peso(respuesta) -> list[str]:
    return [w["message"] for w in respuesta.json()["warnings"] if w["rule"] == "Peso"]


def test_si_faltan_los_pesos_se_reintenta_una_vez(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, sin_peso(rutina()), rutina())

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert falso.llamadas == 2
    assert "Faltan los pesos orientativos" in falso.prompts[1]  # la corrección nombra el problema
    assert avisos_de_peso(respuesta) == []  # la que se guardó es la que trae pesos


def test_si_siguen_faltando_en_el_reintento_se_acepta_con_el_aviso(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, sin_peso(rutina()), sin_peso(rutina()))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert falso.llamadas == 2  # un solo reintento
    assert len(avisos_de_peso(respuesta)) == 1


def test_si_el_reintento_por_pesos_falla_se_usa_la_primera_rutina(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, sin_peso(rutina()), RuntimeError("la IA no respondió"))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert falso.llamadas == 2
    assert len(avisos_de_peso(respuesta)) == 1
