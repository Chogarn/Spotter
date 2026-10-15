"""Cambiar un ejercicio de la propuesta por otro del catálogo (decisión 65)."""

from urllib.parse import quote

from app.ai.catalog import find
from test_proposals import (  # noqa: F401  (fixtures y ayudas del flujo de propuestas)
    ELECCION,
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)

# En la rutina de prueba, el mismo ejercicio está en los dos días.
PRESS = "Press de banca con barra"


def propuesta(api, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina())
    respuesta = api.post("/proposals/generate", json=ELECCION)
    assert respuesta.status_code == 201
    return respuesta.json()["id"]


def alternativas(api, pid, nombre=PRESS):
    return api.get(f"/proposals/{pid}/alternatives?name={quote(nombre)}")


def cambiar(api, pid, desde, hacia):
    return api.post(f"/proposals/{pid}/swap", json={"from_name": desde, "to_id": hacia})


def ejercicios(cuerpo, nombre):
    return [e for d in cuerpo["routine"]["days"] for e in d["exercises"] if e["name"] == nombre]


# --- la lista de alternativas ---


def test_las_alternativas_son_del_mismo_musculo_y_tipo_y_del_nivel(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)

    respuesta = alternativas(api, pid)

    assert respuesta.status_code == 200
    opciones = respuesta.json()
    assert opciones
    for o in opciones:
        c = find(o["name"])
        assert c.primary_muscle.value == "chest" and c.kind.value == "strength"
        assert o["level"] == "principiante"  # la persona es principiante
    assert "Press de banca con barra" not in {o["name"] for o in opciones}


def test_no_ofrece_ejercicios_que_ya_estan_en_la_semana(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    en_la_semana = {
        e["name"] for d in api.get(f"/proposals/{pid}").json()["routine"]["days"] for e in d["exercises"]
    }

    nombres = {o["name"] for o in alternativas(api, pid).json()}

    assert not nombres & en_la_semana


def test_un_ejercicio_que_no_esta_en_la_propuesta_da_404(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    assert alternativas(api, pid, "Ejercicio inventado").status_code == 404


# --- el cambio ---


def test_el_cambio_se_aplica_en_todos_los_dias_donde_esta_el_ejercicio(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    antes = api.get(f"/proposals/{pid}").json()
    assert len(ejercicios(antes, PRESS)) == 2  # está en los dos días

    respuesta = cambiar(api, pid, PRESS, "press_pecho_maquina")

    assert respuesta.status_code == 200
    despues = respuesta.json()
    assert ejercicios(despues, PRESS) == []
    nuevos = ejercicios(despues, "Press de pecho en máquina")
    assert len(nuevos) == 2  # en los dos días


def test_el_ejercicio_nuevo_trae_las_etiquetas_del_catalogo_y_copia_las_series(
    api, entorno, monkeypatch
):
    pid = propuesta(api, monkeypatch)
    viejo = ejercicios(api.get(f"/proposals/{pid}").json(), PRESS)[0]

    nuevo = ejercicios(cambiar(api, pid, PRESS, "press_pecho_maquina").json(), "Press de pecho en máquina")[0]

    c = find("Press de pecho en máquina")
    assert nuevo["equipment"] == c.equipment.value
    assert nuevo["mechanic"] == c.mechanic.value
    assert nuevo["primary_muscle"] == "chest"
    # Mismas series y repeticiones; el peso queda en blanco.
    assert [s["reps"] for s in nuevo["sets"]] == [s["reps"] for s in viejo["sets"]]
    assert all(s["target_weight_kg"] is None for s in nuevo["sets"])
    assert nuevo["rest_seconds"] == viejo["rest_seconds"]
    # Las indicaciones del anterior no valen para el nuevo.
    assert nuevo["execution_notes"] is None
    assert PRESS in nuevo["reason"]


def test_los_otros_ejercicios_no_se_tocan(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    antes = api.get(f"/proposals/{pid}").json()

    despues = cambiar(api, pid, PRESS, "press_pecho_maquina").json()

    for nombre in ("Remo con barra", "Sentadilla con barra", "Hip thrust con barra"):
        assert ejercicios(despues, nombre) == ejercicios(antes, nombre)


def test_el_cambio_queda_guardado(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    cambiar(api, pid, PRESS, "press_pecho_maquina")

    guardada = api.get(f"/proposals/{pid}").json()

    assert ejercicios(guardada, PRESS) == []
    assert len(ejercicios(guardada, "Press de pecho en máquina")) == 2


def test_un_cambio_por_algo_que_no_es_alternativa_se_rechaza(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    # Una sentadilla es de cuádriceps: no reemplaza a un ejercicio de pecho.
    assert cambiar(api, pid, PRESS, "sentadilla_goblet").status_code == 400
    # Uno que ya está en la semana tampoco.
    assert cambiar(api, pid, PRESS, "remo_barra").status_code == 400
    # Ni uno que no existe en el catálogo.
    assert cambiar(api, pid, PRESS, "inventado").status_code == 400


def test_se_puede_cambiar_mas_de_una_vez(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    cambiar(api, pid, PRESS, "press_pecho_maquina")

    segundo = cambiar(api, pid, "Press de pecho en máquina", "flexiones_pecho")

    assert segundo.status_code == 200
    assert ejercicios(segundo.json(), "Press de pecho en máquina") == []
    assert len(ejercicios(segundo.json(), "Flexiones de brazos")) == 2


def test_los_avisos_se_recalculan_con_la_rutina_nueva(api, entorno, monkeypatch):
    from app.ai.routine import RoutineProposal
    from app.ai.rules import validate_routine
    from app.enums import Goal, Level

    pid = propuesta(api, monkeypatch)

    # Un aislado (aperturas) en lugar de un multiarticular cambia el volumen indirecto.
    respuesta = cambiar(api, pid, PRESS, "aperturas_maquina")

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    rutina_nueva = RoutineProposal.model_validate(cuerpo["routine"])
    esperados = validate_routine(
        rutina_nueva, Goal(ELECCION["goal"]), Level(ELECCION["level"]), ELECCION["days"],
        catalog_extra_names=[],
    )
    assert sorted((w["rule"], w["message"]) for w in cuerpo["warnings"]) == sorted(
        (w.rule, w.message) for w in esperados.warnings
    )
    # Y la duración de los días también se recalcula con la rutina nueva.
    assert len(cuerpo["day_minutes"]) == len(cuerpo["routine"]["days"])


def test_no_se_puede_cambiar_una_propuesta_ya_aceptada(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    assert api.post(f"/proposals/{pid}/accept").status_code == 200

    assert cambiar(api, pid, PRESS, "press_pecho_maquina").status_code == 409
    assert alternativas(api, pid).status_code == 409


def test_al_aceptar_el_plan_lleva_el_ejercicio_cambiado(api, entorno, monkeypatch):
    pid = propuesta(api, monkeypatch)
    cambiar(api, pid, PRESS, "press_pecho_maquina")
    assert api.post(f"/proposals/{pid}/accept").status_code == 200

    from sqlalchemy import select

    from app.models import Exercise

    with api.session() as db:
        nombres = {e.name for e in db.scalars(select(Exercise))}
    assert "Press de pecho en máquina" in nombres
    assert PRESS not in nombres
