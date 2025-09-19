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
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { TournamentInvitation, TournamentParticipant, User, Tournament } from '../types';

interface TournamentInvitationScreenProps {
  tournament: Tournament;
  onClose: () => void;
}

export const TournamentInvitationScreen: React.FC<TournamentInvitationScreenProps> = ({
  tournament,
  onClose,
}) => {
  const [invitations, setInvitations] = useState<TournamentInvitation[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [invitationsData, participantsData, usersData] = await Promise.all([
        apiService.getTournamentInvitations(tournament.id),
        apiService.getTournamentParticipants(tournament.id),
        apiService.getUsers(),
      ]);
      setInvitations(invitationsData);
      setParticipants(participantsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load tournament data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [tournament.id])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const inviteUser = async (userId: number) => {
    try {
      await apiService.inviteUserToTournament(tournament.id, userId);
      Alert.alert('Success', 'User invited successfully!');
      loadData();
    } catch (error) {
      console.error('Failed to invite user:', error);
      Alert.alert('Error', 'Failed to invite user');
    }
  };

  const startTournament = async () => {
    Alert.alert(
      'Start Tournament',
      'Are you sure you want to start this tournament? This will lock in all participants and prevent new invitations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Tournament',
          onPress: async () => {
            try {
              await apiService.startTournament(tournament.id);
              Alert.alert('Success', 'Tournament started successfully!');
              onClose();
            } catch (error) {
              console.error('Failed to start tournament:', error);
              Alert.alert('Error', 'Failed to start tournament');
            }
          }
        }
      ]
    );
  };

  const completeTournament = async () => {
    Alert.alert(
      'Complete Tournament',
      'Are you sure you want to complete this tournament?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Tournament',
          onPress: async () => {
            try {
              await apiService.completeTournament(tournament.id);
              Alert.alert('Success', 'Tournament completed successfully!');
              onClose();
            } catch (error) {
              console.error('Failed to complete tournament:', error);
              Alert.alert('Error', 'Failed to complete tournament');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#4CAF50';
      case 'declined': return '#f44336';
      case 'expired': return '#9e9e9e';
      default: return '#ff9800';
    }
  };

  const renderInvitation = ({ item }: { item: TournamentInvitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <Text style={styles.userName}>{item.user?.full_name || 'Unknown User'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        </View>
      </View>
      <Text style={styles.invitationDetails}>
        Invited: {new Date(item.invited_at).toLocaleDateString()}
      </Text>
      {item.responded_at && (
        <Text style={styles.invitationDetails}>
          Responded: {new Date(item.responded_at).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  const renderParticipant = ({ item }: { item: TournamentParticipant }) => (
    <View style={styles.participantCard}>
      <Text style={styles.userName}>{item.user?.full_name || 'Unknown User'}</Text>
      <Text style={styles.participantDetails}>
        Joined: {new Date(item.joined_at).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderUser = ({ item }: { item: User }) => {
    const isAlreadyInvited = invitations.some(inv => inv.user_id === item.id);
    const isParticipant = participants.some(part => part.user_id === item.id);

    return (
      <TouchableOpacity
        style={[
          styles.userCard,
          (isAlreadyInvited || isParticipant) && styles.disabledCard
        ]}
        onPress={() => {
          if (!isAlreadyInvited && !isParticipant) {
            inviteUser(item.id);
            setShowUserModal(false);
          }
        }}
        disabled={isAlreadyInvited || isParticipant}
      >
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userDetails}>@{item.username}</Text>
        {(isAlreadyInvited || isParticipant) && (
          <Text style={styles.disabledText}>
            {isParticipant ? 'Already participating' : 'Already invited'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tournament data...</Text>
      </View>
    );
  }

  const canStartTournament = tournament.status === 'inviting' && participants.length > 0;
  const canCompleteTournament = tournament.status === 'active';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tournament.name}</Text>
        <Text style={styles.status}>Status: {tournament.status}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{participants.length}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{invitations.length}</Text>
          <Text style={styles.statLabel}>Invitations</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {canStartTournament && (
          <TouchableOpacity style={styles.startButton} onPress={startTournament}>
            <Text style={styles.startButtonText}>Start Tournament</Text>
          </TouchableOpacity>
        )}
        {canCompleteTournament && (
          <TouchableOpacity style={styles.completeButton} onPress={completeTournament}>
            <Text style={styles.completeButtonText}>Complete Tournament</Text>
          </TouchableOpacity>
        )}
        {tournament.status === 'inviting' && (
          <TouchableOpacity style={styles.inviteButton} onPress={() => setShowUserModal(true)}>
            <Text style={styles.inviteButtonText}>Invite Users</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={styles.list}
      />

      <FlatList
        data={invitations}
        renderItem={renderInvitation}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Invitations ({invitations.length})</Text>
        }
        style={styles.list}
      />

      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Users</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.id.toString()}
            style={styles.userList}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    margin: 16,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  invitationCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  invitationDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  participantCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  participantDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  userDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  disabledCard: {
    opacity: 0.5,
  },
  disabledText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
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
});
