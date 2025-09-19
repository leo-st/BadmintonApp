// Types for the Badminton App Mobile

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  role_id?: number;
  role_name?: string;
  permissions?: string[];
  medals?: UserMedalCounts;
}

export interface UserMedalCounts {
  gold: number;
  silver: number;
  bronze: number;
  wood: number;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  match_type: 'casual' | 'tournament';
  status: 'pending_verification' | 'verified' | 'rejected';
  submitted_by_id: number;
  verified_by_id?: number;
  tournament_id?: number;
  notes?: string;
  match_date: string;
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
}

export interface MatchCreate {
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  match_type: 'casual' | 'tournament';
  notes?: string;
  tournament_id?: number;
}

export interface MatchVerification {
  verified: boolean;
  notes?: string;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface TournamentCreate {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
}

export interface TournamentStats {
  tournament: {
    id: number;
    name: string;
    is_active: boolean;
    total_matches: number;
  };
  standings: PlayerStanding[];
}

export interface PlayerStanding {
  player_id: number;
  player_name: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  points_won: number;
  points_lost: number;
  win_percentage: number;
}

export interface PlayerLeaderboard {
  player_id: number;
  player_name: string;
  sets_won: number;
  sets_lost: number;
  sets_delta: number;
  points_won: number;
  points_lost: number;
  points_delta: number;
}

export interface TournamentLeaderboard {
  tournament: {
    id: number;
    name: string;
    is_active: boolean;
    total_matches: number;
  };
  leaderboard: PlayerLeaderboard[];
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Tournament invitation types
export interface TournamentParticipant {
  id: number;
  tournament_id: number;
  user_id: number;
  joined_at: string;
  is_active: boolean;
  user?: User;
}

export interface TournamentInvitation {
  id: number;
  tournament_id: number;
  user_id: number;
  invited_by: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invited_at: string;
  responded_at?: string;
  expires_at: string;
  user?: User;
  inviter?: User;
  tournament?: Tournament;
}

export interface TournamentInvitationUpdate {
  status: 'accepted' | 'declined';
}
