'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeedScreen from './screens/FeedScreen';
import MatchesScreen from './screens/MatchesScreen';
import TournamentsScreen from './screens/TournamentsScreen';
import TournamentLeaderboardScreen from './screens/TournamentLeaderboardScreen';
import RecordMatchScreen from './screens/RecordMatchScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReportsScreen from './screens/ReportsScreen';
import ReportDetailScreen from './screens/ReportDetailScreen';
import CreateReportScreen from './screens/CreateReportScreen';
import AdminScreen from './screens/AdminScreen';
import TournamentManagementScreen from './screens/TournamentManagementScreen';
import NotificationCenter from './NotificationCenter';
import { apiService } from '@/services/api';

type TabType = 'feed' | 'matches' | 'tournaments' | 'record-match' | 'tournament-leaderboard' | 'create-post' | 'profile' | 'reports' | 'report-detail' | 'create-report' | 'admin' | 'tournament-management';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<{ id: number; title: string } | null>(null);
  const [unseenReportsCount, setUnseenReportsCount] = useState(0); // New state for unseen reports count
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Check if current user is admin - check permissions array for 'admin' permission
  const isAdmin = user?.permissions?.includes('admin') || false;

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab('profile');
  };

  const handleReportClick = (report: { id: number; title: string }) => {
    setSelectedReport(report);
    setActiveTab('report-detail');
  };

  const loadUnseenReportsCount = async () => {
    try {
      const response = await apiService.getUnseenReportsCount();
      setUnseenReportsCount(response.unseen_count);
    } catch (error) {
      console.error('Failed to load unseen reports count:', error);
    }
  };

  // Load unseen reports count when user is available
  React.useEffect(() => {
    if (user) {
      loadUnseenReportsCount();
    }
  }, [user]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedScreen onCreatePost={() => setActiveTab('create-post')} onUserClick={handleUserClick} />;
      case 'matches':
        return <MatchesScreen onRecordMatch={() => setActiveTab('record-match')} onUserClick={handleUserClick} />;
      case 'tournaments':
        return (
          <TournamentsScreen 
            onTournamentClick={(tournamentId) => {
              setSelectedTournamentId(tournamentId);
              setActiveTab('tournament-leaderboard');
            }} 
          />
        );
      case 'record-match':
        return <RecordMatchScreen onBack={() => setActiveTab('matches')} />;
      case 'create-post':
        return <CreatePostScreen onBack={() => setActiveTab('feed')} onPostCreated={() => setActiveTab('feed')} />;
      case 'profile':
        return (
          <ProfileScreen 
            userId={selectedUserId || undefined} 
            onBack={() => {
              setSelectedUserId(null);
              setActiveTab('feed');
            }} 
          />
        );
      case 'reports':
        return <ReportsScreen onReportClick={handleReportClick} onCreateReport={() => setActiveTab('create-report')} onUnseenCountUpdate={loadUnseenReportsCount} />;
      case 'create-report':
        return <CreateReportScreen onBack={() => setActiveTab('reports')} onReportCreated={() => setActiveTab('reports')} />;
      case 'admin':
        return <AdminScreen onBack={() => setActiveTab('feed')} />;
      case 'tournament-management':
        return <TournamentManagementScreen onBack={() => setActiveTab('feed')} />;
      case 'report-detail':
        return selectedReport ? (
          <ReportDetailScreen 
            report={selectedReport}
            onBack={() => {
              setSelectedReport(null);
              setActiveTab('reports');
            }} 
          />
        ) : (
          <ReportsScreen onReportClick={handleReportClick} />
        );
      case 'tournament-leaderboard':
        return selectedTournamentId ? (
          <TournamentLeaderboardScreen 
            tournamentId={selectedTournamentId}
            onBack={() => setActiveTab('tournaments')}
            onUserClick={handleUserClick}
          />
        ) : (
          <TournamentsScreen 
            onTournamentClick={(tournamentId) => {
              setSelectedTournamentId(tournamentId);
              setActiveTab('tournament-leaderboard');
            }} 
          />
        );
      default:
        return <FeedScreen onCreatePost={() => setActiveTab('create-post')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Title Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Sandwich menu */}
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">Badminton App</h1>
          </div>

          {/* Right side - Notifications */}
          <div className="flex items-center">
            {user && <NotificationCenter currentUser={user} />}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('feed');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'feed'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                📰 Feed
              </button>
              <button
                onClick={() => {
                  setActiveTab('matches');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'matches'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                🏓 Matches
              </button>
              <button
                onClick={() => {
                  setActiveTab('tournaments');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'tournaments'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                🏆 Tournaments
              </button>
              <button
                onClick={() => {
                  setActiveTab('record-match');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'record-match'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                ➕ Record Match
              </button>
              <button
                onClick={() => {
                  setSelectedUserId(null); // Show own profile
                  setActiveTab('profile');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'profile' && !selectedUserId
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                👤 My Profile
              </button>
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'reports' || activeTab === 'report-detail'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>📰 Reports</span>
                  {unseenReportsCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unseenReportsCount}
                    </span>
                  )}
                </div>
              </button>
              
              {/* Admin-only menu items */}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    🛡️ Admin Panel
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('tournament-management');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'tournament-management'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    🏆 Manage Tournaments
                  </button>
                </>
              )}
            </nav>
            
            {/* Logout Button at Bottom */}
            <div className="px-4 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-base font-medium transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-16">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              <button
                onClick={() => setActiveTab('feed')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'feed'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                📰 Feed
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'matches'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                🏓 Matches
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'tournaments'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                🏆 Tournaments
              </button>
              <button
                onClick={() => setActiveTab('record-match')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'record-match'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                ➕ Record Match
              </button>
              <button
                onClick={() => {
                  setSelectedUserId(null); // Show own profile
                  setActiveTab('profile');
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'profile' && !selectedUserId
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                👤 My Profile
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'reports' || activeTab === 'report-detail'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>📰 Reports</span>
                  {unseenReportsCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unseenReportsCount}
                    </span>
                  )}
                </div>
              </button>
              
              {/* Admin-only menu items */}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    🛡️ Admin Panel
                  </button>
                  <button
                    onClick={() => setActiveTab('tournament-management')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'tournament-management'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    🏆 Manage Tournaments
                  </button>
                </>
              )}
            </nav>
          </div>
          
          {/* Logout Button at Bottom */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-base font-medium transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'feed'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📰 Feed
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'matches'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏓 Matches
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tournaments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏆 Tournaments
            </button>
          </nav>
        </div>

        {/* Screen Content */}
        <main className="flex-1">
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
}
