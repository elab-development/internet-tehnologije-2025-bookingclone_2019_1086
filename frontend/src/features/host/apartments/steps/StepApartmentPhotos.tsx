import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  type ApartmentPhotoDto,
  uploadApartmentPhotos,
} from "../../../apartments/services/apartmentService";
import WizardStepActions from "./components/WizardStepActions";
import WizardStepShell from "./components/WizardStepShell";

import "../styles/ApartmentWizardSteps.css";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type StepApartmentPhotosProps = {
  apartmentId: number;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setError: (value: string | null) => void;
  onPrev: () => void;
  onFinish: () => void;
};

function createPhotoId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`;
}

function formatFileSize(size: number) {
  const sizeInMb = size / 1024 / 1024;
  return `${sizeInMb.toFixed(2)} MB`;
}

export default function StepApartmentPhotos({
  apartmentId,
  busy,
  setBusy,
  setError,
  onPrev,
  onFinish,
}: StepApartmentPhotosProps) {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [uploaded, setUploaded] = useState<ApartmentPhotoDto[]>([]);

  const pendingRef = useRef<PendingPhoto[]>([]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextPhotos = Array.from(fileList).map((file, index) => {
      return {
        id: createPhotoId(file, index),
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setPending((currentPending) => {
      return [...currentPending, ...nextPhotos];
    });
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function removePending(id: string) {
    setPending((currentPending) => {
      const itemToRemove = currentPending.find((photo) => {
        return photo.id === id;
      });

      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }

      return currentPending.filter((photo) => {
        return photo.id !== id;
      });
    });
  }

  function clearAll() {
    setPending((currentPending) => {
      currentPending.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });

      return [];
    });
  }

  function hasPendingPhotos() {
    return pending.length > 0;
  }

  function hasUploadedPhotos() {
    return uploaded.length > 0;
  }

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

      const files = pending.map((photo) => {
        return photo.file;
      });

      const created = await uploadApartmentPhotos(apartmentId, files);

      setUploaded(created);
      clearAll();
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
      <div className="apartment-wizard-step__photo-toolbar">
        <input
          type="file"
          className="form-control apartment-wizard-step__photo-input"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          disabled={busy}
        />

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={clearAll}
          disabled={busy || !hasPendingPhotos()}
        >
          Clear
        </button>
      </div>

      {!hasPendingPhotos() && (
        <div className="apartment-wizard-step__empty-text apartment-wizard-step__photos-empty">
          No photos selected yet.
        </div>
      )}

      {hasPendingPhotos() && (
        <div className="apartment-wizard-step__pending-section">
          <div className="apartment-wizard-step__selected-title">
            Selected photos (not uploaded yet)
          </div>

          <div className="apartment-wizard-step__pending-grid">
            {pending.map((photo) => (
              <div key={photo.id} className="apartment-wizard-step__photo-card">
                <img
                  src={photo.previewUrl}
                  alt={photo.file.name}
                  className="apartment-wizard-step__photo-image"
                />

                <div className="apartment-wizard-step__photo-body">
                  <div className="apartment-wizard-step__photo-name">
                    {photo.file.name}
                  </div>

                  <div className="apartment-wizard-step__photo-size">
                    {formatFileSize(photo.file.size)}
                  </div>

                  <div className="apartment-wizard-step__photo-footer">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removePending(photo.id)}
                      disabled={busy}
                    >
                      Remove
                    </button>

                    <div className="apartment-wizard-step__photo-status">
                      staged
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasUploadedPhotos() && (
        <div className="apartment-wizard-step__uploaded-section">
          <div className="apartment-wizard-step__selected-title">
            Uploaded (backend returned)
          </div>

          <div className="apartment-wizard-step__empty-text">
            Uploaded {uploaded.length} photo(s).
          </div>
        </div>
      )}

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