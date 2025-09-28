'use client';

import React, { useState } from 'react';
import { PostCreate } from '@/types';
import { apiService } from '@/services/api';

interface CreatePostScreenProps {
  onBack: () => void;
  onPostCreated?: () => void;
}

export default function CreatePostScreen({ onBack, onPostCreated }: CreatePostScreenProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('Please enter some content for your post');
      return;
    }

    try {
      setIsLoading(true);
      const postData: PostCreate = {
        content: content.trim(),
      };

      await apiService.createPost(postData);
      
      // Reset form and handle navigation
      setContent('');
      
      alert('Post created successfully!');
      onPostCreated?.();
      onBack();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim()) {
      if (confirm('Are you sure you want to discard your post?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">📝 Create Post</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Content Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, updates, or news with the badminton community..."
              rows={6}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {content.length}/500 characters
              </div>
              <div className="text-xs text-gray-400">
                💡 Tip: Share match results, tournament updates, or training tips!
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading || !content.trim()
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Posting...
                </div>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
