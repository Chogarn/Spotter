"""La semana anterior que ve la IA: señales por ejercicio calculadas por el código."""

from datetime import date

import pytest
from sqlalchemy import select

from app.ai.history import build_previous_week, weight_jump_warnings
from app.ai.routine import RoutineProposal
from app.enums import PlanStatus
from app.models import Routine, SetEntry, WeekPlan, WorkoutSession
from tests.test_weeks import api, crear_semana  # noqa: F401


@pytest.fixture
def semana(api):
    return crear_semana(api, date(2026, 9, 1))  # cerrada


def registrar(api, week_id, dia, ejercicio, reales):
    """Carga lo realizado de un ejercicio: reales = [(reps, kg), ...] en el orden de las series."""
    with api.session() as db:
        week = db.get(WeekPlan, week_id)
        day = next(d for d in week.days if d.day_index == dia)
        session = db.scalar(select(WorkoutSession).where(WorkoutSession.plan_day_id == day.id))
        if session is None:
            session = WorkoutSession(user_id=week.user_id, plan_day_id=day.id)
            db.add(session)
            db.flush()
        plan_ex = next(e for e in day.exercises if e.exercise.name == ejercicio)
        for plan_set, (reps, kg) in zip(plan_ex.sets, reales):
            db.add(SetEntry(
                session_id=session.id, plan_exercise_id=plan_ex.id, plan_set_id=plan_set.id,
                exercise_id=plan_ex.exercise_id, set_number=plan_set.set_number,
                reps=reps, weight_kg=kg,
            ))
        db.commit()


def anterior(api, week_id):
    with api.session() as db:
        routine_id = db.get(WeekPlan, week_id).routine_id
        return build_previous_week(db, routine_id)


def test_sin_semana_cerrada_no_hay_semana_anterior(api):
    crear_semana(api, date(2026, 9, 1), status=PlanStatus.ACTIVE)
    with api.session() as db:
        assert build_previous_week(db, db.scalar(select(Routine.id))) is None


def test_superar_las_repeticiones_es_superó_y_parte_del_peso_real(api, semana):
    # plan del press: 10, 9, 8, 7 reps con 50, 55, 60, 65 kg
    registrar(api, semana, 1, "Press de banca", [(12, 52.5), (11, 57.5), (10, 62.5), (9, 67.5)])

    previa = anterior(api, semana)

    assert previa.has_data
    assert "Press de banca [fuerza] — señal: superó" in previa.text
    assert "plan 10 reps · 50 kg → real 12 reps · 52.5 kg" in previa.text
    assert previa.last_weights["press de banca"] == 67.5


def test_quedar_corto_es_no_llegó(api, semana):
    registrar(api, semana, 1, "Press de banca", [(8, 50), (7, 55), (6, 60), (5, 65)])

    assert "señal: no llegó" in anterior(api, semana).text


def test_hacerlo_como_estaba_es_cumplió(api, semana):
    registrar(api, semana, 1, "Press de banca", [(10, 50), (9, 55), (8, 60), (7, 65)])

    assert "señal: cumplió" in anterior(api, semana).text


def test_un_dato_aislado_no_cambia_la_señal(api, semana):
    # una sola serie por encima de cuatro: no es "superó"
    registrar(api, semana, 1, "Press de banca", [(10, 50), (9, 55), (8, 60), (9, 65)])

    assert "señal: cumplió" in anterior(api, semana).text


def test_un_dia_o_ejercicio_sin_registrar_es_informacion(api, semana):
    registrar(api, semana, 1, "Press de banca", [(10, 50)])

    texto = anterior(api, semana).text

    assert "Día 2 · Pierna A — no hecho (nada registrado)" in texto
    assert "Sentadilla [fuerza] — señal: sin registrar" in texto
    assert "→ sin registrar" in texto


def test_sin_nada_registrado_pide_repetir_la_semana(api, semana):
    previa = anterior(api, semana)

    assert not previa.has_data
    assert "proponé repetir la misma semana" in previa.text


def test_el_esfuerzo_viaja_si_esta_cargado(api, semana):
    registrar(api, semana, 1, "Press de banca", [(10, 50)])
    with api.session() as db:
        entry = db.scalars(select(SetEntry)).first()
        entry.effort = 9
        db.commit()

    assert "esfuerzo 9/10" in anterior(api, semana).text


def test_avisa_una_subida_de_mas_de_10_por_ciento(api, semana):
    registrar(api, semana, 1, "Press de banca", [(10, 50), (9, 55), (8, 60), (7, 65)])
    previa = anterior(api, semana)

    def propuesta(kg):
        return RoutineProposal.model_validate({
            "days": [{
                "title": "Torso", "exercises": [{
                    "name": "Press de banca", "kind": "strength", "region": "upper",
                    "direction": "push", "primary_muscle": "chest", "secondary_muscles": [],
                    "mechanic": "compound", "equipment": "barbell", "level": "intermedio",
                    "rest_seconds": 120, "sets": [{"reps": 8, "target_weight_kg": kg}],
                }],
            }],
        })

    avisos = weight_jump_warnings(propuesta(80), previa)  # 65 -> 80 kg: más de 10 %

    assert len(avisos) == 1
    assert avisos[0][0] == "R9"
    assert "Press de banca" in avisos[0][1]
    assert weight_jump_warnings(propuesta(70), previa) == []  # 65 -> 70 kg: dentro de 10 %
