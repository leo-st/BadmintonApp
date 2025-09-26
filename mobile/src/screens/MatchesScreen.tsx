import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import { Match } from '../types';
import { apiService } from '../services/api';
import { FloatingActionButton } from '../components/FloatingActionButton';

interface MatchesScreenProps {
  onNavigateToRecordMatch?: () => void;
  refreshTrigger?: number;
}

export const MatchesScreen: React.FC<MatchesScreenProps> = ({ onNavigateToRecordMatch, refreshTrigger }) => {
  // Only use navigation on non-web platforms
  let navigation: any = null;
  if (Platform.OS !== 'web') {
    navigation = useNavigation();
  }
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadMatches();
    }
  }, [refreshTrigger]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const matchesData = await apiService.getMatches();
      // Matches are already sorted by newest to oldest from the backend
      setMatches(matchesData);
    } catch (error) {
      console.error('Failed to load matches:', error);
      Alert.alert('Error', 'Failed to load matches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'pending_verification':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending_verification':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <ScrollView style={styles.content}>
        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>
              Record your first match to get started!
            </Text>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => navigation && navigation.navigate('RecordMatch' as never)}
            >
              <Text style={styles.recordButtonText}>Record New Match</Text>
            </TouchableOpacity>
          </View>
        ) : (
          matches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchType}>
                  {match.match_type === 'casual' ? '🏸 Casual' : '🏆 Tournament'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(match.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(match.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.playersContainer}>
                <View style={styles.player}>
                  <Text style={styles.playerName}>
                    {match.player1?.full_name || `Player ${match.player1_id}`}
                  </Text>
                  <Text style={styles.playerScore}>{match.player1_score}</Text>
                </View>
                <Text style={styles.vsText}>VS</Text>
                <View style={styles.player}>
                  <Text style={styles.playerName}>
                    {match.player2?.full_name || `Player ${match.player2_id}`}
                  </Text>
                  <Text style={styles.playerScore}>{match.player2_score}</Text>
                </View>
              </View>

              <View style={styles.matchFooter}>
                <Text style={styles.matchDate}>
                  {formatDate(match.match_date)}
                </Text>
                {match.notes && (
                  <Text style={styles.matchNotes} numberOfLines={2}>
                    {match.notes}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      {/* Floating Action Button - Fixed to viewport on web */}
      <FloatingActionButton
        onPress={() => {
          if (Platform.OS === 'web' && onNavigateToRecordMatch) {
            onNavigateToRecordMatch();
          } else if (navigation) {
            navigation.navigate('RecordMatch' as never);
          }
        }}
        icon="+"
        fixed={true}
      />
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
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  matchCard: {
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
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  player: {
    flex: 1,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
  },
  matchFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  matchNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
