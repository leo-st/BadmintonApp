import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, MatchCreate, Tournament } from '../types';
import { apiService } from '../services/api';

export const RecordMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

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
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadTournaments = async () => {
    try {
      setIsLoadingTournaments(true);
      const tournamentsData = await apiService.getTournaments(true); // Only active tournaments
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      Alert.alert('Error', 'Failed to load tournaments. Please try again.');
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const loadTournamentParticipants = async (tournamentId: number) => {
    try {
      setIsLoadingParticipants(true);
      const participants = await apiService.getTournamentParticipants(tournamentId);
      // Extract users from participants
      const participantUsers = participants.map(p => p.user).filter(Boolean) as User[];
      setTournamentParticipants(participantUsers);
    } catch (error) {
      console.error('Failed to load tournament participants:', error);
      Alert.alert('Error', 'Failed to load tournament participants. Please try again.');
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!player1Id || !player2Id) {
      Alert.alert('Error', 'Please select both players');
      return;
    }

    if (player1Id === player2Id) {
      Alert.alert('Error', 'Players must be different');
      return;
    }

    if (!player1Score.trim() || !player2Score.trim()) {
      Alert.alert('Error', 'Please enter scores for both players');
      return;
    }

    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      Alert.alert('Error', 'Please enter valid scores (0 or higher)');
      return;
    }

    if (score1 === score2) {
      Alert.alert('Error', 'Scores cannot be equal');
      return;
    }

    if (matchType === 'tournament' && !tournamentId) {
      Alert.alert('Error', 'Please select a tournament for tournament matches');
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

      console.log('Creating match with data:', matchData);
      await apiService.createMatch(matchData);
      Alert.alert('Success', 'Match recorded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to create match:', error);
      Alert.alert('Error', 'Failed to record match. Please try again.');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.title}>🏸 Record Match</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Match Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Match Type</Text>
            <View style={styles.matchTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  matchType === 'casual' && styles.matchTypeButtonActive,
                ]}
                onPress={() => {
                  setMatchType('casual');
                  setTournamentId(null);
                  setPlayer1Id(null);
                  setPlayer2Id(null);
                }}
              >
                <Text
                  style={[
                    styles.matchTypeButtonText,
                    matchType === 'casual' && styles.matchTypeButtonTextActive,
                  ]}
                >
                  🏓 Casual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.matchTypeButton,
                  matchType === 'tournament' && styles.matchTypeButtonActive,
                ]}
                onPress={() => setMatchType('tournament')}
              >
                <Text
                  style={[
                    styles.matchTypeButtonText,
                    matchType === 'tournament' && styles.matchTypeButtonTextActive,
                  ]}
                >
                  🏆 Tournament
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tournament Selection */}
          {matchType === 'tournament' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tournament</Text>
              {isLoadingTournaments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading tournaments...</Text>
                </View>
              ) : tournaments.length === 0 ? (
                <Text style={styles.noDataText}>No active tournaments available</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tournamentContainer}>
                    {tournaments.map((tournament) => (
                      <TouchableOpacity
                        key={tournament.id}
                        style={[
                          styles.tournamentButton,
                          tournamentId === tournament.id && styles.tournamentButtonActive,
                        ]}
                        onPress={() => {
                          setTournamentId(tournament.id);
                          loadTournamentParticipants(tournament.id);
                          // Reset player selections when tournament changes
                          setPlayer1Id(null);
                          setPlayer2Id(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.tournamentButtonText,
                            tournamentId === tournament.id && styles.tournamentButtonTextActive,
                          ]}
                        >
                          🏆 {tournament.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* Player Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Players</Text>
            
            <View style={styles.playerSelection}>
              <Text style={styles.playerLabel}>Player 1</Text>
              {matchType === 'tournament' && tournamentId && isLoadingParticipants ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading participants...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.playerList}>
                    {(matchType === 'tournament' && tournamentId ? tournamentParticipants : users).map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.playerButton,
                          player1Id === user.id && styles.playerButtonActive,
                        ]}
                        onPress={() => setPlayer1Id(user.id)}
                      >
                        <Text
                          style={[
                            styles.playerButtonText,
                            player1Id === user.id && styles.playerButtonTextActive,
                          ]}
                        >
                          {user.full_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={styles.playerSelection}>
              <Text style={styles.playerLabel}>Player 2</Text>
              {matchType === 'tournament' && tournamentId && isLoadingParticipants ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading participants...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.playerList}>
                    {(matchType === 'tournament' && tournamentId ? tournamentParticipants : users).map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.playerButton,
                          player2Id === user.id && styles.playerButtonActive,
                        ]}
                        onPress={() => setPlayer2Id(user.id)}
                      >
                        <Text
                          style={[
                            styles.playerButtonText,
                            player2Id === user.id && styles.playerButtonTextActive,
                          ]}
                        >
                          {user.full_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>

          {/* Scores */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scores</Text>
            <View style={styles.scoresContainer}>
              <View style={styles.scoreInput}>
                <Text style={styles.scoreLabel}>
                  {users.find(u => u.id === player1Id)?.full_name || 'Player 1'}
                </Text>
                <TextInput
                  style={styles.scoreTextInput}
                  value={player1Score}
                  onChangeText={setPlayer1Score}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.scoreInput}>
                <Text style={styles.scoreLabel}>
                  {users.find(u => u.id === player2Id)?.full_name || 'Player 2'}
                </Text>
                <TextInput
                  style={styles.scoreTextInput}
                  value={player2Score}
                  onChangeText={setPlayer2Score}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about the match..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Record Match</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
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
  },
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  matchTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  matchTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  matchTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  matchTypeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  matchTypeButtonTextActive: {
    color: '#007AFF',
  },
  tournamentContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tournamentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  tournamentButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  tournamentButtonText: {
    fontSize: 14,
    color: '#666',
  },
  tournamentButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playerSelection: {
    marginBottom: 20,
  },
  playerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  playerList: {
    flexDirection: 'row',
    gap: 8,
  },
  playerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  playerButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  playerButtonText: {
    fontSize: 14,
    color: '#666',
  },
  playerButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreInput: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreTextInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 30,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
