import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  deleteApartmentPhotos,
  getApartmentById,
  setMainApartmentPhoto,
  updateApartment,
  uploadApartmentPhotos,
  type ApartmentDto,
  type ApartmentPhotoDto,
} from "../../../apartments/services/apartmentService";
import { getAllTags, type TagDto } from "../../../tags/services/tagService";

export type EditApartmentForm = {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: string;
  max_guests: string;
  status: "active" | "inactive";
};

function toForm(apartment: ApartmentDto): EditApartmentForm {
  return {
    title: apartment.title,
    description: apartment.description,
    address: apartment.address,
    city: apartment.city,
    country: apartment.country,
    price_per_night: String(apartment.price_per_night),
    max_guests: String(apartment.max_guests),
    status: apartment.status === "inactive" ? "inactive" : "active",
  };
}

export function useEditApartment(apartmentId: number) {
  const { t } = useTranslation();

  const [form, setForm] = useState<EditApartmentForm | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [photos, setPhotos] = useState<ApartmentPhotoDto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [apartment, tags] = await Promise.all([
        getApartmentById(apartmentId),
        getAllTags(),
      ]);

      setForm(toForm(apartment));
      setPhotos(apartment.photos ?? []);
      setAvailableTags(tags);
      setSelectedTagIds(
        (apartment.tags ?? [])
          .map((tag) => tag.id)
          .filter((id): id is number => typeof id === "number")
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("editApartment.errors.load")
      );
    } finally {
      setIsLoading(false);
    }
  }, [apartmentId, t]);

  useEffect(() => {
    load();
  }, [load]);

  function changeField(name: string, value: string) {
    setSaved(false);
    setForm((current) => {
      if (!current) {
        return current;
      }

      return { ...current, [name]: value };
    });
  }

  function toggleTag(tagId: number) {
    setSaved(false);
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }

      return [...current, tagId];
    });
  }

  // Photos are saved on the spot rather than with the rest of the form: an
  // upload is a file transfer, and it would be confusing if pictures appeared
  // only after pressing Save.
  async function addPhotos(files: File[]) {
    if (!files.length || photoBusy) {
      return;
    }

    setPhotoBusy(true);
    setError(null);

    try {
      const created = await uploadApartmentPhotos(apartmentId, files);
      setPhotos((current) => [...current, ...created]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : t("editApartment.errors.photoUpload")
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto(photoId: number) {
    if (photoBusy) {
      return;
    }

    setPhotoBusy(true);
    setError(null);

    try {
      await deleteApartmentPhotos(apartmentId, [photoId]);

      const remaining = photos.filter((photo) => photo.id !== photoId);
      const lostMain = !remaining.some((photo) => photo.is_main);

      setPhotos(
        remaining.map((photo, index) => {
          return lostMain && index === 0
            ? { ...photo, is_main: true }
            : photo;
        })
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("editApartment.errors.photoDelete")
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  async function chooseMainPhoto(photoId: number) {
    if (photoBusy) {
      return;
    }

    setPhotoBusy(true);
    setError(null);

    try {
      const updated = await setMainApartmentPhoto(apartmentId, photoId);
      setPhotos(updated);
    } catch (mainError) {
      setError(
        mainError instanceof Error
          ? mainError.message
          : t("editApartment.errors.photoMain")
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  function validate(value: EditApartmentForm): string | null {
    if (!value.title.trim()) {
      return t("editApartment.errors.titleRequired");
    }

    if (Number(value.price_per_night) <= 0) {
      return t("editApartment.errors.priceInvalid");
    }

    if (Number(value.max_guests) < 1) {
      return t("editApartment.errors.guestsInvalid");
    }

    return null;
  }

  async function save() {
    if (!form || isSaving) {
      return false;
    }

    const problem = validate(form);

    if (problem) {
      setError(problem);
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Everything is sent every time: the form always shows the whole
      // apartment, so there is no half-filled state to protect.
      await updateApartment(apartmentId, {
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        price_per_night: Number(form.price_per_night),
        max_guests: Number(form.max_guests),
        status: form.status,
        tag_ids: selectedTagIds,
      });

      setSaved(true);
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("editApartment.errors.save")
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    form,
    photos,
    photoBusy,
    addPhotos,
    removePhoto,
    chooseMainPhoto,
    availableTags,
    selectedTagIds,
    isLoading,
    isSaving,
    error,
    saved,
    changeField,
    toggleTag,
    save,
  };
}
