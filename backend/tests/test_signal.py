"""La señal de un ejercicio compara carga y repeticiones juntas (decisión 73)."""

from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.ai.history import signal


def plan(reps=10, kg="40"):
    return SimpleNamespace(
        reps=reps,
        duration_seconds=None,
        duration_minutes=None,
        target_weight_kg=None if kg is None else Decimal(kg),
    )


def real(reps=10, kg="40"):
    return SimpleNamespace(
        reps=reps,
        duration_seconds=None,
        duration_minutes=None,
        weight_kg=None if kg is None else Decimal(kg),
    )


@pytest.mark.parametrize(
    "plan_kg, plan_reps, real_kg, real_reps, esperado",
    [
        ("40", 10, "42.5", 8, "superó"),  # más peso con menos repeticiones: progresión
        ("40", 10, "41.25", 10, "superó"),  # cualquier aumento cuenta
        ("40", 10, "40", 12, "superó"),  # mismo peso, más repeticiones
        ("40", 10, "40", 10, "cumplió"),
        ("40", 10, "40", 8, "no llegó"),  # mismo peso, menos repeticiones
        ("40", 10, "37.5", 10, "no llegó"),  # menos peso, mismas repeticiones
        ("40", 10, "37.5", 12, "no llegó"),  # menos peso: la pista es el peso
        ("40", 10, "37.5", 8, "no llegó"),
        (None, 10, "40", 8, "no llegó"),  # sin peso planificado: solo repeticiones
        (None, 10, "40", 12, "superó"),
    ],
)
def test_la_señal_lee_peso_y_repeticiones_juntos(plan_kg, plan_reps, real_kg, real_reps, esperado):
    pairs = [(plan(plan_reps, plan_kg), real(real_reps, real_kg)) for _ in range(3)]
    assert signal(pairs) == esperado


def test_sin_registros_es_sin_registrar():
    assert signal([(plan(), None)]) == "sin registrar"


def test_una_serie_corta_entre_superadas_es_cumplió():
    pairs = [(plan(), real(10, "42.5")), (plan(), real(10, "42.5")), (plan(), real(8, "40"))]
    assert signal(pairs) == "cumplió"
