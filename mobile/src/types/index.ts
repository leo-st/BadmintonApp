// Types for the Badminton App Mobile

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
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
  match_type: 'SINGLES' | 'DOUBLES';
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  submitted_by_id: number;
  verified_by_id?: number;
  tournament_id?: number;
  notes?: string;
  match_date: string;
  created_at: string;
  verified_at?: string;
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
  match_type: 'SINGLES' | 'DOUBLES';
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

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
