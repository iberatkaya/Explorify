export interface Place {
    id: string;
    title: string;
    googleMapsLink?: string;
}

export interface NeighborhoodBottomSheetProps {
    neighborhoodName?: string;
    places: Place[];
    onClose: () => void;
    onAddPlace: (title: string, googleMapsLink?: string) => void;
    onEditPlace: (id: string, title: string, googleMapsLink?: string) => void;
    onRemovePlace: (id: string) => void;
    onPlacePress: (place: Place) => void;
}