from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import PlanDay, User, WorkoutSession
from app.routers.weeks import routine_weeks
from app.schemas import CalendarOut, CalendarSessionOut

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _local_date(moment: datetime, tz: int) -> date:
    """El día del calendario de la persona: el instante guardado más su diferencia horaria."""
    return (moment + timedelta(minutes=tz)).date()


@router.get("", response_model=CalendarOut)
def get_calendar(
    month: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="AAAA-MM"),
    # Minutos que hay que sumar a UTC para tener la hora de la persona (Argentina: -180). Lo manda
    # el navegador: el perfil no guarda la zona horaria.
    tz: int = Query(default=0, ge=-840, le=840),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarOut:
    """Calendario de entrenamientos: los días en que la persona completó un día de su plan, de
    todas las rutinas y desde el primero. Cuenta "Día completado" (`finished_at`); un día reabierto
    no cuenta. Devuelve las sesiones del mes pedido, el primer mes con entrenamientos y el total."""
    year, month_number = int(month[:4]), int(month[5:])
    finished = db.scalars(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user.id, WorkoutSession.finished_at.is_not(None))
        .order_by(WorkoutSession.finished_at, WorkoutSession.id)
    )
    number_cache: dict[int, dict[int, int]] = {}
    all_days: set[date] = set()
    month_days: set[date] = set()
    sessions: list[CalendarSessionOut] = []
    for session in finished:
        if session.plan_day_id is None:
            continue  # el día del plan ya no existe: no se sabe qué fue
        day = db.get(PlanDay, session.plan_day_id)
        if day is None:
            continue
        local = _local_date(session.finished_at, tz)
        all_days.add(local)
        if (local.year, local.month) != (year, month_number):
            continue
        month_days.add(local)
        week = day.week_plan
        if week.routine_id not in number_cache:
            number_cache[week.routine_id] = {
                w.id: i + 1 for i, w in enumerate(routine_weeks(db, week.routine_id))
            }
        sessions.append(
            CalendarSessionOut(
                local_date=local,
                finished_at=session.finished_at,
                week_id=week.id,
                week_number=number_cache[week.routine_id][week.id],
                day_index=day.day_index,
                title=day.title,
                routine_name=week.routine.name,
            )
        )
    first = min(all_days) if all_days else None
    return CalendarOut(
        month=month,
        first_month=f"{first.year:04d}-{first.month:02d}" if first else None,
        total_days=len(all_days),
        month_days=len(month_days),
        sessions=sessions,
    )
