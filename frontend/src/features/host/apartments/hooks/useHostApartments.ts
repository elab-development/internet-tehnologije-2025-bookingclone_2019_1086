import { useEffect, useState } from "react";

import { getAuthUser } from "../../../auth/storage/authStorage";
import {
  deleteApartment,
  getMyApartments,
  type ApartmentDto,
} from "../../../apartments/services/apartmentService";

export type HostMessage = {
  type: "success" | "danger";
  text: string;
};

export function useHostApartments() {
  const user = getAuthUser();

  const [items, setItems] = useState<ApartmentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<HostMessage | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);

  const userId = user?.id ?? null;
  const isHost = user?.role === "HOST";
  const hasItems = items.length > 0;
  const showEmpty = !loading && !error && !hasItems;

  useEffect(() => {
    let cancelled = false;

    async function loadMyApartments() {
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getMyApartments({
          page_number: 1,
          page_size: 50,
        });

        if (cancelled) {
          return;
        }

        setItems(response.items);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        if (loadError instanceof Error) {
          setError(loadError.message);
          return;
        }

        setError("Failed to load apartments");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMyApartments();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function deleteApartmentFromCard(apartment: ApartmentDto) {
    if (deleteBusyId !== null) {
      return;
    }

    setDeleteBusyId(apartment.id);
    setMessage(null);

    try {
      await deleteApartment(apartment.id);

      setItems((currentItems) => {
        return currentItems.filter((currentApartment) => {
          return currentApartment.id !== apartment.id;
        });
      });

      setMessage({
        type: "success",
        text: "Apartment deleted successfully.",
      });
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        setMessage({
          type: "danger",
          text: deleteError.message,
        });

        return;
      }

      setMessage({
        type: "danger",
        text: "Failed to delete apartment.",
      });
    } finally {
      setDeleteBusyId(null);
    }
  }

  return {
    items,
    loading,
    error,
    message,
    isHost,
    hasItems,
    showEmpty,
    deleteBusyId,
    deleteApartmentFromCard,
  };
}