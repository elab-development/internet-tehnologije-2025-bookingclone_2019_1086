import Pagination from "../../../../shared/components/Pagination";
import HostApartmentsEmptyState from "../components/HostApartmentsEmptyState";
import HostApartmentsGrid from "../components/HostApartmentsGrid";
import HostApartmentsHeader from "../components/HostApartmentsHeader";
import HostApartmentsMessage from "../components/HostApartmentsMessage";
import HostApartmentsStatus from "../components/HostApartmentsStatus";
import { useHostApartments } from "../hooks/useHostApartments";

import "../styles/HostApartmentsPage.css";

export default function HostApartmentsPage() {
  const {
    items,
    page,
    pageSize,
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
        deleteBusyId={deleteBusyId}
        onDeleteClick={deleteApartmentFromCard}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        disabled={loading || deleteBusyId !== null}
        onPageChange={goToPage}
      />
    </div>
  );
}