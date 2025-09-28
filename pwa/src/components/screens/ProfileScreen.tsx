'use client';

import React, { useState, useEffect } from 'react';
import { User, UserStatistics, UserUpdate } from '@/types';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileScreenProps {
  userId?: number;
  onBack: () => void;
}

export default function ProfileScreen({ userId, onBack }: ProfileScreenProps) {
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsFilters, setStatisticsFilters] = useState({
    match_type: 'all' as 'casual' | 'tournament' | 'all',
    player_ids: [] as number[]
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    full_name: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      loadUser(targetUserId);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (showStatistics && profileUser) {
      loadStatistics();
      loadAllUsers();
    }
  }, [showStatistics, statisticsFilters, profileUser]);

  const loadAllUsers = async () => {
    try {
      const users = await apiService.getUsers();
      // Filter out the current user from the list
      setAllUsers(users.filter(user => user.id !== profileUser?.id));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadUser = async (targetUserId: number) => {
    try {
      setIsLoading(true);
      const userData = await apiService.getUser(targetUserId);
      setProfileUser(userData);
      setProfileData({
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!profileUser) return;
    
    try {
      setStatisticsLoading(true);
      const stats = await apiService.getUserStatistics(profileUser.id, statisticsFilters);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      alert('Failed to load statistics');
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileUser || !isOwnProfile) return;
    
    try {
      setIsSaving(true);
      await apiService.updateUser(profileUser.id, profileData);
      setIsEditing(false);
      alert('Profile updated successfully!');
      // Reload user data
      await loadUser(profileUser.id);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileUser) {
      setProfileData({
        username: profileUser.username,
        email: profileUser.email,
        full_name: profileUser.full_name,
      });
    }
    setIsEditing(false);
    setShowPasswordChange(false);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New password and confirmation do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      await apiService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      alert('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">👤 Profile</h2>
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-indigo-600">
                {profileUser.full_name?.charAt(0) || profileUser.username?.charAt(0) || '?'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {profileUser.full_name || profileUser.username}
            </h3>
            <p className="text-gray-600">@{profileUser.username}</p>
            {!isOwnProfile && (
              <p className="text-sm text-gray-500 mt-2">
                {profileUser.is_active ? '🟢 Active' : '🔴 Inactive'}
              </p>
            )}
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">📋 Personal Information</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                {isEditing && isOwnProfile ? (
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled // Username usually can't be changed
                  />
                ) : (
                  <p className="text-gray-900">@{profileUser.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing && isOwnProfile ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileUser.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing && isOwnProfile ? (
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileUser.full_name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900">{profileUser.role_id ? `Role ${profileUser.role_id}` : 'No role assigned'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className={`${profileUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {profileUser.is_active ? '🟢 Active' : '🔴 Inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Password Change Section - Only for own profile */}
          {isOwnProfile && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">🔐 Security</h4>
              
              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  🔑 Change Password
                </button>
              ) : (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">Change Password</h5>
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      disabled={isChangingPassword}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medals */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">🏆 Medals</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-1">🥇</div>
                <div className="font-semibold text-gray-900">Gold</div>
                <div className="text-2xl font-bold text-yellow-600">{profileUser.medals?.gold || 0}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-1">🥈</div>
                <div className="font-semibold text-gray-900">Silver</div>
                <div className="text-2xl font-bold text-gray-600">{profileUser.medals?.silver || 0}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-1">🥉</div>
                <div className="font-semibold text-gray-900">Bronze</div>
                <div className="text-2xl font-bold text-orange-600">{profileUser.medals?.bronze || 0}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-1">🪵</div>
                <div className="font-semibold text-gray-900">Wood</div>
                <div className="text-2xl font-bold text-amber-600">{profileUser.medals?.wood || 0}</div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-lg font-semibold text-gray-900">📊 Statistics</h4>
              <span className="text-gray-500">{showStatistics ? '▼' : '▶'}</span>
            </button>
            
            {showStatistics && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Match Type:</label>
                    <div className="flex space-x-2">
                      {[
                        { key: 'all', label: 'All', icon: '🎾' },
                        { key: 'casual', label: 'Casual', icon: '🏸' },
                        { key: 'tournament', label: 'Tournament', icon: '🏆' }
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          onClick={() => setStatisticsFilters(prev => ({ ...prev, match_type: key as any }))}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            statisticsFilters.match_type === key
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Opponent:</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      <button
                        onClick={() => setStatisticsFilters(prev => ({ ...prev, player_ids: [] }))}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          statisticsFilters.player_ids.length === 0
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        👥 All Players
                      </button>
                      {allUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            const isSelected = statisticsFilters.player_ids.includes(user.id);
                            setStatisticsFilters(prev => ({
                              ...prev,
                              player_ids: isSelected
                                ? prev.player_ids.filter(id => id !== user.id)
                                : [...prev.player_ids, user.id]
                            }));
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            statisticsFilters.player_ids.includes(user.id)
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {user.full_name || user.username}
                        </button>
                      ))}
                    </div>
                    {statisticsFilters.player_ids.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing matches against: {statisticsFilters.player_ids.length} selected opponent{statisticsFilters.player_ids.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Statistics Display */}
                {statisticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading statistics...</span>
                  </div>
                ) : statistics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl mb-1">🎾</div>
                      <div className="font-semibold text-gray-900">Total Matches</div>
                      <div className="text-2xl font-bold text-blue-600">{statistics.total_matches}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl mb-1">✅</div>
                      <div className="font-semibold text-gray-900">Wins</div>
                      <div className="text-2xl font-bold text-green-600">{statistics.wins}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl mb-1">❌</div>
                      <div className="font-semibold text-gray-900">Losses</div>
                      <div className="text-2xl font-bold text-red-600">{statistics.losses}</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <div className="text-2xl mb-1">📈</div>
                      <div className="font-semibold text-gray-900">Win Rate</div>
                      <div className="text-2xl font-bold text-indigo-600">{statistics.win_rate}%</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No statistics available</p>
                )}
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">🔧 Account Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900">#{profileUser.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <p className="text-gray-900">
                  {profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isOwnProfile && (
            <div className="pt-4 border-t border-gray-200">
              {isEditing ? (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
