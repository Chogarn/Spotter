"""Marca opcional de carga y dolor por ejercicio (decisión 74)."""

from datetime import date
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from app.ai.history import build_previous_week, feel_text
from app.enums import LoadFeel, PainLevel, PlanStatus
from app.models import Routine, WeekPlan
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)

PRESS = "Press de banca con barra"


@pytest.fixture
def semana(api):
    return crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)


def ejercicio(api, semana, nombre=PRESS, dia=1):
    detalle = api.get(f"/weeks/{semana}/days/{dia}").json()
    return next(e for e in detalle["exercises"] if e["name"] == nombre)


def hecho(api, semana, nombre=PRESS, dia=1):
    ej = ejercicio(api, semana, nombre, dia)
    api.post(f"/weeks/{semana}/days/{dia}/exercises/{ej['id']}/done")
    return ej["id"]


def marcar(api, semana, ejercicio_id, cuerpo, dia=1):
    return api.put(f"/weeks/{semana}/days/{dia}/exercises/{ejercicio_id}/feel", json=cuerpo)


def test_un_ejercicio_hecho_empieza_sin_marcas(api, semana):
    ej = hecho(api, semana)
    actual = ejercicio(api, semana)
    assert actual["id"] == ej
    assert actual["completed"] is True
    assert actual["load_feel"] is None and actual["pain"] is None


def test_se_puede_marcar_solo_la_carga(api, semana):
    ej = hecho(api, semana)
    respuesta = marcar(api, semana, ej, {"load_feel": "heavy"})
    assert respuesta.status_code == 200
    assert respuesta.json()["load_feel"] == "heavy"
    assert respuesta.json()["pain"] is None


def test_se_puede_marcar_solo_el_dolor(api, semana):
    ej = hecho(api, semana)
    respuesta = marcar(api, semana, ej, {"pain": "mild"})
    assert respuesta.json()["pain"] == "mild"
    assert respuesta.json()["load_feel"] is None


def test_marcar_un_campo_no_pisa_el_otro(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "very_heavy"})
    respuesta = marcar(api, semana, ej, {"pain": "moderate"})
    assert respuesta.json()["load_feel"] == "very_heavy"
    assert respuesta.json()["pain"] == "moderate"


def test_null_desmarca_solo_ese_campo(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "light", "pain": "strong"})
    respuesta = marcar(api, semana, ej, {"pain": None})
    assert respuesta.json()["pain"] is None
    assert respuesta.json()["load_feel"] == "light"


def test_un_cuerpo_vacio_no_cambia_nada(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "good"})
    assert marcar(api, semana, ej, {}).json()["load_feel"] == "good"


def test_las_marcas_sobreviven_a_recargar_el_dia(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "heavy", "pain": "mild"})
    actual = ejercicio(api, semana)
    assert (actual["load_feel"], actual["pain"]) == ("heavy", "mild")


def test_no_se_marca_un_ejercicio_que_no_esta_hecho(api, semana):
    ej = ejercicio(api, semana)["id"]
    assert marcar(api, semana, ej, {"load_feel": "good"}).status_code == 409


def test_valores_invalidos_dan_422(api, semana):
    ej = hecho(api, semana)
    assert marcar(api, semana, ej, {"load_feel": "mucho"}).status_code == 422
    assert marcar(api, semana, ej, {"pain": "no"}).status_code == 422


def test_con_el_dia_completado_es_de_lectura(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "good"})
    api.post(f"/weeks/{semana}/days/1/complete")
    assert marcar(api, semana, ej, {"load_feel": "heavy"}).status_code == 409
    assert ejercicio(api, semana)["load_feel"] == "good"  # y se sigue viendo
    api.post(f"/weeks/{semana}/days/1/reopen")
    assert marcar(api, semana, ej, {"load_feel": "heavy"}).status_code == 200


def test_con_la_semana_cerrada_es_de_lectura(api):
    cerrada = crear_semana(api, date(2026, 9, 1), status=PlanStatus.CLOSED)
    ej = ejercicio(api, cerrada)["id"]
    assert marcar(api, cerrada, ej, {"load_feel": "good"}).status_code == 409


def test_un_ejercicio_o_dia_inexistente_da_404(api, semana):
    assert marcar(api, semana, 999999, {"load_feel": "good"}).status_code == 404
    ej = hecho(api, semana)
    assert marcar(api, semana, ej, {"load_feel": "good"}, dia=99).status_code == 404


def test_reabrir_el_ejercicio_borra_las_marcas_y_deshacer_tambien(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "heavy"})
    api.post(f"/weeks/{semana}/days/1/exercises/{ej}/reopen")
    api.post(f"/weeks/{semana}/days/1/exercises/{ej}/done")
    assert ejercicio(api, semana)["load_feel"] is None


# --- resumen semanal ---


def test_el_resumen_trae_las_marcas_de_cada_ejercicio(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "very_heavy", "pain": "mild"})
    ejercicios = api.get(f"/weeks/{semana}/summary").json()["exercises"]
    press = next(e for e in ejercicios if e["name"] == PRESS)
    assert (press["load_feel"], press["pain"]) == ("very_heavy", "mild")
    otros = [e for e in ejercicios if e["name"] != PRESS]
    assert all(e["load_feel"] is None and e["pain"] is None for e in otros)


# --- lo que ve la IA ---


def test_el_texto_para_la_ia_solo_dice_lo_que_se_marco():
    assert feel_text(None) == ""
    assert feel_text(SimpleNamespace(load_feel=None, pain=None)) == ""
    assert feel_text(SimpleNamespace(load_feel=LoadFeel.HEAVY, pain=None)) == " · carga: pesada"
    assert feel_text(SimpleNamespace(load_feel=None, pain=PainLevel.MILD)) == " · dolor: leve"
    assert (
        feel_text(SimpleNamespace(load_feel=LoadFeel.VERY_HEAVY, pain=PainLevel.STRONG))
        == " · carga: muy pesada · dolor: fuerte"
    )


def test_la_semana_anterior_manda_las_marcas_y_nunca_inventa_un_sin_dolor(api, semana):
    ej = hecho(api, semana)
    marcar(api, semana, ej, {"load_feel": "heavy", "pain": "moderate"})
    with api.session() as db:
        week = db.get(WeekPlan, semana)
        week.status = PlanStatus.CLOSED
        db.commit()
        texto = build_previous_week(db, db.scalar(select(Routine.id))).text
    linea = next(l for l in texto.splitlines() if l.startswith(f"- {PRESS}"))
    assert "carga: pesada" in linea and "dolor: moderado" in linea
    otras = [l for l in texto.splitlines() if l.startswith("- ") and PRESS not in l]
    assert otras and all("carga:" not in l and "dolor:" not in l for l in otras)
    assert "sin dolor" not in texto
