import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapComponent from '../components/MapComponent';
import { useNeighborhoods } from '../hooks/useNeighborhoods';

const NeighborhoodsMapScreen: React.FC = () => {
  const { neighborhoods, loading, error } = useNeighborhoods();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading neighborhoods...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapComponent
        neighborhoods={neighborhoods || undefined}
        region={{
          latitude: 40.7589, // NYC coordinates
          longitude: -73.9851,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#cc0000',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default NeighborhoodsMapScreen;
