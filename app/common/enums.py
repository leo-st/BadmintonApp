from enum import Enum


class MatchType(Enum):
    CASUAL = "casual"
    TOURNAMENT = "tournament"

class MatchStatus(Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"

class TournamentStatus(Enum):
    DRAFT = "draft"
    INVITING = "inviting"
    ACTIVE = "active"
    COMPLETED = "completed"

class InvitationStatus(Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
