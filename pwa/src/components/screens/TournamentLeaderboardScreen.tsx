'use client';

import React, { useState, useEffect } from 'react';
import { TournamentLeaderboard } from '@/types';
import { apiService } from '@/services/api';

interface TournamentLeaderboardScreenProps {
  tournamentId: number;
  onBack: () => void;
  onUserClick?: (userId: number) => void;
}

export default function TournamentLeaderboardScreen({ tournamentId, onBack, onUserClick }: TournamentLeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [tournamentId]);

  const fetchLeaderboard = async () => {
    try {
      const data = await apiService.getTournamentLeaderboard(tournamentId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Fetch tournament leaderboard error:', error);
      setError('Failed to fetch tournament leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading leaderboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Tournament Leaderboard</h2>
          </div>
          
          {leaderboard?.tournament && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {leaderboard.tournament.name}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>🏆 {leaderboard.tournament.total_matches} matches played</span>
                <span>👥 {leaderboard.leaderboard.length} players</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  leaderboard.tournament.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {leaderboard.tournament.is_active ? 'Active' : 'Completed'}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="p-6">
          {!leaderboard?.leaderboard || leaderboard.leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No leaderboard data found</p>
              <p className="text-gray-400 text-sm mt-2">Leaderboard will appear here once matches are played.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sets (W-L)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points (W-L)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delta
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.leaderboard.map((player, index) => (
                    <tr key={player.player_id} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl">{getRankIcon(index)}</span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onUserClick?.(player.player_id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {player.player_name}
                        </button>
                        <div className="text-sm text-gray-500">
                          Player ID: {player.player_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {player.sets_won}-{player.sets_lost}
                        </div>
                        <div className={`text-xs font-medium ${
                          player.sets_delta > 0 ? 'text-green-600' : 
                          player.sets_delta < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {player.sets_delta > 0 ? '+' : ''}{player.sets_delta}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {player.points_won}-{player.points_lost}
                        </div>
                        <div className={`text-xs font-medium ${
                          player.points_delta > 0 ? 'text-green-600' : 
                          player.points_delta < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {player.points_delta > 0 ? '+' : ''}{player.points_delta}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`text-sm font-bold ${
                          player.sets_delta > 0 ? 'text-green-600' : 
                          player.sets_delta < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {player.sets_delta > 0 ? '+' : ''}{player.sets_delta}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
