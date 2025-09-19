import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Report, ReportReactionCreate } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportDetailScreen = ({ navigation, route }: any) => {
  const { report: initialReport } = route.params;
  const [report, setReport] = useState<Report>(initialReport);
  const [loading, setLoading] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [showReactionDetailsModal, setShowReactionDetailsModal] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [selectedEmojiReactions, setSelectedEmojiReactions] = useState<any[]>([]);
  const { user } = useAuth();

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💪', '🏆'];

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
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateReport', { report })}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
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
          <View style={styles.reactionsHeader}>
            <Text style={styles.reactionsTitle}>Reactions</Text>
            <TouchableOpacity
              style={styles.addReactionButton}
              onPress={() => setShowReactionModal(true)}
            >
              <Text style={styles.addReactionButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.reactionsHint}>
            Tap to react • Hold to see who reacted
          </Text>

          {report.reaction_counts && Object.keys(report.reaction_counts).length > 0 ? (
            <View style={styles.reactionsGrid}>
              {Object.entries(report.reaction_counts).map(([emoji, count]) => (
                <Pressable
                  key={emoji}
                  style={({ pressed }) => [
                    styles.reactionChip,
                    pressed && styles.reactionChipPressed
                  ]}
                  onPress={() => {
                    // Find the first reaction with this emoji to get its ID
                    const reaction = report.reactions?.find(r => r.emoji === emoji);
                    if (reaction && reaction.user_id === user?.id) {
                      handleRemoveReaction(reaction.id);
                    } else {
                      handleReaction(emoji);
                    }
                  }}
                  onLongPress={() => showReactionDetails(emoji)}
                  delayLongPress={500}
                >
                  <Text style={styles.reactionChipEmoji}>{emoji}</Text>
                  <Text style={styles.reactionChipCount}>{count}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.noReactionsContainer}>
              <Text style={styles.noReactionsText}>No reactions yet</Text>
              <TouchableOpacity
                style={styles.addFirstReactionButton}
                onPress={() => setShowReactionModal(true)}
              >
                <Text style={styles.addFirstReactionText}>Add first reaction</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showReactionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Reaction</Text>
            <View style={styles.emojisGrid}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowReactionModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReactionDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReactionDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.reactionDetailsHeader}>
              <Text style={styles.reactionDetailsTitle}>
                {selectedEmoji} Reactions
              </Text>
              <Text style={styles.reactionDetailsSubtitle}>
                {selectedEmojiReactions.length} {selectedEmojiReactions.length === 1 ? 'person' : 'people'} reacted
              </Text>
            </View>
            
            <ScrollView style={styles.reactionDetailsList} showsVerticalScrollIndicator={false}>
              {selectedEmojiReactions.map((reaction, index) => (
                <View key={reaction.id || index} style={styles.reactionDetailItem}>
                  <Text style={styles.reactionDetailEmoji}>{reaction.emoji}</Text>
                  <View style={styles.reactionDetailInfo}>
                    <Text style={styles.reactionDetailUserName}>
                      {reaction.user?.full_name || `User ${reaction.user_id}`}
                    </Text>
                    <Text style={styles.reactionDetailTime}>
                      {formatDateTime(reaction.created_at)}
                    </Text>
                  </View>
                  {reaction.user_id === user?.id && (
                    <TouchableOpacity
                      style={styles.removeReactionButton}
                      onPress={() => {
                        handleRemoveReaction(reaction.id);
                        setShowReactionDetailsModal(false);
                      }}
                    >
                      <Text style={styles.removeReactionText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowReactionDetailsModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
