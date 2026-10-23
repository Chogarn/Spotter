from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.measurements import bmi, record, sync_profile_weight
from app.models import BodyMeasurement, User, WeekPlan
from app.routers.weeks import routine_weeks
from app.schemas import MeasurementIn, MeasurementOut

router = APIRouter(prefix="/measurements", tags=["measurements"])


def to_out(db: Session, user: User, row: BodyMeasurement) -> MeasurementOut:
    number = None
    if row.week_plan_id is not None:
        week = db.get(WeekPlan, row.week_plan_id)
        if week is not None:
            number = next(
                (i + 1 for i, w in enumerate(routine_weeks(db, week.routine_id)) if w.id == week.id), None
            )
    height = user.profile.height_cm if user.profile is not None else None
    return MeasurementOut(
        id=row.id,
        measured_on=row.measured_on,
        weight_kg=row.weight_kg,
        body_fat_pct=row.body_fat_pct,
        bmi=bmi(row.weight_kg, height),
        week_number=number,
    )


def own(db: Session, user: User, measurement_id: int) -> BodyMeasurement:
    row = db.get(BodyMeasurement, measurement_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="No existe esa medición")
    return row


def check_day(day: date | None) -> None:
    if day is not None and day > date.today():
        raise HTTPException(status_code=422, detail="La fecha no puede ser futura")


@router.get("", response_model=list[MeasurementOut])
def list_measurements(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[MeasurementOut]:
    """Las mediciones del usuario, de la más nueva a la más vieja."""
    rows = db.scalars(
        select(BodyMeasurement)
        .where(BodyMeasurement.user_id == user.id)
        .order_by(BodyMeasurement.measured_on.desc())
    )
    return [to_out(db, user, r) for r in rows]


@router.post("", response_model=MeasurementOut, status_code=201)
def create_measurement(
    data: MeasurementIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MeasurementOut:
    """Carga el peso de un día (si ya había uno ese día, lo reemplaza)."""
    check_day(data.measured_on)
    row = record(db, user, data.weight_kg, data.body_fat_pct, data.measured_on)
    db.commit()
    return to_out(db, user, row)


@router.put("/{measurement_id}", response_model=MeasurementOut)
def update_measurement(
    measurement_id: int,
    data: MeasurementIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeasurementOut:
    """Corrige una medición. Se puede cambiar la fecha si no choca con otra medición."""
    row = own(db, user, measurement_id)
    check_day(data.measured_on)
    day = data.measured_on or row.measured_on
    clash = db.scalar(
        select(BodyMeasurement).where(
            BodyMeasurement.user_id == user.id,
            BodyMeasurement.measured_on == day,
            BodyMeasurement.id != row.id,
        )
    )
    if clash is not None:
        raise HTTPException(status_code=409, detail="Ya cargaste una medición en esa fecha")
    row.measured_on = day
    row.weight_kg = data.weight_kg
    row.body_fat_pct = data.body_fat_pct
    db.flush()
    sync_profile_weight(db, user)
    db.commit()
    return to_out(db, user, row)


@router.delete("/{measurement_id}", status_code=204)
def delete_measurement(
    measurement_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    """Borra una medición. El peso del perfil pasa a ser el de la más nueva que quede."""
    row = own(db, user, measurement_id)
    db.delete(row)
    db.flush()
    sync_profile_weight(db, user)
    db.commit()
    return Response(status_code=204)
