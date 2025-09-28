export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  is_active: boolean;
  role_id?: number;
  created_at?: string;
  permissions?: string[];
}

export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  match_date: string;
  tournament_id?: number;
  match_type: 'casual' | 'tournament';
  status: 'pending_verification' | 'verified' | 'rejected';
  submitted_by_id: number;
  verified_by_id?: number;
  notes?: string;
  created_at: string;
  verified_at?: string;
  player1_verified: boolean;
  player2_verified: boolean;
  player1_verified_by_id?: number;
  player2_verified_by_id?: number;
  // Populated fields
  player1?: User;
  player2?: User;
  submitted_by?: User;
  verified_by?: User;
  player1_name?: string;
  player2_name?: string;
  winner_name?: string;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
  total_matches?: number;
  participant_count?: number;
  invitation_count?: number;
  // Populated fields
  created_by?: User;
}

export interface TournamentLeaderboard {
  tournament: {
    id: number;
    name: string;
    is_active: boolean;
    total_matches: number;
  };
  leaderboard: Array<{
    player_id: number;
    player_name: string;
    sets_won: number;
    sets_lost: number;
    sets_delta: number;
    points_won: number;
    points_lost: number;
    points_delta: number;
  }>;
}

export interface MatchCreate {
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  match_type: 'casual' | 'tournament';
  tournament_id?: number;
  notes?: string;
}

export interface Post {
  id: number;
  content: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
  attachments: Attachment[];
  reactions: PostReaction[];
  reaction_counts: Record<string, number>;
  comment_count: number;
  // Populated fields
  author?: User;
  author_name?: string;
  comments_count?: number;
  reactions_count?: number;
}

export interface Attachment {
  id: number;
  post_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface PostReaction {
  id: number;
  post_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  parent_comment_id?: number;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
  attachments: Attachment[];
  reactions: PostReaction[];
  reaction_counts: Record<string, number>;
  replies: Comment[];
  // Populated fields
  user?: User;
}

export interface PostCreate {
  content: string;
}

export interface CommentCreate {
  content: string;
  parent_comment_id?: number;
}

export interface ReactionCreate {
  emoji: string;
}

export interface TournamentInvitation {
  id: number;
  tournament_id: number;
  user_id: number;
  inviter_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invited_at: string;
  expires_at?: string;
  responded_at?: string;
  // Populated fields
  tournament?: Tournament;
  inviter?: User;
  user?: User;
}

export interface MatchVerification {
  verified: boolean;
}

export interface UserStatistics {
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  matches_by_type: {
    casual: number;
    tournament: number;
  };
}

export interface UserUpdate {
  username?: string;
  email?: string;
  full_name?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

// Reports types
export interface Report {
  id: number;
  created_by_id: number;
  event_date: string;
  content: string;
  created_at: string;
  updated_at: string;
  has_seen?: boolean;
  created_by?: User;
  reactions?: ReportReaction[];
  reaction_counts?: { [emoji: string]: number };
}

export interface ReportCreate {
  event_date: string;
  content: string;
}

export interface ReportUpdate {
  event_date?: string;
  content?: string;
}

export interface ReportReaction {
  id: number;
  user_id: number;
  emoji: string;
  created_at: string;
  user?: User;
}

export interface ReportReactionCreate {
  emoji: string;
}

// Admin types
export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role_id?: number;
}

export interface TournamentCreate {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface TournamentUpdate {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

// Tournament Invitation types
export interface TournamentInvitationCreate {
  user_id: number;
}

export interface TournamentInvitationUpdate {
  status: 'accepted' | 'declined';
}

// Tournament Statistics types
export interface TournamentStats {
  tournament: {
    id: number;
    name: string;
    total_matches: number;
    is_active: boolean;
  };
  standings: Array<{
    player_id: number;
    player_name: string;
    matches_played: number;
    matches_won: number;
    matches_lost: number;
    points_won: number;
    points_lost: number;
    win_percentage: number;
  }>;
}
