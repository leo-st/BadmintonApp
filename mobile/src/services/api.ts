// API service for Badminton App
import { User, UserLogin, UserCreate, Match, MatchCreate, MatchVerification, Tournament, TournamentCreate } from '../types';

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

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request(`/users/${id}`);
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

  // Tournament endpoints
  async getTournaments(): Promise<Tournament[]> {
    return this.request('/tournaments');
  }

  async createTournament(tournamentData: TournamentCreate): Promise<Tournament> {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
