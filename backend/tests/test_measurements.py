"""El seguimiento de peso: mediciones con fecha cargadas a mano (decisión 87)."""

from datetime import date, timedelta

from app.enums import PlanStatus
from tests.test_proposals import PERFIL, api, con_perfil  # noqa: F401  (fixture y ayudante compartidos)
from tests.test_weeks import crear_semana


def hoy() -> str:
    return date.today().isoformat()


def dias_atras(n: int) -> str:
    return (date.today() - timedelta(days=n)).isoformat()


def lista(api):
    return api.get("/measurements").json()


def peso_del_perfil(api):
    return api.get("/profile").json()["weight_kg"]


def test_al_crear_el_perfil_el_peso_es_la_primera_medicion(api):
    con_perfil(api)

    filas = lista(api)

    assert len(filas) == 1
    assert filas[0]["measured_on"] == hoy()
    assert float(filas[0]["weight_kg"]) == 80.5
    assert filas[0]["body_fat_pct"] is None


def test_el_imc_se_calcula_con_la_altura_del_perfil(api):
    con_perfil(api)  # 80,5 kg y 178 cm

    assert lista(api)[0]["bmi"] == 25.4  # 80,5 / 1,78^2 = 25,4


def test_cambiar_el_peso_del_perfil_suma_una_medicion_de_hoy(api):
    con_perfil(api)

    assert api.put("/profile", json={**PERFIL, "weight_kg": "79.0"}).status_code == 200

    filas = lista(api)
    assert len(filas) == 1  # reemplaza la de hoy
    assert float(filas[0]["weight_kg"]) == 79.0


def test_guardar_el_perfil_sin_cambiar_el_peso_no_suma_nada(api):
    con_perfil(api)

    api.put("/profile", json={**PERFIL, "name": "Otro nombre"})

    assert len(lista(api)) == 1


def test_cargar_una_medicion_vieja_no_cambia_el_peso_del_perfil(api):
    con_perfil(api)

    r = api.post("/measurements", json={"weight_kg": "82.0", "measured_on": dias_atras(14)})

    assert r.status_code == 201
    assert [m["measured_on"] for m in lista(api)] == [hoy(), dias_atras(14)]
    assert float(peso_del_perfil(api)) == 80.5  # la última sigue siendo la de hoy


def test_una_medicion_mas_nueva_deja_el_peso_del_perfil_en_ese(api):
    con_perfil(api)
    api.post("/measurements", json={"weight_kg": "82.0", "measured_on": dias_atras(14)})

    api.put("/profile", json={**PERFIL, "weight_kg": "78.0"})

    assert float(peso_del_perfil(api)) == 78.0


def test_la_grasa_corporal_es_opcional(api):
    con_perfil(api)

    r = api.post("/measurements", json={"weight_kg": "80.0", "body_fat_pct": "18.5", "measured_on": dias_atras(7)})

    assert float(r.json()["body_fat_pct"]) == 18.5


def test_cargar_dos_veces_el_mismo_dia_reemplaza(api):
    con_perfil(api)
    api.post("/measurements", json={"weight_kg": "81.0", "measured_on": dias_atras(7)})

    api.post("/measurements", json={"weight_kg": "80.0", "measured_on": dias_atras(7)})

    assert len(lista(api)) == 2
    assert float(lista(api)[1]["weight_kg"]) == 80.0


def test_no_se_acepta_una_fecha_futura_ni_un_peso_imposible(api):
    con_perfil(api)

    futura = api.post("/measurements", json={"weight_kg": "80", "measured_on": (date.today() + timedelta(days=1)).isoformat()})
    liviano = api.post("/measurements", json={"weight_kg": "10"})
    grasa = api.post("/measurements", json={"weight_kg": "80", "body_fat_pct": "90"})

    assert futura.status_code == 422
    assert liviano.status_code == 422
    assert grasa.status_code == 422


def test_se_puede_corregir_una_medicion(api):
    con_perfil(api)
    vieja = api.post("/measurements", json={"weight_kg": "82.0", "measured_on": dias_atras(14)}).json()

    r = api.put(f"/measurements/{vieja['id']}", json={"weight_kg": "81.5", "body_fat_pct": "20.0", "measured_on": dias_atras(14)})

    assert r.status_code == 200
    assert float(r.json()["weight_kg"]) == 81.5


def test_corregir_la_fecha_a_un_dia_ya_ocupado_da_409(api):
    con_perfil(api)
    vieja = api.post("/measurements", json={"weight_kg": "82.0", "measured_on": dias_atras(14)}).json()

    r = api.put(f"/measurements/{vieja['id']}", json={"weight_kg": "82.0", "measured_on": hoy()})

    assert r.status_code == 409


def test_borrar_la_mas_nueva_deja_el_peso_del_perfil_en_la_anterior(api):
    con_perfil(api)
    api.post("/measurements", json={"weight_kg": "82.0", "measured_on": dias_atras(14)})
    de_hoy = lista(api)[0]

    assert api.delete(f"/measurements/{de_hoy['id']}").status_code == 204

    assert float(peso_del_perfil(api)) == 82.0
    assert len(lista(api)) == 1


def test_no_se_toca_la_medicion_de_otra_persona(api):
    con_perfil(api)
    mia = lista(api)[0]
    # Se pide como si fuera de otra persona: un id que no existe da 404 igual.
    assert api.put("/measurements/99999", json={"weight_kg": "80"}).status_code == 404
    assert api.delete("/measurements/99999").status_code == 404
    assert api.get("/measurements").json()[0]["id"] == mia["id"]


# --- al cerrar la semana ---


def test_cerrar_la_semana_con_peso_guarda_una_medicion_ligada_a_la_semana(api):
    con_perfil(api)
    semana = crear_semana(api, date.today(), PlanStatus.ACTIVE)

    r = api.post(f"/weeks/{semana}/close", json={"weight_kg": "77.4", "body_fat_pct": "17.2"})

    assert r.status_code == 200
    hoy_fila = lista(api)[0]
    assert float(hoy_fila["weight_kg"]) == 77.4
    assert float(hoy_fila["body_fat_pct"]) == 17.2
    assert hoy_fila["week_number"] == 1
    assert float(peso_del_perfil(api)) == 77.4


def test_cerrar_la_semana_sin_peso_no_guarda_ninguna_medicion(api):
    con_perfil(api)
    semana = crear_semana(api, date.today(), PlanStatus.ACTIVE)

    r = api.post(f"/weeks/{semana}/close", json={"note": "bien"})

    assert r.status_code == 200
    assert len(lista(api)) == 1  # solo la primera, la del perfil


def test_la_grasa_sola_al_cerrar_la_semana_no_se_guarda(api):
    con_perfil(api)
    semana = crear_semana(api, date.today(), PlanStatus.ACTIVE)

    api.post(f"/weeks/{semana}/close", json={"body_fat_pct": "17.2"})

    assert lista(api)[0]["body_fat_pct"] is None
