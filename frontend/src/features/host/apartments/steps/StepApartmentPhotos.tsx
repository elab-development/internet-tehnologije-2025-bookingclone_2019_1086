import { useState } from "react";

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
      return "Uploading...";
    }

    return "Finish";
  }

  function getFinishButtonTitle() {
    if (!hasPendingPhotos()) {
      return "Add at least one photo first";
    }

    return "";
  }

  async function finishAndUpload() {
    try {
      setError(null);

      if (!hasPendingPhotos()) {
        throw new Error("Please add at least one photo before finishing.");
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

      setError("Failed to upload photos");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WizardStepShell
      title="Step 3: Photos"
      subtitle="Add photos locally, then click Finish to upload them."
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
          Back
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
        Finish uploads everything in one request:{" "}
        <span className="apartment-wizard-step__upload-endpoint">
          POST /apartments/{apartmentId}/photos
        </span>
      </div>
    </WizardStepShell>
  );
}