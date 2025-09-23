import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  return (
    <NavigationContainer>
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
