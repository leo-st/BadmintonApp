'use client';

import React, { useState } from 'react';
import { ReportCreate } from '@/types';
import { apiService } from '@/services/api';

interface CreateReportScreenProps {
  onBack: () => void;
  onReportCreated: () => void;
}

export default function CreateReportScreen({ onBack, onReportCreated }: CreateReportScreenProps) {
  const [eventDate, setEventDate] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const MAX_CHARS = 2000;

  const handleSubmit = async () => {
    if (!eventDate || !content.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    if (content.length > MAX_CHARS) {
      alert(`Content is too long. Maximum ${MAX_CHARS} characters allowed.`);
      return;
    }

    try {
      setIsLoading(true);
      const reportData: ReportCreate = {
        event_date: eventDate,
        content: content.trim(),
      };
      
      await apiService.createReport(reportData);
      alert('Report created successfully!');
      onReportCreated(); // Navigate back to reports and refresh
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Error: Failed to create report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() && !confirm('Are you sure you want to discard this report?')) {
      return;
    }
    onBack();
  };

  // Set default date to today
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setEventDate(today);
  }, []);

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleCancel}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">📰 Create New Report</h2>
            <button
              onClick={() => setContent('')}
              className="px-3 py-1 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Date *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The date this report relates to (e.g., tournament date, event date)
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your report content here..."
              rows={12}
              maxLength={MAX_CHARS}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-base"
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Write about events, tournaments, match results, or any other news
              </p>
              <p className="text-xs text-gray-500">
                {content.length}/{MAX_CHARS}
              </p>
            </div>
          </div>

          {/* Preview */}
          {content.trim() && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No date selected'}
                  </span>
                  <span className="text-sm text-gray-500">by You</span>
                </div>
                <div className="text-gray-800 whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !eventDate || !content.trim()}
            className={`w-full py-3 px-4 rounded-md text-white text-lg font-semibold transition-colors ${
              isLoading || !eventDate || !content.trim()
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="ml-2">Creating Report...</span>
              </div>
            ) : (
              'Create Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
