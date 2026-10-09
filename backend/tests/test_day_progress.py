"""Tilde por ejercicio ("hecho"), destildar, "Día completado" y reabrir."""

from datetime import date

import pytest
from sqlalchemy import func, select

from app.enums import PlanStatus
from app.models import PlanSet, SetEntry, WorkoutSession
from tests.test_weeks import api, crear_semana  # noqa: F401  (fixture y ayudante compartidos)


def ejercicios(api, semana, dia):
    return {e["name"]: e for e in api.get(f"/weeks/{semana}/days/{dia}").json()["exercises"]}


def base(dia, semana, ejercicio_id, accion=""):
    return f"/weeks/{semana}/days/{dia}/exercises/{ejercicio_id}/done{accion}"


def marcar(api, semana, dia, ejercicio_id):
    return api.post(base(dia, semana, ejercicio_id))


def destildar(api, semana, dia, ejercicio_id):
    return api.delete(base(dia, semana, ejercicio_id))


def completar(api, semana, dia):
    return api.post(f"/weeks/{semana}/days/{dia}/complete")


def reabrir(api, semana, dia):
    return api.post(f"/weeks/{semana}/days/{dia}/reopen")


def contar(api, modelo):
    with api.session() as db:
        return db.scalar(select(func.count()).select_from(modelo))


@pytest.fixture
def semana(api):
    return crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)


def reales(ejercicio):
    return [s["real"] for s in ejercicio["sets"]]


# --- marcar como hecho ---


def test_marcar_como_hecho_copia_lo_planificado_en_cada_serie(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]

    response = marcar(api, semana, 1, press["id"])

    assert response.status_code == 200
    hecho = response.json()
    assert [(r["reps"], r["weight_kg"]) for r in reales(hecho)] == [
        (s["reps"], s["target_weight_kg"]) for s in press["sets"]
    ]
    assert contar(api, SetEntry) == 4
    assert contar(api, WorkoutSession) == 1


