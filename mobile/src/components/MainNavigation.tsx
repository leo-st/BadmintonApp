import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface MainNavigationProps {
  children: React.ReactNode;
  activeTab?: 'feed' | 'matches' | 'tournaments';
  onTabChange?: (tab: 'feed' | 'matches' | 'tournaments') => void;
  title?: string;
  showTabs?: boolean;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({
  children,
  activeTab,
  onTabChange,
  title = "🏸 Badminton App",
  showTabs = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [unseenReports, setUnseenReports] = useState(0);
  // Only use navigation on non-web platforms
  let navigation: any = null;
  if (Platform.OS !== 'web') {
    navigation = useNavigation() as any;
  }
  const { user, hasPermission, isAdmin, logout } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  // Removed useFocusEffect to avoid NavigationContainer dependency on web

  const loadNotifications = async () => {
    // Skip API calls on web to avoid re-rendering issues for now
    if (Platform.OS === 'web') {
      console.log('MainNavigation: Skipping notifications load on web');
      return;
    }

    // Load pending verifications
    if (hasPermission('matches_can_verify')) {
      try {
        const matches = await apiService.getPendingVerifications();
        setPendingVerifications(matches.length);
      } catch (error) {
        console.error('Failed to load pending verifications:', error);
      }
    }

    // Load pending invitations
    try {
      const invitations = await apiService.getMyInvitations();
      const pending = invitations.filter(inv => 
        inv.status === 'pending' && new Date(inv.expires_at) > new Date()
      );
      setPendingInvitations(pending.length);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
      setPendingInvitations(0);
    }

    // Load unseen reports
    try {
      const response = await apiService.getUnseenReportsCount();
      setUnseenReports(response.unseen_count);
    } catch (error) {
      console.error('Failed to load unseen reports count:', error);
      setUnseenReports(0);
    }
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);
    
    Animated.timing(menuAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const navigateToScreen = (screenName: string) => {
    closeMenu();
    
    // For tab-based screens, switch the active tab instead of navigating away (only if showTabs is true)
    if (showTabs && onTabChange) {
      if (screenName === 'Home' || screenName === 'Posts') {
        onTabChange('feed');
      } else if (screenName === 'Matches') {
        onTabChange('matches');
      } else if (screenName === 'TournamentLeaderboard') {
        onTabChange('tournaments');
      } else if (navigation) {
        navigation.navigate(screenName as never);
      }
    } else if (navigation) {
      // For non-tab screens, navigate to Main screen for tab-based screens with tab parameter
      if (screenName === 'Home' || screenName === 'Posts') {
        navigation.navigate('Main' as never, { tab: 'feed' });
      } else if (screenName === 'Matches') {
        navigation.navigate('Main' as never, { tab: 'matches' });
      } else if (screenName === 'TournamentLeaderboard') {
        navigation.navigate('Main' as never, { tab: 'tournaments' });
      } else {
        navigation.navigate(screenName as never);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    // Navigation will happen automatically when user state changes to null
  };

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, 0],
  });

  const overlayOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const menuItems = [
    { id: 'home', title: 'Home', screen: 'Home', icon: '🏠' },
    { id: 'posts', title: 'Posts Feed', screen: 'Posts', icon: '📱' },
    { id: 'matches', title: 'Matches', screen: 'Matches', icon: '🏸' },
    { id: 'record-match', title: 'Record Match', screen: 'RecordMatch', icon: '➕', permission: 'matches_can_create' },
    { id: 'tournaments', title: 'Tournaments', screen: 'TournamentLeaderboard', icon: '🏆' },
    { id: 'manage-tournaments', title: 'Manage Tournaments', screen: 'Tournament', icon: '⚙️', permission: 'tournaments_can_create' },
    { id: 'verification', title: 'Verify Matches', screen: 'Verification', icon: '🔍', permission: 'matches_can_verify', badge: pendingVerifications },
    { id: 'invitations', title: 'My Invitations', screen: 'MyInvitations', icon: '📬' },
    { id: 'reports', title: 'Reports', screen: 'Reports', icon: '📝', badge: unseenReports },
    { id: 'profile', title: 'Profile', screen: 'Profile', icon: '👤' },
    { id: 'admin', title: 'Admin Panel', screen: 'Admin', icon: '👑', admin: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.admin && !isAdmin()) return false;
    return true;
  });

  // Simplified web layout to avoid overlay issues
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { minHeight: '100vh' as any }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title || '🏸 Badminton App'}</Text>
          <View style={styles.headerRight} />
        </View>
        {showTabs && activeTab && onTabChange && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
              onPress={() => onTabChange('feed')}
            >
              <Text style={[styles.tabIcon, activeTab === 'feed' && styles.activeTabIcon]}>📱</Text>
              <Text style={[styles.tabLabel, activeTab === 'feed' && styles.activeTabLabel]}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
              onPress={() => onTabChange('matches')}
            >
              <Text style={[styles.tabIcon, activeTab === 'matches' && styles.activeTabIcon]}>🏸</Text>
              <Text style={[styles.tabLabel, activeTab === 'matches' && styles.activeTabLabel]}>Matches</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tournaments' && styles.activeTab]}
              onPress={() => onTabChange('tournaments')}
            >
              <Text style={[styles.tabIcon, activeTab === 'tournaments' && styles.activeTabIcon]}>🏆</Text>
              <Text style={[styles.tabLabel, activeTab === 'tournaments' && styles.activeTabLabel]}>Tournaments</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.content, { backgroundColor: '#e6f7ff' }]}>
          <Text style={{ fontSize: 12, color: '#0066cc', padding: 6 }}>WEB: content mounted</Text>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <View style={styles.hamburger}>
            <View style={[styles.hamburgerLine, isMenuOpen && styles.hamburgerLineOpen]} />
            <View style={[styles.hamburgerLine, isMenuOpen && styles.hamburgerLineOpen]} />
            <View style={[styles.hamburgerLine, isMenuOpen && styles.hamburgerLineOpen]} />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{title || '🏸 Badminton App'}</Text>
        
        <View style={styles.headerRight}>
          {((pendingVerifications || 0) > 0 || (pendingInvitations || 0) > 0) && (
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => {
                // Show notification details
                const notifications = [];
                if (pendingVerifications > 0) {
                  notifications.push(`🔍 ${pendingVerifications} match(es) pending verification`);
                }
                if (pendingInvitations > 0) {
                  notifications.push(`📬 ${pendingInvitations} tournament invitation(s) pending`);
                }
                
                Alert.alert(
                  'Notifications',
                  notifications.join('\n\n'),
                  [
                    { text: 'OK' },
                    ...(pendingInvitations > 0 ? [{ text: 'View Invitations', onPress: () => navigation.navigate('MyInvitations' as never) }] : []),
                    ...(pendingVerifications > 0 ? [{ text: 'Verify Matches', onPress: () => navigation.navigate('Verification' as never) }] : [])
                  ]
                );
              }}
            >
              <Text style={styles.notificationCloud}>☁️</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>
                  {(pendingVerifications || 0) + (pendingInvitations || 0)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Bar - Only show if showTabs is true */}
      {showTabs && activeTab && onTabChange && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => onTabChange('feed')}
          >
            <Text style={[styles.tabIcon, activeTab === 'feed' && styles.activeTabIcon]}>📱</Text>
            <Text style={[styles.tabLabel, activeTab === 'feed' && styles.activeTabLabel]}>Feed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
            onPress={() => onTabChange('matches')}
          >
            <Text style={[styles.tabIcon, activeTab === 'matches' && styles.activeTabIcon]}>🏸</Text>
            <Text style={[styles.tabLabel, activeTab === 'matches' && styles.activeTabLabel]}>Matches</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tournaments' && styles.activeTab]}
            onPress={() => onTabChange('tournaments')}
          >
            <Text style={[styles.tabIcon, activeTab === 'tournaments' && styles.activeTabIcon]}>🏆</Text>
            <Text style={[styles.tabLabel, activeTab === 'tournaments' && styles.activeTabLabel]}>Tournaments</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Hamburger Menu Overlay */}
      <Animated.View
        style={[
          styles.menuOverlay,
          { opacity: overlayOpacity }
        ]}
        pointerEvents={isMenuOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.menuOverlayTouchable}
          onPress={closeMenu}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Hamburger Menu */}
      <Animated.View
        style={[
          styles.menu,
          { transform: [{ translateX: menuTranslateX }] }
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <TouchableOpacity onPress={closeMenu} style={styles.menuCloseButton}>
            <Text style={styles.menuCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.menuContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || user?.username || 'Unknown User'}</Text>
            <Text style={styles.userRole}>{user?.role_name || 'No role assigned'}</Text>
          </View>
          
          <View style={styles.menuItems}>
            {Array.isArray(filteredMenuItems) && filteredMenuItems.length > 0 ? (
              filteredMenuItems
                .filter((it) => it && typeof it === 'object')
                .map((item, idx) => (
                  <TouchableOpacity
                    key={String(item.id ?? idx)}
                    style={styles.menuItem}
                    onPress={() => navigateToScreen(item.screen)}
                  >
                    <Text style={styles.menuItemIcon}>{String(item.icon ?? '❓')}</Text>
                    <Text style={styles.menuItemText}>{String(item.title ?? 'Unknown')}</Text>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
            ) : (
              <Text style={styles.menuItemText}>No menu items available</Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
  },
  menuButton: {
    padding: 8,
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  hamburgerLineOpen: {
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    position: 'relative',
    padding: 8,
  },
  notificationCloud: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    minHeight: 0, // Important for web to prevent flex child from collapsing
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  menuOverlayTouchable: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: screenWidth * 0.8,
    backgroundColor: 'white',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  menuCloseButton: {
    padding: 4,
  },
  menuCloseText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
    paddingTop: 20,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  menuBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
