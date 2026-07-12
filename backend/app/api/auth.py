from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile
from app.schemas.schemas import LoginRequest, TokenResponse, ProfileResponse, ProfileUpdate
from app.core.security import create_access_token, get_current_user

router = APIRouter()

@router.post("/sync")
def sync_user(data: dict, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.email == data.get("email")).first()
    if not profile:
        profile = Profile(
            id=data.get("id"),
            email=data.get("email"),
            full_name=data.get("full_name", ""),
            role=data.get("role", "student"),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return ProfileResponse.model_validate(profile)

@router.get("/me")
def get_me(current_user: Profile = Depends(get_current_user)):
    return ProfileResponse.model_validate(current_user)

@router.post("/update-profile")
def update_profile(
    data: ProfileUpdate,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return ProfileResponse.model_validate(current_user)

@router.post("/local/login")
def local_login(data: LoginRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.email == data.email).first()
    if not profile:
        profile = Profile(
            email=data.email,
            full_name=data.email.split("@")[0].replace(".", " ").title(),
            role=data.role or "student",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    token = create_access_token({"sub": profile.id})
    return TokenResponse(access_token=token, token_type="bearer", user=ProfileResponse.model_validate(profile))
