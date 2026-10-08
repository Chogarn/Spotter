from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Profile, User
from app.schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


def to_out(user: User, profile: Profile) -> ProfileOut:
    return ProfileOut(
        name=user.name,
        age=profile.age,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        sex=profile.sex,
        level=profile.level,
        goal=profile.goal,
        equipment=profile.equipment,
        limitations=profile.limitations,
        legal_notice_accepted=profile.legal_notice_accepted_at is not None,
    )


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user)) -> ProfileOut:
    if user.profile is None:
        raise HTTPException(status_code=404, detail="Todavía no cargaste tu perfil")
    return to_out(user, user.profile)


@router.put("", response_model=ProfileOut)
def put_profile(
    data: ProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    """Crea el perfil la primera vez y lo actualiza las siguientes."""
    fields = data.model_dump(exclude={"name", "accept_legal_notice"})
    if user.profile is None:
        user.profile = Profile(**fields)
    else:
        for key, value in fields.items():
            setattr(user.profile, key, value)
    if user.profile.legal_notice_accepted_at is None:
        user.profile.legal_notice_accepted_at = datetime.now(timezone.utc)
    user.name = data.name
    db.add(user)
    db.commit()
    return to_out(user, user.profile)
