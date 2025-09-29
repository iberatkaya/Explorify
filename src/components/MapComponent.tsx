import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
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
});

export default MapComponent;
