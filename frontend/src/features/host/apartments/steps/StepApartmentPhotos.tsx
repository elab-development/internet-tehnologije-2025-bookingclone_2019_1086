import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type ApartmentPhotoDto,
  uploadApartmentPhotos,
} from "../../../apartments/services/apartmentService";

import { usePendingPhotos } from "../hooks/usePendingPhotos";
import PhotoUploadToolbar from "./components/PhotoUploadToolbar";
import PendingPhotoGrid from "./components/PendingPhotoGrid";
import UploadedPhotosSummary from "./components/UploadedPhotosSummary";
import WizardStepActions from "./components/WizardStepActions";
import WizardStepShell from "./components/WizardStepShell";

import "../styles/ApartmentWizardSteps.css";

type StepApartmentPhotosProps = {
  apartmentId: number;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setError: (value: string | null) => void;
  onPrev: () => void;
  onFinish: () => void;
};

export default function StepApartmentPhotos({
  apartmentId,
  busy,
  setBusy,
  setError,
  onPrev,
  onFinish,
}: StepApartmentPhotosProps) {
  const { t } = useTranslation();

  const [uploadedPhotos, setUploadedPhotos] = useState<ApartmentPhotoDto[]>([]);

  const {
    pendingPhotos,
    addFiles,
    removePendingPhoto,
    clearPendingPhotos,
    hasPendingPhotos,
    getPendingFiles,
  } = usePendingPhotos();

  function isFinishDisabled() {
    if (busy) {
      return true;
    }

    if (!hasPendingPhotos()) {
      return true;
    }

    return false;
  }

  function getFinishButtonText() {
    if (busy) {
      return t("createApartment.actions.uploading");
    }

    return t("createApartment.actions.finish");
  }

  function getFinishButtonTitle() {
    if (!hasPendingPhotos()) {
      return t("createApartment.photos.addAtLeastOne");
    }

    return "";
  }

  async function finishAndUpload() {
    try {
      setError(null);

      if (!hasPendingPhotos()) {
        throw new Error(t("createApartment.photos.addAtLeastOne"));
      }

      setBusy(true);

      const createdPhotos = await uploadApartmentPhotos(
        apartmentId,
        getPendingFiles()
      );

      setUploadedPhotos(createdPhotos);
      clearPendingPhotos();
      onFinish();
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        setError(uploadError.message);
        return;
      }

      setError(t("createApartment.errors.uploadPhotosFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WizardStepShell
      title={t("createApartment.photos.title")}
      subtitle={t("createApartment.photos.subtitle")}
    >
      <PhotoUploadToolbar
        busy={busy}
        hasPendingPhotos={hasPendingPhotos()}
        onFilesChange={addFiles}
        onClear={clearPendingPhotos}
      />

      <PendingPhotoGrid
        photos={pendingPhotos}
        busy={busy}
        onRemove={removePendingPhoto}
      />

      <UploadedPhotosSummary photos={uploadedPhotos} />

      <WizardStepActions>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onPrev}
          disabled={busy}
        >
          {t("createApartment.actions.back")}
        </button>

        <button
          type="button"
          className="btn btn-primary px-4 apartment-wizard-step__actions-spacer"
          onClick={finishAndUpload}
          disabled={isFinishDisabled()}
          title={getFinishButtonTitle()}
        >
          {getFinishButtonText()}
        </button>
      </WizardStepActions>

      <div className="apartment-wizard-step__upload-note">
        {t("createApartment.photos.uploadNote")}{" "}
        <span className="apartment-wizard-step__upload-endpoint">
          POST /apartments/{apartmentId}/photos
        </span>
      </div>
    </WizardStepShell>
  );
}