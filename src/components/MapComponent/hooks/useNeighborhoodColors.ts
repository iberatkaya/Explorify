import { useState, useEffect, useCallback, useRef } from 'react';
import { ColorData } from '../types';
import { generateColorFromSeed, loadColorsFromStorage, saveColorsToStorage } from '../utils';

export const useNeighborhoodColors = () => {
    const [colorCache, setColorCache] = useState<{ [key: string]: ColorData }>({});
    const [colorsLoaded, setColorsLoaded] = useState(false);
    const colorCacheRef = useRef<{ [key: string]: ColorData }>({});

    // Keep ref in sync with state
    useEffect(() => {
        colorCacheRef.current = colorCache;
    }, [colorCache]);

    // Load cached colors from AsyncStorage
    useEffect(() => {
        const loadColors = async () => {
            try {
                const storedColors = await loadColorsFromStorage();
                setColorCache(storedColors);
                colorCacheRef.current = storedColors;
                setColorsLoaded(true);
            } catch (error) {
                console.error('Error loading colors:', error);
                setColorsLoaded(true);
            }
        };

        loadColors();
    }, []);

    // Helper function to get or generate colors with caching
    const getNeighborhoodColor = useCallback((neighborhoodName: string): ColorData => {
        // Check if color is already cached
        if (colorCacheRef.current[neighborhoodName]) {
            return colorCacheRef.current[neighborhoodName];
        }

        // Generate new color using the existing algorithm
        const newColor = generateColorFromSeed(neighborhoodName);

        // Cache the new color
        const updatedCache = { ...colorCacheRef.current, [neighborhoodName]: newColor };
        setColorCache(updatedCache);
        colorCacheRef.current = updatedCache;

        // Save to storage asynchronously
        saveColorsToStorage(updatedCache);

        return newColor;
    }, []); // Remove colorCache dependency to prevent infinite loop

    return {
        getNeighborhoodColor,
        colorsLoaded,
    };
};