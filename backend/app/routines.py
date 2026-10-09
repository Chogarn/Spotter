"""Rutinas: crearlas con su nombre automático."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import Goal, Level
from app.models import Routine

GOAL_LABEL = {
    Goal.MASA: "Masa",
    Goal.FUERZA: "Fuerza",
    Goal.PERDER_GRASA: "Perder grasa",
    Goal.CONDICION_GENERAL: "Condición general",
    Goal.MANTENERME_ACTIVO: "Mantenerme activo",
}


def auto_name(goal: Goal, start: date, taken: set[str]) -> str:
    """"Fuerza · desde el 9/10"; si ya existe uno igual, le suma el número: "... 2", "... 3"."""
    base = f"{GOAL_LABEL[goal]} · desde el {start.day}/{start.month}"
    if base not in taken:
        return base
    number = 2
    while f"{base} {number}" in taken:
        number += 1
    return f"{base} {number}"


def create_routine(db: Session, user_id: int, goal: Goal, level: Level) -> Routine:
    """Crea la rutina con nombre automático. No hace commit."""
    taken = set(db.scalars(select(Routine.name).where(Routine.user_id == user_id)))
    routine = Routine(
        user_id=user_id, goal=goal, level=level, name=auto_name(goal, date.today(), taken)
    )
    db.add(routine)
    db.flush()
    return routine
