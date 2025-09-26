import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native';
import { Report, ReportReactionCreate } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReportDetailScreenProps {
  report: Report;
  onBackToReports?: () => void;
  onEditReport?: (report: Report) => void;
}

const ReportDetailScreen: React.FC<ReportDetailScreenProps> = ({ report: initialReport, onBackToReports, onEditReport }) => {
  // Only use navigation on non-web platforms
  let navigation: any = null;
  if (Platform.OS !== 'web') {
    // For mobile, we'd need navigation from useNavigation hook
  }
  const [report, setReport] = useState<Report>(initialReport);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadReportDetails();
  }, []);

  const loadReportDetails = async () => {
    try {
      setLoading(true);
      const updatedReport = await apiService.getReport(report.id);
      setReport(updatedReport);
    } catch (error) {
      console.error('Error loading report details:', error);
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      setLoading(true);
      const reactionData: ReportReactionCreate = { emoji };
      await apiService.addReportReaction(report.id, reactionData);
      await loadReportDetails(); // Reload to get updated reactions
      setShowReactionModal(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
      Alert.alert('Error', 'Failed to add reaction');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveReaction = async (reactionId: number) => {
    try {
      setLoading(true);
      await apiService.removeReportReaction(report.id, reactionId);
      await loadReportDetails(); // Reload to get updated reactions
    } catch (error) {
      console.error('Error removing reaction:', error);
      Alert.alert('Error', 'Failed to remove reaction');
    } finally {
      setLoading(false);
    }
  };

  const showReactionDetails = (emoji: string) => {
    const reactions = report.reactions?.filter(r => r.emoji === emoji) || [];
    setSelectedEmoji(emoji);
    setSelectedEmojiReactions(reactions);
    setShowReactionDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canEdit = user?.id === report.created_by_id;

  const addReaction = async (emoji: string) => {
    try {
      await apiService.addReportReaction(report.id, { emoji });
      // Refresh report to get updated reaction counts
      const updatedReport = await apiService.getReport(report.id);
      setReport(updatedReport);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const handleDeleteReport = async () => {
    console.log('Delete button clicked for report:', report.id);
    
    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this report? This action cannot be undone.');
      console.log('Web confirmation result:', confirmed);
      
      if (!confirmed) {
        console.log('Delete cancelled by user');
        return;
      }
      
      console.log('User confirmed delete, starting deletion process...');
      await performDelete();
    } else {
      // Native mobile confirmation dialog
      Alert.alert(
        'Delete Report',
        'Are you sure you want to delete this report? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('Delete cancelled by user');
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              console.log('User confirmed delete, starting deletion process...');
              await performDelete();
            },
          },
        ]
      );
    }
  };

  const performDelete = async () => {
    try {
      console.log('Setting loading state...');
      setLoading(true);
      console.log('Making API call to delete report:', report.id);
      const result = await apiService.deleteReport(report.id);
      console.log('API call completed, result:', result);
      console.log('Report deleted successfully');
      
      if (Platform.OS === 'web') {
        alert('Report deleted successfully');
        console.log('Navigating back to reports...');
        if (onBackToReports) {
          onBackToReports();
        }
      } else {
        Alert.alert('Success', 'Report deleted successfully', [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigating back to reports...');
              if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      const errorMessage = 'Failed to delete report: ' + (error.message || 'Unknown error');
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      console.log('Clearing loading state...');
      setLoading(false);
    }
  };

  const renderReaction = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.reactionItem}
      onPress={() => {
        if (item.user_id === user?.id) {
          handleRemoveReaction(item.id);
        }
      }}
    >
      <Text style={styles.reactionEmoji}>{item.emoji}</Text>
      <Text style={styles.reactionUser}>
        {item.user?.full_name || `User ${item.user_id}`}
      </Text>
      {item.user_id === user?.id && (
        <Text style={styles.removeText}>Tap to remove</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS === 'web' && onBackToReports) {
              onBackToReports();
            } else if (navigation) {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        {canEdit && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (Platform.OS === 'web' && onEditReport) {
                  onEditReport(report);
                } else if (navigation) {
                  navigation.navigate('CreateReport', { report });
                }
              }}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteReport}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportDate}>{formatDate(report.event_date)}</Text>
            <Text style={styles.reportAuthor}>
              by {report.created_by?.full_name || `User ${report.created_by_id}`}
            </Text>
          </View>

          <Text style={styles.reportContent}>{report.content}</Text>

          <View style={styles.reportFooter}>
            <Text style={styles.reportTimestamp}>
              Created: {formatDateTime(report.created_at)}
            </Text>
            {report.updated_at !== report.created_at && (
              <Text style={styles.reportTimestamp}>
                Updated: {formatDateTime(report.updated_at)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.reactionsSection}>
          {/* Simple inline reactions like in PostsScreen */}
          <View style={styles.reactions}>
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => addReaction('👍')}
            >
              <Text style={styles.reactionEmoji}>👍</Text>
              <Text style={styles.reactionCount}>
                {report.reaction_counts?.['👍'] || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => addReaction('❤️')}
            >
              <Text style={styles.reactionEmoji}>❤️</Text>
              <Text style={styles.reactionCount}>
                {report.reaction_counts?.['❤️'] || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => addReaction('😂')}
            >
              <Text style={styles.reactionEmoji}>😂</Text>
              <Text style={styles.reactionCount}>
                {report.reaction_counts?.['😂'] || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => addReaction('🔥')}
            >
              <Text style={styles.reactionEmoji}>🔥</Text>
              <Text style={styles.reactionCount}>
                {report.reaction_counts?.['🔥'] || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => addReaction('🎉')}
            >
              <Text style={styles.reactionEmoji}>🎉</Text>
              <Text style={styles.reactionCount}>
                {report.reaction_counts?.['🎉'] || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reportDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  reportAuthor: {
    fontSize: 14,
    color: '#666',
  },
  reportContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 15,
  },
  reportFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  reportTimestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  reactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactions: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  reactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reactionsHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
  addReactionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReactionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reactionChipPressed: {
    backgroundColor: '#e0e0e0',
    transform: [{ scale: 0.95 }],
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  reactionChipEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionChipCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  noReactionsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noReactionsText: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  addFirstReactionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addFirstReactionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emojiButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
  },
  emojiText: {
    fontSize: 24,
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  cancelModalButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  // Reaction details modal styles
  reactionDetailsHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reactionDetailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  reactionDetailsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  reactionDetailsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  reactionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  reactionDetailEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  reactionDetailInfo: {
    flex: 1,
  },
  reactionDetailUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reactionDetailTime: {
    fontSize: 12,
    color: '#666',
  },
  removeReactionButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeReactionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ReportDetailScreen;
