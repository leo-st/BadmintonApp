'use client';

import React, { useState, useEffect } from 'react';
import { Match, TournamentInvitation, User, MatchVerification } from '@/types';
import { apiService } from '@/services/api';

interface NotificationCenterProps {
  currentUser: User;
}

interface NotificationItem {
  id: string;
  type: 'match_verification' | 'tournament_invitation';
  data: Match | TournamentInvitation;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export default function NotificationCenter({ currentUser }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Auto-load notifications when component mounts (when user logs in)
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const [pendingMatches, pendingInvitations] = await Promise.all([
        apiService.getPendingVerifications(),
        apiService.getMyInvitations()
      ]);

      const notificationItems: NotificationItem[] = [];

      // Add match verification notifications
      pendingMatches.forEach(match => {
        if (canUserVerify(match)) {
          notificationItems.push({
            id: `match-${match.id}`,
            type: 'match_verification',
            data: match,
            priority: 'high',
            createdAt: match.match_date
          });
        }
      });

      // Add tournament invitation notifications
      pendingInvitations
        .filter(inv => inv.status === 'pending' && !isExpired(inv.expires_at))
        .forEach(invitation => {
          notificationItems.push({
            id: `invitation-${invitation.id}`,
            type: 'tournament_invitation',
            data: invitation,
            priority: 'medium',
            createdAt: invitation.invited_at
          });
        });

      // Sort by priority and date
      notificationItems.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setNotifications(notificationItems);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canUserVerify = (match: Match) => {
    // User can verify if they are a player and need to verify
    if (currentUser.id === match.player1_id && !match.player1_verified) {
      return true;
    }
    if (currentUser.id === match.player2_id && !match.player2_verified) {
      return true;
    }
    return false;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleVerifyMatch = async (matchId: number, verified: boolean) => {
    const key = `match-${matchId}`;
    try {
      setActionLoading(prev => ({ ...prev, [key]: true }));
      await apiService.verifyMatch(matchId, { verified });
      await loadNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to verify match:', error);
      alert('Failed to verify match');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRespondToInvitation = async (invitationId: number, status: 'accepted' | 'declined') => {
    const key = `invitation-${invitationId}`;
    try {
      setActionLoading(prev => ({ ...prev, [key]: true }));
      await apiService.respondToInvitation(invitationId, status);
      await loadNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      alert('Failed to respond to invitation');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const renderMatchVerification = (match: Match) => {
    const key = `match-${match.id}`;
    const isLoading = actionLoading[key];

    return (
      <div key={key} className="p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">🔍</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900">Match Verification Required</h4>
              <span className="text-xs text-gray-500">
                {new Date(match.match_date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">
                {match.player1?.full_name || `Player ${match.player1_id}`}
              </span>
              {' vs '}
              <span className="font-medium">
                {match.player2?.full_name || `Player ${match.player2_id}`}
              </span>
              {' - '}
              <span className="font-bold text-indigo-600">
                {match.player1_score} - {match.player2_score}
              </span>
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Did this match happen as reported?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleVerifyMatch(match.id, false)}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : '❌ Reject'}
              </button>
              <button
                onClick={() => handleVerifyMatch(match.id, true)}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : '✅ Verify'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTournamentInvitation = (invitation: TournamentInvitation) => {
    const key = `invitation-${invitation.id}`;
    const isLoading = actionLoading[key];

    return (
      <div key={key} className="p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">🏆</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900">Tournament Invitation</h4>
              <span className="text-xs text-gray-500">
                {new Date(invitation.invited_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">{invitation.tournament?.name || 'Tournament'}</span>
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Invited by {invitation.inviter?.full_name || 'Unknown'}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Decline'}
              </button>
              <button
                onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotification = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'match_verification':
        return renderMatchVerification(notification.data as Match);
      case 'tournament_invitation':
        return renderTournamentInvitation(notification.data as TournamentInvitation);
      default:
        return null;
    }
  };

  const notificationCount = notifications.length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5M9 12l2 2 4-4" />
        </svg>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-2">🔔</div>
                  <p className="text-sm text-gray-600">No notifications</p>
                  <p className="text-xs text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                notifications.map(renderNotification)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
