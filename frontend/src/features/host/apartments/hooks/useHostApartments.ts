import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../auth/hooks/useAuth";
import {
  deleteApartment,
  getMyApartments,
  type ApartmentDto,
} from "../../../apartments/services/apartmentService";

export type HostMessage = {
  type: "success" | "danger";
  text: string;
};

const PAGE_SIZE = 12;

export function useHostApartments() {
  const { user } = useAuth();

  const [items, setItems] = useState<ApartmentDto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<HostMessage | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);

  const userId = user?.id ?? null;
  const isHost = user?.role === "HOST";
  const hasItems = items.length > 0;
  const showEmpty = !loading && !error && !hasItems;

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getMyApartments({
        page_number: page,
        page_size: PAGE_SIZE,
      });

      setItems(response.items);
      setTotal(response.total);
    } catch (loadError) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError("Failed to load apartments");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    load();
  }, [load]);

  function goToPage(nextPage: number) {
    setPage(nextPage);
  }

  async function deleteApartmentFromCard(apartment: ApartmentDto) {
    if (deleteBusyId !== null) {
      return;
    }

    setDeleteBusyId(apartment.id);
    setMessage(null);

    try {
      await deleteApartment(apartment.id);

      setMessage({
        type: "success",
        text: "Apartment deleted successfully.",
      });

      // Removing the last card of a page would leave it empty, so step back instead.
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load();
      }
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
    page,
    pageSize: PAGE_SIZE,
    total,
    loading,
    error,
    message,
    isHost,
    hasItems,
    showEmpty,
    deleteBusyId,
    goToPage,
    deleteApartmentFromCard,
  };
}
