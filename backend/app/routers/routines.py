from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.enums import PlanStatus
from app.models import Routine, User
from app.schemas import RoutineDetailOut, RoutineRenameIn, RoutineSummaryOut, WeekSummaryOut

router = APIRouter(prefix="/routines", tags=["routines"])


def get_own_routine(db: Session, user: User, routine_id: int) -> Routine:
    routine = db.get(Routine, routine_id)
    if routine is None or routine.user_id != user.id:
        raise HTTPException(status_code=404, detail="No existe esa rutina")
    return routine


@router.get("", response_model=list[RoutineSummaryOut])
def list_routines(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[RoutineSummaryOut]:
    """Mis rutinas: de la más nueva a la más vieja."""
    routines = db.scalars(
        select(Routine)
        .where(Routine.user_id == user.id)
        .order_by(Routine.created_at.desc(), Routine.id.desc())
    )
    return [
        RoutineSummaryOut(
            id=r.id,
            name=r.name,
            goal=r.goal,
            level=r.level,
            week_count=len(r.weeks),
            has_active_week=any(w.status == PlanStatus.ACTIVE for w in r.weeks),
        )
        for r in routines
    ]


@router.get("/{routine_id}", response_model=RoutineDetailOut)
def get_routine(
    routine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> RoutineDetailOut:
    """Una rutina con su lista de semanas, de la más nueva a la más vieja."""
    routine = get_own_routine(db, user, routine_id)
    weeks = [
        WeekSummaryOut(
            id=week.id,
            number=number,
            status=week.status.value,
            week_start=week.week_start,
            closed_at=week.closed_at,
            day_count=len(week.days),
        )
        for number, week in enumerate(routine.weeks, start=1)
    ]
    return RoutineDetailOut(
        id=routine.id,
        name=routine.name,
        goal=routine.goal,
        level=routine.level,
        weeks=weeks[::-1],
    )


@router.patch("/{routine_id}", response_model=RoutineSummaryOut)
def rename_routine(
    routine_id: int,
    data: RoutineRenameIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoutineSummaryOut:
    routine = get_own_routine(db, user, routine_id)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="El nombre no puede estar vacío")
    routine.name = name
    db.commit()
    return RoutineSummaryOut(
        id=routine.id,
        name=routine.name,
        goal=routine.goal,
        level=routine.level,
        week_count=len(routine.weeks),
        has_active_week=any(w.status == PlanStatus.ACTIVE for w in routine.weeks),
    )
