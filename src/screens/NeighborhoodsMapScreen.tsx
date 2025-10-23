import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from '@gorhom/bottom-sheet';
import MapComponent from '../components/MapComponent';
import NeighborhoodBottomSheet from '../components/NeighborhoodBottomSheet';
import { useNeighborhoods } from '../hooks/useNeighborhoods';
import { NeighborhoodFeature } from '../components/MapComponent/types';
import { Place } from '../components/NeighborhoodBottomSheet/types';

const PLACES_STORAGE_KEY = '@explorify_places';

const NeighborhoodsMapScreen: React.FC = () => {
  const { neighborhoods, loading, error } = useNeighborhoods();
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState<NeighborhoodFeature | null>(null);
  const [places, setPlaces] = useState<{ [key: string]: Place[] }>({});
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Load places from storage on component mount
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const storedPlaces = await AsyncStorage.getItem(PLACES_STORAGE_KEY);
        if (storedPlaces) {
          setPlaces(JSON.parse(storedPlaces));
        }
      } catch (err) {
        console.error('Error loading places from storage:', err);
      }
    };

    loadPlaces();
  }, []);

  // Save places to storage whenever places state changes
  useEffect(() => {
    const savePlaces = async () => {
      try {
        await AsyncStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(places));
      } catch (err) {
        console.error('Error saving places to storage:', err);
      }
    };

    // Only save if places is not empty (to avoid saving empty state on first load)
    if (Object.keys(places).length > 0) {
      savePlaces();
    }
  }, [places]);

  // Handle neighborhood press from map
  const handleNeighborhoodPress = useCallback(
    (neighborhood: NeighborhoodFeature) => {
      console.log(
        'Neighborhood pressed:',
        neighborhood.properties.ntaname,
        !!bottomSheetRef.current,
      );
      setSelectedNeighborhood(neighborhood);
      bottomSheetRef.current?.expand();
    },
    [],
  );

  // Handle marker press from map
  const handleMarkerPress = useCallback(
    (marker: {
      id: string;
      coordinate: { latitude: number; longitude: number };
      title?: string;
      description?: string;
    }) => {
      console.log('Marker pressed:', marker.id, marker.coordinate);

      // Find which neighborhood this marker belongs to
      if (neighborhoods?.features) {
        const {
          findNeighborhoodForCoordinate,
        } = require('../components/MapComponent/utils');
        const foundNeighborhood = findNeighborhoodForCoordinate(
          marker.coordinate,
          neighborhoods.features,
        );

        if (foundNeighborhood) {
          console.log(
            'Found neighborhood for marker:',
            foundNeighborhood.properties.ntaname,
          );
          setSelectedNeighborhood(foundNeighborhood);
          bottomSheetRef.current?.expand();
        } else {
          console.log('No neighborhood found for marker at', marker.coordinate);
        }
      }
    },
    [neighborhoods],
  );

  // Handle closing bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    setSelectedNeighborhood(null);
    bottomSheetRef.current?.close();
  }, []);

  // Handle adding a new place
  const handleAddPlace = useCallback(
    (title: string, googleMapsLink?: string) => {
      if (!selectedNeighborhood) return;

      const neighborhoodId = selectedNeighborhood.properties.ntaname;
      const newPlace: Place = {
        id: Date.now().toString(),
        title,
        googleMapsLink,
      };

      setPlaces(prev => ({
        ...prev,
        [neighborhoodId]: [...(prev[neighborhoodId] || []), newPlace],
      }));
    },
    [selectedNeighborhood],
  );

  // Handle editing an existing place
  const handleEditPlace = useCallback(
    (placeId: string, title: string, googleMapsLink?: string) => {
      if (!selectedNeighborhood) return;

      const neighborhoodId = selectedNeighborhood.properties.ntaname;
      setPlaces(prev => ({
        ...prev,
        [neighborhoodId]: (prev[neighborhoodId] || []).map(place =>
          place.id === placeId ? { ...place, title, googleMapsLink } : place,
        ),
      }));
    },
    [selectedNeighborhood],
  );

  // Handle removing a place
  const handleRemovePlace = useCallback(
    (placeId: string) => {
      if (!selectedNeighborhood) return;

      const neighborhoodId = selectedNeighborhood.properties.ntaname;
      setPlaces(prev => ({
        ...prev,
        [neighborhoodId]: (prev[neighborhoodId] || []).filter(
          place => place.id !== placeId,
        ),
      }));
    },
    [selectedNeighborhood],
  );

  // Handle place press (for Google Maps opening)
  const handlePlacePress = useCallback((place: Place) => {
    console.log('Place pressed:', place.title, place.googleMapsLink);
    // The Google Maps opening is handled in the NeighborhoodBottomSheet component
  }, []);

  // Get places for current neighborhood
  const currentPlaces = selectedNeighborhood
    ? places[selectedNeighborhood.properties.ntaname] || []
    : [];

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
        places={places}
        onNeighborhoodPress={handleNeighborhoodPress}
        onMarkerPress={handleMarkerPress}
        region={{
          latitude: 40.7589, // NYC coordinates
          longitude: -73.9851,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      />
      <NeighborhoodBottomSheet
        ref={bottomSheetRef}
        neighborhoodName={selectedNeighborhood?.properties.ntaname}
        places={currentPlaces}
        onClose={handleCloseBottomSheet}
        onAddPlace={handleAddPlace}
        onEditPlace={handleEditPlace}
        onRemovePlace={handleRemovePlace}
        onPlacePress={handlePlacePress}
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
