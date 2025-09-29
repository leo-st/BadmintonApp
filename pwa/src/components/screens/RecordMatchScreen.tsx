'use client';

import React, { useState, useEffect } from 'react';
import { User, Tournament, MatchCreate } from '@/types';
import { apiService } from '@/services/api';

interface RecordMatchScreenProps {
  onBack: () => void;
}

export default function RecordMatchScreen({ onBack }: RecordMatchScreenProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for casual matches
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);

  // Form state
  const [player1Id, setPlayer1Id] = useState<number | null>(null);
  const [player2Id, setPlayer2Id] = useState<number | null>(null);
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [matchType, setMatchType] = useState<'casual' | 'tournament'>('casual');
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadUsers();
    loadTournaments();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersData = await apiService.getUsers();
      setAllUsers(usersData); // Store all users
      setUsers(usersData); // Default to all users for casual matches
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadTournaments = async () => {
    try {
      setIsLoadingTournaments(true);
      const tournamentsData = await apiService.getPublicTournaments(); // Get all tournaments
      // Filter to only show tournaments with status "active" for match recording
      const activeTournaments = tournamentsData.filter(tournament => tournament.status === 'active');
      setTournaments(activeTournaments);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      alert('Failed to load tournaments. Please try again.');
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const loadTournamentParticipants = async (tournamentId: number) => {
    try {
      const participants = await apiService.getTournamentParticipants(tournamentId);
      setUsers(participants);
      // Reset player selections when switching to tournament participants
      setPlayer1Id(null);
      setPlayer2Id(null);
    } catch (error) {
      console.error('Failed to load tournament participants:', error);
      alert('Failed to load tournament participants. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!player1Id || !player2Id) {
      alert('Please select both players');
      return;
    }

    if (player1Id === player2Id) {
      alert('Players must be different');
      return;
    }

    if (!player1Score.trim() || !player2Score.trim()) {
      alert('Please enter scores for both players');
      return;
    }

    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      alert('Please enter valid scores (0 or higher)');
      return;
    }

    if (score1 === score2) {
      alert('Scores cannot be equal');
      return;
    }

    if (matchType === 'tournament' && !tournamentId) {
      alert('Please select a tournament for tournament matches');
      return;
    }

    try {
      setIsLoading(true);
      const matchData: MatchCreate = {
        player1_id: player1Id,
        player2_id: player2Id,
        player1_score: score1,
        player2_score: score2,
        match_type: matchType,
        tournament_id: matchType === 'tournament' ? tournamentId : undefined,
        notes: notes.trim() || undefined,
      };

      await apiService.createMatch(matchData);
      
      // Reset form and handle navigation
      resetForm();
      
      alert('Match recorded successfully!');
      onBack();
    } catch (error) {
      console.error('Failed to create match:', error);
      alert('Failed to record match. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPlayer1Id(null);
    setPlayer2Id(null);
    setPlayer1Score('');
    setPlayer2Score('');
    setMatchType('casual');
    setTournamentId(null);
    setNotes('');
  };

  if (isLoadingUsers) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading users...</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">🏸 Record Match</h2>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Match Type */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Match Type</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setMatchType('casual');
                  setTournamentId(null);
                  setUsers(allUsers); // Show all users for casual matches
                  setPlayer1Id(null);
                  setPlayer2Id(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  matchType === 'casual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏸 Casual
              </button>
              <button
                onClick={() => {
                  setMatchType('tournament');
                  setUsers(allUsers); // Show all users initially, will be filtered when tournament is selected
                  setPlayer1Id(null);
                  setPlayer2Id(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  matchType === 'tournament'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏆 Tournament
              </button>
            </div>
          </div>

          {/* Tournament Selection */}
          {matchType === 'tournament' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tournament</h3>
              {isLoadingTournaments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Loading tournaments...</span>
                </div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-lg font-medium mb-2">No Active Tournaments</p>
                  <p className="text-sm">There are currently no active tournaments available for match recording.</p>
                  <p className="text-sm mt-2">Contact an admin to activate a tournament.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tournaments.map((tournament) => (
                    <button
                      key={tournament.id}
                      onClick={() => {
                        setTournamentId(tournament.id);
                        // Load tournament participants and reset player selections
                        loadTournamentParticipants(tournament.id);
                      }}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        tournamentId === tournament.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">🏆 {tournament.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {tournament.is_active ? 'Active' : 'Completed'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Player Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Players</h3>
            
            {users.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-lg font-medium mb-2">
                  {matchType === 'tournament' && tournamentId ? 'No Tournament Participants' : 'No Players Available'}
                </p>
                <p className="text-sm">
                  {matchType === 'tournament' && tournamentId 
                    ? 'This tournament has no participants yet. Contact an admin to invite players.'
                    : 'No players are available for match recording.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Player 1</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setPlayer1Id(user.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        player1Id === user.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Player 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Player 2</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setPlayer2Id(user.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        player2Id === user.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Scores */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Scores</h3>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {users.find(u => u.id === player1Id)?.full_name || 'Player 1'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">VS</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {users.find(u => u.id === player2Id)?.full_name || 'Player 2'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the match..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/200 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Recording Match...
                </div>
              ) : (
                'Record Match'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
