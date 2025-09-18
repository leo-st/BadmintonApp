import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Tournament, TournamentCreate, TournamentStats } from '../types';

export const TournamentScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTournaments(false); // Get all tournaments
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const activeTournaments = tournaments.filter(t => t.is_active);
  const finishedTournaments = tournaments.filter(t => !t.is_active);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const handleCreateTournament = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Tournament name is required');
      return;
    }

    try {
      const tournamentData: TournamentCreate = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      };

      await apiService.createTournament(tournamentData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
      loadTournaments();
      Alert.alert('Success', 'Tournament created successfully');
    } catch (error) {
      console.error('Failed to create tournament:', error);
      Alert.alert('Error', 'Failed to create tournament');
    }
  };

  const handleDeactivateTournament = async (tournamentId: number) => {
    Alert.alert(
      'Deactivate Tournament',
      'Are you sure you want to deactivate this tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deactivateTournament(tournamentId);
              loadTournaments();
              Alert.alert('Success', 'Tournament deactivated successfully');
            } catch (error) {
              console.error('Failed to deactivate tournament:', error);
              Alert.alert('Error', 'Failed to deactivate tournament');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTournament = async (tournamentId: number) => {
    Alert.alert(
      'Delete Tournament',
      'Are you sure you want to delete this tournament? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTournament(tournamentId);
              loadTournaments();
              Alert.alert('Success', 'Tournament deleted successfully');
            } catch (error) {
              console.error('Failed to delete tournament:', error);
              Alert.alert('Error', 'Failed to delete tournament');
            }
          },
        },
      ]
    );
  };

  const handleViewStats = async (tournament: Tournament) => {
    try {
      const stats = await apiService.getTournamentStats(tournament.id);
      setSelectedTournament(tournament);
      setTournamentStats(stats);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Failed to load tournament stats:', error);
      Alert.alert('Error', 'Failed to load tournament statistics');
    }
  };

  const renderTournament = (tournament: Tournament) => (
    <View key={tournament.id} style={styles.tournamentCard}>
      <View style={styles.tournamentHeader}>
        <Text style={styles.tournamentName}>{tournament.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: tournament.is_active ? '#34C759' : '#FF3B30' }
        ]}>
          <Text style={styles.statusText}>
            {tournament.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      {tournament.description && (
        <Text style={styles.tournamentDescription}>{tournament.description}</Text>
      )}
      
      <Text style={styles.tournamentDate}>
        Start: {new Date(tournament.start_date).toLocaleDateString()}
      </Text>
      {tournament.end_date && (
        <Text style={styles.tournamentDate}>
          End: {new Date(tournament.end_date).toLocaleDateString()}
        </Text>
      )}

      <View style={styles.tournamentActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.statsButton]}
          onPress={() => handleViewStats(tournament)}
        >
          <Text style={styles.actionButtonText}>📊 Stats</Text>
        </TouchableOpacity>
        
        {tournament.is_active && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deactivateButton]}
            onPress={() => handleDeactivateTournament(tournament.id)}
          >
            <Text style={styles.actionButtonText}>⏸️ Deactivate</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTournament(tournament.id)}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="slide"
      onRequestClose={() => setShowStatsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedTournament?.name} - Statistics
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStatsModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {tournamentStats && (
          <ScrollView style={styles.statsContainer}>
            <View style={styles.tournamentInfo}>
              <Text style={styles.infoText}>
                Total Matches: {tournamentStats.tournament.total_matches}
              </Text>
              <Text style={styles.infoText}>
                Status: {tournamentStats.tournament.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            <Text style={styles.standingsTitle}>Player Standings</Text>
            {tournamentStats.standings.map((player, index) => (
              <View key={player.player_id} style={styles.playerStanding}>
                <View style={styles.standingHeader}>
                  <Text style={styles.standingPosition}>#{index + 1}</Text>
                  <Text style={styles.playerName}>{player.player_name}</Text>
                  <Text style={styles.winPercentage}>
                    {player.win_percentage.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.standingStats}>
                  <Text style={styles.statText}>
                    Matches: {player.matches_won}W-{player.matches_lost}L
                  </Text>
                  <Text style={styles.statText}>
                    Points: {player.points_won}-{player.points_lost}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  if (!hasPermission('tournaments_can_create')) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You don't have permission to manage tournaments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Tournament Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create Tournament</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tournaments...</Text>
          </View>
        ) : tournaments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tournaments found</Text>
            <Text style={styles.emptySubtext}>Create your first tournament!</Text>
          </View>
        ) : (
          <View style={styles.tournamentsList}>
            {/* Active Tournaments */}
            {activeTournaments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🏆 Active Tournaments</Text>
                {activeTournaments.map(renderTournament)}
              </>
            )}
            
            {/* Finished Tournaments */}
            {finishedTournaments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>📊 Finished Tournaments</Text>
                {finishedTournaments.map(renderTournament)}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Tournament Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Tournament</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Tournament Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter tournament name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter tournament description"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.start_date}
              onChangeText={(text) => setFormData({ ...formData, start_date: text })}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={formData.end_date}
              onChangeText={(text) => setFormData({ ...formData, end_date: text })}
              placeholder="YYYY-MM-DD (optional)"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateTournament}
            >
              <Text style={styles.submitButtonText}>Create Tournament</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {renderStatsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
  },
  tournamentsList: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    marginLeft: 4,
  },
  tournamentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tournamentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tournamentActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  statsButton: {
    backgroundColor: '#007AFF',
  },
  deactivateButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flex: 1,
    padding: 20,
  },
  tournamentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  standingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  playerStanding: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  standingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  standingPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    minWidth: 30,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  winPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  standingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
});
