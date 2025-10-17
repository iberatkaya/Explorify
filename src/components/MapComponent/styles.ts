import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const mapStyles = StyleSheet.create({
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
        borderRadius: 12,
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
    labelTextWithPlaces: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    labelContainerWithPlaces: {
        backgroundColor: 'rgba(34, 197, 94, 0.95)', // Green background when places exist
        borderColor: 'rgba(22, 163, 74, 0.8)',
    },
    placesText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#fff',
        textAlign: 'center',
        marginTop: 2,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    clusterCountText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#666',
        textAlign: 'center',
        marginLeft: 2,
        marginTop: -2,
        lineHeight: 10,
    },
    clusterCountTextWithPlaces: {
        fontSize: 8,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginLeft: 2,
        marginTop: -1,
        lineHeight: 10,
    },
    clusterLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});