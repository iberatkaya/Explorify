import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import MapView, { Marker, Region, Polygon } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface NeighborhoodFeature {
  type: 'Feature';
  properties: {
    ntaname: string;
    boroname: string;
    [key: string]: any;
  };
  geometry: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  };
}

interface NeighborhoodGeoJSON {
  type: 'FeatureCollection';
  features: NeighborhoodFeature[];
}

interface MapComponentProps {
  region?: Region;
  markers?: Array<{
    id: string;
    coordinate: {
      latitude: number;
      longitude: number;
    };
    title?: string;
    description?: string;
  }>;
  neighborhoods?: NeighborhoodGeoJSON;
}

const MapComponent: React.FC<MapComponentProps> = ({
  region = {
    latitude: 40.7589, // NYC centered coordinates
    longitude: -73.9851,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  markers = [],
  neighborhoods,
}) => {
  const [currentRegion, setCurrentRegion] = useState<Region>(region);
  const [colorCache, setColorCache] = useState<{
    [key: string]: { r: number; g: number; b: number };
  }>({});
  const [colorsLoaded, setColorsLoaded] = useState(false);

  // Load cached colors from AsyncStorage
  useEffect(() => {
    const loadColors = async () => {
      try {
        const storedColors = await AsyncStorage.getItem('neighborhood_colors');
        if (storedColors) {
          setColorCache(JSON.parse(storedColors));
        }
        setColorsLoaded(true);
      } catch (error) {
        console.error('Error loading colors from storage:', error);
        setColorsLoaded(true);
      }
    };

    loadColors();
  }, []);

  // Save colors to AsyncStorage whenever cache updates
  const saveColorsToStorage = useCallback(
    async (colors: { [key: string]: { r: number; g: number; b: number } }) => {
      try {
        await AsyncStorage.setItem(
          'neighborhood_colors',
          JSON.stringify(colors),
        );
      } catch (error) {
        console.error('Error saving colors to storage:', error);
      }
    },
    [],
  );
  // Helper function to convert GeoJSON coordinates to react-native-maps format
  const convertCoordinates = (
    coordinates: number[][][],
  ): Array<{ latitude: number; longitude: number }> => {
    return coordinates[0].map(coord => ({
      longitude: coord[0],
      latitude: coord[1],
    }));
  };

  // Helper function to find the largest polygon in a MultiPolygon (main landmass)
  const getLargestPolygon = (coordinates: number[][][][]) => {
    if (coordinates.length === 1) {
      return coordinates[0];
    }

    // Calculate area for each polygon and return the largest one
    let largestPolygon = coordinates[0];
    let largestArea = 0;

    coordinates.forEach(polygon => {
      const coords = polygon[0];
      // Remove closing coordinate if present
      const cleanCoords =
        coords[coords.length - 1][0] === coords[0][0] &&
        coords[coords.length - 1][1] === coords[0][1]
          ? coords.slice(0, -1)
          : coords;

      // Calculate area using shoelace formula
      let area = 0;
      for (let i = 0; i < cleanCoords.length; i++) {
        const j = (i + 1) % cleanCoords.length;
        area += cleanCoords[i][0] * cleanCoords[j][1];
        area -= cleanCoords[j][0] * cleanCoords[i][1];
      }
      area = Math.abs(area) / 2;

      if (area > largestArea) {
        largestArea = area;
        largestPolygon = polygon;
      }
    });

    return largestPolygon;
  };
  // Helper function to get center point of a polygon using proper centroid calculation
  const getPolygonCenter = (coordinates: number[][][]) => {
    const coords = coordinates[0];

    // Remove the last coordinate if it's the same as the first (closing the polygon)
    const cleanCoords =
      coords[coords.length - 1][0] === coords[0][0] &&
      coords[coords.length - 1][1] === coords[0][1]
        ? coords.slice(0, -1)
        : coords;

    // Calculate polygon centroid using the shoelace formula
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < cleanCoords.length; i++) {
      const j = (i + 1) % cleanCoords.length;
      const xi = cleanCoords[i][0]; // longitude
      const yi = cleanCoords[i][1]; // latitude
      const xj = cleanCoords[j][0]; // longitude
      const yj = cleanCoords[j][1]; // latitude

      const cross = xi * yj - xj * yi;
      area += cross;
      centroidX += (xi + xj) * cross;
      centroidY += (yi + yj) * cross;
    }

    area = area / 2;

    // If area is 0 (degenerate polygon), fall back to simple average
    if (Math.abs(area) < 1e-10) {
      let totalLat = 0;
      let totalLng = 0;
      cleanCoords.forEach(coord => {
        totalLng += coord[0];
        totalLat += coord[1];
      });
      return {
        lat: totalLat / cleanCoords.length,
        lng: totalLng / cleanCoords.length,
      };
    }

    centroidX = centroidX / (6 * area);
    centroidY = centroidY / (6 * area);

    return {
      lat: centroidY,
      lng: centroidX,
    };
  };

  // Helper function to get or generate colors with caching
  const getNeighborhoodColor = useCallback(
    (neighborhoodName: string) => {
      // Check if color is already cached
      if (colorCache[neighborhoodName]) {
        return colorCache[neighborhoodName];
      }

      // Generate new color using the existing algorithm
      let hash = 0;
      for (let i = 0; i < neighborhoodName.length; i++) {
        const char = neighborhoodName.charCodeAt(i);
        hash = hash * 31 + char;
      }

      // Generate vibrant colors by ensuring minimum brightness
      // Use HSL color space approach for better color distribution
      const hue = Math.abs(hash) % 360;
      const saturation = 70 + (Math.abs(hash * 13) % 30); // 70-100% saturation for vibrant colors
      const lightness = 45 + (Math.abs(hash * 7) % 25); // 45-70% lightness to avoid too dark or too light

      // Convert HSL to RGB
      const hslToRgb = (h: number, s: number, l: number) => {
        h = h / 360;
        s = s / 100;
        l = l / 100;

        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => {
          const k = (n + h * 12) % 12;
          return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        };

        return {
          r: Math.round(f(0) * 255),
          g: Math.round(f(8) * 255),
          b: Math.round(f(4) * 255),
        };
      };

      const newColor = hslToRgb(hue, saturation, lightness);

      // Cache the new color
      const updatedCache = { ...colorCache, [neighborhoodName]: newColor };
      setColorCache(updatedCache);

      // Save to storage asynchronously
      saveColorsToStorage(updatedCache);

      return newColor;
    },
    [colorCache, saveColorsToStorage],
  );

  // Helper function to determine if labels should be clustered based on zoom level
  const shouldClusterLabels = (mapRegion: Region) => {
    // If latitudeDelta is large (zoomed out), cluster labels
    return mapRegion.latitudeDelta > 0.05; // Adjust this threshold as needed
  };

  // Helper function to cluster nearby neighborhoods
  const clusterNeighborhoods = useMemo(() => {
    if (!neighborhoods || !shouldClusterLabels(currentRegion)) {
      return neighborhoods?.features || [];
    }

    const clustered: NeighborhoodFeature[] = [];
    const processed = new Set<number>();
    const clusterDistance = currentRegion.latitudeDelta * 0.3; // Cluster distance based on zoom

    neighborhoods.features.forEach((feature, index) => {
      if (processed.has(index)) return;

      const largestPolygon = getLargestPolygon(feature.geometry.coordinates);
      const center = getPolygonCenter(largestPolygon);

      // Find nearby neighborhoods to cluster
      const cluster = [feature];
      processed.add(index);

      neighborhoods.features.forEach((otherFeature, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return;

        const otherLargestPolygon = getLargestPolygon(
          otherFeature.geometry.coordinates,
        );
        const otherCenter = getPolygonCenter(otherLargestPolygon);

        const distance = Math.sqrt(
          Math.pow(center.lat - otherCenter.lat, 2) +
            Math.pow(center.lng - otherCenter.lng, 2),
        );

        if (distance < clusterDistance) {
          cluster.push(otherFeature);
          processed.add(otherIndex);
        }
      });

      // Create a representative feature for the cluster
      if (cluster.length > 1) {
        // Use the largest neighborhood in the cluster as representative
        const representative = cluster.reduce((prev, current) => {
          const prevPolygon = getLargestPolygon(prev.geometry.coordinates);
          const currentPolygon = getLargestPolygon(
            current.geometry.coordinates,
          );

          // Simple area comparison (could be more sophisticated)
          const prevArea = prevPolygon[0].length;
          const currentArea = currentPolygon[0].length;

          return currentArea > prevArea ? current : prev;
        });

        // Modify the name to show it's a cluster
        const clusterFeature: NeighborhoodFeature = {
          ...representative,
          properties: {
            ...representative.properties,
            ntaname:
              cluster.length === 2
                ? `${representative.properties.ntaname} & ${
                    cluster.find(f => f !== representative)?.properties.ntaname
                  }`
                : `${representative.properties.ntaname}`,
          },
        };
        clustered.push(clusterFeature);
      } else {
        clustered.push(feature);
      }
    });

    return clustered;
  }, [neighborhoods, currentRegion]);

  // Callback for region change
  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    setCurrentRegion(newRegion);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
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
                }}
              />
            ));
          })}

        {/* Render neighborhood name labels */}
        {clusterNeighborhoods.map((feature, index) => {
          const largestPolygon = getLargestPolygon(
            feature.geometry.coordinates,
          );
          const center = getPolygonCenter(largestPolygon);
          return (
            <Marker
              key={`label-${feature.properties.ntaname}-${index}`}
              coordinate={{
                latitude: center.lat,
                longitude: center.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={
                  feature.properties.ntaname.includes('+') ||
                  feature.properties.ntaname.includes('&')
                    ? styles.clusterLabelContainer
                    : styles.labelContainer
                }
              >
                <Text
                  style={
                    feature.properties.ntaname.includes('+') ||
                    feature.properties.ntaname.includes('&')
                      ? styles.clusterLabelText
                      : styles.labelText
                  }
                >
                  {feature.properties.ntaname}
                </Text>
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
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: width,
    height: height,
  },
  labelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  clusterLabelContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)', // Blue background for clusters
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  clusterLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});

export default MapComponent;
