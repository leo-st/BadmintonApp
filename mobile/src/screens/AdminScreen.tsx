import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { User } from '../types';

export const AdminScreen: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.username || !newUser.email || !newUser.full_name || !newUser.password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      await apiService.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({ username: '', email: '', full_name: '', password: '' });
      loadUsers();
      Alert.alert('Success', 'User created successfully');
    } catch (error) {
      console.error('Failed to create user:', error);
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleDeleteUser = (userId: number, username: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteUser(userId);
              loadUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await apiService.updateUser(selectedUser.id, {
        username: selectedUser.username,
        email: selectedUser.email,
        full_name: selectedUser.full_name,
        is_active: selectedUser.is_active,
        role_id: selectedUser.role_id,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userDetails}>@{item.username}</Text>
        <Text style={styles.userDetails}>{item.email}</Text>
        <Text style={styles.userDetails}>
          Role: {item.role_name || 'No role'} | Status: {item.is_active ? 'Active' : 'Inactive'}
        </Text>
        <Text style={styles.userDetails}>
          Permissions: {item.permissions?.length || 0}
        </Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id, item.username)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!hasPermission('users_can_view_user_list')) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You don't have permission to access this screen</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👑 Admin Panel</Text>
        <Text style={styles.subtitle}>User Management</Text>
      </View>

      {hasPermission('users_can_create_user') && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Add New User</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadUsers}
        style={styles.userList}
      />

      {/* Create User Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New User</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={newUser.username}
              onChangeText={(text) => setNewUser({ ...newUser, username: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newUser.email}
              onChangeText={(text) => setNewUser({ ...newUser, email: text })}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={newUser.full_name}
              onChangeText={(text) => setNewUser({ ...newUser, full_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={newUser.password}
              onChangeText={(text) => setNewUser({ ...newUser, password: text })}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateUser}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>
            
            {selectedUser && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={selectedUser.username}
                  onChangeText={(text) => setSelectedUser({ ...selectedUser, username: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={selectedUser.email}
                  onChangeText={(text) => setSelectedUser({ ...selectedUser, email: text })}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={selectedUser.full_name}
                  onChangeText={(text) => setSelectedUser({ ...selectedUser, full_name: text })}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateUser}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  createButton: {
    backgroundColor: '#34C759',
    margin: 20,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userList: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
});

