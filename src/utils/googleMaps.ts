import { Linking, Alert } from 'react-native';

/**
 * Opens a Google Maps link or searches for a place in NYC
 * @param googleMapsLink - Optional Google Maps link
 * @param searchText - Text to search for if no link provided
 */
export const openGoogleMaps = async (googleMapsLink?: string, searchText?: string) => {
    try {
        let url: string;

        if (googleMapsLink) {
            // If a Google Maps link is provided, use it directly
            url = googleMapsLink;
        } else if (searchText) {
            // Create a Google Maps search URL for the place in New York City
            const encodedSearch = encodeURIComponent(`${searchText}, New York, NY`);
            url = `https://www.google.com/maps/search/${encodedSearch}`;
        } else {
            throw new Error('No Google Maps link or search text provided');
        }

        // Check if the URL can be opened
        const canOpen = await Linking.canOpenURL(url);

        if (canOpen) {
            await Linking.openURL(url);
        } else {
            throw new Error('Cannot open Google Maps');
        }
    } catch (error) {
        console.error('Error opening Google Maps:', error);
        Alert.alert(
            'Error',
            'Unable to open Google Maps. Please make sure it is installed on your device.',
            [{ text: 'OK' }]
        );
    }
};

/**
 * Validates if a string is a valid Google Maps URL
 * @param url - URL to validate
 * @returns boolean indicating if the URL is a valid Google Maps link
 */
export const isValidGoogleMapsLink = (url: string): boolean => {
    try {
        // Simple validation for Google Maps URLs
        const lowerUrl = url.toLowerCase();
        return (
            lowerUrl.includes('google.com/maps') ||
            lowerUrl.includes('maps.google.com') ||
            lowerUrl.includes('goo.gl/maps') ||
            lowerUrl.includes('maps.app.goo.gl') ||
            lowerUrl.startsWith('https://maps.google.com') ||
            lowerUrl.startsWith('https://www.google.com/maps')
        );
    } catch {
        return false;
    }
};