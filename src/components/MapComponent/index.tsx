import React, { useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Region, Polygon } from 'react-native-maps';
import debounce from 'debounce';

// Local imports
import { mapStyles } from './styles';
import { MapComponentProps, Place } from './types';
import { useNeighborhoodColors } from './hooks/useNeighborhoodColors';
import {
  convertCoordinates,
  getLargestPolygon,
  getPolygonCenter,
  shouldClusterLabels,
  clusterNeighborhoods,
} from './utils';

const MapComponent: React.FC<MapComponentProps> = ({
  region = {
    latitude: 40.7589, // NYC centered coordinates
    longitude: -73.9851,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  markers = [],
  neighborhoods,
  places = {},
  onNeighborhoodPress,
  onMarkerPress,
}) => {
  const [currentRegion, setCurrentRegion] = useState<Region>(region);
  const { getNeighborhoodColor, colorsLoaded } = useNeighborhoodColors();

  // Helper function to cluster nearby neighborhoods
  const clusteredNeighborhoods = useMemo(() => {
    if (!neighborhoods || !shouldClusterLabels(currentRegion.latitudeDelta)) {
      return neighborhoods?.features || [];
    }

    const clusterDistance = currentRegion.latitudeDelta * 0.3; // Cluster distance based on zoom
    const mapCenter = {
      lat: currentRegion.latitude,
      lng: currentRegion.longitude,
    };
    return clusterNeighborhoods(
      neighborhoods.features,
      clusterDistance,
      mapCenter,
      places, // Pass places data to prioritize neighborhoods with places
    );
  }, [neighborhoods, currentRegion, places]);

  // Create debounced function for region updates
  const debouncedSetCurrentRegion = useMemo(
    () =>
      debounce((newRegion: Region) => {
        setCurrentRegion(newRegion);
      }, 30),
    [],
  );

  // Debounced callback for region change (real-time during zoom/pan)
  const onRegionChange = useCallback(
    (newRegion: Region) => {
      debouncedSetCurrentRegion(newRegion);
    },
    [debouncedSetCurrentRegion],
  );

  // Callback for region change complete (when user stops interacting)
  const onRegionChangeComplete = useCallback(
    (newRegion: Region) => {
      // Cancel any pending debounced calls
      debouncedSetCurrentRegion.clear();
      // Immediately update the region when interaction ends
      setCurrentRegion(newRegion);
    },
    [debouncedSetCurrentRegion],
  );

  return (
    <View style={mapStyles.container}>
      <MapView
        style={mapStyles.map}
        initialRegion={region}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        mapType="standard"
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsIndoors={false}
        showsIndoorLevelPicker={false}
        showsTraffic={false}
      >
        {/* Render neighborhood polygons */}
        {colorsLoaded &&
          neighborhoods?.features.map((feature, index) => {
            const { r, g, b } = getNeighborhoodColor(
              feature.properties.ntaname,
            );
            return feature.geometry.coordinates.map((polygon, polygonIndex) => (
              <Polygon
                key={`${feature.properties.ntaname}-${index}-${polygonIndex}`}
                coordinates={convertCoordinates(polygon)}
                fillColor={`rgba(${r}, ${g}, ${b}, 0.2)`}
                strokeColor={`rgba(${r}, ${g}, ${b}, 0.6)`}
                strokeWidth={2}
                tappable={true}
                onPress={() => {
                  console.log(
                    `Tapped ${feature.properties.ntaname} in ${feature.properties.boroname}`,
                  );
                  onNeighborhoodPress?.(feature);
                }}
              />
            ));
          })}

        {/* Render neighborhood name labels */}
        {colorsLoaded &&
          clusteredNeighborhoods.map((feature, index) => {
            const largestPolygon = getLargestPolygon(
              feature.geometry.coordinates,
            );
            const center = getPolygonCenter(largestPolygon);

            // Handle both clustered and non-clustered neighborhoods
            let neighborhoodPlaces: Place[] = [];
            if (feature.properties.clusterMembers) {
              // This is a clustered neighborhood, aggregate places from all members
              neighborhoodPlaces = feature.properties.clusterMembers.reduce(
                (allPlaces: Place[], memberName: string) => {
                  const memberPlaces = places[memberName] || [];
                  return allPlaces.concat(memberPlaces);
                },
                [],
              );
            } else {
              // This is a single neighborhood
              neighborhoodPlaces = places[feature.properties.ntaname] || [];
            }

            const hasPlaces = neighborhoodPlaces.length > 0;

            // Check if this is a clustered neighborhood and extract count
            const isCluster =
              feature.properties.clusterMembers &&
              feature.properties.clusterMembers.length > 1;
            let neighborhoodName = feature.properties.ntaname;
            let clusterCount = null;

            if (isCluster) {
              // Extract cluster count from the name format "Name (+X)"
              const clusterMatch = neighborhoodName.match(
                /^(.+?)\s*\(\+(\d+)\)$/,
              );
              if (clusterMatch) {
                neighborhoodName = clusterMatch[1];
                clusterCount = clusterMatch[2];
              }
            }

            return (
              <Marker
                key={`label-${feature.properties.ntaname}-${index}`}
                coordinate={{
                  latitude: center.lat,
                  longitude: center.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => {
                  console.log(
                    `Marker pressed for ${feature.properties.ntaname}`,
                  );
                  onNeighborhoodPress?.(feature);
                }}
              >
                <View
                  style={[
                    mapStyles.labelContainer,
                    hasPlaces && mapStyles.labelContainerWithPlaces,
                  ]}
                >
                  <View style={mapStyles.titleContainer}>
                    <Text
                      style={
                        hasPlaces
                          ? mapStyles.labelTextWithPlaces
                          : mapStyles.labelText
                      }
                    >
                      {neighborhoodName.split('-').join('\n')}
                    </Text>
                    {clusterCount && (
                      <Text
                        style={[
                          hasPlaces
                            ? mapStyles.clusterCountTextWithPlaces
                            : mapStyles.clusterCountText,
                        ]}
                      >
                        +{clusterCount}
                      </Text>
                    )}
                  </View>
                  {hasPlaces && (
                    <Text style={mapStyles.placesText}>
                      📍 {neighborhoodPlaces.length} place
                      {neighborhoodPlaces.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </Marker>
            );
          })}

        {/* Render markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => {
              console.log(`Regular marker pressed: ${marker.id}`);
              onMarkerPress?.(marker);
            }}
          />
        ))}
      </MapView>
    </View>
  );
};

export default MapComponent;
