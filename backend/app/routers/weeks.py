from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.plan_writer import active_week
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import WeekOut

router = APIRouter(prefix="/weeks", tags=["weeks"])


@router.get("/active", response_model=WeekOut)
def get_active_week(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> WeekOut:
    """La semana activa del usuario, con los títulos de sus días."""
    week = active_week(db, user.id)
    if week is None:
        raise HTTPException(status_code=404, detail="No tenés una semana activa")
    return WeekOut(
        id=week.id,
        week_start=week.week_start,
        days=[{"day_index": d.day_index, "title": d.title} for d in week.days],
    )
