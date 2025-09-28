'use client';

import React, { useState, useEffect } from 'react';
import { Post, User, Comment, ReactionCreate } from '@/types';
import { apiService } from '@/services/api';

export default function FeedScreen({ onCreatePost, onUserClick }: { onCreatePost?: () => void; onUserClick?: (userId: number) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState<{ [postId: number]: boolean }>({});
  const [postComments, setPostComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: number]: boolean }>({});
  const [addingReaction, setAddingReaction] = useState<{ [postId: number]: boolean }>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await apiService.getPostsNormalized({ limit: 20 });
      setPosts(data.posts);
      setUsers(data.users);
    } catch (error) {
      console.error('Fetch posts error:', error);
      setError('Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  const addReaction = async (postId: number, emoji: string) => {
    try {
      setAddingReaction(prev => ({ ...prev, [postId]: true }));
      await apiService.addReactionToPost(postId, { emoji });
      await fetchPosts(); // Refresh posts to get updated reaction counts
    } catch (error) {
      console.error('Failed to add reaction:', error);
      alert('Failed to add reaction');
    } finally {
      setAddingReaction(prev => ({ ...prev, [postId]: false }));
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
      await apiService.createComment(postId, { content: commentText.trim() });
      await loadComments(postId); // Refresh comments
      await fetchPosts(); // Update comment count
      setNewComment(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Feed</h2>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading posts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Feed</h2>
          <p className="text-gray-600 mt-1">Latest posts and updates from the community</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {posts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-lg">No posts found</p>
              <p className="text-gray-400 text-sm mt-2">Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => {
              // Try to get author info from multiple sources - using user_id from real API
              const author = users[post.user_id] || post.author || { 
                username: post.author_name || `User ${post.user_id}`,
                full_name: post.author_name || `User ${post.user_id}`
              };
              
              const displayName = author.full_name || author.username || post.author_name || `User ${post.user_id}`;
              const initials = displayName.charAt(0).toUpperCase();
              
              return (
                <div key={post.id} className="p-6 hover:bg-gray-50 border-b border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {initials}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <button
                          onClick={() => onUserClick?.(post.user_id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {displayName}
                        </button>
                        <span className="text-gray-500">·</span>
                        <p className="text-sm text-gray-500">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                      <div className="text-gray-900 whitespace-pre-wrap">
                        {post.content}
                      </div>
                      
                      {/* Attachments */}
                      {(post.attachments && post.attachments.length > 0) && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-500">
                            📎 {post.attachments.length} attachment(s)
                          </div>
                        </div>
                      )}

                      {/* Reaction Counts */}
                      {post.reaction_counts && Object.keys(post.reaction_counts).length > 0 && (
                        <div className="mt-3 flex items-center space-x-1">
                          {Object.entries(post.reaction_counts).map(([emoji, count]) => (
                            <span key={`${post.id}-reaction-${emoji}`} className="text-sm">
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center space-x-6">
                        {/* Reaction Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => addReaction(post.id, '👍')}
                            disabled={addingReaction[post.id]}
                            className="flex items-center space-x-1 text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                          >
                            <span>👍</span>
                            {addingReaction[post.id] && (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                            )}
                          </button>
                          <button
                            onClick={() => addReaction(post.id, '❤️')}
                            disabled={addingReaction[post.id]}
                            className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <span>❤️</span>
                          </button>
                          <button
                            onClick={() => addReaction(post.id, '🎾')}
                            disabled={addingReaction[post.id]}
                            className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
                          >
                            <span>🎾</span>
                          </button>
                        </div>

                        {/* Comment Button */}
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                          <span>💬</span>
                          <span className="text-sm">Comment</span>
                          {post.comment_count > 0 && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">
                              {post.comment_count}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments[post.id] && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          {/* Existing Comments */}
                          {loadingComments[post.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                              <span className="ml-2 text-gray-600">Loading comments...</span>
                            </div>
                          ) : postComments[post.id] && postComments[post.id].length > 0 ? (
                            <div className="space-y-3">
                              {postComments[post.id].map((comment) => (
                                <div key={comment.id} className="flex items-start space-x-2">
                                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-medium text-gray-600">
                                      {comment.user?.full_name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <button
                                          onClick={() => onUserClick?.(comment.user_id)}
                                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                        >
                                          {comment.user?.full_name || `User ${comment.user_id}`}
                                        </button>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(comment.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-800">{comment.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm text-center py-2">No comments yet</p>
                          )}

                          {/* Add Comment */}
                          <div className="mt-4 flex items-center space-x-2">
                            <input
                              type="text"
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                            />
                            <button
                              onClick={() => addComment(post.id)}
                              disabled={!newComment[post.id]?.trim()}
                              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {onCreatePost && (
        <button
          onClick={onCreatePost}
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          title="Create New Post"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}
