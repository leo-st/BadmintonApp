import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Force web to use @react-navigation/stack explicitly
// (native-stack can cause blank screens on web)
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainScreen } from './src/screens/MainScreen';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { RecordMatchScreen } from './src/screens/RecordMatchScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { VerificationScreen } from './src/screens/VerificationScreen';
import { TournamentScreen } from './src/screens/TournamentScreen';
import { TournamentLeaderboardScreen } from './src/screens/TournamentLeaderboardScreen';
import { MyInvitationsScreen } from './src/screens/MyInvitationsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import CreateReportScreen from './src/screens/CreateReportScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import { PostsScreen } from './src/screens/PostsScreen';

const Stack = createStackNavigator();

// Disable native screens on web to avoid blank rendering
// Disable native screens entirely to avoid web blank rendering
enableScreens(false);

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Badminton App...</Text>
      </View>
    );
  }

  const linking = Platform.OS === 'web' ? undefined : ({
    prefixes: [typeof window !== 'undefined' ? window.location.origin + '/' : '/'] as string[],
    config: {
      screens: {
        Login: 'login',
        Main: '',
        Posts: 'posts',
        Matches: 'matches',
        RecordMatch: 'record',
        Profile: 'profile/:userId?',
        Admin: 'admin',
        Verification: 'verification',
        Tournament: 'tournament',
        TournamentLeaderboard: 'leaderboard',
        MyInvitations: 'invitations',
        Reports: 'reports',
        CreateReport: 'reports/create',
        ReportDetail: 'reports/:id',
      },
    },
  } as const);

  const navProps: any = {};
  if (linking) navProps.linking = linking as any;

  // Web-only minimal stack with safe screens (no animated menu)
  if (Platform.OS === 'web') {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="WebMain" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="WebMain" component={WebMainScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer {...navProps}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Matches" component={MatchesScreen} />
            <Stack.Screen name="RecordMatch" component={RecordMatchScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="Tournament" component={TournamentScreen} />
            <Stack.Screen name="TournamentLeaderboard" component={TournamentLeaderboardScreen} />
            <Stack.Screen name="MyInvitations" component={MyInvitationsScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="CreateReport" component={CreateReportScreen} />
            <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
            <Stack.Screen name="Posts" component={PostsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// --- WebMainScreen: simple header + tabs, no animated menu ---
import { useState } from 'react';
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity } from 'react-native';
const WebMainScreen: React.FC = () => {
  const [tab, setTab] = useState<'feed' | 'matches' | 'tournaments'>('feed');

  return (
    <RNView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <RNView style={{ backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 12 }}>
        <RNText style={{ color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>🏸 Badminton App</RNText>
      </RNView>
      <RNView style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e1e5e9', paddingVertical: 8, justifyContent: 'space-evenly' }}>
        <RNTouchableOpacity onPress={()=>setTab('feed')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: tab==='feed' ? '#e8f2ff' : '#f7f7f7', borderWidth: 1, borderColor: '#d0d7de' }}>
          <RNText style={{ fontWeight: '600', color: '#111' }}>Feed</RNText>
        </RNTouchableOpacity>
        <RNTouchableOpacity onPress={()=>setTab('matches')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: tab==='matches' ? '#e8f2ff' : '#f7f7f7', borderWidth: 1, borderColor: '#d0d7de' }}>
          <RNText style={{ fontWeight: '600', color: '#111' }}>Matches</RNText>
        </RNTouchableOpacity>
        <RNTouchableOpacity onPress={()=>setTab('tournaments')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: tab==='tournaments' ? '#e8f2ff' : '#f7f7f7', borderWidth: 1, borderColor: '#d0d7de' }}>
          <RNText style={{ fontWeight: '600', color: '#111' }}>Tournaments</RNText>
        </RNTouchableOpacity>
      </RNView>
      <RNView style={{ flex: 1, minHeight: 0 }}>
        {tab === 'feed' && <PostsScreen navigation={null as any} />}
        {tab === 'matches' && <MatchesScreen />}
        {tab === 'tournaments' && <TournamentLeaderboardScreen />}
      </RNView>
    </RNView>
  );
};
