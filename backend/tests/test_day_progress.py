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


# --- marcar una serie como hecha ---


def serie_hecha(api, semana, dia, serie_id):
    return api.post(f"/weeks/{semana}/days/{dia}/sets/{serie_id}/done")


def desmarcar_serie(api, semana, dia, serie_id):
    return api.delete(f"/weeks/{semana}/days/{dia}/sets/{serie_id}/done")


def test_marcar_una_serie_copia_lo_planificado_y_solo_esa(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    plan = press["sets"][1]  # 9 reps x 55 kg

    response = serie_hecha(api, semana, 1, plan["id"])

    assert response.status_code == 200
    assert response.json()["real"] == {
        "reps": 9, "duration_minutes": None, "duration_seconds": None, "weight_kg": 55.0,
    }
    assert [s["real"] is not None for s in ejercicios(api, semana, 1)["Press de banca"]["sets"]] == [
        False, True, False, False,
    ]
    assert contar(api, SetEntry) == 1 and contar(api, WorkoutSession) == 1


def test_marcar_una_serie_ya_editada_respeta_lo_editado_y_no_duplica(api, semana):
    plan = ejercicios(api, semana, 1)["Press de banca"]["sets"][0]
    api.put(f"/weeks/{semana}/days/1/sets/{plan['id']}", json={"reps": 6, "weight_kg": 60})

    real = serie_hecha(api, semana, 1, plan["id"]).json()["real"]

    assert (real["reps"], real["weight_kg"]) == (6, 60.0)
    assert contar(api, SetEntry) == 1


def test_marcar_dos_veces_la_misma_serie_no_duplica(api, semana):
    plan = ejercicios(api, semana, 1)["Press de banca"]["sets"][0]
    serie_hecha(api, semana, 1, plan["id"])
    serie_hecha(api, semana, 1, plan["id"])
    assert contar(api, SetEntry) == 1


def test_una_serie_de_plancha_y_de_cinta_copia_segundos_y_minutos(api, semana):
    plancha = ejercicios(api, semana, 1)["Plancha"]["sets"][0]
    cinta = ejercicios(api, semana, 2)["Cinta"]["sets"][0]

    assert serie_hecha(api, semana, 1, plancha["id"]).json()["real"]["duration_seconds"] == 45
    assert serie_hecha(api, semana, 2, cinta["id"]).json()["real"]["duration_minutes"] == 30


def test_desmarcar_una_serie_borra_solo_esa(api, semana):
    series = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    serie_hecha(api, semana, 1, series[0]["id"])
    serie_hecha(api, semana, 1, series[1]["id"])

    response = desmarcar_serie(api, semana, 1, series[0]["id"])

    assert response.status_code == 200
    assert response.json()["real"] is None
    despues = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    assert [s["real"] is not None for s in despues] == [False, True, False, False]


def test_desmarcar_sin_nada_registrado_no_crea_sesion(api, semana):
    serie = ejercicios(api, semana, 1)["Press de banca"]["sets"][0]
    assert desmarcar_serie(api, semana, 1, serie["id"]).status_code == 200
    assert contar(api, WorkoutSession) == 0


def test_el_plan_no_cambia_al_marcar_ni_al_desmarcar_series(api, semana):
    antes = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    serie_hecha(api, semana, 1, antes[0]["id"])
    desmarcar_serie(api, semana, 1, antes[0]["id"])
    despues = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    campos = ("reps", "target_weight_kg", "duration_seconds", "duration_minutes")
    assert [{c: s[c] for c in campos} for s in antes] == [{c: s[c] for c in campos} for s in despues]


def test_el_caso_completo_de_marcadas_editadas_y_sin_tocar_al_marcar_el_ejercicio(api, semana):
    """Series 1 y 2 marcadas, la 3 editada sin marcar, la 4 sin tocar; después se marca el ejercicio.

    Todas quedan como hechas: la 1, 2 y 4 con lo planificado y la 3 con lo que se editó.
    """
    press = ejercicios(api, semana, 1)["Press de banca"]
    s1, s2, s3, s4 = press["sets"]
    serie_hecha(api, semana, 1, s1["id"])
    serie_hecha(api, semana, 1, s2["id"])
    api.put(f"/weeks/{semana}/days/1/sets/{s3['id']}", json={"reps": 5, "weight_kg": 70})

    hecho = marcar(api, semana, 1, press["id"]).json()

    reales_ = [(r["reps"], r["weight_kg"]) for r in reales(hecho)]
    assert reales_ == [
        (s1["reps"], s1["target_weight_kg"]),  # marcada: lo planificado
        (s2["reps"], s2["target_weight_kg"]),  # marcada: lo planificado
        (5, 70.0),  # editada: lo editado
        (s4["reps"], s4["target_weight_kg"]),  # sin tocar: lo planificado
    ]
    assert contar(api, SetEntry) == 4


def test_marcar_series_no_es_obligatorio_para_marcar_el_ejercicio(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    hecho = marcar(api, semana, 1, press["id"]).json()  # sin marcar ninguna serie antes
    assert all(r is not None for r in reales(hecho))


def test_con_el_dia_completado_no_se_marcan_ni_desmarcan_series(api, semana):
    serie = ejercicios(api, semana, 1)["Press de banca"]["sets"][0]
    serie_hecha(api, semana, 1, serie["id"])
    completar(api, semana, 1)

    assert serie_hecha(api, semana, 1, ejercicios(api, semana, 1)["Press de banca"]["sets"][1]["id"]).status_code == 409
    assert desmarcar_serie(api, semana, 1, serie["id"]).status_code == 409
    assert contar(api, SetEntry) == 1


def test_una_semana_cerrada_no_admite_marcar_series(api):
    cerrada = crear_semana(api, date(2026, 9, 1), status=PlanStatus.CLOSED)
    serie = ejercicios(api, cerrada, 1)["Press de banca"]["sets"][0]

    assert serie_hecha(api, cerrada, 1, serie["id"]).status_code == 409
    assert desmarcar_serie(api, cerrada, 1, serie["id"]).status_code == 409
    assert contar(api, SetEntry) == 0


def test_la_serie_debe_ser_de_ese_dia_y_de_ese_usuario_al_marcar(api, semana):
    del_dia_2 = ejercicios(api, semana, 2)["Sentadilla"]["sets"][0]["id"]
    ajena = crear_semana(api, date(2026, 9, 2), status=PlanStatus.ACTIVE, email="otro@spotter.local")

    assert serie_hecha(api, semana, 1, del_dia_2).status_code == 404  # otro día
    assert serie_hecha(api, semana, 1, 99999).status_code == 404
    assert serie_hecha(api, ajena, 1, del_dia_2).status_code == 404  # semana ajena
    assert desmarcar_serie(api, semana, 1, del_dia_2).status_code == 404


# --- ejercicio cerrado: bloqueado hasta reabrirlo ---


def reabrir_ejercicio(api, semana, dia, ejercicio_id):
    return api.post(f"/weeks/{semana}/days/{dia}/exercises/{ejercicio_id}/reopen")


def cerrado(api, semana, dia, nombre):
    return ejercicios(api, semana, dia)[nombre]["completed"]


def test_un_ejercicio_empieza_sin_cerrar(api, semana):
    assert cerrado(api, semana, 1, "Press de banca") is False


def test_marcar_el_ejercicio_lo_cierra(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]

    respuesta = marcar(api, semana, 1, press["id"]).json()

    assert respuesta["completed"] is True
    assert cerrado(api, semana, 1, "Press de banca") is True
    assert cerrado(api, semana, 1, "Plancha") is False  # los demás siguen abiertos


def test_marcar_todas_las_series_a_mano_no_cierra_el_ejercicio(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    for serie in press["sets"]:
        serie_hecha(api, semana, 1, serie["id"])

    assert all(s["real"] is not None for s in ejercicios(api, semana, 1)["Press de banca"]["sets"])
    assert cerrado(api, semana, 1, "Press de banca") is False


def test_un_ejercicio_cerrado_no_admite_editar_marcar_ni_desmarcar_series(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    serie = press["sets"][0]["id"]

    assert api.put(f"/weeks/{semana}/days/1/sets/{serie}", json={"reps": 3}).status_code == 409
    assert serie_hecha(api, semana, 1, serie).status_code == 409
    assert desmarcar_serie(api, semana, 1, serie).status_code == 409
    # nada cambió: sigue con lo copiado del plan
    assert contar(api, SetEntry) == 4
    assert ejercicios(api, semana, 1)["Press de banca"]["sets"][0]["real"]["reps"] == press["sets"][0]["reps"]


def test_marcar_de_nuevo_un_ejercicio_cerrado_no_duplica_nada(api, semana):
    from app.models import ExerciseCompletion

    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    assert marcar(api, semana, 1, press["id"]).status_code == 200
    assert contar(api, ExerciseCompletion) == 1
    assert contar(api, SetEntry) == 4


def test_reabrir_el_ejercicio_conserva_lo_registrado_y_deja_corregir(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    serie = press["sets"][1]
    api.put(f"/weeks/{semana}/days/1/sets/{serie['id']}", json={"reps": 6, "weight_kg": 60})
    marcar(api, semana, 1, press["id"])

    respuesta = reabrir_ejercicio(api, semana, 1, press["id"])

    assert respuesta.status_code == 200
    assert respuesta.json()["completed"] is False
    assert cerrado(api, semana, 1, "Press de banca") is False
    despues = ejercicios(api, semana, 1)["Press de banca"]["sets"]
    assert all(s["real"] is not None for s in despues)  # no se borró nada
    assert (despues[1]["real"]["reps"], despues[1]["real"]["weight_kg"]) == (6, 60.0)  # ni lo editado
    assert contar(api, SetEntry) == 4
    editar = api.put(f"/weeks/{semana}/days/1/sets/{serie['id']}", json={"reps": 4})
    assert editar.status_code == 200


def test_se_puede_cerrar_de_nuevo_despues_de_reabrir(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    reabrir_ejercicio(api, semana, 1, press["id"])
    assert marcar(api, semana, 1, press["id"]).json()["completed"] is True


def test_reabrir_un_ejercicio_que_no_estaba_cerrado_no_hace_nada(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    assert reabrir_ejercicio(api, semana, 1, press["id"]).status_code == 200
    assert contar(api, WorkoutSession) == 0


def test_deshacer_un_ejercicio_cerrado_borra_lo_registrado_y_el_cierre(api, semana):
    from app.models import ExerciseCompletion

    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])

    respuesta = destildar(api, semana, 1, press["id"])

    assert respuesta.status_code == 200
    assert respuesta.json()["completed"] is False
    assert all(r is None for r in reales(respuesta.json()))
    assert contar(api, SetEntry) == 0
    assert contar(api, ExerciseCompletion) == 0


def test_cerrar_un_ejercicio_no_bloquea_a_los_otros(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    plancha = ejercicios(api, semana, 1)["Plancha"]
    marcar(api, semana, 1, press["id"])

    editar = api.put(f"/weeks/{semana}/days/1/sets/{plancha['sets'][0]['id']}", json={"duration_seconds": 30})
    assert editar.status_code == 200


def test_reabrir_el_dia_no_reabre_los_ejercicios_cerrados(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    completar(api, semana, 1)
    reabrir(api, semana, 1)
    assert cerrado(api, semana, 1, "Press de banca") is True


def test_con_el_dia_completado_no_se_reabre_un_ejercicio(api, semana):
    press = ejercicios(api, semana, 1)["Press de banca"]
    marcar(api, semana, 1, press["id"])
    completar(api, semana, 1)
    assert reabrir_ejercicio(api, semana, 1, press["id"]).status_code == 409
    assert cerrado(api, semana, 1, "Press de banca") is True


def test_una_semana_cerrada_no_admite_reabrir_ejercicios(api):
    semana_cerrada = crear_semana(api, date(2026, 9, 1), status=PlanStatus.CLOSED)
    press = ejercicios(api, semana_cerrada, 1)["Press de banca"]
    assert reabrir_ejercicio(api, semana_cerrada, 1, press["id"]).status_code == 409


def test_reabrir_el_ejercicio_debe_ser_de_ese_dia_y_de_ese_usuario(api, semana):
    del_dia_2 = ejercicios(api, semana, 2)["Sentadilla"]["id"]
    ajena = crear_semana(api, date(2026, 9, 2), status=PlanStatus.ACTIVE, email="otro@spotter.local")

    assert reabrir_ejercicio(api, semana, 1, del_dia_2).status_code == 404
    assert reabrir_ejercicio(api, semana, 1, 99999).status_code == 404
    assert reabrir_ejercicio(api, ajena, 1, del_dia_2).status_code == 404


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
    plancha = ejercicios(api, semana, 1)["Plancha"]
    marcar(api, semana, 1, press["id"])  # este ejercicio queda cerrado
    completar(api, semana, 1)

    assert reabrir(api, semana, 1).json()["finished_at"] is None
    assert api.get(f"/weeks/{semana}/days/1").json()["finished_at"] is None
    # un ejercicio sin cerrar vuelve a poder corregirse
    editar = api.put(f"/weeks/{semana}/days/1/sets/{plancha['sets'][0]['id']}", json={"duration_seconds": 30})
    assert editar.status_code == 200
    # pero reabrir el día no reabre los ejercicios que se habían cerrado
    cerrado = api.put(f"/weeks/{semana}/days/1/sets/{press['sets'][0]['id']}", json={"reps": 3})
    assert cerrado.status_code == 409


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
