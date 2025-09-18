import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const ProfileScreen: React.FC = () => {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiService.updateUser(user!.id, profileData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
      // Refresh user data by logging in again
      // In a real app, you'd have a refresh token or update the context
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      full_name: user?.full_name || '',
    });
    setEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 My Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={profileData.username}
                onChangeText={(text) => setProfileData({ ...profileData, username: text })}
                editable={false} // Username usually can't be changed
              />
            ) : (
              <Text style={styles.value}>@{profileData.username}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.value}>{profileData.email}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={profileData.full_name}
                onChangeText={(text) => setProfileData({ ...profileData, full_name: text })}
              />
            ) : (
              <Text style={styles.value}>{profileData.full_name}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user?.role_name || 'No role assigned'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: user?.is_active ? '#34C759' : '#FF3B30' }]}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>🏆 Medals</Text>
            <View style={styles.medalsContainer}>
              <View style={styles.medalRow}>
                <Text style={styles.medalText}>🥇 Gold: {user?.medals?.gold || 0}</Text>
                <Text style={styles.medalText}>🥈 Silver: {user?.medals?.silver || 0}</Text>
              </View>
              <View style={styles.medalRow}>
                <Text style={styles.medalText}>🥉 Bronze: {user?.medals?.bronze || 0}</Text>
                <Text style={styles.medalText}>🪵 Wood: {user?.medals?.wood || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{user?.id}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {editing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  medalsContainer: {
    marginTop: 8,
  },
  medalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    marginTop: 20,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

