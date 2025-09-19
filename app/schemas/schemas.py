from datetime import datetime, date
from typing import Optional, List, Dict

from pydantic import BaseModel, EmailStr

from app.common.enums import MatchStatus, MatchType, TournamentStatus, InvitationStatus


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None

class UserMedalCounts(BaseModel):
    gold: int = 0
    silver: int = 0
    bronze: int = 0
    wood: int = 0

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    role_id: Optional[int] = None
    permissions: Optional[List[str]] = None
    medals: Optional[UserMedalCounts] = None

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
    player1_verified: bool
    player2_verified: bool
    player1_verified_by_id: Optional[int]
    player2_verified_by_id: Optional[int]
    # Player relationship fields
    player1: Optional[UserResponse] = None
    player2: Optional[UserResponse] = None
    submitted_by: Optional[UserResponse] = None

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
    status: str
    created_at: datetime
    participant_count: Optional[int] = None
    invitation_count: Optional[int] = None

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Permission system schemas
class RoleBase(BaseModel):
    role_name: str
    locked: bool = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    locked: Optional[bool] = None

class RoleResponse(RoleBase):
    role_id: int

    class Config:
        from_attributes = True

class PermissionGroupBase(BaseModel):
    permission_group_name: str

class PermissionGroupCreate(PermissionGroupBase):
    pass

class PermissionGroupResponse(PermissionGroupBase):
    permission_group_id: int

    class Config:
        from_attributes = True

class PermissionBase(BaseModel):
    permission_key: str
    permission_group_id: Optional[int] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    permission_id: int

    class Config:
        from_attributes = True

class UserPermissionResponse(BaseModel):
    user_id: int
    username: str
    role_id: Optional[int]
    role_name: Optional[str]
    permissions: List[str]

    class Config:
        from_attributes = True

# Medal schemas
class MedalBase(BaseModel):
    user_id: int
    tournament_id: int
    position: int
    medal_type: str

class MedalCreate(MedalBase):
    pass

class MedalResponse(MedalBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Tournament invitation schemas
class TournamentParticipantBase(BaseModel):
    tournament_id: int
    user_id: int

class TournamentParticipantCreate(TournamentParticipantBase):
    pass

class TournamentParticipantResponse(TournamentParticipantBase):
    id: int
    joined_at: datetime
    is_active: bool
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class TournamentInvitationBase(BaseModel):
    tournament_id: int
    user_id: int

class TournamentInvitationCreate(TournamentInvitationBase):
    pass

class TournamentInvitationResponse(TournamentInvitationBase):
    id: int
    invited_by: int
    status: str
    invited_at: datetime
    responded_at: Optional[datetime] = None
    expires_at: datetime
    user: Optional[UserResponse] = None
    inviter: Optional[UserResponse] = None
    tournament: Optional[TournamentResponse] = None

    class Config:
        from_attributes = True

class TournamentInvitationUpdate(BaseModel):
    status: str


# Report schemas
class ReportBase(BaseModel):
    event_date: date
    content: str

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    event_date: Optional[date] = None
    content: Optional[str] = None

class ReportReactionBase(BaseModel):
    emoji: str

class ReportReactionCreate(ReportReactionBase):
    pass

class ReportReactionResponse(ReportReactionBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ReportResponse(ReportBase):
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserResponse] = None
    reactions: List[ReportReactionResponse] = []
    reaction_counts: Dict[str, int] = {}  # Count of each emoji type

    class Config:
        from_attributes = True
