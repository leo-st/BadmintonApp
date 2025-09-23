import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Post, PostCreate, PostUpdate, Comment, CommentCreate, CommentUpdate, Attachment, AttachmentCreate } from '../types';
import { FloatingActionButton } from '../components/FloatingActionButton';

export const PostsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showComments, setShowComments] = useState<{ [postId: number]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  const [postComments, setPostComments] = useState<{ [postId: number]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: number]: boolean }>({});
  const [editingPost, setEditingPost] = useState<{ [postId: number]: boolean }>({});
  const [editingComment, setEditingComment] = useState<{ [commentId: number]: boolean }>({});
  const [editPostContent, setEditPostContent] = useState<{ [postId: number]: string }>({});
  const [editCommentContent, setEditCommentContent] = useState<{ [commentId: number]: string }>({});
  const [showAttachmentModal, setShowAttachmentModal] = useState<{ [attachmentId: number]: boolean }>({});
  const [newPostAttachments, setNewPostAttachments] = useState<AttachmentCreate[]>([]);
  const [newCommentAttachments, setNewCommentAttachments] = useState<{ [postId: number]: AttachmentCreate[] }>({});
  const [editPostAttachments, setEditPostAttachments] = useState<{ [postId: number]: Attachment[] }>({});
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<{ [postId: number]: number[] }>({});

  const navigateToUserProfile = (userId: number) => {
    (navigation as any).navigate('Profile', { userId });
  };

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use normalized endpoint for better performance
      const response = await apiService.getPostsNormalized({ limit: 20 });
      
      // Reconstruct full post objects by joining posts with users
      const reconstructedPosts: Post[] = response.posts.map(post => {
        const user = response.users[post.user_id.toString()];
        return {
          ...post,
          user: user || { id: post.user_id, username: 'Unknown', email: '', full_name: '', is_active: true, created_at: new Date().toISOString(), role_id: 0, permissions: [], medals: { gold: 0, silver: 0, bronze: 0, wood: 0 }, profile_picture_url: null, profile_picture_updated_at: null }
        };
      });
      
      setPosts(reconstructedPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
      console.error('Error details:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.username]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const createPost = async () => {
    if (!newPostContent.trim() && newPostAttachments.length === 0) return;
    
    try {
      const postData: PostCreate = {
        content: newPostContent.trim(),
      };
      
      const newPost = await apiService.createPost(postData);
      if (newPost) {
        // Add attachments if any
        for (const attachment of newPostAttachments) {
          try {
            await apiService.addAttachmentToPost(newPost.id, attachment);
          } catch (error) {
            console.error('Failed to add attachment:', error);
          }
        }
        
        setPosts(prev => [newPost, ...prev]);
        setNewPostContent('');
        setNewPostAttachments([]);
        setShowCreatePost(false);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const addReaction = async (postId: number, emoji: string) => {
    try {
      await apiService.addReactionToPost(postId, { emoji });
      // Refresh posts to get updated reaction counts
      await loadPosts();
    } catch (error) {
      console.error('Failed to add reaction:', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const loadComments = async (postId: number) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const comments = await apiService.getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = async (postId: number) => {
    const isShowing = showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: !isShowing }));
    
    if (!isShowing && !postComments[postId]) {
      await loadComments(postId);
    }
  };

  const addComment = async (postId: number) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;
    
    try {
      const commentData: CommentCreate = {
        content: commentText.trim(),
      };
      
      const newComment = await apiService.createComment(postId, commentData);
      if (newComment) {
        // Refresh comments for this post
        await loadComments(postId);
        // Update comment count by refreshing posts
        await loadPosts();
        // Clear the input
        setNewComment(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const editPost = async (postId: number) => {
    const content = editPostContent[postId];
    if (!content?.trim()) return;
    
    try {
      const updateData: PostUpdate = {
        content: content.trim(),
      };
      
      await apiService.updatePost(postId, updateData);
      
      // Handle attachment deletions
      const attachmentsToDeleteList = attachmentsToDelete[postId] || [];
      for (const attachmentId of attachmentsToDeleteList) {
        try {
          await apiService.deleteAttachment(attachmentId);
        } catch (error) {
          console.error('Failed to delete attachment:', error);
        }
      }
      
      // Handle new attachments
      for (const attachment of newPostAttachments) {
        try {
          await apiService.addAttachmentToPost(postId, attachment);
        } catch (error) {
          console.error('Failed to add attachment:', error);
        }
      }
      
      setEditingPost(prev => ({ ...prev, [postId]: false }));
      setEditPostContent(prev => ({ ...prev, [postId]: '' }));
      setEditPostAttachments(prev => ({ ...prev, [postId]: [] }));
      setAttachmentsToDelete(prev => ({ ...prev, [postId]: [] }));
      setNewPostAttachments([]);
      await loadPosts();
    } catch (error) {
      console.error('Failed to update post:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  const deletePost = async (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This will also delete all comments and attachments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiService.deletePost(postId);
              setPosts(prev => prev.filter(p => p.id !== postId));
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const editComment = async (commentId: number) => {
    const content = editCommentContent[commentId];
    if (!content?.trim()) return;
    
    try {
      const updateData: CommentUpdate = {
        content: content.trim(),
      };
      
      await apiService.updateComment(commentId, updateData);
      setEditingComment(prev => ({ ...prev, [commentId]: false }));
      setEditCommentContent(prev => ({ ...prev, [commentId]: '' }));
      
      // Find the post ID for this comment and refresh comments
      const postId = Object.keys(postComments).find(pid => 
        postComments[parseInt(pid)].some(c => c.id === commentId)
      );
      if (postId) {
        await loadComments(parseInt(postId));
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const deleteComment = async (commentId: number) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiService.deleteComment(commentId);
              
              // Find the post ID for this comment and refresh comments
              const postId = Object.keys(postComments).find(pid => 
                postComments[parseInt(pid)].some(c => c.id === commentId)
              );
              if (postId) {
                await loadComments(parseInt(postId));
                await loadPosts(); // Update comment count
              }
            } catch (error) {
              console.error('Failed to delete comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleAttachmentPress = (attachment: Attachment) => {
    setShowAttachmentModal(prev => ({ ...prev, [attachment.id]: true }));
  };

  const addAttachmentToPost = () => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Image', onPress: () => addAttachment('image') },
        { text: 'Video', onPress: () => addAttachment('video') },
        { text: 'Document', onPress: () => addAttachment('document') },
        { text: 'Link', onPress: () => addAttachment('link') },
        { text: 'Audio', onPress: () => addAttachment('audio') },
      ]
    );
  };

  const addAttachment = (type: string) => {
    Alert.prompt(
      'Add Attachment',
      `Enter ${type} URL or path:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (url: string | undefined) => {
            if (url?.trim()) {
              const attachment: AttachmentCreate = {
                file_type: type as any,
                file_name: `${type}_${Date.now()}`,
                file_path: url.trim(),
                file_size: 0,
                file_metadata: {},
              };
              setNewPostAttachments(prev => [...prev, attachment]);
            }
          },
        },
      ]
    );
  };

  const removeAttachmentFromPost = (index: number) => {
    setNewPostAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startEditingPost = (postId: number) => {
    setEditingPost(prev => ({ ...prev, [postId]: true }));
    setEditPostContent(prev => ({ ...prev, [postId]: posts.find(p => p.id === postId)?.content || '' }));
    setEditPostAttachments(prev => ({ ...prev, [postId]: posts.find(p => p.id === postId)?.attachments || [] }));
    setAttachmentsToDelete(prev => ({ ...prev, [postId]: [] }));
  };

  const cancelEditingPost = (postId: number) => {
    setEditingPost(prev => ({ ...prev, [postId]: false }));
    setEditPostContent(prev => ({ ...prev, [postId]: '' }));
    setEditPostAttachments(prev => ({ ...prev, [postId]: [] }));
    setAttachmentsToDelete(prev => ({ ...prev, [postId]: [] }));
  };

  const markAttachmentForDeletion = (postId: number, attachmentId: number) => {
    setAttachmentsToDelete(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), attachmentId]
    }));
  };

  const unmarkAttachmentForDeletion = (postId: number, attachmentId: number) => {
    setAttachmentsToDelete(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(id => id !== attachmentId)
    }));
  };

  const addAttachmentToEditPost = (postId: number) => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Image', onPress: () => addAttachmentToEdit(postId, 'image') },
        { text: 'Video', onPress: () => addAttachmentToEdit(postId, 'video') },
        { text: 'Document', onPress: () => addAttachmentToEdit(postId, 'document') },
        { text: 'Link', onPress: () => addAttachmentToEdit(postId, 'link') },
        { text: 'Audio', onPress: () => addAttachmentToEdit(postId, 'audio') },
      ]
    );
  };

  const addAttachmentToEdit = (postId: number, type: string) => {
    Alert.prompt(
      'Add Attachment',
      `Enter ${type} URL or path:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (url: string | undefined) => {
            if (url?.trim()) {
              const attachment: AttachmentCreate = {
                file_type: type as any,
                file_name: `${type}_${Date.now()}`,
                file_path: url.trim(),
                file_size: 0,
                file_metadata: {},
              };
              // Add to new attachments for this post
              setNewPostAttachments(prev => [...prev, attachment]);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.file_type === 'image' || attachment.file_type === 'gif';
    const isVideo = attachment.file_type === 'video';
    const isDocument = attachment.file_type === 'document';
    const isLink = attachment.file_type === 'link';
    const isAudio = attachment.file_type === 'audio';

    return (
      <TouchableOpacity
        key={attachment.id}
        style={styles.attachment}
        onPress={() => handleAttachmentPress(attachment)}
      >
        {isImage ? (
          <Image
            source={{ uri: attachment.file_path }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />
        ) : isVideo ? (
          <View style={styles.attachmentVideo}>
            <Text style={styles.attachmentIcon}>🎥</Text>
            <Text style={styles.attachmentText}>{attachment.file_name || 'Unknown'}</Text>
          </View>
        ) : isDocument ? (
          <View style={styles.attachmentDocument}>
            <Text style={styles.attachmentIcon}>📄</Text>
            <Text style={styles.attachmentText}>{attachment.file_name || 'Unknown'}</Text>
          </View>
        ) : isLink ? (
          <View style={styles.attachmentLink}>
            <Text style={styles.attachmentIcon}>🔗</Text>
            <Text style={styles.attachmentText}>{attachment.file_name || 'Unknown'}</Text>
          </View>
        ) : isAudio ? (
          <View style={styles.attachmentAudio}>
            <Text style={styles.attachmentIcon}>🎵</Text>
            <Text style={styles.attachmentText}>{attachment.file_name || 'Unknown'}</Text>
          </View>
        ) : (
          <View style={styles.attachmentGeneric}>
            <Text style={styles.attachmentIcon}>📎</Text>
            <Text style={styles.attachmentText}>{attachment.file_name || 'Unknown'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Error: {error}</Text>
        <TouchableOpacity onPress={loadPosts} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Create Post Form */}
      {showCreatePost && (
        <View style={styles.createPostForm}>
          <TextInput
            style={styles.postInput}
            placeholder="What's happening in badminton today?"
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            maxLength={500}
          />
          
          {/* Attachments */}
          {newPostAttachments.length > 0 && (
            <View style={styles.attachments}>
              {newPostAttachments.map((attachment, index) => (
                <View key={index} style={styles.attachmentPreview}>
                  <Text style={styles.attachmentPreviewText}>
                    {attachment.file_type === 'image' ? '🖼️' : 
                     attachment.file_type === 'video' ? '🎥' : 
                     attachment.file_type === 'document' ? '📄' : 
                     attachment.file_type === 'link' ? '🔗' : 
                     attachment.file_type === 'audio' ? '🎵' : '📎'} {attachment.file_name || 'Unknown'}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeAttachmentButton}
                    onPress={() => removeAttachmentFromPost(index)}
                  >
                    <Text style={styles.removeAttachmentText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.createPostActions}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={addAttachmentToPost}
            >
              <Text style={styles.attachmentButtonText}>📎 Add Attachment</Text>
            </TouchableOpacity>
            
            <View style={styles.createPostButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreatePost(false);
                  setNewPostContent('');
                  setNewPostAttachments([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={createPost}
              >
                <Text style={styles.submitButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.postsList}>
        {posts.map((post) => {
          const isOwner = user?.id === post.user_id;
          const isEditing = editingPost[post.id];
          

          return (
            <View key={post.id} style={styles.post}>
              <View style={styles.postHeader}>
                <View style={styles.postAuthorContainer}>
                  {post.user?.profile_picture_url ? (
                    <Image 
                      source={{ uri: `http://localhost:8000${post.user.profile_picture_url}` }}
                      style={styles.postAuthorAvatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.postAuthorAvatarPlaceholder}>
                      <Text style={styles.postAuthorAvatarText}>👤</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => post.user && navigateToUserProfile(post.user.id)}>
                    <Text style={styles.postAuthor}>{post.user?.username || 'Unknown'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.postHeaderRight}>
                  <Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                  {isOwner && (
                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          if (isEditing) {
                            editPost(post.id);
                          } else {
                            startEditingPost(post.id);
                          }
                        }}
                      >
                        <Text style={styles.actionButtonText}>
                          {isEditing ? '💾' : '✏️'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deletePost(post.id)}
                      >
                        <Text style={styles.actionButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editPostContent[post.id] || ''}
                    onChangeText={(text) => setEditPostContent(prev => ({ ...prev, [post.id]: text }))}
                    multiline
                    placeholder="Edit your post..."
                  />
                  
                  {/* Existing Attachments in Edit Mode */}
                  {editPostAttachments[post.id] && editPostAttachments[post.id].length > 0 && (
                    <View style={styles.editAttachments}>
                      <Text style={styles.editAttachmentsTitle}>Attachments:</Text>
                      {editPostAttachments[post.id].map((attachment) => {
                        const isMarkedForDeletion = (attachmentsToDelete[post.id] || []).includes(attachment.id);
                        return (
                          <View key={attachment.id} style={[styles.editAttachmentItem, isMarkedForDeletion && styles.markedForDeletion]}>
                            <Text style={styles.editAttachmentText}>
                              {attachment.file_type === 'image' ? '🖼️' : 
                               attachment.file_type === 'video' ? '🎥' : 
                               attachment.file_type === 'document' ? '📄' : 
                               attachment.file_type === 'link' ? '🔗' : 
                               attachment.file_type === 'audio' ? '🎵' : '📎'} {attachment.file_name || 'Unknown'}
                            </Text>
                            <TouchableOpacity
                              style={styles.editAttachmentButton}
                              onPress={() => {
                                if (isMarkedForDeletion) {
                                  unmarkAttachmentForDeletion(post.id, attachment.id);
                                } else {
                                  markAttachmentForDeletion(post.id, attachment.id);
                                }
                              }}
                            >
                              <Text style={styles.editAttachmentButtonText}>
                                {isMarkedForDeletion ? '↩️' : '🗑️'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  
                  {/* New Attachments in Edit Mode */}
                  {newPostAttachments.length > 0 && (
                    <View style={styles.editAttachments}>
                      <Text style={styles.editAttachmentsTitle}>New Attachments:</Text>
                      {newPostAttachments.map((attachment, index) => (
                        <View key={index} style={styles.editAttachmentItem}>
                          <Text style={styles.editAttachmentText}>
                            {attachment.file_type === 'image' ? '🖼️' : 
                             attachment.file_type === 'video' ? '🎥' : 
                             attachment.file_type === 'document' ? '📄' : 
                             attachment.file_type === 'link' ? '🔗' : 
                             attachment.file_type === 'audio' ? '🎵' : '📎'} {attachment.file_name || 'Unknown'}
                          </Text>
                          <TouchableOpacity
                            style={styles.editAttachmentButton}
                            onPress={() => removeAttachmentFromPost(index)}
                          >
                            <Text style={styles.editAttachmentButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Add Attachment Button in Edit Mode */}
                  <TouchableOpacity 
                    style={styles.editAddAttachmentButton}
                    onPress={() => addAttachmentToEditPost(post.id)}
                  >
                    <Text style={styles.editAddAttachmentButtonText}>📎 Add Attachment</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.cancelButton]}
                      onPress={() => cancelEditingPost(post.id)}
                    >
                      <Text style={styles.editButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveButton]}
                      onPress={() => editPost(post.id)}
                    >
                      <Text style={styles.editButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.postContent}>{post.content || ''}</Text>
              )}

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <View style={styles.attachments}>
                  {post.attachments.map(renderAttachment)}
                </View>
              )}
            
            {/* Reactions */}
            <View style={styles.reactions}>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => addReaction(post.id, '👍')}
              >
                <Text style={styles.reactionEmoji}>👍</Text>
                <Text style={styles.reactionCount}>
                  {post.reaction_counts?.['👍'] || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => addReaction(post.id, '❤️')}
              >
                <Text style={styles.reactionEmoji}>❤️</Text>
                <Text style={styles.reactionCount}>
                  {post.reaction_counts?.['❤️'] || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => addReaction(post.id, '😂')}
              >
                <Text style={styles.reactionEmoji}>😂</Text>
                <Text style={styles.reactionCount}>
                  {post.reaction_counts?.['😂'] || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => addReaction(post.id, '🔥')}
              >
                <Text style={styles.reactionEmoji}>🔥</Text>
                <Text style={styles.reactionCount}>
                  {post.reaction_counts?.['🔥'] || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.commentButton}
                onPress={() => toggleComments(post.id)}
              >
                <Text style={styles.commentButtonText}>
                  💬 {post.comment_count || 0} comments
                </Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            {showComments[post.id] && (
              <View style={styles.commentsSection}>
                {loadingComments[post.id] ? (
                  <Text style={styles.loadingText}>Loading comments...</Text>
                ) : (
                  <>
                    {postComments[post.id] && postComments[post.id].map((comment) => {
                      const isCommentOwner = user?.id === comment.user_id;
                      const isEditingComment = editingComment[comment.id];

                      return (
                        <View key={comment.id} style={styles.comment}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentAuthorContainer}>
                              {comment.user?.profile_picture_url ? (
                                <Image 
                                  source={{ uri: `http://localhost:8000${comment.user.profile_picture_url}` }}
                                  style={styles.commentAuthorAvatar}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.commentAuthorAvatarPlaceholder}>
                                  <Text style={styles.commentAuthorAvatarText}>👤</Text>
                                </View>
                              )}
                              <TouchableOpacity onPress={() => comment.user && navigateToUserProfile(comment.user.id)}>
                                <Text style={styles.commentAuthor}>{comment.user?.username || 'Unknown'}</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.commentHeaderRight}>
                              <Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                              {isCommentOwner && (
                                <View style={styles.commentActions}>
                                  <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                      if (isEditingComment) {
                                        editComment(comment.id);
                                      } else {
                                        setEditingComment(prev => ({ ...prev, [comment.id]: true }));
                                        setEditCommentContent(prev => ({ ...prev, [comment.id]: comment.content }));
                                      }
                                    }}
                                  >
                                    <Text style={styles.actionButtonText}>
                                      {isEditingComment ? '💾' : '✏️'}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => deleteComment(comment.id)}
                                  >
                                    <Text style={styles.actionButtonText}>🗑️</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          </View>

                          {isEditingComment ? (
                            <View style={styles.editContainer}>
                              <TextInput
                                style={styles.editInput}
                                value={editCommentContent[comment.id] || ''}
                                onChangeText={(text) => setEditCommentContent(prev => ({ ...prev, [comment.id]: text }))}
                                multiline
                                placeholder="Edit your comment..."
                              />
                              <View style={styles.editActions}>
                                <TouchableOpacity
                                  style={[styles.editButton, styles.cancelButton]}
                                  onPress={() => {
                                    setEditingComment(prev => ({ ...prev, [comment.id]: false }));
                                    setEditCommentContent(prev => ({ ...prev, [comment.id]: '' }));
                                  }}
                                >
                                  <Text style={styles.editButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.editButton, styles.saveButton]}
                                  onPress={() => editComment(comment.id)}
                                >
                                  <Text style={styles.editButtonText}>Save</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.commentContent}>{comment.content}</Text>
                          )}

                          {/* Comment Attachments */}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <View style={styles.attachments}>
                              {comment.attachments.map(renderAttachment)}
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* Add Comment */}
                    <View style={styles.addComment}>
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Add a comment..."
                        value={newComment[post.id] || ''}
                        onChangeText={(text) => setNewComment(prev => ({ ...prev, [post.id]: text }))}
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.commentSubmitButton}
                        onPress={() => addComment(post.id)}
                      >
                        <Text style={styles.commentSubmitText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        );
        })}
        
        {posts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Attachment Modal */}
      {Object.keys(showAttachmentModal).map(attachmentId => {
        const attachment = posts
          .flatMap(p => p.attachments || [])
          .concat(
            Object.values(postComments).flatMap(comments => 
              comments.flatMap(c => c.attachments || [])
            )
          )
          .find(a => a.id === parseInt(attachmentId));
        
        if (!attachment || !showAttachmentModal[parseInt(attachmentId)]) return null;
        
        return (
          <Modal
            key={attachmentId}
            visible={showAttachmentModal[parseInt(attachmentId)]}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAttachmentModal(prev => ({ ...prev, [parseInt(attachmentId)]: false }))}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAttachmentModal(prev => ({ ...prev, [parseInt(attachmentId)]: false }))}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
                
                {attachment.file_type === 'image' || attachment.file_type === 'gif' ? (
                  <Image
                    source={{ uri: attachment.file_path }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.modalFileInfo}>
                    <Text style={styles.modalFileIcon}>
                      {attachment.file_type === 'video' ? '🎥' : 
                       attachment.file_type === 'document' ? '📄' : 
                       attachment.file_type === 'audio' ? '🎵' : '📎'}
                    </Text>
                    <Text style={styles.modalFileName}>{attachment.file_name || 'Unknown'}</Text>
                    <Text style={styles.modalFileType}>{(attachment.file_type || 'unknown').toUpperCase()}</Text>
                    {attachment.file_size && (
                      <Text style={styles.modalFileSize}>
                        {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </Modal>
        );
      })}
      
      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setShowCreatePost(!showCreatePost)}
        icon="+"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  postsList: {
    flex: 1,
    padding: 10,
  },
  post: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  createPostForm: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createPostActions: {
    marginTop: 10,
  },
  createPostButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  attachmentButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  attachmentButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  attachmentPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  removeAttachmentButton: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeAttachmentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  commentButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  commentsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  comment: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 10,
    color: '#999',
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  commentSubmitText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postAuthorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  postAuthorAvatarText: {
    fontSize: 16,
    color: '#666',
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postActions: {
    flexDirection: 'row',
    gap: 5,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 12,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAuthorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  commentAuthorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  commentAuthorAvatarText: {
    fontSize: 12,
    color: '#666',
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 4,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  attachment: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  attachmentImage: {
    width: 100,
    height: 100,
  },
  attachmentVideo: {
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  attachmentDocument: {
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  attachmentLink: {
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  attachmentAudio: {
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  attachmentGeneric: {
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  attachmentIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  attachmentText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalImage: {
    width: 300,
    height: 300,
  },
  modalFileInfo: {
    alignItems: 'center',
    padding: 20,
  },
  modalFileIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  modalFileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalFileType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalFileSize: {
    fontSize: 12,
    color: '#999',
  },
  editAttachments: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  editAttachmentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  editAttachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  markedForDeletion: {
    backgroundColor: '#ffebee',
    opacity: 0.6,
  },
  editAttachmentText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  editAttachmentButton: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editAttachmentButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editAddAttachmentButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  editAddAttachmentButtonText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
});