def test_marcar_dos_veces_no_duplica(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    marcar(api, semana, 1, press["id"])
    assert contar(api, SetEntry) == 4


def test_marcar_respeta_las_series_que_ya_se_editaron(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    serie_2 = press["sets"][1]
    api.put(f"/weeks/{semana}/days/1/sets/{serie_2['id']}", json={"reps": 6, "weight_kg": 60})

    hecho = marcar(api, semana, 1, press["id"]).json()

    assert hecho["sets"][1]["real"]["reps"] == 6  # la editada no se pisa
    assert hecho["sets"][1]["real"]["weight_kg"] == 60.0
    assert all(r is not None for r in reales(hecho))  # y las demás se completaron
    assert contar(api, SetEntry) == 4


def test_marcar_no_cambia_el_plan(api, semana):
    antes = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    marcar(api, semana, 1, ejercicios(api, semana, 1)["Press de banca"]["id"])
    despues = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    campos = ("reps", "target_weight_kg", "duration_seconds", "duration_minutes")
    assert [{c: s[c] for c in campos} for s in antes] == [{c: s[c] for c in campos} for s in despues]
    with api.session() as db:
        assert db.scalar(select(func.count()).select_from(PlanSet)) == 4 + 3 + 4 + 1


def test_el_isometrico_y_el_cardio_copian_sus_segundos_y_minutos(api, semana):
    plancha = ejercicios(api, semana, 1)["Plancha"]
    cinta = ejercicios(api, semana, 2)["Cinta"]

    hecha = marcar(api, semana, 1, plancha["id"]).json()
    cinta_hecha = marcar(api, semana, 2, cinta["id"]).json()

    assert [r["duration_seconds"] for r in reales(hecha)] == [45, 45, 45]
    assert all(r["reps"] is None and r["weight_kg"] is None for r in reales(hecha))
    assert [r["duration_minutes"] for r in reales(cinta_hecha)] == [30]


def test_marcar_un_ejercicio_no_toca_los_demas(api, semana):
    marcar(api, semana, 1, ejercicios(api, semana, 1)["Press de banca"]["id"])
    assert all(r is None for r in reales(ejercicios(api, semana, 1)["Plancha"]))


# --- destildar ---


def test_destildar_borra_las_series_reales_de_ese_ejercicio_y_solo_ellas(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    plancha = ejercicios(api, semana, 1)["Plancha"]
    marcar(api, semana, 1, press["id"])
    marcar(api, semana, 1, plancha["id"])

    response = destildar(api, semana, 1, press["id"])

    assert response.status_code == 200
    assert all(r is None for r in reales(response.json()))
    assert all(r is not None for r in reales(ejercicios(api, semana, 1)["Plancha"]))
    assert contar(api, SetEntry) == 3


def test_destildar_tambien_borra_lo_editado_a_mano(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    api.put(f"/weeks/{semana}/days/1/sets/{press['sets'][0]['id']}", json={"reps": 3})
    destildar(api, semana, 1, press["id"])
    assert contar(api, SetEntry) == 0


def test_destildar_sin_nada_registrado_no_hace_nada_ni_crea_sesion(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    assert destildar(api, semana, 1, press["id"]).status_code == 200
    assert contar(api, WorkoutSession) == 0


# --- día completado y reabrir ---


def test_completar_el_dia_cierra_la_sesion(api, semana):
    response = completar(api, semana, 1)

    assert response.status_code == 200
    assert response.json()["finished_at"] is not None
    assert api.get(f"/weeks/{semana}/days/1").json()["finished_at"] is not None
    assert contar(api, WorkoutSession) == 1


def test_se_puede_completar_con_ejercicios_sin_hacer(api, semana):
    marcar(api, semana, 1, ejercicios(api, semana, 1)["Press de banca"]["id"])
    completar(api, semana, 1)
    # la plancha sigue sin series reales: queda como no hecha
    assert all(r is None for r in reales(ejercicios(api, semana, 1)["Plancha"]))


def test_completar_dos_veces_conserva_la_primera_hora(api, semana):
    # SQLite no guarda la zona horaria: la misma hora puede llegar con o sin la "Z" final.
    primera = completar(api, semana, 1).json()["finished_at"].rstrip("Z")
    segunda = completar(api, semana, 1).json()["finished_at"].rstrip("Z")
    assert primera == segunda
    assert contar(api, WorkoutSession) == 1


def test_un_dia_completado_no_admite_cambios(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    completar(api, semana, 1)

    assert marcar(api, semana, 1, ejercicios(api, semana, 1)["Plancha"]["id"]).status_code == 409
    assert destildar(api, semana, 1, press["id"]).status_code == 409
    editar = api.put(f"/weeks/{semana}/days/1/sets/{press['sets'][0]['id']}", json={"reps": 3})
    assert editar.status_code == 409
    assert contar(api, SetEntry) == 4  # nada cambió


def test_reabrir_deja_corregir_de_nuevo(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    completar(api, semana, 1)

    assert reabrir(api, semana, 1).json()["finished_at"] is None
    assert api.get(f"/weeks/{semana}/days/1").json()["finished_at"] is None
    editar = api.put(f"/weeks/{semana}/days/1/sets/{press['sets'][0]['id']}", json={"reps": 3})
    assert editar.status_code == 200


def test_reabrir_un_dia_que_no_estaba_completado_no_hace_nada(api, semana):
    assert reabrir(api, semana, 1).status_code == 200
    assert contar(api, WorkoutSession) == 0


def test_cada_dia_se_completa_por_separado(api, semana):
    completar(api, semana, 1)
    assert api.get(f"/weeks/{semana}/days/2").json()["finished_at"] is None
    assert marcar(api, semana, 2, ejercicios(api, semana, 2)["Sentadilla"]["id"]).status_code == 200


# --- semana cerrada y propiedad ---


def test_una_semana_cerrada_no_admite_nada_de_esto(api):
    cerrada = crear_semana(api, date(2026, 9, 1), status=PlanStatus.CLOSED)
    press = ejercicios(api, cerrada, 1)["Press de banca"]

    assert marcar(api, cerrada, 1, press["id"]).status_code == 409
    assert destildar(api, cerrada, 1, press["id"]).status_code == 409
    assert completar(api, cerrada, 1).status_code == 409
    assert reabrir(api, cerrada, 1).status_code == 409
    assert contar(api, SetEntry) == 0 and contar(api, WorkoutSession) == 0


def test_el_ejercicio_debe_ser_de_ese_dia_y_de_ese_usuario(api, semana):
    del_dia_2 = ejercicios(api, semana, 2)["Sentadilla"]["id"]
    ajena = crear_semana(api, date(2026, 9, 2), status=PlanStatus.ACTIVE, email="otro@spotter.local")

    assert marcar(api, semana, 1, del_dia_2).status_code == 404  # es de otro día
    assert marcar(api, semana, 1, 99999).status_code == 404
    assert marcar(api, semana, 9, del_dia_2).status_code == 404  # día inexistente
    assert marcar(api, ajena, 1, del_dia_2).status_code == 404  # semana ajena
    assert completar(api, ajena, 1).status_code == 404
    assert reabrir(api, ajena, 1).status_code == 404


# --- estado de cada día en la semana ---


def estados(api, semana):
    return [d["state"] for d in api.get(f"/weeks/{semana}").json()["days"]]


def test_el_estado_de_los_dias_pasa_de_pendiente_a_a_medias_a_completado(api, semana):
    assert estados(api, semana) == ["pending", "pending"]

    marcar(api, semana, 1, ejercicios(api, semana, 1)["Press de banca"]["id"])
    assert estados(api, semana) == ["partial", "pending"]

    completar(api, semana, 1)
    assert estados(api, semana) == ["completed", "pending"]

    reabrir(api, semana, 1)
    assert estados(api, semana) == ["partial", "pending"]


def test_completar_sin_registrar_nada_deja_el_dia_completado(api, semana):
    completar(api, semana, 2)
    assert estados(api, semana) == ["pending", "completed"]
