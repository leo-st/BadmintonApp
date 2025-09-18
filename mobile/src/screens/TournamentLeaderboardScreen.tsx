import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Tournament, TournamentLeaderboard } from '../types';

export const TournamentLeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPublicTournaments();
      setTournaments(data);
      if (data.length > 0) {
        setSelectedTournament(data[0]);
        loadLeaderboard(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async (tournamentId: number) => {
    try {
      setLoadingLeaderboard(true);
      const data = await apiService.getTournamentLeaderboard(tournamentId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      Alert.alert('Error', 'Failed to load tournament leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    loadLeaderboard(tournament.id);
  };

  const formatDelta = (delta: number) => {
    if (delta > 0) return `+${delta}`;
    if (delta < 0) return `${delta}`;
    return '0';
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return '#34C759';
    if (delta < 0) return '#FF3B30';
    return '#666';
  };

  const renderTournamentSelector = () => (
    <View style={styles.tournamentSelector}>
      <Text style={styles.selectorTitle}>Select Tournament</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tournamentList}>
          {tournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              style={[
                styles.tournamentButton,
                selectedTournament?.id === tournament.id && styles.tournamentButtonActive,
              ]}
              onPress={() => handleTournamentSelect(tournament)}
            >
              <Text
                style={[
                  styles.tournamentButtonText,
                  selectedTournament?.id === tournament.id && styles.tournamentButtonTextActive,
                ]}
              >
                🏆 {tournament.name}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: tournament.is_active ? '#34C759' : '#FF3B30' }
              ]}>
                <Text style={styles.statusText}>
                  {tournament.is_active ? 'Active' : 'Completed'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderLeaderboard = () => {
    if (!leaderboard) return null;

    return (
      <View style={styles.leaderboardContainer}>
        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentName}>{leaderboard.tournament.name}</Text>
          <Text style={styles.tournamentStats}>
            {leaderboard.tournament.total_matches} matches • {leaderboard.leaderboard.length} players
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.playerHeader]}>Player</Text>
          <Text style={[styles.headerCell, styles.setsHeader]}>Sets</Text>
          <Text style={[styles.headerCell, styles.pointsHeader]}>Points</Text>
        </View>

        <ScrollView style={styles.tableContainer}>
          {leaderboard.leaderboard.map((player, index) => (
            <View key={player.player_id} style={styles.tableRow}>
              <View style={styles.playerCell}>
                <Text style={styles.positionText}>#{index + 1}</Text>
                <Text style={styles.playerName}>{player.player_name}</Text>
              </View>
              
              <View style={styles.setsCell}>
                <Text style={styles.setsText}>
                  {player.sets_won}-{player.sets_lost}
                </Text>
                <Text style={[styles.deltaText, { color: getDeltaColor(player.sets_delta) }]}>
                  {formatDelta(player.sets_delta)}
                </Text>
              </View>
              
              <View style={styles.pointsCell}>
                <Text style={styles.pointsText}>
                  {player.points_won}-{player.points_lost}
                </Text>
                <Text style={[styles.deltaText, { color: getDeltaColor(player.points_delta) }]}>
                  {formatDelta(player.points_delta)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tournaments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Tournament Leaderboards</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTournamentSelector()}
        
        {loadingLeaderboard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboard ? (
          renderLeaderboard()
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tournaments available</Text>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  tournamentSelector: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tournamentList: {
    flexDirection: 'row',
    gap: 12,
  },
  tournamentButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 150,
    alignItems: 'center',
  },
  tournamentButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  tournamentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tournamentButtonTextActive: {
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  leaderboardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tournamentInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tournamentStats: {
    fontSize: 14,
    color: '#666',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  playerHeader: {
    flex: 2,
  },
  setsHeader: {
    flex: 1,
    textAlign: 'center',
  },
  pointsHeader: {
    flex: 1,
    textAlign: 'center',
  },
  tableContainer: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  playerCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
    minWidth: 30,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  setsCell: {
    flex: 1,
    alignItems: 'center',
  },
  setsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pointsCell: {
    flex: 1,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
