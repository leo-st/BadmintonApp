import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { TournamentInvitation } from '../types';
import { MainNavigation } from '../components/MainNavigation';

export const MyInvitationsScreen: React.FC = () => {
  const [invitations, setInvitations] = useState<TournamentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvitations = async () => {
    try {
      const data = await apiService.getMyInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvitations();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvitations();
  };

  const respondToInvitation = async (invitationId: number, status: 'accepted' | 'declined') => {
    try {
      await apiService.respondToInvitation(invitationId, status);
      Alert.alert(
        'Success',
        `Invitation ${status} successfully!`,
        [{ text: 'OK', onPress: () => loadInvitations() }]
      );
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      Alert.alert('Error', 'Failed to respond to invitation');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatusColor = (status: string, expiresAt: string) => {
    if (isExpired(expiresAt) && status === 'pending') return '#ff6b6b';
    if (status === 'accepted') return '#4CAF50';
    if (status === 'declined') return '#f44336';
    if (status === 'expired') return '#9e9e9e';
    return '#ff9800'; // pending
  };

  const getStatusText = (status: string, expiresAt: string) => {
    if (isExpired(expiresAt) && status === 'pending') return 'Expired';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderInvitation = ({ item }: { item: TournamentInvitation }) => {
    const canRespond = item.status === 'pending' && !isExpired(item.expiresAt);
    const isExpiredInvitation = isExpired(item.expiresAt) && item.status === 'pending';

    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <Text style={styles.tournamentName}>{item.tournament?.name || 'Unknown Tournament'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.expiresAt) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status, item.expiresAt)}</Text>
          </View>
        </View>
        
        <Text style={styles.tournamentDescription}>
          {item.tournament?.description || 'No description available'}
        </Text>
        
        <Text style={styles.invitationDetails}>
          Invited by: {item.inviter?.full_name || 'Unknown'}
        </Text>
        
        <Text style={styles.invitationDetails}>
          Invited: {new Date(item.invited_at).toLocaleDateString()}
        </Text>
        
        {item.expires_at && (
          <Text style={styles.invitationDetails}>
            Expires: {new Date(item.expires_at).toLocaleDateString()}
          </Text>
        )}

        {isExpiredInvitation && (
          <Text style={styles.expiredText}>
            This invitation has expired and can no longer be accepted.
          </Text>
        )}

        {canRespond && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={() => handleRespondToInvitation(item.id, 'declined')}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleRespondToInvitation(item.id, 'accepted')}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleRespondToInvitation = (invitationId: number, status: 'accepted' | 'declined') => {
    const action = status === 'accepted' ? 'accept' : 'decline';
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action} this tournament invitation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action.charAt(0).toUpperCase() + action.slice(1), onPress: () => respondToInvitation(invitationId, status) }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading invitations...</Text>
      </View>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expires_at));
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending' || isExpired(inv.expires_at));

  return (
    <MainNavigation title="📨 My Invitations" showTabs={false}>
      <View style={styles.container}>
      <Text style={styles.title}>My Tournament Invitations</Text>
      
      {pendingInvitations.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📬 Pending Invitations ({pendingInvitations.length})</Text>
          <FlatList
            data={pendingInvitations}
            renderItem={renderInvitation}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        </>
      )}

      {otherInvitations.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📋 Previous Invitations ({otherInvitations.length})</Text>
          <FlatList
            data={otherInvitations}
            renderItem={renderInvitation}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        </>
      )}

      {invitations.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tournament invitations</Text>
          <Text style={styles.emptySubtext}>You'll see tournament invitations here when admins invite you to participate.</Text>
        </View>
      )}
      </View>
    </MainNavigation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
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
  invitationDetails: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  expiredText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  declineButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
