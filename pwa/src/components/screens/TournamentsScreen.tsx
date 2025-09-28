'use client';

import React, { useState, useEffect } from 'react';
import { Tournament } from '@/types';
import { apiService } from '@/services/api';
import TournamentLeaderboardScreen from './TournamentLeaderboardScreen';

interface TournamentsScreenProps {
  onTournamentClick?: (tournamentId: number) => void;
}

export default function TournamentsScreen({ onTournamentClick }: TournamentsScreenProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const data = await apiService.getPublicTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Fetch tournaments error:', error);
      setError('Failed to fetch tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTournamentClick = (tournamentId: number) => {
    if (onTournamentClick) {
      onTournamentClick(tournamentId);
    } else {
      setSelectedTournamentId(tournamentId);
    }
  };

  const handleBackToList = () => {
    setSelectedTournamentId(null);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTournamentStatus = (tournament: Tournament) => {
    // Use the actual status field from the database instead of date-based logic
    switch (tournament.status) {
      case 'draft':
        return { status: 'draft', color: 'gray', icon: '📝' };
      case 'inviting':
        return { status: 'upcoming', color: 'blue', icon: '📅' }; // Show as "Upcoming" for inviting status
      case 'active':
        return { status: 'active', color: 'green', icon: '🏆' };
      case 'completed':
        return { status: 'completed', color: 'gray', icon: '🏁' };
      default:
        // Fallback to is_active field
        if (!tournament.is_active) {
          return { status: 'completed', color: 'gray', icon: '🏁' };
        } else {
          return { status: 'upcoming', color: 'blue', icon: '📅' };
        }
    }
  };

  // Calculate statistics based on actual status field
  const activeCount = tournaments.filter(t => t.status === 'active').length;
  const upcomingCount = tournaments.filter(t => t.status === 'inviting').length;
  const completedCount = tournaments.filter(t => t.status === 'completed').length;

  // Show leaderboard if tournament is selected
  if (selectedTournamentId) {
    return (
      <TournamentLeaderboardScreen
        tournamentId={selectedTournamentId}
        onBack={handleBackToList}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournaments</h2>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading tournaments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournaments</h2>
        <p className="text-gray-600 mb-6">
          View all tournaments and track tournament progress.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Tournaments */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center mb-2">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-green-800">Active Tournaments</h3>
            </div>
            <p className="text-green-700 text-sm">Tournaments currently in progress</p>
            <div className="mt-2 text-2xl font-bold text-green-600">{activeCount}</div>
          </div>

          {/* Upcoming Tournaments */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center mb-2">
              <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-blue-800">Upcoming</h3>
            </div>
            <p className="text-blue-700 text-sm">Tournaments starting soon</p>
            <div className="mt-2 text-2xl font-bold text-blue-600">{upcomingCount}</div>
          </div>

          {/* Completed Tournaments */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-2">
              <div className="h-3 w-3 bg-gray-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
            </div>
            <p className="text-gray-700 text-sm">Finished tournaments</p>
            <div className="mt-2 text-2xl font-bold text-gray-600">{completedCount}</div>
          </div>
        </div>


        {/* Tournament List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tournaments</h3>
          {tournaments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No tournaments found</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for new tournaments!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => {
                const statusInfo = getTournamentStatus(tournament);
                return (
                  <div 
                    key={tournament.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTournamentClick(tournament.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {statusInfo.icon}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{tournament.name}</h4>
                          {tournament.description && (
                            <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>📅 Starts: {formatDate(tournament.start_date)}</span>
                            {tournament.end_date && (
                              <span>🏁 Ends: {formatDate(tournament.end_date)}</span>
                            )}
                            {tournament.participant_count && (
                              <span>👥 {tournament.participant_count} participants</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                          statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusInfo.status === 'active' ? '🏆 Active' :
                           statusInfo.status === 'upcoming' ? '📅 Upcoming' :
                           '🏁 Completed'}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          Tournament #{tournament.id}
                        </div>
                        <div className="text-xs text-indigo-500 mt-1">
                          Click to view leaderboard →
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
