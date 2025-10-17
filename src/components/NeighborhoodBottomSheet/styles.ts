import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    header: {
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    addSection: {
        marginBottom: 20,
    },
    addContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addContainerSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    inputSecondary: {
        marginTop: 8,
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    addButtonFullWidth: {
        width: '100%',
        marginTop: 12,
        paddingVertical: 12,
    },
    addButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    listSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#e9ecef', // Darker background for better contrast
        borderRadius: 8,
        marginBottom: 8,
        height: 68, // Fixed height for consistent alignment
    },
    placeContent: {
        flex: 1,
        paddingRight: 8,
    },
    placeActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editIconButton: {
        padding: 4,
        marginRight: 8,
    },
    editIconText: {
        fontSize: 16,
    },
    removeButton: {
        padding: 4,
        marginLeft: 8,
    },
    removeButtonText: {
        color: '#ff3b30',
        fontSize: 18,
        fontWeight: 'bold',
    },
    editPlaceContainer: {
        padding: 16,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: 'white',
        marginBottom: 8,
    },
    editInputSecondary: {
        marginBottom: 12,
    },
    editButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    editButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    placeTitle: {
        fontSize: 20,
        color: '#333',
        fontWeight: '600',
        marginBottom: 4,
    },
    googleMapsIndicator: {
        fontSize: 12,
        color: '#007AFF',
        fontStyle: 'italic',
    },
    noLinkIndicator: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    emptyListContainer: {
        flex: 1,
    },
    // Swipeable styles
    leftActions: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 10,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 8, // Match the marginBottom of placeItem
    },
    actionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        paddingHorizontal: 16,
    },
    editAction: {
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        height: 68, // Fixed height to match placeItem minHeight exactly
        paddingHorizontal: 16,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    deleteAction: {
        backgroundColor: '#ff3b30',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        height: 68, // Fixed height to match placeItem minHeight exactly
        paddingHorizontal: 16,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    editActionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteActionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});