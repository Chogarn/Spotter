import pytest
from pydantic import ValidationError

from app.ai.routine import DayProposal, ExerciseProposal, RoutineProposal, SetProposal
from app.ai.rules import (
    BIG_GROUPS,
    estimate_day_minutes,
    validate_routine,
    weekly_sets_by_muscle,
)
from app.enums import Goal, Level, Muscle


def fuerza(muscle, sets=4, reps=10, rest=120, secondary=()):
    return ExerciseProposal(
        name=f"Ejercicio de {muscle.value}",
        kind="strength",
        region="upper",
        direction="push",
        primary_muscle=muscle,
        secondary_muscles=list(secondary),
        mechanic="compound",
        equipment="barbell",
        level="intermedio",
        rest_seconds=rest,
        sets=[SetProposal(reps=reps, target_weight_kg=50) for _ in range(sets)],
    )


def plancha(sets=3, seconds=45, rest=60):
    return ExerciseProposal(
        name="Plancha",
        kind="isometric",
        region="core",
        direction="none",
        primary_muscle="core",
        mechanic="isolation",
        equipment="bodyweight",
        level="principiante",
        rest_seconds=rest,
        sets=[SetProposal(duration_seconds=seconds) for _ in range(sets)],
    )


def cardio(minutes=30):
    return ExerciseProposal(
        name="Cinta",
        kind="cardio",
        region="full_body",
        direction="none",
        primary_muscle="full_body",
        mechanic="compound",
        equipment="machine",
        level="principiante",
        sets=[SetProposal(duration_minutes=minutes)],
    )


def dia_completo(**kwargs):
    return DayProposal(title="Cuerpo completo", exercises=[fuerza(m, **kwargs) for m in BIG_GROUPS])


def dias_de_cardio(total):
    """Reparte el cardio en días de hasta 100 minutos (el tope por serie es 180)."""
    dias = []
    while total > 0:
        minutos = min(100, total)
        dias.append(DayProposal(title="Cardio", exercises=[cardio(minutos)]))
        total -= minutos
    return dias


def rutina(n_dias=2, **kwargs):
    return RoutineProposal(days=[dia_completo(**kwargs) for _ in range(n_dias)])


def reglas(result, nivel="errors"):
    return {i.rule for i in getattr(result, nivel)}


# --- forma (Pydantic) ---


def test_una_rutina_valida_no_trae_errores_ni_avisos():
    # 2 días x 5 series = 10 series semanales por grupo grande (R3).
    result = validate_routine(rutina(sets=5), Goal.MASA, Level.INTERMEDIO)
    assert result.ok
    assert result.warnings == []


def test_serie_con_repeticiones_y_minutos_se_rechaza():
    with pytest.raises(ValidationError):
        SetProposal(reps=10, duration_minutes=5)
    with pytest.raises(ValidationError):
        SetProposal()


def test_el_cardio_no_lleva_repeticiones_ni_peso():
    base = dict(
        name="Cinta", kind="cardio", region="full_body", direction="none",
        primary_muscle="full_body", mechanic="compound", equipment="machine", level="principiante",
    )
    with pytest.raises(ValidationError):
        ExerciseProposal(**base, sets=[SetProposal(reps=10)])
    with pytest.raises(ValidationError):
        ExerciseProposal(**base, sets=[SetProposal(duration_minutes=20, target_weight_kg=5)])


def test_el_cardio_exige_las_etiquetas_full_body_de_r13():
    with pytest.raises(ValidationError):
        ExerciseProposal(
            name="Cinta", kind="cardio", region="lower", direction="none",
            primary_muscle="full_body", mechanic="compound", equipment="machine",
            level="principiante", sets=[SetProposal(duration_minutes=20)],
        )


def test_la_fuerza_exige_descanso_y_repeticiones():
    datos = dict(
        name="Press", kind="strength", region="upper", direction="push", primary_muscle="chest",
        mechanic="compound", equipment="barbell", level="intermedio",
    )
    with pytest.raises(ValidationError):
        ExerciseProposal(**datos, sets=[SetProposal(reps=8)])  # sin rest_seconds
    with pytest.raises(ValidationError):
        ExerciseProposal(**datos, rest_seconds=90, sets=[SetProposal(duration_minutes=5)])


def test_etiquetas_fuera_de_las_listas_cerradas_se_rechazan():
    with pytest.raises(ValidationError):
        ExerciseProposal(
            name="X", kind="strength", region="upper", direction="push",
            primary_muscle="cerebro", mechanic="compound", equipment="barbell",
            level="intermedio", rest_seconds=60, sets=[SetProposal(reps=5)],
        )


def test_el_esquema_json_para_gemini_se_genera():
    esquema = RoutineProposal.model_json_schema()
    assert "days" in esquema["properties"]


def test_la_respuesta_de_gemini_se_valida_desde_json():
    texto = rutina().model_dump_json()
    assert len(RoutineProposal.model_validate_json(texto).days) == 2


# --- errores: R1, R11, R12, R17 ---


