"""El reparto de las series entre los días (decisión 90) y el tiempo apagado."""

from app.ai.prompt import minutes_text, volume_text
from app.ai.routine import DayProposal, RoutineProposal
from app.ai.rules import BIG_GROUPS, distribution_issues, validate_routine
from app.enums import Goal, Level, Muscle
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    GRANDES,
    api,
    con_perfil,
    ejercicio,
    entorno,
    usar_gemini,
)
from tests.test_routine_rules import cardio, fuerza


def dia(**series):
    """Un día con un ejercicio por grupo grande; `series` pone las series de cada uno (por defecto 3).
    Con más de 10 series (el máximo de un ejercicio) se parten en dos ejercicios del mismo grupo."""
    ejercicios = []
    for m in BIG_GROUPS:
        total = series.get(m.value, 3)
        while total > 0:
            ejercicios.append(fuerza(m, sets=min(total, 10)))
            total -= 10
    return DayProposal(title="Día", exercises=ejercicios)


def rutina(*dias):
    return RoutineProposal(days=list(dias))


# --- las reglas ---


def test_un_reparto_parejo_no_tiene_problemas():
    assert distribution_issues(rutina(dia(), dia(), dia())) == []


def test_un_grupo_que_se_trabaja_un_solo_dia_con_3_dias_se_marca():
    solo_pecho_el_primero = DayProposal(
        title="Día",
        exercises=[fuerza(m, sets=3) for m in BIG_GROUPS if m != Muscle.CHEST],
    )
    problemas = distribution_issues(rutina(dia(), solo_pecho_el_primero, solo_pecho_el_primero))

    assert any("Pecho se trabaja un solo día" in p for p in problemas)


def test_con_2_dias_de_cuerpo_completo_no_se_exige_trabajar_cada_grupo_en_2():
    solo = DayProposal(title="Día", exercises=[fuerza(m, sets=3) for m in BIG_GROUPS if m != Muscle.CHEST])
    # Pecho está en un solo día, pero la rutina tiene solo 2: no se exige.
    assert not any("un solo día" in p for p in distribution_issues(rutina(dia(), solo)))


def test_una_diferencia_grande_entre_dos_dias_del_mismo_grupo_se_marca():
    problemas = distribution_issues(rutina(dia(chest=9), dia(chest=3)))

    assert any("Pecho tiene 9 series el Día 1 y 3 el Día 2" in p for p in problemas)


def test_mas_de_9_series_de_un_grupo_en_un_dia_se_marca():
    problemas = distribution_issues(rutina(dia(chest=13), dia(chest=12)))

    assert any("Pecho tiene 13 series el Día 1: el máximo es 9" in p for p in problemas)


def test_los_dias_tienen_que_tener_una_cantidad_parecida_de_series_grandes():
    corto = DayProposal(title="Día", exercises=[fuerza(Muscle.CHEST, sets=3), fuerza(Muscle.BACK, sets=3)])
    problemas = distribution_issues(rutina(dia(), corto))

    assert any("El Día 1 tiene 18 series de grupos grandes y el Día 2 tiene 6" in p for p in problemas)


def test_el_complemento_no_completa_un_dia_y_tiene_su_tope():
    relleno = DayProposal(
        title="Día",
        exercises=[fuerza(m, sets=3) for m in BIG_GROUPS]
        + [fuerza(Muscle.CORE, sets=4), fuerza(Muscle.BICEPS, sets=3)],
    )
    problemas = distribution_issues(rutina(relleno, dia()))

    assert any("El Día 1 tiene 7 series de bíceps, tríceps, gemelos y abdominales" in p for p in problemas)


