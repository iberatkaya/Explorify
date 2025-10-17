import React, { useRef } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Swipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Place } from './types';
import { styles } from './styles';
import { openGoogleMaps } from '../../utils/googleMaps';

interface SwipeablePlaceProps {
  place: Place;
  onEdit: (place: Place) => void;
  onRemove: (place: Place) => void;
  onPress: (place: Place) => void;
}

const SwipeablePlace: React.FC<SwipeablePlaceProps> = ({
  place,
  onEdit,
  onRemove,
  onPress,
}) => {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const renderRightActions = (
    _progress: SharedValue<number>,
    _translation: SharedValue<number>,
  ) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.editAction}
          onPress={() => {
            swipeableRef.current?.close();
            onEdit(place);
          }}
        >
          <Text style={styles.editActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            swipeableRef.current?.close();
            onRemove(place);
          }}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handlePress = () => {
    openGoogleMaps(place.googleMapsLink, place.title);
    onPress(place);
  };

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={30}
        overshootRight={false}
        friction={2}
      >
        <View style={styles.placeItem}>
          <TouchableOpacity
            style={styles.placeContent}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text style={styles.placeTitle}>{place.title}</Text>
            {place.googleMapsLink ? (
              <Text style={styles.googleMapsIndicator}>
                📍 Google Maps link
              </Text>
            ) : (
              <Text style={styles.noLinkIndicator}>📍 Will open on map</Text>
            )}
          </TouchableOpacity>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

export default SwipeablePlace;
