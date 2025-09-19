// API service for Badminton App
import { User, UserLogin, UserCreate, Match, MatchCreate, MatchVerification, Tournament, TournamentCreate, TournamentStats, TournamentLeaderboard } from '../types';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookie-based auth
      ...options,
    };

    // Debug logging
    console.log('API Request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body,
    });

    try {
      const response = await fetch(url, config);
      
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: UserLogin): Promise<{ message: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async register(userData: UserCreate): Promise<User> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    return this.request('/users/me');
  }

  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: UserCreate): Promise<User> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Match endpoints
  async getMatches(): Promise<Match[]> {
    return this.request('/matches');
  }

  async createMatch(matchData: MatchCreate): Promise<Match> {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async verifyMatch(id: number, verification: MatchVerification): Promise<Match> {
    return this.request(`/matches/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(verification),
    });
  }

  async getPendingVerifications(): Promise<Match[]> {
    return this.request('/verification/pending-verification');
  }

  async getVerificationStatus(matchId: number): Promise<any> {
    return this.request(`/matches/${matchId}/verification-status`);
  }

  // Tournament endpoints
  async getTournaments(activeOnly: boolean = true): Promise<Tournament[]> {
    if (activeOnly) {
      return this.request(`/tournaments?active_only=${activeOnly}`);
    } else {
      return this.request('/tournaments/public');
    }
  }

  async createTournament(tournament: TournamentCreate): Promise<Tournament> {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournament),
    });
  }

  async updateTournament(tournamentId: number, tournament: TournamentCreate): Promise<Tournament> {
    return this.request(`/tournaments/${tournamentId}`, {
      method: 'PUT',
      body: JSON.stringify(tournament),
    });
  }

  async deleteTournament(tournamentId: number): Promise<{message: string}> {
    return this.request(`/tournaments/${tournamentId}`, {
      method: 'DELETE',
    });
  }

  async deactivateTournament(tournamentId: number): Promise<{message: string}> {
    return this.request(`/tournaments/${tournamentId}/deactivate`, {
      method: 'POST',
    });
  }

  async getTournamentStats(tournamentId: number): Promise<TournamentStats> {
    return this.request(`/tournaments/${tournamentId}/stats`);
  }

  async getPublicTournaments(): Promise<Tournament[]> {
    return this.request('/tournaments/public');
  }

  async getTournamentLeaderboard(tournamentId: number): Promise<TournamentLeaderboard> {
    return this.request(`/tournaments/${tournamentId}/leaderboard`);
  }

  // Tournament invitation methods
  async inviteUserToTournament(tournamentId: number, userId: number): Promise<TournamentInvitation> {
    return this.request(`/tournament-invitations/tournament/${tournamentId}/invite/${userId}`, {
      method: 'POST',
    });
  }

  async respondToInvitation(invitationId: number, status: string): Promise<TournamentInvitation> {
    return this.request(`/tournament-invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async getTournamentInvitations(tournamentId: number): Promise<TournamentInvitation[]> {
    return this.request(`/tournament-invitations/tournament/${tournamentId}`);
  }

  async getMyInvitations(): Promise<TournamentInvitation[]> {
    return this.request('/tournament-invitations/my-invitations');
  }

  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    return this.request(`/tournament-invitations/tournament/${tournamentId}/participants`);
  }

  async startTournament(tournamentId: number): Promise<{ message: string; tournament_id: number }> {
    return this.request(`/tournament-invitations/tournament/${tournamentId}/start`, {
      method: 'POST',
    });
  }

  async completeTournament(tournamentId: number): Promise<{ message: string; tournament_id: number }> {
    return this.request(`/tournament-invitations/tournament/${tournamentId}/complete`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
