import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  fixed?: boolean; // New prop for viewport-fixed positioning
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = '+',
  style,
  fixed = false,
}) => {
  const fabStyle = fixed && Platform.OS === 'web' 
    ? [styles.fab, styles.fabFixed, style]
    : [styles.fab, style];

  return (
    <TouchableOpacity
      style={fabStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.fabIcon}>{icon}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
  },
  fabFixed: {
    // Fixed positioning for web to stay in viewport
    position: 'fixed' as any,
    zIndex: 9999,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});
