'use client';

import React, { useState, useEffect } from 'react';
import { Report, ReportReactionCreate, ReportUpdate } from '@/types';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ReportsScreenProps {
  onReportClick?: (report: Report) => void;
  onCreateReport?: () => void;
  onUnseenCountUpdate?: () => void;
}

export default function ReportsScreen({ onReportClick, onCreateReport, onUnseenCountUpdate }: ReportsScreenProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unseenCount, setUnseenCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [addingReaction, setAddingReaction] = useState<{ [reportId: number]: boolean }>({});
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [editingReport, setEditingReport] = useState<number | null>(null);
  const [deletingReport, setDeletingReport] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    event_date: '',
    content: ''
  });
  const { user: currentUser } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 20,
    total: 0,
    has_more: false
  });

  useEffect(() => {
    loadReports();
    loadUnseenCount();
  }, []);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReactionPicker) {
        setShowReactionPicker(null);
      }
    };

    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReactionPicker]);

  useEffect(() => {
    if (searchText || dateFrom || dateTo) {
      loadReports(true);
    }
  }, [searchText, dateFrom, dateTo]);

  const loadReports = async (reset = false) => {
    try {
      setIsLoading(true);
      setError('');

      const currentSkip = reset ? 0 : pagination.skip;
      const params: Record<string, string | number> = {
        skip: currentSkip,
        limit: pagination.limit,
      };
      
      if (searchText.trim()) {
        params.search_text = searchText.trim();
      }
      if (dateFrom) {
        params.event_date_from = dateFrom;
      }
      if (dateTo) {
        params.event_date_to = dateTo;
      }

      const response = await apiService.getReports(params);
      
      
      if (reset) {
        setReports(response.reports);
        setPagination(response.pagination);
      } else {
        setReports(prev => {
          // Filter out any duplicate reports by ID
          const existingIds = new Set(prev.map(r => r.id));
          const newReports = response.reports.filter(r => !existingIds.has(r.id));
          return [...prev, ...newReports];
        });
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      setError('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnseenCount = async () => {
    try {
      const response = await apiService.getUnseenReportsCount();
      setUnseenCount(response.unseen_count);
    } catch (error) {
      console.error('Failed to load unseen count:', error);
    }
  };

  const markReportAsSeen = async (reportId: number) => {
    try {
      await apiService.markReportSeen(reportId);
      // Update the report in the list to mark it as seen
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, has_seen: true } : report
      ));
      // Update unseen count
      setUnseenCount(prev => Math.max(0, prev - 1));
      // Update parent's unseen count
      onUnseenCountUpdate?.();
    } catch (error) {
      console.error('Failed to mark report as seen:', error);
    }
  };

  const toggleReaction = async (reportId: number, emoji: string) => {
    try {
      setAddingReaction(prev => ({ ...prev, [reportId]: true }));
      
      // Check if user already reacted with this emoji
      const report = reports.find(r => r.id === reportId);
      const userReaction = report?.reactions?.find(r => r.user_id === currentUser?.id && r.emoji === emoji);
      
      if (userReaction) {
        // Remove reaction
        await apiService.removeReportReaction(reportId, userReaction.id);
      } else {
        // Add reaction
        const reactionData: ReportReactionCreate = { emoji };
        await apiService.addReportReaction(reportId, reactionData);
      }
      
      // Update the specific report's reaction counts instead of reloading all
      const updatedReport = await apiService.getReport(reportId);
      setReports(prev => prev.map(report => 
        report.id === reportId ? updatedReport : report
      ));
    } catch (err) {
      console.error('Error toggling reaction:', err);
      alert('Failed to update reaction');
    } finally {
      setAddingReaction(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const handleEdit = (report: Report) => {
    setEditData({
      event_date: report.event_date,
      content: report.content
    });
    setEditingReport(report.id);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;
    
    try {
      const updateData: ReportUpdate = {
        event_date: editData.event_date,
        content: editData.content
      };
      await apiService.updateReport(editingReport, updateData);
      
      // Update the specific report
      const updatedReport = await apiService.getReport(editingReport);
      setReports(prev => prev.map(report => 
        report.id === editingReport ? updatedReport : report
      ));
      
      setEditingReport(null);
      setEditData({ event_date: '', content: '' });
      alert('Report updated successfully!');
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report');
    }
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditData({ event_date: '', content: '' });
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingReport(reportId);
      await apiService.deleteReport(reportId);
      
      // Remove the report from the list
      setReports(prev => prev.filter(report => report.id !== reportId));
      onUnseenCountUpdate?.(); // Update unseen count
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    } finally {
      setDeletingReport(null);
    }
  };

  const handleReportClick = (report: Report) => {
    // Mark as seen if not already seen
    if (!report.has_seen) {
      markReportAsSeen(report.id);
    }
    onReportClick?.(report);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const clearFilters = () => {
    setSearchText('');
    setDateFrom('');
    setDateTo('');
    setShowFilters(false);
    loadReports(true);
  };

  const handleSearch = () => {
    loadReports(true);
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading reports...</span>
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📰 Reports</h2>
              <p className="text-gray-600 mt-1">Newsletter and event reports</p>
              {unseenCount > 0 && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                  {unseenCount} unread report{unseenCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search reports..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reports List */}
        <div className="divide-y divide-gray-200">
          {error && (
            <div className="p-6 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => loadReports(true)}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {reports.length === 0 && !isLoading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-lg">No reports found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchText || dateFrom || dateTo 
                  ? 'Try adjusting your search criteria' 
                  : 'Reports will appear here once they are created'}
              </p>
            </div>
          ) : (
            reports.map((report, index) => (
              <div
                key={`report-${report.id}-${index}`}
                onClick={() => handleReportClick(report)}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !report.has_seen ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {formatDate(report.event_date)}
                      </span>
                      {!report.has_seen && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    {editingReport === report.id ? (
                      <div className="mb-3 space-y-3">
                        <div>
                          <input
                            type="date"
                            value={editData.event_date}
                            onChange={(e) => setEditData(prev => ({ ...prev, event_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <textarea
                            value={editData.content}
                            onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                            rows={4}
                            maxLength={2000}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-sm"
                            placeholder="Write your report content here..."
                          />
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">
                              {editData.content.length}/2000 characters
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            disabled={!editData.event_date || !editData.content.trim()}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-700 mb-3 line-clamp-3">
                        {report.content}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>by {report.created_by?.full_name || `User ${report.created_by_id}`}</span>
                      <span>{formatDateTime(report.created_at)}</span>
                    </div>

                    {/* Reaction Section */}
                    <div className="mt-3 flex items-center space-x-2">
                      {/* Emoji Picker Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReactionPicker(report.id);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">React</span>
                      </button>

                      {/* Reaction Counts */}
                      {report.reaction_counts && Object.entries(report.reaction_counts).map(([emoji, count]) => {
                        const userReaction = report.reactions?.find(r => r.user_id === currentUser?.id && r.emoji === emoji);
                        return (
                          <button
                            key={`${report.id}-reaction-${emoji}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReaction(report.id, emoji);
                            }}
                            disabled={addingReaction[report.id]}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full border transition-colors text-sm ${
                              userReaction 
                                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                            } ${addingReaction[report.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span>{emoji}</span>
                            <span className="font-medium">{count}</span>
                          </button>
                        );
                      })}

                      {/* Reaction Picker Popup */}
                      {showReactionPicker === report.id && (
                        <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1">
                          {['👍', '❤️', '🎉', '😊', '🔥', '👏'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReaction(report.id, emoji);
                                setShowReactionPicker(null);
                              }}
                              className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    {/* Edit/Delete buttons for own reports */}
                    {currentUser?.id === report.created_by_id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(report);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Report"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(report.id);
                          }}
                          disabled={deletingReport === report.id}
                          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete Report"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                    {/* Arrow icon */}
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Load More */}
          {pagination.has_more && (
            <div className="p-6 text-center">
              <button
                onClick={() => {
                  setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }));
                  loadReports(false);
                }}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {onCreateReport && (
          <button
            onClick={onCreateReport}
            className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
            title="Create New Report"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
