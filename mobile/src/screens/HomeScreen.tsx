import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const HomeScreen: React.FC = () => {
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const navigation = useNavigation();
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [unseenReports, setUnseenReports] = useState(0);


  useEffect(() => {
    loadPendingVerifications();
    loadPendingInvitations();
    loadUnseenReports();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPendingVerifications();
      loadPendingInvitations();
      loadUnseenReports();
    }, [])
  );

  const loadPendingVerifications = async () => {
    if (hasPermission('matches_can_verify')) {
      try {
        const matches = await apiService.getPendingVerifications();
        setPendingVerifications(matches.length);
      } catch (error) {
        console.error('Failed to load pending verifications:', error);
      }
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const invitations = await apiService.getMyInvitations();
      const pending = invitations.filter(inv => 
        inv.status === 'pending' && new Date(inv.expires_at) > new Date()
      );
      setPendingInvitations(pending.length);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
      setPendingInvitations(0);
    }
  };

  const loadUnseenReports = async () => {
    try {
      const response = await apiService.getUnseenReportsCount();
      setUnseenReports(response.unseen_count);
    } catch (error) {
      console.error('Failed to load unseen reports count:', error);
      setUnseenReports(0);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>🏸 Badminton App</Text>
          {hasPermission('matches_can_verify') && pendingVerifications > 0 && (
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => navigation.navigate('Verification' as never)}
            >
              <Text style={styles.notificationText}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{pendingVerifications}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.welcome}>Welcome, {user?.full_name || user?.username}!</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Quick Stats</Text>
          <Text style={styles.cardText}>Matches Played: 0</Text>
          <Text style={styles.cardText}>Tournaments: 0</Text>
          <Text style={styles.cardText}>Win Rate: 0%</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Quick Actions</Text>
          {hasPermission('matches_can_create') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('RecordMatch' as never)}
            >
              <Text style={styles.actionButtonText}>Record New Match</Text>
            </TouchableOpacity>
          )}
          {hasPermission('matches_can_view_all') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Matches' as never)}
            >
              <Text style={styles.actionButtonText}>View Matches</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TournamentLeaderboard' as never)}
          >
            <Text style={styles.actionButtonText}>🏆 Tournament Leaderboards</Text>
          </TouchableOpacity>
          {hasPermission('tournaments_can_create') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Tournament' as never)}
            >
              <Text style={styles.actionButtonText}>🏆 Manage Tournaments</Text>
            </TouchableOpacity>
          )}
          {hasPermission('matches_can_verify') && (
            <TouchableOpacity 
              style={[styles.actionButton, pendingVerifications > 0 && styles.urgentButton]}
              onPress={() => navigation.navigate('Verification' as never)}
            >
              <Text style={[styles.actionButtonText, pendingVerifications > 0 && styles.urgentButtonText]}>
                🔍 Verify Matches {pendingVerifications > 0 && `(${pendingVerifications})`}
              </Text>
            </TouchableOpacity>
          )}
          {pendingInvitations > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.urgentButton]}
              onPress={() => navigation.navigate('MyInvitations' as never)}
            >
              <Text style={[styles.actionButtonText, styles.urgentButtonText]}>
                📬 Tournament Invitations ({pendingInvitations})
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, unseenReports > 0 ? styles.urgentButton : { backgroundColor: '#28a745' }]}
            onPress={() => navigation.navigate('Reports' as never)}
          >
            <Text style={[styles.actionButtonText, unseenReports > 0 ? styles.urgentButtonText : { color: 'white' }]}>
              📝 Reports {unseenReports > 0 && `(${unseenReports})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            onPress={() => navigation.navigate('Posts' as never)}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>📱 Posts Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>My Profile</Text>
          </TouchableOpacity>
          {isAdmin() && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ff6b6b' }]}
              onPress={() => navigation.navigate('Admin' as never)}
            >
              <Text style={[styles.actionButtonText, { color: 'white' }]}>👑 Admin Panel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 User Info</Text>
          <Text style={styles.cardText}>Role: {user?.role_name || 'No role assigned'}</Text>
          <Text style={styles.cardText}>Permissions: {user?.permissions?.length || 0} assigned</Text>
          {isAdmin() && (
            <Text style={[styles.cardText, { color: '#ff6b6b', fontWeight: 'bold' }]}>🔑 Admin Access</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Recent Activity</Text>
          <Text style={styles.cardText}>No recent activity</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  notificationIcon: {
    position: 'relative',
    padding: 8,
  },
  notificationText: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcome: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  urgentButton: {
    backgroundColor: '#ff6b6b',
  },
  urgentButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 20,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
