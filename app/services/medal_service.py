from sqlalchemy.orm import Session
from typing import List, Dict
from app.models.models import User, Tournament, Match
from app.models.medals import Medal
from app.common.enums import MatchStatus
from app.schemas.schemas import UserMedalCounts

def award_medals_for_tournament(db: Session, tournament_id: int) -> Dict[str, int]:
    """Award medals to players based on tournament leaderboard"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise ValueError("Tournament not found")
    
    # Get all verified matches for this tournament
    matches = db.query(Match).filter(
        Match.tournament_id == tournament_id,
        Match.status == MatchStatus.VERIFIED
    ).all()
    
    # Calculate player statistics
    player_stats = {}
    
    for match in matches:
        # Process player1
        if match.player1_id not in player_stats:
            player_stats[match.player1_id] = {
                "player_id": match.player1_id,
                "sets_won": 0,
                "sets_lost": 0,
                "points_won": 0,
                "points_lost": 0,
            }
        
        # Process player2
        if match.player2_id not in player_stats:
            player_stats[match.player2_id] = {
                "player_id": match.player2_id,
                "sets_won": 0,
                "sets_lost": 0,
                "points_won": 0,
                "points_lost": 0,
            }
        
        # Update player1 stats
        player1_stats = player_stats[match.player1_id]
        player1_stats["points_won"] += match.player1_score
        player1_stats["points_lost"] += match.player2_score
        if match.player1_score > match.player2_score:
            player1_stats["sets_won"] += 1
        else:
            player1_stats["sets_lost"] += 1
        
        # Update player2 stats
        player2_stats = player_stats[match.player2_id]
        player2_stats["points_won"] += match.player2_score
        player2_stats["points_lost"] += match.player1_score
        if match.player2_score > match.player1_score:
            player2_stats["sets_won"] += 1
        else:
            player2_stats["sets_lost"] += 1
    
    # Calculate deltas
    for player_id, stats in player_stats.items():
        stats["sets_delta"] = stats["sets_won"] - stats["sets_lost"]
        stats["points_delta"] = stats["points_won"] - stats["points_lost"]
    
    # Sort by sets won, then by sets delta, then by points delta
    sorted_players = sorted(
        player_stats.values(),
        key=lambda x: (x["sets_won"], x["sets_delta"], x["points_delta"]),
        reverse=True
    )
    
    # Award medals based on position
    medals_awarded = {"gold": 0, "silver": 0, "bronze": 0, "wood": 0}
    
    for i, player in enumerate(sorted_players):
        position = i + 1
        user_id = player["player_id"]
        
        # Determine medal type based on position
        if position == 1:
            medal_type = "gold"
        elif position == 2:
            medal_type = "silver"
        elif position == 3:
            medal_type = "bronze"
        else:
            medal_type = "wood"
        
        # Check if medal already exists for this user and tournament
        existing_medal = db.query(Medal).filter(
            Medal.user_id == user_id,
            Medal.tournament_id == tournament_id
        ).first()
        
        if existing_medal:
            # Update existing medal
            existing_medal.position = position
            existing_medal.medal_type = medal_type
        else:
            # Create new medal
            medal = Medal(
                user_id=user_id,
                tournament_id=tournament_id,
                position=position,
                medal_type=medal_type
            )
            db.add(medal)
        
        medals_awarded[medal_type] += 1
    
    db.commit()
    return medals_awarded

def get_user_medal_counts(db: Session, user_id: int) -> UserMedalCounts:
    """Get medal counts for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return UserMedalCounts()
    
    return UserMedalCounts(**user.get_medal_counts())

def get_tournament_medals(db: Session, tournament_id: int) -> List[Dict]:
    """Get all medals awarded for a specific tournament"""
    medals = db.query(Medal).filter(Medal.tournament_id == tournament_id).all()
    
    result = []
    for medal in medals:
        result.append({
            "id": medal.id,
            "user_id": medal.user_id,
            "user_name": medal.user.full_name if medal.user else f"Player {medal.user_id}",
            "position": medal.position,
            "medal_type": medal.medal_type,
            "created_at": medal.created_at
        })
    
    return result
