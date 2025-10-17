import { Region } from 'react-native-maps';

export interface NeighborhoodFeature {
    type: 'Feature';
    properties: {
        ntaname: string;
        boroname: string;
        // Properties added during clustering
        originalNtaname?: string;
        clusterMembers?: string[];
        [key: string]: any;
    };
    geometry: {
        type: 'MultiPolygon';
        coordinates: number[][][][];
    };
}

export interface NeighborhoodGeoJSON {
    type: 'FeatureCollection';
    features: NeighborhoodFeature[];
}

export interface Place {
    id: string;
    title: string;
    googleMapsLink?: string;
}

export interface MapComponentProps {
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
    places?: { [neighborhoodName: string]: Place[] };
    onNeighborhoodPress?: (neighborhood: NeighborhoodFeature) => void;
}

export interface ColorData {
    r: number;
    g: number;
    b: number;
}