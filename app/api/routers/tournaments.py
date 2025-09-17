
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.models.models import Tournament, User
from app.schemas.schemas import TournamentCreate, TournamentResponse

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

@router.post("", response_model=TournamentResponse)
def create_tournament(
    tournament: TournamentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_tournament = Tournament(**tournament.dict())
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament

@router.get("", response_model=list[TournamentResponse])
def read_tournaments(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Tournament)
    if active_only:
        query = query.filter(Tournament.is_active.is_(True))

    tournaments = query.offset(skip).limit(limit).all()
    return tournaments

@router.get("/{tournament_id}", response_model=TournamentResponse)
def read_tournament(tournament_id: int, db: Session = Depends(get_db)):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament
