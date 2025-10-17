import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    convertCoordinates,
    getLargestPolygon,
    getPolygonCenter,
    generateColorFromSeed,
    loadColorsFromStorage,
    saveColorsToStorage,
    shouldClusterLabels,
    clusterNeighborhoods,
    NeighborhoodFeature,
} from '../index';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('MapComponent Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('convertCoordinates', () => {
        it('should convert GeoJSON coordinates to react-native-maps format', () => {
            const geoJsonCoords = [
                [
                    [-73.9851, 40.7589],
                    [-73.9841, 40.7599],
                    [-73.9861, 40.7609],
                    [-73.9851, 40.7589], // closing coordinate
                ],
            ];

            const result = convertCoordinates(geoJsonCoords);

            expect(result).toEqual([
                { longitude: -73.9851, latitude: 40.7589 },
                { longitude: -73.9841, latitude: 40.7599 },
                { longitude: -73.9861, latitude: 40.7609 },
                { longitude: -73.9851, latitude: 40.7589 },
            ]);
        });

        it('should handle empty coordinates array', () => {
            const result = convertCoordinates([[]]);
            expect(result).toEqual([]);
        });
    });

    describe('getLargestPolygon', () => {
        it('should return the only polygon when there is one', () => {
            const singlePolygon = [
                [
                    [
                        [-73.9851, 40.7589],
                        [-73.9841, 40.7599],
                        [-73.9861, 40.7609],
                        [-73.9851, 40.7589],
                    ],
                ],
            ];

            const result = getLargestPolygon(singlePolygon);
            expect(result).toBe(singlePolygon[0]);
        });

        it('should return the largest polygon when there are multiple', () => {
            const smallPolygon = [
                [
                    [-73.9851, 40.7589],
                    [-73.9841, 40.7599],
                    [-73.9851, 40.7589],
                ],
            ];

            const largePolygon = [
                [
                    [-74.0051, 40.7289],
                    [-74.0041, 40.7299],
                    [-74.0061, 40.7309],
                    [-74.0071, 40.7319],
                    [-74.0051, 40.7289],
                ],
            ];

            const multiPolygon = [smallPolygon, largePolygon];
            const result = getLargestPolygon(multiPolygon);

            expect(result).toBe(largePolygon);
        });
    });

    describe('getPolygonCenter', () => {
        it('should calculate centroid correctly for a triangle', () => {
            const triangleCoords = [
                [
                    [0, 0],
                    [3, 0],
                    [0, 3],
                    [0, 0], // closing coordinate
                ],
            ];

            const result = getPolygonCenter(triangleCoords);

            // For a triangle with vertices at (0,0), (3,0), (0,3), centroid should be at (1,1)
            expect(result.lng).toBeCloseTo(1, 1);
            expect(result.lat).toBeCloseTo(1, 1);
        });

        it('should handle degenerate polygon with fallback to average', () => {
            const degenerateCoords = [
                [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                ],
            ];

            const result = getPolygonCenter(degenerateCoords);

            expect(result.lng).toBe(0);
            expect(result.lat).toBe(0);
        });

        it('should remove closing coordinate before calculation', () => {
            const coordsWithClosing = [
                [
                    [0, 0],
                    [2, 0],
                    [1, 2],
                    [0, 0], // closing coordinate
                ],
            ];

            const coordsWithoutClosing = [
                [
                    [0, 0],
                    [2, 0],
                    [1, 2],
                ],
            ];

            const result1 = getPolygonCenter(coordsWithClosing);
            const result2 = getPolygonCenter(coordsWithoutClosing);

            expect(result1.lng).toBeCloseTo(result2.lng, 5);
            expect(result1.lat).toBeCloseTo(result2.lat, 5);
        });
    });

    describe('generateColorFromSeed', () => {
        it('should generate consistent colors for the same seed', () => {
            const seed = 'Manhattan';
            const color1 = generateColorFromSeed(seed);
            const color2 = generateColorFromSeed(seed);

            expect(color1).toEqual(color2);
        });

        it('should generate different colors for different seeds', () => {
            const color1 = generateColorFromSeed('Manhattan');
            const color2 = generateColorFromSeed('Brooklyn');

            expect(color1).not.toEqual(color2);
        });

        it('should generate valid RGB values', () => {
            const color = generateColorFromSeed('TestNeighborhood');

            expect(color.r).toBeGreaterThanOrEqual(0);
            expect(color.r).toBeLessThanOrEqual(255);
            expect(color.g).toBeGreaterThanOrEqual(0);
            expect(color.g).toBeLessThanOrEqual(255);
            expect(color.b).toBeGreaterThanOrEqual(0);
            expect(color.b).toBeLessThanOrEqual(255);
        });

        it('should generate vibrant colors (not too dark)', () => {
            const color = generateColorFromSeed('TestNeighborhood');

            // Convert back to HSL to check lightness
            const r = color.r / 255;
            const g = color.g / 255;
            const b = color.b / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const lightness = (max + min) / 2;

            // Should be between 45% and 70% lightness as per our algorithm
            expect(lightness).toBeGreaterThan(0.4);
            expect(lightness).toBeLessThan(0.8);
        });
    });

    describe('loadColorsFromStorage', () => {
        it('should load colors from AsyncStorage successfully', async () => {
            const mockColors = {
                Manhattan: { r: 255, g: 0, b: 0 },
                Brooklyn: { r: 0, g: 255, b: 0 },
            };

            mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockColors));

            const result = await loadColorsFromStorage();

            expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('neighborhood_colors');
            expect(result).toEqual(mockColors);
        });

        it('should return empty object when no stored colors', async () => {
            mockAsyncStorage.getItem.mockResolvedValue(null);

            const result = await loadColorsFromStorage();

            expect(result).toEqual({});
        });

        it('should handle AsyncStorage errors gracefully', async () => {
            mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await loadColorsFromStorage();

            expect(result).toEqual({});
            expect(consoleSpy).toHaveBeenCalledWith('Error loading colors from storage:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('saveColorsToStorage', () => {
        it('should save colors to AsyncStorage successfully', async () => {
            const colors = {
                Manhattan: { r: 255, g: 0, b: 0 },
                Brooklyn: { r: 0, g: 255, b: 0 },
            };

            mockAsyncStorage.setItem.mockResolvedValue();

            await saveColorsToStorage(colors);

            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
                'neighborhood_colors',
                JSON.stringify(colors)
            );
        });

        it('should handle AsyncStorage errors gracefully', async () => {
            const colors = { Manhattan: { r: 255, g: 0, b: 0 } };

            mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await saveColorsToStorage(colors);

            expect(consoleSpy).toHaveBeenCalledWith('Error saving colors to storage:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('shouldClusterLabels', () => {
        it('should return true when zoomed out (large latitudeDelta)', () => {
            expect(shouldClusterLabels(0.1)).toBe(true);
            expect(shouldClusterLabels(0.5)).toBe(true);
        });

        it('should return false when zoomed in (small latitudeDelta)', () => {
            expect(shouldClusterLabels(0.01)).toBe(false);
            expect(shouldClusterLabels(0.05)).toBe(false);
        });

        it('should handle edge case at threshold', () => {
            expect(shouldClusterLabels(0.05)).toBe(false);
            expect(shouldClusterLabels(0.051)).toBe(true);
        });
    });

    describe('clusterNeighborhoods', () => {
        const createMockFeature = (name: string, coords: number[][][]): NeighborhoodFeature => ({
            type: 'Feature',
            properties: {
                ntaname: name,
                boroname: 'TestBoro',
            },
            geometry: {
                type: 'MultiPolygon',
                coordinates: [coords],
            },
        });

        it('should return original features when no clustering needed', () => {
            const feature1 = createMockFeature('Far North', [[[0, 10], [1, 10], [0.5, 11], [0, 10]]]);
            const feature2 = createMockFeature('Far South', [[[0, 0], [1, 0], [0.5, 1], [0, 0]]]);

            const features = [feature1, feature2];
            const mapCenter = { lat: 5, lng: 0.5 };
            const result = clusterNeighborhoods(features, 0.1, mapCenter);

            expect(result).toHaveLength(2);
            expect(result[0].properties.ntaname).toBe('Far North');
            expect(result[1].properties.ntaname).toBe('Far South');
        });

        it('should cluster nearby neighborhoods', () => {
            const feature1 = createMockFeature('Close1', [[[0, 0], [1, 0], [0.5, 1], [0, 0]]]);
            const feature2 = createMockFeature('Close2', [[[0.01, 0.01], [1.01, 0.01], [0.51, 1.01], [0.01, 0.01]]]);

            const features = [feature1, feature2];
            const mapCenter = { lat: 0.5, lng: 0.5 };
            const result = clusterNeighborhoods(features, 0.1, mapCenter);

            expect(result).toHaveLength(1);
            expect(result[0].properties.ntaname).toContain('&');
        });

        it('should create appropriate cluster names', () => {
            const feature1 = createMockFeature('Area1', [[[0, 0], [1, 0], [0.5, 1], [0, 0]]]);
            const feature2 = createMockFeature('Area2', [[[0.01, 0.01], [1.01, 0.01], [0.51, 1.01], [0.01, 0.01]]]);
            const feature3 = createMockFeature('Area3', [[[0.02, 0.02], [1.02, 0.02], [0.52, 1.02], [0.02, 0.02]]]);

            const features = [feature1, feature2, feature3];
            const mapCenter = { lat: 0.5, lng: 0.5 };
            const result = clusterNeighborhoods(features, 0.1, mapCenter);

            expect(result).toHaveLength(1);
            expect(result[0].properties.ntaname).toMatch(/Area\d+ \(\+2\)/);
        });

        it('should handle empty features array', () => {
            const mapCenter = { lat: 0, lng: 0 };
            const result = clusterNeighborhoods([], 0.1, mapCenter);
            expect(result).toEqual([]);
        });

        it('should prioritize neighborhoods with places in clustering', () => {
            const feature1 = createMockFeature('NoPlaces', [[[0, 0], [1, 0], [0.5, 1], [0, 0]]]);
            const feature2 = createMockFeature('WithPlaces', [[[0.01, 0.01], [1.01, 0.01], [0.51, 1.01], [0.01, 0.01]]]);

            const features = [feature1, feature2];
            const mapCenter = { lat: 0.5, lng: 0.5 };
            const places = {
                'WithPlaces': [{ id: '1', title: 'Cool Place' }],
                'NoPlaces': []
            };
            const result = clusterNeighborhoods(features, 0.1, mapCenter, places);

            expect(result).toHaveLength(1);
            expect(result[0].properties.ntaname).toContain('WithPlaces');
        });

        it('should prioritize neighborhood with more places when clustering', () => {
            const feature1 = createMockFeature('FewPlaces', [[[0, 0], [1, 0], [0.5, 1], [0, 0]]]);
            const feature2 = createMockFeature('ManyPlaces', [[[0.01, 0.01], [1.01, 0.01], [0.51, 1.01], [0.01, 0.01]]]);

            const features = [feature1, feature2];
            const mapCenter = { lat: 0.5, lng: 0.5 };
            const places = {
                'FewPlaces': [{ id: '1', title: 'Place 1' }],
                'ManyPlaces': [
                    { id: '2', title: 'Place 2' },
                    { id: '3', title: 'Place 3' },
                    { id: '4', title: 'Place 4' }
                ]
            };
            const result = clusterNeighborhoods(features, 0.1, mapCenter, places);

            expect(result).toHaveLength(1);
            expect(result[0].properties.ntaname).toContain('ManyPlaces');
        });

        it('should preserve cluster member information for places aggregation', () => {
            const feature1 = createMockFeature('Area1', [[[0, 0], [1, 0], [0.5, 1], [0, 0]]]);
            const feature2 = createMockFeature('Area2', [[[0.01, 0.01], [1.01, 0.01], [0.51, 1.01], [0.01, 0.01]]]);

            const features = [feature1, feature2];
            const mapCenter = { lat: 0.5, lng: 0.5 };
            const places = {
                'Area1': [{ id: '1', title: 'Place 1' }],
                'Area2': [{ id: '2', title: 'Place 2' }]
            };
            const result = clusterNeighborhoods(features, 0.1, mapCenter, places);

            expect(result).toHaveLength(1);
            expect(result[0].properties.clusterMembers).toEqual(['Area1', 'Area2']);
            expect(result[0].properties.originalNtaname).toBeDefined();
        });
    });
});