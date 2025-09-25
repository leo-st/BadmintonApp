import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MainNavigation } from '../components/MainNavigation';
import { FeedScreen } from './FeedScreen';
import { MatchesScreen } from './MatchesScreen';
import { TournamentLeaderboardScreen } from './TournamentLeaderboardScreen';

type TabType = 'feed' | 'matches' | 'tournaments';

type MainScreenRouteProp = RouteProp<{
  Main: { tab?: TabType };
}, 'Main'>;

export const MainScreen: React.FC = () => {
  const route = useRoute<MainScreenRouteProp>();
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  useEffect(() => {
    // Set the active tab based on route parameters
    if (route.params?.tab) {
      console.log('Main: route tab ->', route.params.tab);
      setActiveTab(route.params.tab);
    }
    console.log('Main: activeTab =', activeTab);
  }, [route.params?.tab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedScreen />;
      case 'matches':
        return <MatchesScreen />;
      case 'tournaments':
        return <TournamentLeaderboardScreen />;
      default:
        return <FeedScreen />;
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={{ backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>🏸 Badminton App</Text>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e1e5e9' }}>
          <TouchableOpacity style={[styles.tab, activeTab === 'feed' && styles.activeTab]} onPress={() => setActiveTab('feed')}>
            <Text style={[styles.tabLabel, activeTab === 'feed' && styles.activeTabLabel]}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'matches' && styles.activeTab]} onPress={() => setActiveTab('matches')}>
            <Text style={[styles.tabLabel, activeTab === 'matches' && styles.activeTabLabel]}>Matches</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'tournaments' && styles.activeTab]} onPress={() => setActiveTab('tournaments')}>
            <Text style={[styles.tabLabel, activeTab === 'tournaments' && styles.activeTabLabel]}>Tournaments</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, minHeight: 0 }}>
          {renderActiveTab()}
        </View>
      </View>
    );
  }

  return (
    <MainNavigation activeTab={activeTab} onTabChange={(t)=>{ console.log('Main: onTabChange', t); setActiveTab(t);} }>
      {renderActiveTab()}
    </MainNavigation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
