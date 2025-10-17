import React, { useState, useCallback, useMemo } from 'react';
import { TouchableOpacity, Alert, Keyboard } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Text, View } from 'react-native';

import { NeighborhoodBottomSheetProps, Place } from './types';
import { styles } from './styles';
import { isValidGoogleMapsLink } from '../../utils/googleMaps';
import SwipeablePlace from './SwipeablePlace';

const NeighborhoodBottomSheet = React.forwardRef<
  BottomSheet,
  NeighborhoodBottomSheetProps
>(
  (
    {
      neighborhoodName,
      places,
      onClose,
      onAddPlace,
      onEditPlace,
      onRemovePlace,
      onPlacePress,
    },
    ref,
  ) => {
    const [newPlaceTitle, setNewPlaceTitle] = useState('');
    const [newPlaceGoogleMapsLink, setNewPlaceGoogleMapsLink] = useState('');
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);
    const [editPlaceTitle, setEditPlaceTitle] = useState('');
    const [editPlaceGoogleMapsLink, setEditPlaceGoogleMapsLink] = useState('');

    // Bottom sheet snap points
    const snapPoints = useMemo(() => ['88%'], []);

    // Handle sheet changes
    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose();
        }
      },
      [onClose],
    );

    // Handle adding a new place
    const handleAddPlace = useCallback(() => {
      const title = newPlaceTitle.trim();
      const googleMapsLink = newPlaceGoogleMapsLink.trim();

      if (title) {
        // Validate Google Maps link if provided
        if (googleMapsLink && !isValidGoogleMapsLink(googleMapsLink)) {
          Alert.alert(
            'Invalid Google Maps Link',
            'Please enter a valid Google Maps URL or leave it empty.',
            [{ text: 'OK' }],
          );
          return;
        }

        onAddPlace(title, googleMapsLink || undefined);
        setNewPlaceTitle('');
        setNewPlaceGoogleMapsLink('');
        Keyboard.dismiss();
      }
    }, [newPlaceTitle, newPlaceGoogleMapsLink, onAddPlace]);

    // Handle starting edit for a place (called from SwipeablePlace)
    const handleEditPlaceSwipe = useCallback((place: Place) => {
      setEditingPlace(place);
      setEditPlaceTitle(place.title);
      setEditPlaceGoogleMapsLink(place.googleMapsLink || '');
    }, []);

    // Handle removing a place with confirmation (called from SwipeablePlace)
    const handleRemovePlaceSwipe = useCallback(
      (place: Place) => {
        Alert.alert(
          'Remove Place',
          `Are you sure you want to remove "${place.title}" from your list?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => onRemovePlace(place.id),
            },
          ],
        );
      },
      [onRemovePlace],
    );

    // Handle saving edit
    const handleSaveEdit = useCallback(() => {
      if (!editingPlace) return;

      const title = editPlaceTitle.trim();
      const googleMapsLink = editPlaceGoogleMapsLink.trim();

      if (title) {
        // Validate Google Maps link if provided
        if (googleMapsLink && !isValidGoogleMapsLink(googleMapsLink)) {
          Alert.alert(
            'Invalid Google Maps Link',
            'Please enter a valid Google Maps URL or leave it empty.',
            [{ text: 'OK' }],
          );
          return;
        }

        onEditPlace(editingPlace.id, title, googleMapsLink || undefined);
        setEditingPlace(null);
        setEditPlaceTitle('');
        setEditPlaceGoogleMapsLink('');
        Keyboard.dismiss();
      }
    }, [editingPlace, editPlaceTitle, editPlaceGoogleMapsLink, onEditPlace]);

    // Handle canceling edit
    const handleCancelEdit = useCallback(() => {
      setEditingPlace(null);
      setEditPlaceTitle('');
      setEditPlaceGoogleMapsLink('');
      Keyboard.dismiss();
    }, []);

    // Render backdrop component
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          style={[props.style, styles.backdrop]}
        />
      ),
      [],
    );

    // Render place item
    const renderPlaceItem = useCallback(
      ({ item }: { item: Place }) => {
        const isEditing = editingPlace?.id === item.id;

        if (isEditing) {
          return (
            <View style={styles.editPlaceContainer}>
              <BottomSheetTextInput
                style={styles.editInput}
                placeholder="Place title..."
                value={editPlaceTitle}
                onChangeText={setEditPlaceTitle}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <BottomSheetTextInput
                style={[styles.editInput, styles.editInputSecondary]}
                placeholder="Google Maps link (optional)..."
                value={editPlaceGoogleMapsLink}
                onChangeText={setEditPlaceGoogleMapsLink}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    styles.saveButton,
                    !editPlaceTitle.trim() && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveEdit}
                  disabled={!editPlaceTitle.trim()}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        return (
          <SwipeablePlace
            place={item}
            onEdit={handleEditPlaceSwipe}
            onRemove={handleRemovePlaceSwipe}
            onPress={onPlacePress}
          />
        );
      },
      [
        editingPlace,
        editPlaceTitle,
        editPlaceGoogleMapsLink,
        handleEditPlaceSwipe,
        handleRemovePlaceSwipe,
        handleSaveEdit,
        handleCancelEdit,
        onPlacePress,
      ],
    );

    // Empty state component
    const renderEmptyState = useCallback(
      () => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No places added yet.{'\n'}Add some places you want to visit in this
            neighborhood!
          </Text>
        </View>
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={styles.container}
      >
        <BottomSheetView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {neighborhoodName || 'Neighborhood'}
            </Text>
          </View>

          {/* Add new place section */}
          <View style={styles.addSection}>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="Add a place to visit..."
              value={newPlaceTitle}
              onChangeText={setNewPlaceTitle}
              onSubmitEditing={handleAddPlace}
              returnKeyType="next"
              autoCapitalize="words"
              autoCorrect={false}
            />
            <BottomSheetTextInput
              style={[styles.input, styles.inputSecondary]}
              placeholder="Google Maps link (optional)..."
              value={newPlaceGoogleMapsLink}
              onChangeText={setNewPlaceGoogleMapsLink}
              onSubmitEditing={handleAddPlace}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                styles.addButtonFullWidth,
                !newPlaceTitle.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddPlace}
              disabled={!newPlaceTitle.trim()}
            >
              <Text style={styles.addButtonText}>Add Place</Text>
            </TouchableOpacity>
          </View>

          {/* Places list section */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Places ({places.length})</Text>
            <BottomSheetFlatList
              data={places}
              renderItem={renderPlaceItem}
              keyExtractor={(item: Place) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={
                places.length === 0 ? styles.emptyListContainer : undefined
              }
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

NeighborhoodBottomSheet.displayName = 'NeighborhoodBottomSheet';

export default NeighborhoodBottomSheet;
