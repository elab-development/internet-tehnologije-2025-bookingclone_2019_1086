import { useEffect, useState } from "react";

import { getAuthUser } from "../../../auth/storage/authStorage";
import {
  type ApartmentDto,
  deleteApartment,
  getMyApartments,
} from "../../../apartments/services/apartmentService";

type HostMessage = {
  type: "success" | "danger";
  text: string;
};

type DeleteModalState = {
  apartmentId: number | null;
  apartmentTitle: string;
};

export function useHostApartments() {
  const user = getAuthUser();

  const [items, setItems] = useState<ApartmentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<HostMessage | null>(null);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    apartmentId: null,
    apartmentTitle: "",
  });

  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);

  const userId = user?.id ?? null;
  const isHost = user?.role === "HOST";
  const hasItems = items.length > 0;
  const showEmpty = !loading && !error && !hasItems;
  const isDeleteModalOpen = deleteModal.apartmentId !== null;

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

        const myApartments = response.items.filter((apartment) => {
          return apartment.user_id === userId;
        });

        if (cancelled) {
          return;
        }

        setItems(myApartments);
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

  function openDeleteModal(apartment: ApartmentDto) {
    setDeleteModal({
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
    });
  }

  function closeDeleteModal() {
    if (deleteBusy) {
      return;
    }

    setDeleteModal({
      apartmentId: null,
      apartmentTitle: "",
    });
  }

  async function confirmDelete() {
    const apartmentId = deleteModal.apartmentId;

    if (!apartmentId) {
      return;
    }

    setDeleteBusy(true);
    setMessage(null);

    try {
      await deleteApartment(apartmentId);

      setItems((currentItems) => {
        return currentItems.filter((apartment) => {
          return apartment.id !== apartmentId;
        });
      });

      setMessage({
        type: "success",
        text: "Apartment deleted successfully.",
      });

      setDeleteModal({
        apartmentId: null,
        apartmentTitle: "",
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
        text: "Failed to delete apartment",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  function clearMessage() {
    setMessage(null);
  }

  return {
    items,
    loading,
    error,
    message,
    isHost,
    hasItems,
    showEmpty,
    deleteBusy,
    deleteModal,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    clearMessage,
  };
}