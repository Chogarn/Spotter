"""Mediciones de cuerpo (decisión 87): peso y grasa corporal con fecha, cargados a mano."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BodyMeasurement, User


def bmi(weight_kg: Decimal | float, height_cm: int | None) -> float | None:
    """Índice de masa corporal: kg sobre metros al cuadrado, con un decimal. Es solo informativo."""
    if not height_cm:
        return None
    meters = height_cm / 100
    return round(float(weight_kg) / (meters * meters), 1)


def record(
    db: Session,
    user: User,
    weight_kg: Decimal,
    body_fat_pct: Decimal | None = None,
    measured_on: date | None = None,
    week_plan_id: int | None = None,
) -> BodyMeasurement:
    """Guarda la medición de un día (si ya había una ese día, la reemplaza) y deja el peso del
    perfil en el de la medición más nueva. No hace commit."""
    day = measured_on or date.today()
    row = db.scalar(
        select(BodyMeasurement).where(
            BodyMeasurement.user_id == user.id, BodyMeasurement.measured_on == day
        )
    )
    if row is None:
        row = BodyMeasurement(user_id=user.id, measured_on=day)
        db.add(row)
    row.weight_kg = weight_kg
    row.body_fat_pct = body_fat_pct
    if week_plan_id is not None:
        row.week_plan_id = week_plan_id
    db.flush()
    sync_profile_weight(db, user)
    return row


def sync_profile_weight(db: Session, user: User) -> None:
    """El peso del perfil es siempre el de la última medición. Sin mediciones, queda como está."""
    latest = db.scalar(
        select(BodyMeasurement)
        .where(BodyMeasurement.user_id == user.id)
        .order_by(BodyMeasurement.measured_on.desc())
    )
    if latest is not None and user.profile is not None:
        user.profile.weight_kg = latest.weight_kg
