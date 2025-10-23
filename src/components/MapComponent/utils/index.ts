import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Place interface from types file
interface Place {
    id: string;
    title: string;
    googleMapsLink?: string;
}

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

export interface ColorData {
    r: number;
    g: number;
    b: number;
}

// Helper function to convert GeoJSON coordinates to react-native-maps format
export const convertCoordinates = (
    coordinates: number[][][],
): Array<{ latitude: number; longitude: number }> => {
    return coordinates[0].map(coord => ({
        longitude: coord[0],
        latitude: coord[1],
    }));
};

// Helper function to find the largest polygon in a MultiPolygon (main landmass)
export const getLargestPolygon = (coordinates: number[][][][]) => {
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
export const getPolygonCenter = (coordinates: number[][][]) => {
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
export const generateColorFromSeed = (seed: string): ColorData => {
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

// Storage functions for color persistence
export const loadColorsFromStorage = async (): Promise<{ [key: string]: ColorData }> => {
    try {
        const storedColors = await AsyncStorage.getItem('neighborhood_colors');
        return storedColors ? JSON.parse(storedColors) : {};
    } catch (error) {
        console.error('Error loading colors from storage:', error);
        return {};
    }
};

export const saveColorsToStorage = async (colors: { [key: string]: ColorData }): Promise<void> => {
    try {
        await AsyncStorage.setItem('neighborhood_colors', JSON.stringify(colors));
    } catch (error) {
        console.error('Error saving colors to storage:', error);
    }
};

// Clustering utility functions
export const shouldClusterLabels = (latitudeDelta: number): boolean => {
    // If latitudeDelta is large (zoomed out), cluster labels
    return latitudeDelta > 0.08; // Adjust this threshold as needed
};

export const clusterNeighborhoods = (
    features: NeighborhoodFeature[],
    clusterDistance: number,
    mapCenter: { lat: number; lng: number },
    places?: { [neighborhoodName: string]: Place[] },
): NeighborhoodFeature[] => {
    const clustered: NeighborhoodFeature[] = [];
    const processed = new Set<number>();
    const allClusters: Array<{ cluster: NeighborhoodFeature[]; centerDistance: number }> = [];

    // First pass: create all clusters and calculate their distance to map center
    features.forEach((feature, index) => {
        if (processed.has(index)) return;

        const largestPolygon = getLargestPolygon(feature.geometry.coordinates);
        const center = getPolygonCenter(largestPolygon);

        // Find nearby neighborhoods to cluster
        const cluster = [feature];
        processed.add(index);

        features.forEach((otherFeature, otherIndex) => {
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

        // Calculate cluster's distance to map center (using first feature's center as proxy)
        const clusterCenterDistance = Math.sqrt(
            Math.pow(mapCenter.lat - center.lat, 2) +
            Math.pow(mapCenter.lng - center.lng, 2)
        );

        allClusters.push({ cluster, centerDistance: clusterCenterDistance });
    });

    // Find the cluster closest to map center
    const centralCluster = allClusters.reduce((closest, current) =>
        current.centerDistance < closest.centerDistance ? current : closest
    );

    // Process all clusters
    allClusters.forEach(({ cluster }) => {
        if (cluster.length > 1) {
            let representative: NeighborhoodFeature;

            // Helper function to check if a neighborhood has places
            const hasPlaces = (feature: NeighborhoodFeature) => {
                const neighborhoodPlaces = places?.[feature.properties.ntaname] || [];
                return neighborhoodPlaces.length > 0;
            };

            // Helper function to get place count for a neighborhood
            const getPlaceCount = (feature: NeighborhoodFeature) => {
                const neighborhoodPlaces = places?.[feature.properties.ntaname] || [];
                return neighborhoodPlaces.length;
            };

            // Only use smart center-based logic for the cluster closest to map center
            if (cluster === centralCluster.cluster) {
                // First, try to find neighborhoods with places
                const neighborhoodsWithPlaces = cluster.filter(hasPlaces);

                if (neighborhoodsWithPlaces.length > 0) {
                    // If multiple neighborhoods have places, pick the one with most places
                    // If tied, pick the one closest to map center
                    representative = neighborhoodsWithPlaces.reduce((best, current) => {
                        const bestPlaceCount = getPlaceCount(best);
                        const currentPlaceCount = getPlaceCount(current);

                        // If current has more places, it wins
                        if (currentPlaceCount > bestPlaceCount) {
                            return current;
                        }

                        // If same number of places, pick the one closer to map center
                        if (currentPlaceCount === bestPlaceCount) {
                            const bestPolygon = getLargestPolygon(best.geometry.coordinates);
                            const bestCenter = getPolygonCenter(bestPolygon);
                            const bestDistance = Math.sqrt(
                                Math.pow(mapCenter.lat - bestCenter.lat, 2) +
                                Math.pow(mapCenter.lng - bestCenter.lng, 2)
                            );

                            const currentPolygon = getLargestPolygon(current.geometry.coordinates);
                            const currentCenter = getPolygonCenter(currentPolygon);
                            const currentDistance = Math.sqrt(
                                Math.pow(mapCenter.lat - currentCenter.lat, 2) +
                                Math.pow(mapCenter.lng - currentCenter.lng, 2)
                            );

                            return currentDistance < bestDistance ? current : best;
                        }

                        // If best has more places, it stays
                        return best;
                    });
                } else {
                    // No neighborhoods with places, fall back to closest to map center
                    representative = cluster.reduce((closest, current) => {
                        const closestPolygon = getLargestPolygon(closest.geometry.coordinates);
                        const closestCenter = getPolygonCenter(closestPolygon);
                        const closestDistance = Math.sqrt(
                            Math.pow(mapCenter.lat - closestCenter.lat, 2) +
                            Math.pow(mapCenter.lng - closestCenter.lng, 2)
                        );

                        const currentPolygon = getLargestPolygon(current.geometry.coordinates);
                        const currentCenter = getPolygonCenter(currentPolygon);
                        const currentDistance = Math.sqrt(
                            Math.pow(mapCenter.lat - currentCenter.lat, 2) +
                            Math.pow(mapCenter.lng - currentCenter.lng, 2)
                        );

                        return currentDistance < closestDistance ? current : closest;
                    });
                }
            } else {
                // For other clusters, prioritize neighborhoods with places first
                const neighborhoodsWithPlaces = cluster.filter(hasPlaces);

                if (neighborhoodsWithPlaces.length > 0) {
                    // Pick the neighborhood with the most places
                    representative = neighborhoodsWithPlaces.reduce((best, current) => {
                        const bestPlaceCount = getPlaceCount(best);
                        const currentPlaceCount = getPlaceCount(current);
                        return currentPlaceCount > bestPlaceCount ? current : best;
                    });
                } else {
                    // No neighborhoods with places, just use the first neighborhood
                    representative = cluster[0];
                }
            }

            // Modify the name to show it's a cluster
            const clusterFeature: NeighborhoodFeature = {
                ...representative,
                properties: {
                    ...representative.properties,
                    ntaname:
                        cluster.length === 2
                            ? `${representative.properties.ntaname} & ${cluster.find(f => f !== representative)?.properties.ntaname
                            }`
                            : `${representative.properties.ntaname} (+${cluster.length - 1})`,
                    // Store original names and all cluster members for places lookup
                    originalNtaname: representative.properties.ntaname,
                    clusterMembers: cluster.map(f => f.properties.ntaname),
                },
            };
            clustered.push(clusterFeature);
        } else {
            clustered.push(cluster[0]);
        }
    });

    return clustered;
};

// Point-in-polygon test using ray casting algorithm
export const isPointInPolygon = (
    point: { latitude: number; longitude: number },
    polygon: number[][][]
): boolean => {
    const x = point.longitude;
    const y = point.latitude;
    const coords = polygon[0]; // Use the outer ring

    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const xi = coords[i][0];
        const yi = coords[i][1];
        const xj = coords[j][0];
        const yj = coords[j][1];

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
};

// Find which neighborhood contains a given coordinate
export const findNeighborhoodForCoordinate = (
    coordinate: { latitude: number; longitude: number },
    neighborhoods: NeighborhoodFeature[]
): NeighborhoodFeature | null => {
    for (const neighborhood of neighborhoods) {
        // Check all polygons in the MultiPolygon
        for (const polygon of neighborhood.geometry.coordinates) {
            if (isPointInPolygon(coordinate, polygon)) {
                return neighborhood;
            }
        }
    }
    return null;
};