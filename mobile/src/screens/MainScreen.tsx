import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MainNavigation } from '../components/MainNavigation';
import { FeedScreen } from './FeedScreen';
import { MatchesScreen } from './MatchesScreen';
import { TournamentLeaderboardScreen } from './TournamentLeaderboardScreen';
import { RecordMatchScreen } from './RecordMatchScreen';
import { ProfileScreen } from './ProfileScreen';
import { AdminScreen } from './AdminScreen';
import { VerificationScreen } from './VerificationScreen';
import { TournamentScreen } from './TournamentScreen';
import { MyInvitationsScreen } from './MyInvitationsScreen';
import ReportsScreen from './ReportsScreen';
import CreateReportScreen from './CreateReportScreen';
import ReportDetailScreen from './ReportDetailScreen';
import { useAuth } from '../context/AuthContext';

type TabType = 'feed' | 'matches' | 'tournaments';

type MainScreenRouteProp = RouteProp<{
  Main: { tab?: TabType };
}, 'Main'>;

export const MainScreen: React.FC = () => {
  const { user, hasPermission, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [showMenu, setShowMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string>('main'); // For non-tab screens
  const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger refresh of screens
  const [selectedReport, setSelectedReport] = useState<any>(null); // For ReportDetail screen

  // Only use navigation hooks on non-web platforms
  let route: any = null;
  let navigation: any = null;
  
  if (Platform.OS !== 'web') {
    route = useRoute<MainScreenRouteProp>();
    navigation = useNavigation() as any;
  }

  useEffect(() => {
    // Set the active tab based on route parameters (only on mobile)
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedScreen />;
      case 'matches':
        return <MatchesScreen 
          onNavigateToRecordMatch={() => handleMenuItemPress('RecordMatch')} 
          refreshTrigger={refreshTrigger}
        />;
      case 'tournaments':
        return <TournamentLeaderboardScreen />;
      default:
        return <FeedScreen />;
    }
  };

  const renderCurrentScreen = () => {
    // If we're showing a non-tab screen, render it
    if (currentScreen !== 'main') {
      switch (currentScreen) {
        case 'RecordMatch':
          return <RecordMatchScreen onBackToMatches={handleBackToMatches} />;
        case 'Profile':
          return <ProfileScreen />;
        case 'Admin':
          return <AdminScreen />;
        case 'Verification':
          return <VerificationScreen />;
        case 'Tournament':
          return <TournamentScreen />;
        case 'MyInvitations':
          return <MyInvitationsScreen />;
        case 'Reports':
          return <ReportsScreen 
            onNavigateToCreateReport={handleNavigateToCreateReport}
            onNavigateToReportDetail={handleNavigateToReportDetail}
          />;
        case 'CreateReport':
          return <CreateReportScreen 
            report={selectedReport} 
            onBackToReports={selectedReport ? handleBackToReportDetail : handleBackToReports} 
          />;
        case 'ReportDetail':
          return <ReportDetailScreen 
            report={selectedReport} 
            onBackToReports={handleBackToReports} 
            onEditReport={handleEditReport}
          />;
        default:
          return renderActiveTab();
      }
    }
    
    // Otherwise render the active tab
    return renderActiveTab();
  };

  const handleMenuItemPress = (screen: string) => {
    setShowMenu(false);
    
    if (Platform.OS === 'web') {
      // Handle web routing by switching screens directly
      if (screen === 'Posts' || screen === 'Home') {
        setCurrentScreen('main');
        setActiveTab('feed');
      } else if (screen === 'Matches') {
        setCurrentScreen('main');
        setActiveTab('matches');
      } else if (screen === 'TournamentLeaderboard') {
        setCurrentScreen('main');
        setActiveTab('tournaments');
      } else {
        // For other screens, switch to that screen
        setCurrentScreen(screen);
      }
    } else if (navigation) {
      navigation.navigate(screen);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

  const handleBackToMatches = () => {
    console.log('handleBackToMatches called - navigating back to matches');
    setCurrentScreen('main');
    setActiveTab('matches');
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  const handleNavigateToCreateReport = () => {
    setCurrentScreen('CreateReport');
  };

  const handleNavigateToReportDetail = (report: any) => {
    setSelectedReport(report);
    setCurrentScreen('ReportDetail');
  };

  const handleBackToReports = () => {
    setCurrentScreen('Reports');
    setSelectedReport(null);
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    setCurrentScreen('CreateReport');
  };

  const handleBackToReportDetail = () => {
    setCurrentScreen('ReportDetail');
    // selectedReport should still contain the report data
  };

  console.log('MainScreen render - Platform:', Platform.OS, 'User:', user?.username);

  // Web-optimized PWA layout with responsive sidebar
  if (Platform.OS === 'web') {
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : false;

    return (
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.webHeader}>
          <View style={styles.webHeaderContent}>
            <TouchableOpacity 
              style={styles.webMenuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Text style={styles.webMenuIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.webHeaderTitle}>🏸 Badminton App</Text>
            <View style={styles.webHeaderActions}>
              {/* Removed header + buttons - using only floating action buttons */}
            </View>
          </View>
        </View>

        <View style={styles.webMainContent}>
          {/* Sidebar for desktop */}
          {isDesktop && (
            <View style={styles.webSidebar}>
              <View style={styles.webUserInfo}>
                <Text style={styles.webUserName}>{user?.full_name || user?.username}</Text>
                <Text style={styles.webUserRole}>{user?.role_name || 'User'}</Text>
              </View>
              
                     <ScrollView style={styles.webSidebarMenu}>
                       <TouchableOpacity style={styles.webMenuItem} onPress={() => { setCurrentScreen('main'); setActiveTab('feed'); }}>
                         <Text style={styles.webMenuItemIcon}>📱</Text>
                         <Text style={styles.webMenuItemText}>Posts Feed</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.webMenuItem} onPress={() => { setCurrentScreen('main'); setActiveTab('matches'); }}>
                         <Text style={styles.webMenuItemIcon}>🏸</Text>
                         <Text style={styles.webMenuItemText}>Matches</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.webMenuItem} onPress={() => { setCurrentScreen('main'); setActiveTab('tournaments'); }}>
                         <Text style={styles.webMenuItemIcon}>🏆</Text>
                         <Text style={styles.webMenuItemText}>Tournaments</Text>
                       </TouchableOpacity>
                {hasPermission('matches_can_create') && (
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('RecordMatch')}>
                    <Text style={styles.webMenuItemIcon}>➕</Text>
                    <Text style={styles.webMenuItemText}>Record Match</Text>
                  </TouchableOpacity>
                )}
                {hasPermission('tournaments_can_create') && (
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Tournament')}>
                    <Text style={styles.webMenuItemIcon}>⚙️</Text>
                    <Text style={styles.webMenuItemText}>Manage Tournaments</Text>
                  </TouchableOpacity>
                )}
                {hasPermission('matches_can_verify') && (
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Verification')}>
                    <Text style={styles.webMenuItemIcon}>🔍</Text>
                    <Text style={styles.webMenuItemText}>Verify Matches</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('MyInvitations')}>
                  <Text style={styles.webMenuItemIcon}>📬</Text>
                  <Text style={styles.webMenuItemText}>My Invitations</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Reports')}>
                  <Text style={styles.webMenuItemIcon}>📝</Text>
                  <Text style={styles.webMenuItemText}>Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Profile')}>
                  <Text style={styles.webMenuItemIcon}>👤</Text>
                  <Text style={styles.webMenuItemText}>Profile</Text>
                </TouchableOpacity>
                {isAdmin() && (
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Admin')}>
                    <Text style={styles.webMenuItemIcon}>👑</Text>
                    <Text style={styles.webMenuItemText}>Admin Panel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.webMenuItem, styles.webLogoutItem]} onPress={handleLogout}>
                  <Text style={styles.webMenuItemIcon}>🚪</Text>
                  <Text style={styles.webMenuItemText}>Logout</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Mobile menu overlay */}
          {!isDesktop && showMenu && (
            <View style={styles.webMobileMenuOverlay}>
              <TouchableOpacity 
                style={styles.webMobileMenuOverlayTouch}
                onPress={() => setShowMenu(false)}
              />
              <View style={styles.webMobileMenu}>
                <View style={styles.webMobileMenuHeader}>
                  <Text style={styles.webMobileMenuTitle}>Menu</Text>
                  <TouchableOpacity onPress={() => setShowMenu(false)}>
                    <Text style={styles.webMobileMenuClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.webMobileMenuContent}>
                  <View style={styles.webUserInfo}>
                    <Text style={styles.webUserName}>{user?.full_name || user?.username}</Text>
                    <Text style={styles.webUserRole}>{user?.role_name || 'User'}</Text>
                  </View>
                       <TouchableOpacity style={styles.webMenuItem} onPress={() => { setCurrentScreen('main'); setActiveTab('feed'); setShowMenu(false); }}>
                         <Text style={styles.webMenuItemIcon}>📱</Text>
                         <Text style={styles.webMenuItemText}>Posts Feed</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.webMenuItem} onPress={() => { setCurrentScreen('main'); setActiveTab('matches'); setShowMenu(false); }}>
                         <Text style={styles.webMenuItemIcon}>🏸</Text>
                         <Text style={styles.webMenuItemText}>Matches</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.webMenuItem} onPress={() => { setCurrentScreen('main'); setActiveTab('tournaments'); setShowMenu(false); }}>
                         <Text style={styles.webMenuItemIcon}>🏆</Text>
                         <Text style={styles.webMenuItemText}>Tournaments</Text>
                       </TouchableOpacity>
                  {hasPermission('matches_can_create') && (
                    <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('RecordMatch')}>
                      <Text style={styles.webMenuItemIcon}>➕</Text>
                      <Text style={styles.webMenuItemText}>Record Match</Text>
                    </TouchableOpacity>
                  )}
                  {hasPermission('tournaments_can_create') && (
                    <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Tournament')}>
                      <Text style={styles.webMenuItemIcon}>⚙️</Text>
                      <Text style={styles.webMenuItemText}>Manage Tournaments</Text>
                    </TouchableOpacity>
                  )}
                  {hasPermission('matches_can_verify') && (
                    <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Verification')}>
                      <Text style={styles.webMenuItemIcon}>🔍</Text>
                      <Text style={styles.webMenuItemText}>Verify Matches</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('MyInvitations')}>
                    <Text style={styles.webMenuItemIcon}>📬</Text>
                    <Text style={styles.webMenuItemText}>My Invitations</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Reports')}>
                    <Text style={styles.webMenuItemIcon}>📝</Text>
                    <Text style={styles.webMenuItemText}>Reports</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Profile')}>
                    <Text style={styles.webMenuItemIcon}>👤</Text>
                    <Text style={styles.webMenuItemText}>Profile</Text>
                  </TouchableOpacity>
                  {isAdmin() && (
                    <TouchableOpacity style={styles.webMenuItem} onPress={() => handleMenuItemPress('Admin')}>
                      <Text style={styles.webMenuItemIcon}>👑</Text>
                      <Text style={styles.webMenuItemText}>Admin Panel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.webMenuItem, styles.webLogoutItem]} onPress={handleLogout}>
                    <Text style={styles.webMenuItemIcon}>🚪</Text>
                    <Text style={styles.webMenuItemText}>Logout</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Main content area */}
          <View style={[styles.webContent, isDesktop && styles.webContentWithSidebar]}>
            {/* Tab navigation or back button */}
            {currentScreen === 'main' ? (
              <View style={styles.webTabBar}>
                <TouchableOpacity 
                  style={[styles.webTab, activeTab === 'feed' && styles.webActiveTab]} 
                  onPress={() => setActiveTab('feed')}
                >
                  <Text style={styles.webTabIcon}>📱</Text>
                  <Text style={[styles.webTabLabel, activeTab === 'feed' && styles.webActiveTabLabel]}>Feed</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.webTab, activeTab === 'matches' && styles.webActiveTab]} 
                  onPress={() => setActiveTab('matches')}
                >
                  <Text style={styles.webTabIcon}>🏸</Text>
                  <Text style={[styles.webTabLabel, activeTab === 'matches' && styles.webActiveTabLabel]}>Matches</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.webTab, activeTab === 'tournaments' && styles.webActiveTab]} 
                  onPress={() => setActiveTab('tournaments')}
                >
                  <Text style={styles.webTabIcon}>🏆</Text>
                  <Text style={[styles.webTabLabel, activeTab === 'tournaments' && styles.webActiveTabLabel]}>Tournaments</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.webBackBar}>
                <TouchableOpacity 
                  style={styles.webBackButton}
                  onPress={() => setCurrentScreen('main')}
                >
                  <Text style={styles.webBackIcon}>←</Text>
                  <Text style={styles.webBackText}>Back to Main</Text>
                </TouchableOpacity>
                <Text style={styles.webScreenTitle}>
                  {currentScreen === 'RecordMatch' ? 'Record Match' :
                   currentScreen === 'Profile' ? 'Profile' :
                   currentScreen === 'Admin' ? 'Admin Panel' :
                   currentScreen === 'Verification' ? 'Verify Matches' :
                   currentScreen === 'Tournament' ? 'Manage Tournaments' :
                   currentScreen === 'MyInvitations' ? 'My Invitations' :
                   currentScreen === 'Reports' ? 'Reports' :
                   currentScreen === 'CreateReport' ? 'Create Report' :
                   currentScreen === 'ReportDetail' ? 'Report Details' :
                   currentScreen}
                </Text>
              </View>
            )}

            {/* Tab content */}
            <View style={styles.webTabContent}>
              {renderCurrentScreen()}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Native mobile layout (unchanged)
  return (
    <MainNavigation activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveTab()}
    </MainNavigation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Web-specific styles
  webContainer: {
    flex: 1,
    height: '100vh' as any,
    backgroundColor: '#f8f9fa',
  },
  webHeader: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  webHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
  },
  webMenuButton: {
    padding: 8,
    borderRadius: 4,
  },
  webMenuIcon: {
    fontSize: 18,
    color: 'white',
  },
  webHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  webHeaderActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  webHeaderActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webHeaderActionIcon: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  webMainContent: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  webSidebar: {
    width: 250,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  webSidebarMenu: {
    flex: 1,
    paddingVertical: 16,
  },
  webUserInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#f8f9fa',
  },
  webUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  webUserRole: {
    fontSize: 14,
    color: '#666',
  },
  webMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  webMenuItemIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  webMenuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  webLogoutItem: {
    backgroundColor: '#fff5f5',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 16,
  },
  webMobileMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
  },
  webMobileMenuOverlayTouch: {
    flex: 1,
  },
  webMobileMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  webMobileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
  },
  webMobileMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  webMobileMenuClose: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    padding: 4,
  },
  webMobileMenuContent: {
    flex: 1,
  },
  webContent: {
    flex: 1,
    backgroundColor: 'white',
    minHeight: 0,
  },
  webContentWithSidebar: {
    marginLeft: 0,
  },
  webTabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  webTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  webActiveTab: {
    backgroundColor: '#f0f8ff',
    borderBottomColor: '#007AFF',
  },
  webTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  webTabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  webActiveTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  webTabContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden' as any,
  },
  webHeader: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  webHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
  },
  webHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  webHeaderActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  webMenuButton: {
    padding: 8,
    borderRadius: 4,
  },
  webMenuIcon: {
    fontSize: 18,
    color: 'white',
  },
  webMainContent: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  webSidebar: {
    width: 250,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  webSidebarMenu: {
    flex: 1,
    paddingVertical: 16,
  },
  webUserInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#f8f9fa',
  },
  webUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  webUserRole: {
    fontSize: 14,
    color: '#666',
  },
  webMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  webMenuItemIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  webMenuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  webLogoutItem: {
    backgroundColor: '#fff5f5',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 16,
  },
  webMobileMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
  },
  webMobileMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  webMobileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
  },
  webMobileMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  webMobileMenuClose: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    padding: 4,
  },
  webMobileMenuContent: {
    flex: 1,
  },
  webContent: {
    flex: 1,
    backgroundColor: 'white',
    minHeight: 0,
  },
  webContentWithSidebar: {
    marginLeft: 0,
  },
  webTabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  webTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  webActiveTab: {
    backgroundColor: '#f0f8ff',
    borderBottomColor: '#007AFF',
  },
  webTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  webTabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  webActiveTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  webTabContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden' as any,
  },
  webBackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  webBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f8ff',
  },
  webBackIcon: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 4,
  },
  webBackText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  webScreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
    flex: 1,
  },
});
