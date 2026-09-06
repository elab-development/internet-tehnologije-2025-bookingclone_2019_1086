import { useTranslation } from "react-i18next";

import ConfirmDialog from "../../../../shared/components/ConfirmDialog";
import Pagination from "../../../../shared/components/Pagination";
import HostApartmentsEmptyState from "../components/HostApartmentsEmptyState";
import HostApartmentsGrid from "../components/HostApartmentsGrid";
import HostApartmentsHeader from "../components/HostApartmentsHeader";
import HostApartmentsMessage from "../components/HostApartmentsMessage";
import HostApartmentsStatus from "../components/HostApartmentsStatus";
import { useHostApartments } from "../hooks/useHostApartments";

import "../styles/HostApartmentsPage.css";

export default function HostApartmentsPage() {
  const { t } = useTranslation();

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
    pendingDelete,
    goToPage,
    requestDelete,
    cancelDelete,
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
        deleteBusyId={deleteBusyId}
        onDeleteClick={requestDelete}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        disabled={loading || deleteBusyId !== null}
        onPageChange={goToPage}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        danger
        busy={deleteBusyId !== null}
        title={t("hostApartments.confirmDeleteTitle")}
        message={t("hostApartments.confirmDelete", {
          name: pendingDelete?.title ?? "",
        })}
        confirmLabel={t("hostApartments.actions.delete")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}