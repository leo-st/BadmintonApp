'use client';

import React, { useState, useEffect } from 'react';
import { Match, User, Tournament } from '@/types';
import { apiService } from '@/services/api';

interface MatchesScreenProps {
  onRecordMatch?: () => void;
  onUserClick?: (userId: number) => void;
}

interface MatchFilters {
  match_type?: string;
  status?: string;
  player_ids?: number[];
  tournament_id?: number;
}

export default function MatchesScreen({ onRecordMatch, onUserClick }: MatchesScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MatchFilters>({});

  useEffect(() => {
    fetchMatches();
    fetchUsers();
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [filters]);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const matchesData = await apiService.getMatches(filters);
      setMatches(matchesData);
    } catch (error) {
      console.error('Fetch matches error:', error);
      setError('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchTournaments = async () => {
    try {
      const tournamentsData = await apiService.getTournaments(false);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Fetch tournaments error:', error);
    }
  };

  const handleFilterChange = (key: keyof MatchFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handlePlayerToggle = (playerId: number) => {
    setFilters(prev => {
      const currentPlayerIds = prev.player_ids || [];
      const newPlayerIds = currentPlayerIds.includes(playerId)
        ? currentPlayerIds.filter(id => id !== playerId)
        : [...currentPlayerIds, playerId];
      
      return {
        ...prev,
        player_ids: newPlayerIds.length > 0 ? newPlayerIds : undefined
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading matches...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="bg-white rounded-lg shadow">
        {/* Header with Filter Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Matches</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Match Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.match_type || ''}
                  onChange={(e) => handleFilterChange('match_type', e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="casual">🏸 Casual</option>
                  <option value="tournament">🏆 Tournament</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="verified">✅ Verified</option>
                  <option value="pending_verification">⏳ Pending</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>

              {/* Player Filter */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Players ({filters.player_ids?.length || 0} selected)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded bg-white">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.player_ids?.includes(user.id) || false}
                        onChange={() => handlePlayerToggle(user.id)}
                        className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-xs text-gray-700 truncate">
                        {user.full_name || user.username}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tournament Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tournament</label>
                <select
                  value={filters.tournament_id || ''}
                  onChange={(e) => handleFilterChange('tournament_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All Tournaments</option>
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Compact Matches List */}
        <div className="divide-y divide-gray-100">
          {matches.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm">No matches found</p>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* Players and Score */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-sm">
                      <button
                        onClick={() => onUserClick?.(match.player1_id)}
                        className={`hover:text-indigo-600 hover:underline truncate ${
                          match.player1_score > match.player2_score ? 'font-semibold text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {match.player1?.full_name || `Player ${match.player1_id}`}
                      </button>
                      <span className="text-gray-400">vs</span>
                      <button
                        onClick={() => onUserClick?.(match.player2_id)}
                        className={`hover:text-indigo-600 hover:underline truncate ${
                          match.player2_score > match.player1_score ? 'font-semibold text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {match.player2?.full_name || `Player ${match.player2_id}`}
                      </button>
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-1">
                      {match.player1_score} - {match.player2_score}
                    </div>
                  </div>

                  {/* Status Badges and Date */}
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        match.match_type === 'tournament' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {match.match_type === 'tournament' ? '🏆' : '🏸'}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        match.status === 'verified' 
                          ? 'bg-green-100 text-green-700'
                          : match.status === 'pending_verification'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {match.status === 'verified' ? '✅' : 
                         match.status === 'pending_verification' ? '⏳' : '❌'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(match.match_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {onRecordMatch && (
        <button
          onClick={onRecordMatch}
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          title="Record New Match"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}