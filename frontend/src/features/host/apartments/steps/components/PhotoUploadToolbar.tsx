import type { ChangeEvent } from "react";

type PhotoUploadToolbarProps = {
  busy: boolean;
  hasPendingPhotos: boolean;
  onFilesChange: (fileList: FileList | null) => void;
  onClear: () => void;
};

export default function PhotoUploadToolbar({
  busy,
  hasPendingPhotos,
  onFilesChange,
  onClear,
}: PhotoUploadToolbarProps) {
  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesChange(event.target.files);
    event.target.value = "";
  }

  function isClearDisabled() {
    if (busy) {
      return true;
    }

    if (!hasPendingPhotos) {
      return true;
    }

    return false;
  }

  return (
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
        onClick={onClear}
        disabled={isClearDisabled()}
      >
        Clear
      </button>
    </div>
  );
}