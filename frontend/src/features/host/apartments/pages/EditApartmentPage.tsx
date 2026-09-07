import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "../../../../shared/components/ConfirmDialog";
import WizardTextField from "../steps/components/WizardTextField";
import { useEditApartment } from "../hooks/useEditApartment";

import "../styles/ApartmentWizardSteps.css";
import "../styles/EditApartmentPage.css";

export default function EditApartmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const apartmentId = Number(id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoToRemove, setPhotoToRemove] = useState<number | null>(null);

  const {
    form,
    photos,
    photoBusy,
    addPhotos,
    removePhoto,
    chooseMainPhoto,
    availableTags,
    selectedTagIds,
    isLoading,
    isSaving,
    error,
    saved,
    changeField,
    toggleTag,
    save,
  } = useEditApartment(apartmentId);

  function handleFilesPicked(files: FileList | null) {
    if (!files || !files.length) {
      return;
    }

    addPhotos(Array.from(files));

    // Clearing it lets the same file be picked again after a failed upload.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleConfirmRemovePhoto() {
    if (photoToRemove === null) {
      return;
    }

    await removePhoto(photoToRemove);
    setPhotoToRemove(null);
  }

  async function handleSave() {
    const ok = await save();

    if (ok) {
      navigate("/host/apartments");
    }
  }

  if (!Number.isFinite(apartmentId)) {
    return (
      <main className="container my-4">
        <p className="text-danger">{t("editApartment.errors.load")}</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container my-4">
        <p className="text-muted">{t("editApartment.loading")}</p>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="container my-4">
        <p className="text-danger">{error ?? t("editApartment.errors.load")}</p>
      </main>
    );
  }

  return (
    <main className="container my-4" style={{ maxWidth: "860px" }}>
      <header className="mb-4">
        <h1 className="fw-bold">{t("editApartment.title")}</h1>
        <p className="text-muted mb-0">{t("editApartment.subtitle")}</p>
      </header>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {saved ? (
        <div className="alert alert-success">{t("editApartment.saved")}</div>
      ) : null}

      <div className="row g-3">
        <div className="col-12">
          <WizardTextField
            label={t("createApartment.details.fields.title")}
            name="title"
            value={form.title}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12">
          <WizardTextField
            label={t("createApartment.details.fields.description")}
            name="description"
            value={form.description}
            multiline
            rows={5}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12 col-md-6">
          <WizardTextField
            label={t("createApartment.details.fields.address")}
            name="address"
            value={form.address}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12 col-md-3">
          <WizardTextField
            label={t("createApartment.details.fields.city")}
            name="city"
            value={form.city}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12 col-md-3">
          <WizardTextField
            label={t("createApartment.details.fields.country")}
            name="country"
            value={form.country}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12 col-md-4">
          <WizardTextField
            label={t("createApartment.details.fields.pricePerNight")}
            name="price_per_night"
            type="number"
            min="1"
            value={form.price_per_night}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12 col-md-4">
          <WizardTextField
            label={t("createApartment.details.fields.maxGuests")}
            name="max_guests"
            type="number"
            min="1"
            value={form.max_guests}
            disabled={isSaving}
            onChange={changeField}
          />
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="apartment-status">
            {t("editApartment.fields.status")}
          </label>

          <select
            id="apartment-status"
            className="form-select"
            value={form.status}
            disabled={isSaving}
            onChange={(event) => changeField("status", event.target.value)}
          >
            <option value="active">{t("editApartment.status.active")}</option>
            <option value="inactive">
              {t("editApartment.status.inactive")}
            </option>
          </select>

          <div className="form-text">{t("editApartment.status.hint")}</div>
        </div>

        <div className="col-12">
          <label className="form-label">
            {t("editApartment.photos.label")}
          </label>

          {photos.length === 0 ? (
            <p className="text-muted small mb-2">
              {t("editApartment.photos.empty")}
            </p>
          ) : (
            <div className="d-flex flex-wrap gap-3 mb-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={
                    photo.is_main
                      ? "edit-apartment__photo edit-apartment__photo--main"
                      : "edit-apartment__photo"
                  }
                >
                  <img src={photo.image_url} alt="" />

                  <button
                    type="button"
                    className="btn btn-sm btn-danger edit-apartment__photo-remove"
                    title={t("editApartment.photos.remove")}
                    disabled={photoBusy || isSaving}
                    onClick={() => setPhotoToRemove(photo.id)}
                  >
                    ✕
                  </button>

                  {photo.is_main ? (
                    <span className="edit-apartment__photo-main-badge">
                      {t("editApartment.photos.mainBadge")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-light edit-apartment__photo-main-button"
                      disabled={photoBusy || isSaving}
                      onClick={() => chooseMainPhoto(photo.id)}
                    >
                      {t("editApartment.photos.setMain")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            disabled={photoBusy || isSaving}
            onChange={(event) => handleFilesPicked(event.target.files)}
          />

          <div className="form-text">
            {photoBusy
              ? t("editApartment.photos.working")
              : t("editApartment.photos.hint")}
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">
            {t("createApartment.steps.tags")}
          </label>

          <div className="d-flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={isSaving}
                  className={`btn btn-sm ${
                    active ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mt-4">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving ? t("editApartment.saving") : t("editApartment.save")}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={isSaving}
          onClick={() => navigate("/host/apartments")}
        >
          {t("editApartment.cancel")}
        </button>
      </div>

      <ConfirmDialog
        open={photoToRemove !== null}
        danger
        busy={photoBusy}
        title={t("editApartment.photos.confirmTitle")}
        message={t("editApartment.photos.confirmMessage")}
        confirmLabel={t("editApartment.photos.remove")}
        onConfirm={handleConfirmRemovePhoto}
        onCancel={() => setPhotoToRemove(null)}
      />
    </main>
  );
}
