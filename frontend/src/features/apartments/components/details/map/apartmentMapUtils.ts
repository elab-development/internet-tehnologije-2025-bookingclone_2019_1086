import type { ApartmentDetailsDto } from "../../ApartmentDetailsPage";

export type MapPosition = {
  latitude: number;
  longitude: number;
  hasExactCoordinates: boolean;
};

export const DEFAULT_MAP_POSITION: MapPosition = {
  latitude: 44.8125,
  longitude: 20.4612,
  hasExactCoordinates: false,
};

export function getValidCoordinate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function getMapPosition(apartment: ApartmentDetailsDto): MapPosition {
  const latitude = getValidCoordinate(apartment.latitude);
  const longitude = getValidCoordinate(apartment.longitude);

  if (latitude !== null && longitude !== null) {
    return {
      latitude,
      longitude,
      hasExactCoordinates: true,
    };
  }

  return DEFAULT_MAP_POSITION;
}

export function buildAddressText(apartment: ApartmentDetailsDto) {
  const parts = [apartment.address, apartment.city, apartment.country].filter(
    Boolean
  );

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return "Belgrade";
}

export function getMapZoom(position: MapPosition) {
  if (position.hasExactCoordinates) {
    return 15;
  }

  return 12;
}

export function getMapCenter(position: MapPosition): [number, number] {
  return [position.latitude, position.longitude];
}