def test_r11_una_semana_de_un_dia_se_rechaza():
    result = validate_routine(rutina(1), Goal.MASA, Level.INTERMEDIO)
    assert {"R11", "R1"} <= reglas(result)


def test_r11_siete_dias_se_rechazan():
    assert "R11" in reglas(validate_routine(rutina(7), Goal.MASA, Level.INTERMEDIO))


@pytest.mark.parametrize("dias,ok", [(2, True), (3, True), (4, False)])
def test_r12_el_principiante_entrena_2_o_3_dias(dias, ok):
    result = validate_routine(rutina(dias), Goal.MASA, Level.PRINCIPIANTE)
    assert ("R12" not in reglas(result)) is ok


def test_r1_faltan_grupos_musculares_grandes():
    dia = DayProposal(title="Solo pecho", exercises=[fuerza(Muscle.CHEST)])
    result = validate_routine(RoutineProposal(days=[dia, dia]), Goal.MASA, Level.INTERMEDIO)
    assert "R1" in reglas(result)


def test_r1_los_dias_de_solo_cardio_no_cuentan_como_fuerza():
    solo_cardio = DayProposal(title="Cardio", exercises=[cardio(40)])
    result = validate_routine(
        RoutineProposal(days=[dia_completo(), solo_cardio, solo_cardio]), Goal.MASA, Level.INTERMEDIO
    )
    assert "R1" in reglas(result)


@pytest.mark.parametrize("minutos,ok", [(0, False), (149, False), (150, True), (300, True), (301, False)])
def test_r17_el_cardio_de_perder_grasa_va_de_150_a_300(minutos, ok):
    dias = [dia_completo(sets=2), dia_completo(sets=2), *dias_de_cardio(minutos)]
    result = validate_routine(RoutineProposal(days=dias), Goal.PERDER_GRASA, Level.INTERMEDIO)
    assert ("R17" not in reglas(result)) is ok


def test_r17_no_se_exige_cardio_a_quien_busca_masa():
    assert "R17" not in reglas(validate_routine(rutina(), Goal.MASA, Level.INTERMEDIO))


# --- conteo de series (R5) ---


def test_r5_las_series_indirectas_cuentan_la_mitad():
    dia = DayProposal(
        title="x",
        exercises=[
            fuerza(Muscle.CHEST, sets=4, secondary=[Muscle.TRICEPS, Muscle.SHOULDERS]),
            fuerza(Muscle.SHOULDERS, sets=3),
        ],
    )
    totales = weekly_sets_by_muscle(RoutineProposal(days=[dia]))
    assert totales[Muscle.CHEST] == 4
    assert totales[Muscle.TRICEPS] == 2  # 4 series x 0,5
    assert totales[Muscle.SHOULDERS] == 3 + 2  # 3 directas + 4 x 0,5 indirectas


def test_el_cardio_no_suma_series_a_ningun_musculo():
    dia = DayProposal(title="x", exercises=[cardio(30)])
    assert weekly_sets_by_muscle(RoutineProposal(days=[dia])) == {}


# --- avisos ---


def test_r34_estimacion_de_la_duracion():
    # 3 series x 10 reps = 90 s; 2 descansos de 60 s = 120 s; total 3,5 min.
    # + movilidad 7,5 min + cardio 20 min + 1 cambio de ejercicio de 1,5 min = 32,5.
    dia = DayProposal(
        title="x",
        mobility_notes="movilidad de cadera",
        exercises=[fuerza(Muscle.CHEST, sets=3, rest=60), cardio(20)],
    )
    assert estimate_day_minutes(dia) == pytest.approx(32.5)


def test_r34_avisa_si_la_sesion_se_aleja_de_la_referencia():
    corta = rutina(sets=1, rest=30)  # muy corta para la referencia de 60 a 90
    result = validate_routine(corta, Goal.MASA, Level.INTERMEDIO)
    assert result.ok  # solo avisa
    assert "R34" in reglas(result, "warnings")


def test_r18_el_avanzado_con_masa_no_tiene_referencia_de_duracion():
    corta = rutina(sets=1, rest=30)
    assert "R34" not in reglas(validate_routine(corta, Goal.MASA, Level.AVANZADO), "warnings")


def test_r4_fuerza_avisa_si_hay_mas_de_3_series_por_ejercicio():
    result = validate_routine(rutina(sets=4), Goal.FUERZA, Level.INTERMEDIO)
    assert result.ok
    assert "R4" in reglas(result, "warnings")
    assert "R4" not in reglas(validate_routine(rutina(sets=3), Goal.FUERZA, Level.INTERMEDIO), "warnings")


def test_r20_perder_grasa_avisa_si_el_volumen_de_fuerza_se_pasa():
    dias = [dia_completo(sets=4), dia_completo(sets=4), *dias_de_cardio(200)]
    result = validate_routine(RoutineProposal(days=dias), Goal.PERDER_GRASA, Level.INTERMEDIO)
    assert "R20" in reglas(result, "warnings")


def test_r24_mantenerme_activo_avisa_sin_cardio():
    result = validate_routine(rutina(sets=2), Goal.MANTENERME_ACTIVO, Level.PRINCIPIANTE)
    assert "R24" in reglas(result, "warnings")


