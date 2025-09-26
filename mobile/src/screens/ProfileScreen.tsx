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
  Image,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { User } from '../types';
import { MainNavigation } from '../components/MainNavigation';

type ProfileScreenRouteProp = RouteProp<{
  Profile: { userId?: number };
}, 'Profile'>;

export const ProfileScreen: React.FC = () => {
  const { user: currentUser, login, refreshUser } = useAuth();
  // Only use route on non-web platforms
  let route: any = null;
  if (Platform.OS !== 'web') {
    route = useRoute<ProfileScreenRouteProp>();
  }
  const { userId } = route?.params || {};
  
  // Use the specified user or current user
  const [profileUser, setProfileUser] = useState<User | null>(currentUser);
  const [loadingUser, setLoadingUser] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: profileUser?.username || '',
    email: profileUser?.email || '',
    full_name: profileUser?.full_name || '',
  });
  
  // Statistics state
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsFilters, setStatisticsFilters] = useState({
    match_type: 'all' as 'casual' | 'tournament' | 'all',
    player_ids: [] as number[]
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const loadUser = async (targetUserId: number) => {
    try {
      setLoadingUser(true);
      const userData = await apiService.getUser(targetUserId);
      setProfileUser(userData);
      setProfileData({
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (userId && userId !== currentUser?.id) {
      // Loading another user's profile
      loadUser(userId);
    } else {
      // Using current user's profile
      setProfileUser(currentUser);
      if (currentUser) {
        setProfileData({
          username: currentUser.username,
          email: currentUser.email,
          full_name: currentUser.full_name,
        });
      }
    }
  }, [userId, currentUser]);

  const loadStatistics = async () => {
    if (!profileUser) return;
    
    try {
      setStatisticsLoading(true);
      const stats = await apiService.getUserStatistics(profileUser.id, statisticsFilters);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setStatisticsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await apiService.getUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    if (showStatistics) {
      loadStatistics();
      loadAllUsers();
    }
  }, [showStatistics, statisticsFilters]);

  const handleSave = async () => {
    if (!profileUser) return;
    
    try {
      setLoading(true);
      await apiService.updateUser(profileUser.id, profileData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload New', onPress: handleUploadPicture },
        ...(user?.profile_picture_url ? [{ text: 'Delete', style: 'destructive', onPress: handleDeletePicture }] : []),
      ]
    );
  };

  const handleUploadPicture = () => {
    Alert.alert(
      'Upload Profile Picture',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Test Image',
          onPress: async () => {
            try {
              setLoading(true);
              // Use a reliable external image URL
              const mockFile = {
                name: 'profile.jpg',
                type: 'image/jpeg',
                uri: 'https://picsum.photos/150/150',
              } as any;
              
              const result = await apiService.uploadProfilePicture(mockFile);
              Alert.alert('Success', 'Profile picture updated successfully');
              // Refresh user data
              await refreshUser();
            } catch (error) {
              console.error('Failed to upload profile picture:', error);
              Alert.alert('Error', 'Failed to upload profile picture');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: 'Enter URL',
          onPress: () => {
            Alert.prompt(
              'Upload Profile Picture',
              'Enter image URL:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Upload',
                  onPress: async (url: string | undefined) => {
                    if (url?.trim()) {
                      try {
                        setLoading(true);
                        const mockFile = {
                          name: 'profile.jpg',
                          type: 'image/jpeg',
                          uri: url.trim(),
                        } as any;
                        
                        const result = await apiService.uploadProfilePicture(mockFile);
                        Alert.alert('Success', 'Profile picture updated successfully');
                        // Refresh user data
                        await refreshUser();
                      } catch (error) {
                        console.error('Failed to upload profile picture:', error);
                        Alert.alert('Error', 'Failed to upload profile picture');
                      } finally {
                        setLoading(false);
                      }
                    }
                  },
                },
              ],
              'plain-text',
              ''
            );
          },
        },
      ]
    );
  };

  const handleDeletePicture = () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.deleteProfilePicture();
              Alert.alert('Success', 'Profile picture deleted successfully');
              // Refresh user data
              await refreshUser();
            } catch (error) {
              console.error('Failed to delete profile picture:', error);
              Alert.alert('Error', 'Failed to delete profile picture');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      full_name: user?.full_name || '',
    });
    setEditing(false);
  };

  const isOwnProfile = !userId || userId === currentUser?.id;

  return (
    <MainNavigation title="👤 Profile" showTabs={false}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            👤 {isOwnProfile ? 'My Profile' : `${profileUser?.username || 'User'} Profile`}
          </Text>
        </View>

      <View style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity 
            style={styles.profilePictureContainer}
            onPress={isOwnProfile ? handleProfilePicturePress : undefined}
            disabled={!isOwnProfile}
          >
            {profileUser?.profile_picture_url ? (
              <Image 
                source={{ uri: `http://localhost:8000${profileUser.profile_picture_url}` }}
                style={styles.profilePicture}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePicturePlaceholderText}>👤</Text>
              </View>
            )}
            {isOwnProfile && (
              <View style={styles.profilePictureOverlay}>
                <Text style={styles.profilePictureOverlayText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profilePictureLabel}>
            {isOwnProfile ? 'Tap to change photo' : 'Profile Picture'}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            {editing && isOwnProfile ? (
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
            {editing && isOwnProfile ? (
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
            {editing && isOwnProfile ? (
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
            <Text style={styles.value}>{profileUser?.role_name || 'No role assigned'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: profileUser?.is_active ? '#34C759' : '#FF3B30' }]}>
              {profileUser?.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>🏆 Medals</Text>
            <View style={styles.medalsContainer}>
              <View style={styles.medalRow}>
                <Text style={styles.medalText}>🥇 Gold: {profileUser?.medals?.gold || 0}</Text>
                <Text style={styles.medalText}>🥈 Silver: {profileUser?.medals?.silver || 0}</Text>
              </View>
              <View style={styles.medalRow}>
                <Text style={styles.medalText}>🥉 Bronze: {profileUser?.medals?.bronze || 0}</Text>
                <Text style={styles.medalText}>🪵 Wood: {profileUser?.medals?.wood || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.statisticsHeader}
            onPress={() => setShowStatistics(!showStatistics)}
          >
            <Text style={styles.cardTitle}>📊 Statistics</Text>
            <Text style={styles.expandIcon}>{showStatistics ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showStatistics && (
            <View style={styles.statisticsContent}>
              {/* Filters */}
              <View style={styles.filtersContainer}>
                <Text style={styles.filterLabel}>Match Type:</Text>
                <View style={styles.filterButtons}>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'casual', label: 'Casual', icon: '🏸' },
                    { key: 'tournament', label: 'Tournament', icon: '🏆' }
                  ].map(({ key, label, icon }) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterButton,
                        statisticsFilters.match_type === key && styles.filterButtonActive
                      ]}
                      onPress={() => setStatisticsFilters(prev => ({ ...prev, match_type: key as any }))}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        statisticsFilters.match_type === key && styles.filterButtonTextActive
                      ]}>
                        {icon} {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.filterLabel}>Players:</Text>
                <ScrollView horizontal style={styles.playersFilter}>
                  {allUsers.map((otherUser) => (
                    <TouchableOpacity
                      key={otherUser.id}
                      style={[
                        styles.playerFilterButton,
                        statisticsFilters.player_ids.includes(otherUser.id) && styles.playerFilterButtonActive
                      ]}
                      onPress={() => {
                        const isSelected = statisticsFilters.player_ids.includes(otherUser.id);
                        setStatisticsFilters(prev => ({
                          ...prev,
                          player_ids: isSelected 
                            ? prev.player_ids.filter(id => id !== otherUser.id)
                            : [...prev.player_ids, otherUser.id]
                        }));
                      }}
                    >
                      <Text style={[
                        styles.playerFilterButtonText,
                        statisticsFilters.player_ids.includes(otherUser.id) && styles.playerFilterButtonTextActive
                      ]}>
                        {otherUser.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Statistics Display */}
              {statisticsLoading ? (
                <Text style={styles.loadingText}>Loading statistics...</Text>
              ) : statistics ? (
                <View style={styles.statisticsDisplay}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Matches:</Text>
                    <Text style={styles.statValue}>{statistics.total_matches}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Wins:</Text>
                    <Text style={[styles.statValue, { color: '#34C759' }]}>{statistics.wins}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Losses:</Text>
                    <Text style={[styles.statValue, { color: '#FF3B30' }]}>{statistics.losses}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Win Rate:</Text>
                    <Text style={[styles.statValue, { color: '#007AFF', fontWeight: 'bold' }]}>
                      {statistics.win_rate}%
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>No statistics available</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{profileUser?.id}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>
              {profileUser?.created_at ? new Date(profileUser.created_at).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        {isOwnProfile && (
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
        )}
      </View>
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
  },
  content: {
    padding: 20,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    borderWidth: 4,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    fontSize: 48,
    color: '#666',
  },
  profilePictureOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profilePictureOverlayText: {
    fontSize: 16,
    color: 'white',
  },
  profilePictureLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  // Statistics styles
  statisticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  statisticsContent: {
    marginTop: 16,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  playersFilter: {
    maxHeight: 40,
  },
  playerFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
  },
  playerFilterButtonActive: {
    backgroundColor: '#34C759',
  },
  playerFilterButtonText: {
    fontSize: 11,
    color: '#666',
  },
  playerFilterButtonTextActive: {
    color: 'white',
  },
  statisticsDisplay: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});

