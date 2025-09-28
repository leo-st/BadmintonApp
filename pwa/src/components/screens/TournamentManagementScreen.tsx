'use client';

import React, { useState, useEffect } from 'react';
import { Tournament, TournamentCreate, TournamentUpdate, User, TournamentInvitation, TournamentStats } from '@/types';
import { apiService } from '@/services/api';

interface TournamentManagementScreenProps {
  onBack: () => void;
}

export default function TournamentManagementScreen({ onBack }: TournamentManagementScreenProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<TournamentInvitation[]>([]);
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getPublicTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      alert('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      if (!formData.name || !formData.start_date || !formData.end_date) {
        alert('Please fill in all required fields');
        return;
      }

      setIsCreating(true);
      const tournamentData: TournamentCreate = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      
      await apiService.createTournament(tournamentData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', start_date: new Date().toISOString().split('T')[0], end_date: '' });
      alert('Tournament created successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Failed to create tournament:', error);
      alert('Failed to create tournament');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setEditData({
      name: tournament.name,
      description: tournament.description || '',
      start_date: tournament.start_date,
      end_date: tournament.end_date || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTournament = async () => {
    if (!selectedTournament) return;

    try {
      setIsUpdating(true);
      const updateData: TournamentUpdate = {
        name: editData.name,
        description: editData.description,
        start_date: editData.start_date,
        end_date: editData.end_date,
      };
      
      await apiService.updateTournament(selectedTournament.id, updateData);
      setShowEditModal(false);
      setSelectedTournament(null);
      alert('Tournament updated successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Failed to update tournament:', error);
      alert('Failed to update tournament');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTournament = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(tournamentId);
      await apiService.deleteTournament(tournamentId);
      alert('Tournament deleted successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      alert('Failed to delete tournament');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeactivateTournament = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to deactivate this tournament?')) {
      return;
    }

    try {
      await apiService.deactivateTournament(tournamentId);
      alert('Tournament deactivated successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Failed to deactivate tournament:', error);
      alert('Failed to deactivate tournament');
    }
  };

  const handleActivateTournament = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to activate this tournament? This will allow match recording.')) {
      return;
    }

    try {
      await apiService.activateTournament(tournamentId);
      alert('Tournament activated successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Failed to activate tournament:', error);
      alert('Failed to activate tournament');
    }
  };

  const handleInvitePlayers = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    try {
      const [usersData, invitationsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getTournamentInvitations(tournament.id)
      ]);
      setUsers(usersData);
      setInvitations(invitationsData);
      setShowInvitationModal(true);
    } catch (error) {
      console.error('Failed to load invitation data:', error);
      alert('Failed to load invitation data');
    }
  };

  const handleInviteUser = async (userId: number) => {
    if (!selectedTournament) return;
    
    try {
      await apiService.inviteUserToTournament(selectedTournament.id, userId);
      alert('User invited successfully!');
      // Reload invitations
      const invitationsData = await apiService.getTournamentInvitations(selectedTournament.id);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to invite user');
    }
  };

  const handleViewStats = async (tournament: Tournament) => {
    try {
      const stats = await apiService.getTournamentStats(tournament.id);
      setSelectedTournament(tournament);
      setTournamentStats(stats);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Failed to load tournament stats:', error);
      alert('Failed to load tournament statistics');
    }
  };

  const getStatusBadge = (tournament: Tournament) => {
    // Use the actual status field from the database
    switch (tournament.status) {
      case 'draft':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Draft</span>;
      case 'inviting':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Inviting</span>;
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      case 'completed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Completed</span>;
      default:
        // Fallback to is_active field
        if (!tournament.is_active) {
          return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        } else {
          return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Inviting</span>;
        }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
          Loading tournaments...
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
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">🏆 Tournament Management</h2>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Tournament
            </button>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournaments</h3>
          <div className="space-y-4">
            {tournaments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tournaments found. Create your first tournament!
              </div>
            ) : (
              tournaments.map((tournament) => (
                <div key={tournament.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="space-y-4">
                    {/* Tournament Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{tournament.name}</h4>
                          {getStatusBadge(tournament)}
                        </div>
                        {tournament.description && (
                          <p className="text-gray-600 mb-3">{tournament.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Start: {formatDate(tournament.start_date)}</span>
                          {tournament.end_date && (
                            <span>End: {formatDate(tournament.end_date)}</span>
                          )}
                          <span>Participants: {tournament.participant_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tournament Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleViewStats(tournament)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        📊 View Statistics
                      </button>
                      <button
                        onClick={() => handleInvitePlayers(tournament)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        👥 Invite Players
                      </button>
                      <button
                        onClick={() => handleEditTournament(tournament)}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      {tournament.status === 'active' && (
                        <button
                          onClick={() => handleDeactivateTournament(tournament.id)}
                          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          ⏸️ Deactivate
                        </button>
                      )}
                      {tournament.status === 'inviting' && (
                        <button
                          onClick={() => handleActivateTournament(tournament.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          ▶️ Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTournament(tournament.id)}
                        disabled={isDeleting === tournament.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        🗑️ {isDeleting === tournament.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Tournament</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter tournament name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter tournament description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTournament}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {showEditModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Tournament</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={editData.start_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={editData.end_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTournament}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {showInvitationModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                👥 Invite Players to {selectedTournament.name}
              </h3>
              <button
                onClick={() => setShowInvitationModal(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            {/* Users List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {users
                .filter(user => 
                  user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.username.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(user => {
                  const existingInvitation = invitations.find(inv => inv.user_id === user.id);
                  const isInvited = !!existingInvitation;
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {user.full_name?.charAt(0) || user.username.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isInvited && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            existingInvitation.status === 'accepted' 
                              ? 'bg-green-100 text-green-800'
                              : existingInvitation.status === 'declined'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {existingInvitation.status === 'pending' ? 'Pending' : existingInvitation.status}
                          </span>
                        )}
                        <button
                          onClick={() => handleInviteUser(user.id)}
                          disabled={isInvited}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            isInvited
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isInvited ? 'Invited' : 'Invite'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && selectedTournament && tournamentStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📊 {selectedTournament.name} - Statistics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tournament Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Total Matches:</span>
                  <span className="ml-2 text-sm text-gray-900">{tournamentStats.tournament.total_matches}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    tournamentStats.tournament.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tournamentStats.tournament.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Player Standings */}
            <div className="flex-1 overflow-y-auto">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Player Standings</h4>
              <div className="space-y-3">
                {tournamentStats.standings.map((player, index) => (
                  <div key={player.player_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-indigo-600">#{index + 1}</span>
                        <span className="text-lg font-semibold text-gray-900">{player.player_name}</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {player.win_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Matches:</span> {player.matches_won}W-{player.matches_lost}L ({player.matches_played} total)
                      </div>
                      <div>
                        <span className="font-medium">Points:</span> {player.points_won}-{player.points_lost}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