def test_el_complemento_no_cuenta_como_grupo_grande():
    # Dos días idénticos de grupos grandes más un día solo de brazos: los brazos no suman al reparto
    # de los grupos grandes, así que el día "solo de brazos" no tiene series grandes (0).
    brazos = DayProposal(title="Día", exercises=[fuerza(Muscle.BICEPS, sets=3), fuerza(Muscle.TRICEPS, sets=3)])
    problemas = distribution_issues(rutina(dia(), dia(), brazos))

    assert any("series de grupos grandes y el Día 3 tiene 0" in p for p in problemas)


def test_un_dia_solo_de_cardio_no_se_cuenta():
    solo_cardio = DayProposal(title="Cardio", exercises=[cardio(30)])

    assert distribution_issues(rutina(dia(), dia(), solo_cardio)) == []


def test_validate_routine_los_deja_como_avisos_y_como_pedido_de_reintento():
    resultado = validate_routine(rutina(dia(chest=13), dia(chest=12)), Goal.MASA, Level.INTERMEDIO)

    assert resultado.ok  # no rechaza
    assert any(w.rule == "Reparto" for w in resultado.warnings)
    assert any(i.rule == "Reparto" for i in resultado.soft_issues)


# --- el reintento en la generación ---


def a_dict(r: RoutineProposal) -> dict:
    return r.model_dump(mode="json")


def rutina_catalogo(**series):
    """Una rutina con ejercicios del catálogo: dos días con los 6 grupos grandes."""
    def ej(g):
        return ejercicio(*g, sets=series.get(g[1], 3))

    return {
        "days": [
            {"title": "Día 1", "mobility_notes": None, "exercises": [ej(g) for g in GRANDES]},
            {"title": "Día 2", "mobility_notes": None, "exercises": [ejercicio(*g, sets=3) for g in GRANDES]},
        ],
        "notices": [],
    }


ELECCION = {"goal": "masa", "level": "principiante", "days": 2}


def generar(api, cuerpo=ELECCION):
    return api.post("/proposals/generate", json=cuerpo)


def test_si_el_reparto_esta_mal_se_pide_de_nuevo_y_se_le_dice_cual(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina_catalogo(chest=9), rutina_catalogo())

    respuesta = generar(api)

    assert respuesta.status_code == 201
    assert falso.llamadas == 2
    assert "Reparto" in falso.prompts[1]
    assert "Pecho tiene 9 series el Día 1 y 3 el Día 2" in falso.prompts[1]
    assert not any(w["rule"] == "Reparto" for w in respuesta.json()["warnings"])


def test_si_el_segundo_intento_sigue_mal_repartido_se_acepta_con_el_aviso(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina_catalogo(chest=9), rutina_catalogo(chest=9))

    respuesta = generar(api)

    assert respuesta.status_code == 201
    assert falso.llamadas == 2
    assert any(w["rule"] == "Reparto" for w in respuesta.json()["warnings"])


# --- el tiempo apagado (decisión 90) ---


def test_sin_tiempo_elegido_el_prompt_deja_que_decida_la_ia_con_la_referencia():
    texto = minutes_text(None)
    assert "Vos decidís la duración" in texto
    assert "El tiempo manda" not in texto
    assert "Dejá la sesión **más larga" in volume_text(None)


def test_con_tiempo_elegido_el_prompt_sigue_como_en_la_decision_82():
    assert "no pases del tiempo" in minutes_text(60)
    assert "no alargues la sesión" in volume_text(60)


def test_se_puede_generar_sin_minutos_y_no_se_reintenta_por_el_tiempo(api, entorno, monkeypatch):
    con_perfil(api)
    falso = usar_gemini(monkeypatch, rutina_catalogo())

    respuesta = generar(api)  # sin "minutes"

    assert respuesta.status_code == 201
    assert falso.llamadas == 1
    assert "Vos decidís la duración" in falso.prompts[0]


def test_unos_minutos_raros_siguen_rechazandose(api, entorno, monkeypatch):
    con_perfil(api)
    usar_gemini(monkeypatch, rutina_catalogo())

    assert generar(api, {**ELECCION, "minutes": 50}).status_code == 422
