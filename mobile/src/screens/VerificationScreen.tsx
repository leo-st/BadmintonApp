import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Match } from '../types';
import { MainNavigation } from '../components/MainNavigation';

export const VerificationScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      setLoading(true);
      const pendingMatches = await apiService.getPendingVerifications();
      setMatches(pendingMatches);
    } catch (error) {
      console.error('Failed to load pending verifications:', error);
      Alert.alert('Error', 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingVerifications();
    setRefreshing(false);
  };

  const handleVerifyMatch = async (matchId: number, verified: boolean) => {
    try {
      await apiService.verifyMatch(matchId, { verified });
      loadPendingVerifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to verify match:', error);
      Alert.alert('Error', 'Failed to verify match');
    }
  };

  const getVerificationStatus = (match: Match) => {
    const requirements = {
      player1_needs_verification: true,
      player2_needs_verification: true,
      submitted_by_player: false
    };

    // Determine who needs to verify based on who submitted
    if (match.submitted_by_id === match.player1_id) {
      requirements.player1_needs_verification = false;
      requirements.submitted_by_player = true;
    } else if (match.submitted_by_id === match.player2_id) {
      requirements.player2_needs_verification = false;
      requirements.submitted_by_player = true;
    }

    return requirements;
  };

  const canUserVerify = (match: Match) => {
    if (!user) return false;
    
    const requirements = getVerificationStatus(match);
    
    // User can verify if they are a player and need to verify
    if (user.id === match.player1_id && requirements.player1_needs_verification && !match.player1_verified) {
      return true;
    }
    if (user.id === match.player2_id && requirements.player2_needs_verification && !match.player2_verified) {
      return true;
    }
    
    return false;
  };

  const renderMatch = (match: Match) => {
    const canVerify = canUserVerify(match);
    const requirements = getVerificationStatus(match);
    
    return (
      <View key={match.id} style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>
            {match.player1?.full_name || `Player ${match.player1_id}`} vs {match.player2?.full_name || `Player ${match.player2_id}`}
          </Text>
          <Text style={styles.matchScore}>
            {match.player1_score} - {match.player2_score}
          </Text>
        </View>
        
        <View style={styles.matchDetails}>
          <Text style={styles.matchType}>{match.match_type.toUpperCase()}</Text>
          <Text style={styles.matchDate}>
            {new Date(match.match_date).toLocaleDateString()}
          </Text>
          {match.notes && (
            <Text style={styles.matchNotes}>Notes: {match.notes}</Text>
          )}
        </View>

        <View style={styles.verificationStatus}>
          <Text style={styles.statusTitle}>Verification Status:</Text>
          <Text style={styles.statusText}>
            Player 1: {match.player1_verified ? '✅ Verified' : '⏳ Pending'}
          </Text>
          <Text style={styles.statusText}>
            Player 2: {match.player2_verified ? '✅ Verified' : '⏳ Pending'}
          </Text>
          <Text style={styles.statusText}>
            Submitted by: {match.submitted_by?.full_name || `User ${match.submitted_by_id}`}
          </Text>
        </View>

        {canVerify && (
          <View style={styles.verificationActions}>
            <Text style={styles.actionPrompt}>
              Did this match happen as reported?
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleVerifyMatch(match.id, false)}
              >
                <Text style={styles.actionButtonText}>❌ Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.verifyButton]}
                onPress={() => handleVerifyMatch(match.id, true)}
              >
                <Text style={styles.actionButtonText}>✅ Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!canVerify && (
          <View style={styles.waitingStatus}>
            <Text style={styles.waitingText}>
              {match.player1_verified && match.player2_verified
                ? '✅ Fully verified'
                : '⏳ Waiting for other players to verify'
              }
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!hasPermission('matches_can_verify')) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You don't have permission to verify matches</Text>
      </View>
    );
  }

  return (
    <MainNavigation title="✅ Verify Matches" showTabs={false}>
      <ScrollView 
        style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Match Verification</Text>
        <Text style={styles.subtitle}>
          {matches.length} pending verification{matches.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pending verifications...</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🎉 No pending verifications!</Text>
          <Text style={styles.emptySubtext}>All matches are verified</Text>
        </View>
      ) : (
        <View style={styles.matchesList}>
          {matches.map(renderMatch)}
        </View>
      )}
      </ScrollView>
    </MainNavigation>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
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
    fontSize: 24,
    color: '#34C759',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
  },
  matchesList: {
    padding: 20,
  },
  matchCard: {
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
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  matchScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  matchDetails: {
    marginBottom: 12,
  },
  matchType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  verificationStatus: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  verificationActions: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
  },
  actionPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1976d2',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingStatus: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
});
