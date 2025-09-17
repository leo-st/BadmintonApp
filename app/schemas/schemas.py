from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.common.enums import MatchStatus, MatchType


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# Match schemas
class MatchBase(BaseModel):
    player1_id: int
    player2_id: int
    player1_score: int
    player2_score: int
    match_type: MatchType
    notes: Optional[str] = None
    tournament_id: Optional[int] = None

class MatchCreate(MatchBase):
    pass

class MatchResponse(MatchBase):
    id: int
    status: MatchStatus
    submitted_by_id: int
    verified_by_id: Optional[int]
    match_date: datetime
    created_at: datetime
    verified_at: Optional[datetime]

    class Config:
        from_attributes = True

class MatchVerification(BaseModel):
    verified: bool
    notes: Optional[str] = None

# Tournament schemas
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None

class TournamentCreate(TournamentBase):
    pass

class TournamentResponse(TournamentBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
