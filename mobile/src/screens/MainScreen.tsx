import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
      setActiveTab(route.params.tab);
    }
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
});
