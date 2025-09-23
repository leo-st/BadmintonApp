import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const HomeScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏸 Badminton App</Text>
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
          <Text style={styles.cardTitle}>🔔 Notifications</Text>
          {pendingVerifications > 0 && (
            <Text style={styles.notificationText}>
              🔍 {pendingVerifications} match(es) pending verification
            </Text>
          )}
          {pendingInvitations > 0 && (
            <Text style={styles.notificationText}>
              📬 {pendingInvitations} tournament invitation(s) pending
            </Text>
          )}
          {unseenReports > 0 && (
            <Text style={styles.notificationText}>
              📝 {unseenReports} unseen report(s)
            </Text>
          )}
          {pendingVerifications === 0 && pendingInvitations === 0 && unseenReports === 0 && (
            <Text style={styles.cardText}>No pending notifications</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 User Info</Text>
          <Text style={styles.cardText}>Role: {user?.role_name || 'No role assigned'}</Text>
          <Text style={styles.cardText}>Permissions: {user?.permissions?.length || 0} assigned</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Recent Activity</Text>
          <Text style={styles.cardText}>No recent activity</Text>
        </View>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
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
  notificationText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 8,
    fontWeight: '500',
  },
});
