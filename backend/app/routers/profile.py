from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.legal import LEGAL_VERSION
from app.measurements import record
from app.models import Profile, User
from app.schemas import ConsentIn, ProfileIn, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


def to_out(user: User, profile: Profile) -> ProfileOut:
    return ProfileOut(
        name=user.name,
        age=profile.current_age,
        birth_date=profile.birth_date,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        sex=profile.sex,
        limitations=profile.limitations,
        legal_notice_accepted=profile.legal_notice_version == LEGAL_VERSION,
        legal_notice_accepted_at=profile.legal_notice_accepted_at,
        legal_notice_version=profile.legal_notice_version,
        health_consent=profile.health_consent_at is not None,
        health_consent_at=profile.health_consent_at,
    )


def accept_legal(profile: Profile, now: datetime) -> None:
    """Aceptar el aviso vigente: la fecha cambia solo si cambia la versión."""
    if profile.legal_notice_version != LEGAL_VERSION or profile.legal_notice_accepted_at is None:
        profile.legal_notice_accepted_at = now
        profile.legal_notice_version = LEGAL_VERSION


def give_health_consent(profile: Profile, now: datetime) -> None:
    if profile.health_consent_at is None or profile.health_consent_version != LEGAL_VERSION:
        profile.health_consent_at = now
        profile.health_consent_version = LEGAL_VERSION


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
    if user.profile is None and not data.accept_health_consent:
        raise HTTPException(
            status_code=422,
            detail="Para crear el perfil hace falta tu consentimiento para los datos de salud",
        )
    fields = data.model_dump(exclude={"name", "accept_legal_notice", "accept_health_consent"})
    if fields["birth_date"] is None:
        # Un guardado sin fecha (perfil viejo) no borra la fecha que ya hubiera.
        del fields["birth_date"]
    weight_changed = user.profile is None or user.profile.weight_kg != fields["weight_kg"]
    if user.profile is None:
        user.profile = Profile(**fields)
    else:
        for key, value in fields.items():
            setattr(user.profile, key, value)
    if weight_changed:
        # Un peso nuevo es una medición nueva de hoy (decisión 87); el perfil sigue en la última.
        db.add(user)
        db.flush()
        record(db, user, user.profile.weight_kg)
    now = datetime.now(timezone.utc)
    accept_legal(user.profile, now)
    if data.accept_health_consent:
        give_health_consent(user.profile, now)
    user.name = data.name
    db.add(user)
    db.commit()
    return to_out(user, user.profile)


@router.post("/consent", response_model=ProfileOut)
def post_consent(
    data: ConsentIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    """Aceptar el aviso vigente (pantalla para aceptar) y, si se marca, el consentimiento de salud."""
    if user.profile is None:
        raise HTTPException(status_code=404, detail="Todavía no cargaste tu perfil")
    now = datetime.now(timezone.utc)
    accept_legal(user.profile, now)
    if data.accept_health_consent:
        give_health_consent(user.profile, now)
    db.add(user.profile)
    db.commit()
    return to_out(user, user.profile)


@router.delete("/consent/health", response_model=ProfileOut)
def withdraw_health_consent(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    """Retirar el consentimiento de salud: se apaga "Generar rutina"; los datos quedan guardados."""
    if user.profile is None:
        raise HTTPException(status_code=404, detail="Todavía no cargaste tu perfil")
    user.profile.health_consent_at = None
    user.profile.health_consent_version = None
    db.add(user.profile)
    db.commit()
    return to_out(user, user.profile)
