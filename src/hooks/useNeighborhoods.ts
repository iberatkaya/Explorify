import { useState, useEffect } from 'react';

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

export const useNeighborhoods = () => {
    const [neighborhoods, setNeighborhoods] = useState<NeighborhoodGeoJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadNeighborhoods = async () => {
            try {
                // In a real app, you would load from the actual GeoJSON file
                // For now, we'll create a sample based on the example you provided
                const neighborhoodsData = require('../assets/neighborhoods.json');
                setNeighborhoods(neighborhoodsData);
            } catch (err) {
                setError('Failed to load neighborhoods data');
                console.error('Error loading neighborhoods:', err);
            } finally {
                setLoading(false);
            }
        };

        loadNeighborhoods();
    }, []);

    return { neighborhoods, loading, error };
};