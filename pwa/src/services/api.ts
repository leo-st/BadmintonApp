// API service for PWA Badminton App
import { User, Match, Tournament, Post, TournamentLeaderboard, MatchCreate, PostCreate, Comment, CommentCreate, ReactionCreate, TournamentInvitation, MatchVerification, UserStatistics, UserUpdate, PasswordChange, Report, ReportCreate, ReportUpdate, ReportReactionCreate, UserCreate, TournamentCreate, TournamentUpdate, TournamentInvitationCreate, TournamentInvitationUpdate, TournamentStats } from '@/types';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const defaultOptions: RequestInit = {
      credentials: 'include', // Always include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(`/api${endpoint}`, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }): Promise<{ message: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/users/me');
  }

  // Match endpoints
  async getMatches(): Promise<Match[]> {
    return this.request('/matches');
  }

  // Tournament endpoints
  async getTournaments(activeOnly: boolean = true): Promise<Tournament[]> {
    if (activeOnly) {
      return this.request(`/tournaments?active_only=${activeOnly}`);
    } else {
      return this.request('/tournaments/public');
    }
  }

  async getPublicTournaments(): Promise<Tournament[]> {
    return this.request('/tournaments/public');
  }

  async getTournamentLeaderboard(tournamentId: number): Promise<TournamentLeaderboard> {
    return this.request<TournamentLeaderboard>(`/tournaments/${tournamentId}/leaderboard`);
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createMatch(matchData: MatchCreate): Promise<Match> {
    return this.request<Match>('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  // Posts API methods
  async createPost(postData: PostCreate): Promise<Post> {
    return this.request<Post>('/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async addReactionToPost(postId: number, reactionData: ReactionCreate): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(reactionData),
    });
  }

  async getComments(postId: number): Promise<Comment[]> {
    return this.request<Comment[]>(`/posts/${postId}/comments`);
  }

  async createComment(postId: number, commentData: CommentCreate): Promise<Comment> {
    return this.request<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  // Notification API methods
  async getPendingVerifications(): Promise<Match[]> {
    return this.request<Match[]>('/verification/pending-verification');
  }

  async verifyMatch(matchId: number, verification: MatchVerification): Promise<Match> {
    return this.request<Match>(`/matches/${matchId}/verify`, {
      method: 'POST',
      body: JSON.stringify(verification),
    });
  }

  async getMyInvitations(): Promise<TournamentInvitation[]> {
    return this.request<TournamentInvitation[]>('/tournament-invitations/my-invitations');
  }

  async respondToInvitation(invitationId: number, status: 'accepted' | 'declined'): Promise<TournamentInvitation> {
    return this.request<TournamentInvitation>(`/tournament-invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Profile API methods
  async getUser(userId: number): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async updateUser(userId: number, userData: UserUpdate): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserStatistics(userId: number, filters?: { match_type?: string; player_ids?: number[] }): Promise<UserStatistics> {
    const params = new URLSearchParams();
    if (filters?.match_type && filters.match_type !== 'all') {
      params.append('match_type', filters.match_type);
    }
    if (filters?.player_ids && filters.player_ids.length > 0) {
      // Send as comma-separated string as expected by backend
      params.append('player_ids', filters.player_ids.join(','));
    }
    
    const queryString = params.toString();
    const endpoint = `/users/${userId}/statistics${queryString ? `?${queryString}` : ''}`;
    
    return this.request<UserStatistics>(endpoint);
  }

  async changePassword(passwordData: PasswordChange): Promise<{ message: string }> {
    return this.request<{ message: string }>('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // Reports API methods
  async getReports(params?: {
    skip?: number;
    limit?: number;
    search_text?: string;
    event_date_from?: string;
    event_date_to?: string;
  }): Promise<{ reports: Report[]; pagination: { skip: number; limit: number; total: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search_text) queryParams.append('search_text', params.search_text);
    if (params?.event_date_from) queryParams.append('event_date_from', params.event_date_from);
    if (params?.event_date_to) queryParams.append('event_date_to', params.event_date_to);
    
    const queryString = queryParams.toString();
    const endpoint = `/reports/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ reports: Report[]; pagination: { skip: number; limit: number; total: number } }>(endpoint);
  }

  async getReport(reportId: number): Promise<Report> {
    return this.request<Report>(`/reports/${reportId}`);
  }

  async getUnseenReportsCount(): Promise<{ unseen_count: number }> {
    return this.request<{ unseen_count: number }>('/reports/unseen-count');
  }

  async markReportSeen(reportId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/reports/${reportId}/mark-seen`, {
      method: 'POST',
    });
  }

  async addReportReaction(reportId: number, reactionData: ReportReactionCreate): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/reports/${reportId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(reactionData),
    });
  }

  async removeReportReaction(reportId: number, reactionId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/reports/${reportId}/reactions/${reactionId}`, {
      method: 'DELETE',
    });
  }

  async createReport(reportData: ReportCreate): Promise<Report> {
    return this.request<Report>('/reports/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(reportId: number, reportData: ReportUpdate): Promise<Report> {
    return this.request<Report>(`/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  }

  async deleteReport(reportId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/reports/${reportId}`, {
      method: 'DELETE',
    });
  }

  // Admin API methods
  async createUser(userData: UserCreate): Promise<User> {
    return this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUserAdmin(userId: number, userData: Partial<UserUpdate>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async createTournament(tournamentData: TournamentCreate): Promise<Tournament> {
    return this.request<Tournament>('/tournaments/', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  async updateTournament(tournamentId: number, tournamentData: TournamentUpdate): Promise<Tournament> {
    return this.request<Tournament>(`/tournaments/${tournamentId}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData),
    });
  }

  async deleteTournament(tournamentId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tournaments/${tournamentId}`, {
      method: 'DELETE',
    });
  }

  async deactivateTournament(tournamentId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tournaments/${tournamentId}/deactivate`, {
      method: 'POST',
    });
  }

  async activateTournament(tournamentId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tournaments/${tournamentId}/activate`, {
      method: 'POST',
    });
  }

  // Tournament Invitation methods
  async inviteUserToTournament(tournamentId: number, userId: number): Promise<TournamentInvitation> {
    return this.request<TournamentInvitation>(`/tournament-invitations/tournament/${tournamentId}/invite/${userId}`, {
      method: 'POST',
    });
  }

  async getTournamentInvitations(tournamentId: number): Promise<TournamentInvitation[]> {
    return this.request<TournamentInvitation[]>(`/tournament-invitations/tournament/${tournamentId}`);
  }

  async getTournamentParticipants(tournamentId: number): Promise<User[]> {
    const participants = await this.request<Array<{ user_id: number; user: { username?: string; full_name?: string; email?: string; is_active?: boolean; role_id?: number; created_at?: string; permissions?: string[] } }>>(`/tournament-invitations/tournament/${tournamentId}/participants`);
    // Extract user information from participant objects
    return participants.map(participant => ({
      id: participant.user_id,
      username: participant.user?.username || '',
      full_name: participant.user?.full_name || participant.user?.username || `User ${participant.user_id}`,
      email: participant.user?.email,
      is_active: participant.user?.is_active ?? true,
      role_id: participant.user?.role_id,
      created_at: participant.user?.created_at,
      permissions: participant.user?.permissions
    }));
  }

  async respondToTournamentInvitation(invitationId: number, status: 'accepted' | 'declined'): Promise<TournamentInvitation> {
    return this.request<TournamentInvitation>(`/tournament-invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Tournament Statistics
  async getTournamentStats(tournamentId: number): Promise<TournamentStats> {
    return this.request<TournamentStats>(`/tournaments/${tournamentId}/stats`);
  }

  // Posts endpoints
  async getPosts(params?: {
    skip?: number;
    limit?: number;
    user_id?: number;
  }): Promise<Post[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.user_id !== undefined) queryParams.append('user_id', params.user_id.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/posts/?${queryString}` : '/posts/';
    return this.request(endpoint);
  }

  async getPostsNormalized(params?: {
    skip?: number;
    limit?: number;
    user_id?: number;
  }): Promise<{posts: Post[], users: Record<string, User>}> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.user_id !== undefined) queryParams.append('user_id', params.user_id.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/posts/normalized?${queryString}` : '/posts/normalized';
    return this.request(endpoint);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
