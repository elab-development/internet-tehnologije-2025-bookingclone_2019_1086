import { useHostApartments } from "../hooks/useHostApartments";

import DeleteApartmentModal from "../components/DeleteApartmentModal";
import HostApartmentsEmptyState from "../components/HostApartmentsEmptyState";
import HostApartmentsGrid from "../components/HostApartmentsGrid";
import HostApartmentsHeader from "../components/HostApartmentsHeader";
import HostApartmentsMessage from "../components/HostApartmentsMessage";
import HostApartmentsStatus from "../components/HostApartmentsStatus";

import "../styles/HostApartmentsPage.css";

export default function HostApartmentsPage() {
  const {
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
  } = useHostApartments();

  function shouldShowGrid() {
    if (!hasItems) {
      return false;
    }

    if (loading) {
      return false;
    }

    if (error) {
      return false;
    }

    return true;
  }

  return (
    <div className="container my-4 host-apartments-page">
      <HostApartmentsHeader isHost={isHost} />

      <HostApartmentsMessage message={message} />

      <HostApartmentsStatus loading={loading} error={error} />

      <HostApartmentsEmptyState show={showEmpty} isHost={isHost} />

      <HostApartmentsGrid
        show={shouldShowGrid()}
        items={items}
        isHost={isHost}
        onDeleteClick={openDeleteModal}
      />

      <DeleteApartmentModal
        open={isDeleteModalOpen}
        apartmentTitle={deleteModal.apartmentTitle}
        busy={deleteBusy}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}