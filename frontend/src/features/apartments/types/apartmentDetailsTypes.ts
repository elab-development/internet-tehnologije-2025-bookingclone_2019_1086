import type {
  ApartmentDto,
  ApartmentPhotoDto,
  ApartmentTagDto,
} from "../services/apartmentService";

export type ApartmentDetailsDto = ApartmentDto & {
  tags?: ApartmentTagDto[];
};

export const FALLBACK_APARTMENT_PHOTO: ApartmentPhotoDto = {
  id: 0,
  image_url: "https://picsum.photos/1200/800",
  is_main: true,
};

export function getApartmentPhotos(apartment: ApartmentDetailsDto) {
  if (Array.isArray(apartment.photos) && apartment.photos.length > 0) {
    return apartment.photos;
  }

  return [FALLBACK_APARTMENT_PHOTO];
}

export function getApartmentTags(apartment: ApartmentDetailsDto) {
  if (Array.isArray(apartment.tags)) {
    return apartment.tags;
  }

  return [];
}