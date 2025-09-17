import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  return (
    <>
      {user ? <HomeScreen /> : <LoginScreen />}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
