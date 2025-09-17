from enum import Enum


class MatchType(Enum):
    CASUAL = "casual"
    TOURNAMENT = "tournament"

class MatchStatus(Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"