def test_r25_condicion_general_avisa_si_falta_aerobico():
    result = validate_routine(rutina(sets=3), Goal.CONDICION_GENERAL, Level.PRINCIPIANTE)
    assert "R25" in reglas(result, "warnings")


@pytest.mark.parametrize("series,avisa", [(2, True), (3, True), (5, False), (6, False)])
def test_r3_masa_avisa_si_un_grupo_grande_queda_fuera_de_10_a_20_series(series, avisa):
    # 2 dias x series por ejercicio = series semanales directas por grupo grande.
    result = validate_routine(rutina(sets=series), Goal.MASA, Level.INTERMEDIO)
    assert result.ok  # solo avisa
    assert ("R3" in reglas(result, "warnings")) is avisa


def test_r3_avisa_tambien_cuando_se_pasa_de_20():
    result = validate_routine(rutina(3, sets=8), Goal.MASA, Level.INTERMEDIO)  # 24 por grupo
    assert "R3" in reglas(result, "warnings")


def test_r3_no_se_aplica_a_otros_objetivos():
    for objetivo in (Goal.FUERZA, Goal.PERDER_GRASA, Goal.MANTENERME_ACTIVO, Goal.CONDICION_GENERAL):
        assert "R3" not in reglas(validate_routine(rutina(sets=1), objetivo, Level.INTERMEDIO), "warnings")


def test_r3_solo_mira_los_6_grupos_grandes():
    # Bíceps, tríceps, gemelos y core no tienen mínimo propio: un día solo con ellos no suma a R3.
    solo_chicos = DayProposal(
        title="Brazos",
        exercises=[fuerza(Muscle.BICEPS, sets=1), fuerza(Muscle.TRICEPS, sets=1)],
    )
    result = validate_routine(RoutineProposal(days=[solo_chicos, solo_chicos]), Goal.MASA, Level.INTERMEDIO)
    faltantes = [w.message for w in result.warnings if w.rule == "R3"]
    assert len(faltantes) == 6  # una por cada grupo grande
    assert not any("biceps" in m or "triceps" in m for m in faltantes)



# --- isométricos (plancha): se miden en segundos ---


def test_una_serie_lleva_una_sola_medida_de_las_tres():
    with pytest.raises(ValidationError):
        SetProposal(reps=10, duration_seconds=30)
    with pytest.raises(ValidationError):
        SetProposal(duration_minutes=5, duration_seconds=30)
    assert SetProposal(duration_seconds=30).duration_seconds == 30


def test_el_isometrico_se_mide_en_segundos_y_lleva_descanso():
    datos = dict(
        name="Plancha", kind="isometric", region="core", direction="none", primary_muscle="core",
        mechanic="isolation", equipment="bodyweight", level="principiante",
    )
    with pytest.raises(ValidationError):
        ExerciseProposal(**datos, rest_seconds=60, sets=[SetProposal(reps=10)])
    with pytest.raises(ValidationError):
        ExerciseProposal(**datos, sets=[SetProposal(duration_seconds=30)])  # sin descanso
    assert ExerciseProposal(**datos, rest_seconds=60, sets=[SetProposal(duration_seconds=30)])


def test_la_fuerza_y_el_cardio_no_aceptan_segundos():
    with pytest.raises(ValidationError):
        ExerciseProposal(
            name="Press", kind="strength", region="upper", direction="push", primary_muscle="chest",
            mechanic="compound", equipment="barbell", level="intermedio", rest_seconds=90,
            sets=[SetProposal(duration_seconds=30)],
        )
    with pytest.raises(ValidationError):
        ExerciseProposal(
            name="Cinta", kind="cardio", region="full_body", direction="none",
            primary_muscle="full_body", mechanic="compound", equipment="machine",
            level="principiante", sets=[SetProposal(duration_seconds=30)],
        )


def test_el_isometrico_suma_series_al_musculo_y_cuenta_como_dia_de_fuerza():
    solo_plancha = DayProposal(title="Core", exercises=[plancha(sets=3)])
    routine = RoutineProposal(days=[solo_plancha])
    assert weekly_sets_by_muscle(routine)[Muscle.CORE] == 3
    from app.ai.rules import strength_days

    assert strength_days(routine) == 1


def test_r34_el_tiempo_de_un_isometrico_son_sus_segundos():
    # 3 series x 45 s = 135 s; 2 descansos de 60 s = 120 s; total 255 s = 4,25 min.
    dia = DayProposal(title="Core", exercises=[plancha(sets=3, seconds=45, rest=60)])
    assert estimate_day_minutes(dia) == pytest.approx(4.25)


def test_una_rutina_con_plancha_valida_sin_errores():
    dias = [
        DayProposal(title="Cuerpo completo", exercises=[*[fuerza(m) for m in BIG_GROUPS], plancha()])
        for _ in range(2)
    ]
    result = validate_routine(RoutineProposal(days=dias), Goal.MASA, Level.INTERMEDIO)
    assert result.ok
