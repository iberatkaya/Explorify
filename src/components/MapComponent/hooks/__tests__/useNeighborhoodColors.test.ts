import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNeighborhoodColors } from '../useNeighborhoodColors';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

// Mock the utils functions
jest.mock('../../utils', () => ({
    generateColorFromSeed: jest.fn(),
    loadColorsFromStorage: jest.fn(),
    saveColorsToStorage: jest.fn(),
}));

const mockUtils = require('../../utils');

describe('useNeighborhoodColors', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementations
        mockUtils.generateColorFromSeed.mockImplementation((seed: string) => ({
            r: seed.length * 10,
            g: seed.length * 20,
            b: seed.length * 30,
        }));

        mockUtils.loadColorsFromStorage.mockResolvedValue({});
        mockUtils.saveColorsToStorage.mockResolvedValue(undefined);
    });

    it('should initialize with empty color cache and colorsLoaded false', () => {
        const { result } = renderHook(() => useNeighborhoodColors());

        expect(result.current.colorsLoaded).toBe(false);
    });

    it('should load colors from storage on mount', async () => {
        const storedColors = {
            Manhattan: { r: 255, g: 0, b: 0 },
            Brooklyn: { r: 0, g: 255, b: 0 },
        };

        mockUtils.loadColorsFromStorage.mockResolvedValue(storedColors);

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        expect(mockUtils.loadColorsFromStorage).toHaveBeenCalled();
    });

    it('should handle storage loading errors gracefully', async () => {
        mockUtils.loadColorsFromStorage.mockRejectedValue(new Error('Storage error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error loading colors:', expect.any(Error));

        consoleSpy.mockRestore();
    });

    it('should return cached color when available', async () => {
        const storedColors = {
            Manhattan: { r: 255, g: 0, b: 0 },
        };

        mockUtils.loadColorsFromStorage.mockResolvedValue(storedColors);

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        const color = result.current.getNeighborhoodColor('Manhattan');

        expect(color).toEqual({ r: 255, g: 0, b: 0 });
        expect(mockUtils.generateColorFromSeed).not.toHaveBeenCalled();
    });

    it('should generate and cache new color when not in cache', async () => {
        mockUtils.loadColorsFromStorage.mockResolvedValue({});
        mockUtils.generateColorFromSeed.mockReturnValue({ r: 100, g: 150, b: 200 });

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        let color;
        act(() => {
            color = result.current.getNeighborhoodColor('Brooklyn');
        });

        expect(mockUtils.generateColorFromSeed).toHaveBeenCalledWith('Brooklyn');
        expect(color).toEqual({ r: 100, g: 150, b: 200 });
        expect(mockUtils.saveColorsToStorage).toHaveBeenCalledWith({
            Brooklyn: { r: 100, g: 150, b: 200 },
        });
    });

    it('should maintain color consistency across multiple calls', async () => {
        mockUtils.loadColorsFromStorage.mockResolvedValue({});
        mockUtils.generateColorFromSeed.mockReturnValue({ r: 100, g: 150, b: 200 });

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        let color1, color2;
        act(() => {
            color1 = result.current.getNeighborhoodColor('Queens');
        });

        act(() => {
            color2 = result.current.getNeighborhoodColor('Queens');
        });

        expect(color1).toEqual(color2);
        expect(mockUtils.generateColorFromSeed).toHaveBeenCalledTimes(1);
    });

    it('should update cache with multiple neighborhoods', async () => {
        mockUtils.loadColorsFromStorage.mockResolvedValue({});
        mockUtils.generateColorFromSeed
            .mockReturnValueOnce({ r: 100, g: 150, b: 200 })
            .mockReturnValueOnce({ r: 50, g: 75, b: 125 });

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        act(() => {
            result.current.getNeighborhoodColor('Bronx');
        });

        act(() => {
            result.current.getNeighborhoodColor('Staten Island');
        });

        // Check that saveColorsToStorage was called with the final state
        expect(mockUtils.saveColorsToStorage).toHaveBeenLastCalledWith({
            Bronx: { r: 100, g: 150, b: 200 },
            'Staten Island': { r: 50, g: 75, b: 125 },
        });
    });

    it('should preserve existing cache when adding new colors', async () => {
        const initialColors = {
            Manhattan: { r: 255, g: 0, b: 0 },
        };

        mockUtils.loadColorsFromStorage.mockResolvedValue(initialColors);
        mockUtils.generateColorFromSeed.mockReturnValue({ r: 0, g: 255, b: 0 });

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        act(() => {
            result.current.getNeighborhoodColor('Brooklyn');
        });

        expect(mockUtils.saveColorsToStorage).toHaveBeenCalledWith({
            Manhattan: { r: 255, g: 0, b: 0 },
            Brooklyn: { r: 0, g: 255, b: 0 },
        });
    });

    it('should handle special characters in neighborhood names', async () => {
        mockUtils.loadColorsFromStorage.mockResolvedValue({});
        mockUtils.generateColorFromSeed.mockReturnValue({ r: 200, g: 100, b: 50 });

        const { result } = renderHook(() => useNeighborhoodColors());

        await waitFor(() => {
            expect(result.current.colorsLoaded).toBe(true);
        });

        act(() => {
            result.current.getNeighborhoodColor('Lower East Side & Chinatown');
        });

        expect(mockUtils.generateColorFromSeed).toHaveBeenCalledWith('Lower East Side & Chinatown');
        expect(mockUtils.saveColorsToStorage).toHaveBeenCalledWith({
            'Lower East Side & Chinatown': { r: 200, g: 100, b: 50 },
        });
    });
});