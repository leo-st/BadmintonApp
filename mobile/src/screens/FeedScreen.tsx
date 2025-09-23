import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PostsScreen } from './PostsScreen';

export const FeedScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <PostsScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
