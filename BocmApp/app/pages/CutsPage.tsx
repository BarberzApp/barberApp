import React from 'react';
import { View, StyleSheet } from 'react-native';
import OptimizedFeedScreen from '../screens/OptimizedFeedScreen';

const CutsPage = () => {
  return (
    <View style={styles.container}>
      <OptimizedFeedScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default CutsPage; 