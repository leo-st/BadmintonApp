'use client';

import React, { useState, useEffect } from 'react';
import { Match } from '@/types';
import { apiService } from '@/services/api';

interface MatchesScreenProps {
  onRecordMatch?: () => void;
  onUserClick?: (userId: number) => void;
}

export default function MatchesScreen({ onRecordMatch, onUserClick }: MatchesScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const matchesData = await apiService.getMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Fetch matches error:', error);
      setError('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Matches</h2>
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
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Matches</h2>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {matches.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-lg">No matches found</p>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="text-lg font-medium text-gray-900">
                          <button
                            onClick={() => onUserClick?.(match.player1_id)}
                            className={`hover:text-indigo-600 hover:underline ${match.player1_score > match.player2_score ? 'font-bold text-green-600' : ''}`}
                          >
                            {match.player1?.full_name || `Player ${match.player1_id}`}
                          </button>
                          <span className="text-gray-500 mx-2">vs</span>
                          <button
                            onClick={() => onUserClick?.(match.player2_id)}
                            className={`hover:text-indigo-600 hover:underline ${match.player2_score > match.player1_score ? 'font-bold text-green-600' : ''}`}
                          >
                            {match.player2?.full_name || `Player ${match.player2_id}`}
                          </button>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-indigo-600 mb-2">
                        {match.player1_score} - {match.player2_score}
                      </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        match.match_type === 'tournament' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.match_type === 'tournament' ? '🏆 Tournament' : '🎾 Casual'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        match.status === 'verified' 
                          ? 'bg-green-100 text-green-800'
                          : match.status === 'pending_verification'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {match.status === 'verified' ? '✅ Verified' : 
                         match.status === 'pending_verification' ? '⏳ Pending' : '❌ Rejected'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(match.match_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {match.notes && (
                      <div className="text-xs text-gray-400 mt-1 max-w-32 truncate">
                        {match.notes}
                      </div>
                    )}
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