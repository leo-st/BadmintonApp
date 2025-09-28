'use client';

import React, { useState, useEffect } from 'react';
import { Report, ReportReactionCreate, ReportUpdate } from '@/types';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ReportDetailScreenProps {
  report: Report;
  onBack: () => void;
}

export default function ReportDetailScreen({ report: initialReport, onBack }: ReportDetailScreenProps) {
  const [report, setReport] = useState<Report>(initialReport);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingReaction, setIsAddingReaction] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    event_date: '',
    content: ''
  });
  const { user: currentUser } = useAuth();

  const isOwnReport = currentUser?.id === report.created_by_id;

  useEffect(() => {
    loadReportDetails();
  }, []);

  const loadReportDetails = async () => {
    try {
      setIsLoading(true);
      const updatedReport = await apiService.getReport(report.id);
      setReport(updatedReport);
    } catch (error) {
      console.error('Failed to load report details:', error);
      alert('Failed to load report details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      setIsAddingReaction(true);
      const reactionData: ReportReactionCreate = { emoji };
      await apiService.addReportReaction(report.id, reactionData);
      await loadReportDetails(); // Reload to get updated reactions
    } catch (error) {
      console.error('Failed to add reaction:', error);
      alert('Failed to add reaction');
    } finally {
      setIsAddingReaction(false);
    }
  };

  const handleRemoveReaction = async (reactionId: number) => {
    try {
      setIsAddingReaction(true);
      await apiService.removeReportReaction(report.id, reactionId);
      await loadReportDetails(); // Reload to get updated reactions
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      alert('Failed to remove reaction');
    } finally {
      setIsAddingReaction(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      event_date: report.event_date,
      content: report.content
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      const updateData: ReportUpdate = {
        event_date: editData.event_date,
        content: editData.content
      };
      await apiService.updateReport(report.id, updateData);
      await loadReportDetails(); // Reload to get updated data
      setIsEditing(false);
      alert('Report updated successfully!');
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      event_date: '',
      content: ''
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiService.deleteReport(report.id);
      alert('Report deleted successfully!');
      onBack(); // Go back to reports list
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
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

  // Get current user's reaction
  const userReaction = report.reactions?.find(r => r.user_id === 1); // Assuming current user ID is 1 for now

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
              <h2 className="text-2xl font-bold text-gray-900">📰 Report Details</h2>
              {isOwnReport && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEdit}
                    disabled={isLoading || isDeleting}
                    className="p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    title="Edit Report"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading || isDeleting}
                    className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete Report"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
              {!isOwnReport && <div className="w-9"></div>} {/* Spacer for centering when no buttons */}
            </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Header */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-bold text-gray-900">
                {formatDate(report.event_date)}
              </h3>
              {!report.has_seen && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  NEW
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>by {report.created_by?.full_name || `User ${report.created_by_id}`}</span>
              <span>{formatDateTime(report.created_at)}</span>
            </div>
          </div>

          {/* Report Content */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={editData.event_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Content *
                </label>
                <textarea
                  value={editData.content}
                  onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your report content here..."
                  rows={8}
                  maxLength={2000}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-base"
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {editData.content.length}/2000 characters
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading || isDeleting}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading || isDeleting || !editData.event_date || !editData.content.trim()}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
                {report.content}
              </div>
            </div>
          )}

          {/* Reactions Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Reactions</h4>
            </div>

            {/* Reaction Buttons */}
            <div className="flex items-center space-x-2">
              {['👍', '❤️', '🎉', '😊', '🔥', '👏'].map(emoji => (
                <button
                  key={`reaction-${emoji}`}
                  onClick={() => handleReaction(emoji)}
                  disabled={isAddingReaction}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-colors ${
                    userReaction?.emoji === emoji
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  <span>{emoji}</span>
                  {report.reaction_counts?.[emoji] && (
                    <span className={`${userReaction?.emoji === emoji ? 'text-white' : 'text-gray-900'} font-medium`}>
                      {report.reaction_counts[emoji]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>


    </div>
  );
}
