import { useTranslation } from "react-i18next";

import CreateApartmentStepper from "../components/CreateApartmentStepper";
import { useCreateApartmentWizard } from "../hooks/useCreateApartmentWizard";
import StepApartmentDetails from "../steps/StepApartmentDetails";
import StepApartmentPhotos from "../steps/StepApartmentPhotos";
import StepApartmentTags from "../steps/StepApartmentTags";

import "../styles/CreateApartmentWizard.css";

export default function CreateApartmentWizard() {
  const { t } = useTranslation();
  const wizard = useCreateApartmentWizard();

  function renderError() {
    if (!wizard.error) {
      return null;
    }

    return (
      <div className="alert alert-danger" role="alert">
        {wizard.error}
      </div>
    );
  }

  function renderDetailsStep() {
    if (wizard.currentStepKey !== "details") {
      return null;
    }

    return (
      <StepApartmentDetails
        value={wizard.details}
        onChange={wizard.setDetails}
        busy={wizard.busy}
        onNext={wizard.handleNextFromDetails}
        onCancel={wizard.handleCancel}
      />
    );
  }

  function renderTagsStep() {
    if (wizard.currentStepKey !== "tags") {
      return null;
    }

    return (
      <StepApartmentTags
        availableTags={wizard.availableTags}
        selectedTagIds={wizard.selectedTagIds}
        onChangeSelectedTagIds={wizard.setSelectedTagIds}
        busy={wizard.busy}
        onPrev={wizard.goPrev}
        onCreate={wizard.handleCreateWithTags}
        onCancel={wizard.handleCancel}
      />
    );
  }

  function renderPhotosStep() {
    if (wizard.currentStepKey !== "photos") {
      return null;
    }

    if (!wizard.createdApartmentId) {
      return null;
    }

    return (
      <StepApartmentPhotos
        apartmentId={wizard.createdApartmentId}
        busy={wizard.busy}
        setBusy={wizard.setBusy}
        setError={wizard.setError}
        onPrev={wizard.goPrev}
        onFinish={wizard.handleFinish}
      />
    );
  }

  return (
    <div className="container my-4 create-apartment-wizard">
      <div className="create-apartment-wizard__header">
        <h2 className="create-apartment-wizard__title">
          {t("createApartment.title")}
        </h2>

        <div className="create-apartment-wizard__subtitle">
          {t("createApartment.subtitle")}
        </div>
      </div>

      <CreateApartmentStepper
        steps={wizard.steps}
        createdApartmentId={wizard.createdApartmentId}
        hasCreatedApartment={wizard.hasCreatedApartment}
        canOpenStep={wizard.canOpenStep}
        goToStep={wizard.goToStep}
        getStepButtonClassName={wizard.getStepButtonClassName}
      />

      {renderError()}
      {renderDetailsStep()}
      {renderTagsStep()}
      {renderPhotosStep()}
    </div>
  );
}