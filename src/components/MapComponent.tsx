import React from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import MapView, { Marker, Region, Polygon } from 'react-native-maps';

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

  // Helper function to generate bright, vibrant colors based on neighborhood name
  const getRandomColor = (seed: string) => {
    // Use a simple hash function based on the neighborhood name for consistent colors
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
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

    return hslToRgb(hue, saturation, lightness);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
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
        {neighborhoods?.features.map((feature, index) => {
          const { r, g, b } = getRandomColor(feature.properties.ntaname);
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
        {neighborhoods?.features.map((feature, index) => {
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
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>
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
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default MapComponent;
