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
  profile_picture_url?: string;
  profile_picture_updated_at?: string;
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
  status: string;
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
  refreshUser: () => Promise<void>;
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

// Posts types
export interface Post {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user?: User;
  attachments?: Attachment[];
  comments?: Comment[];
  reactions?: PostReaction[];
  reaction_counts?: { [emoji: string]: number };
  comment_count: number;
}

export interface PostCreate {
  content: string;
}

export interface PostUpdate {
  content?: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  parent_comment_id?: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user?: User;
  attachments?: Attachment[];
  reactions?: CommentReaction[];
  reaction_counts?: { [emoji: string]: number };
  replies?: Comment[];
}

export interface CommentCreate {
  content: string;
  parent_comment_id?: number;
}

export interface CommentUpdate {
  content?: string;
}

export interface Attachment {
  id: number;
  file_type: 'image' | 'video' | 'document' | 'link' | 'gif' | 'audio';
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  file_metadata?: any;
  created_at: string;
}

export interface AttachmentCreate {
  file_type: 'image' | 'video' | 'document' | 'link' | 'gif' | 'audio';
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  file_metadata?: any;
}

export interface PostReaction {
  id: number;
  user_id: number;
  emoji: string;
  created_at: string;
  user?: User;
}

export interface PostReactionCreate {
  emoji: string;
}

export interface CommentReaction {
  id: number;
  user_id: number;
  emoji: string;
  created_at: string;
  user?: User;
}

export interface CommentReactionCreate {
  emoji: string;
}
