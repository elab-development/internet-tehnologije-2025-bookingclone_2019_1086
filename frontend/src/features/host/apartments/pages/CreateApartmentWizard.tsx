import StepApartmentDetails from "../steps/StepApartmentDetails";
import StepApartmentPhotos from "../steps/StepApartmentPhotos";
import StepApartmentTags from "../steps/StepApartmentTags";
import { useCreateApartmentWizard } from "../hooks/useCreateApartmentWizard";

import "../styles/CreateApartmentWizard.css";

export default function CreateApartmentWizard() {
  const wizard = useCreateApartmentWizard();

  return (
    <div className="container my-4 create-apartment-wizard">
      <div className="create-apartment-wizard__header">
        <h2 className="create-apartment-wizard__title">Create apartment</h2>

        <div className="create-apartment-wizard__subtitle">
          Complete all steps to publish your listing
        </div>
      </div>

      <div className="card shadow-sm create-apartment-wizard__stepper-card">
        <div className="card-body create-apartment-wizard__stepper-body">
          <div className="create-apartment-wizard__stepper">
            {wizard.steps.map((step, index) => (
              <button
                key={step.key}
                type="button"
                className={wizard.getStepButtonClassName(step, index)}
                onClick={() => wizard.goToStep(step.key)}
                disabled={!wizard.canOpenStep(step.key)}
              >
                {index + 1}. {step.label}
              </button>
            ))}

            {wizard.hasCreatedApartment && (
              <div className="create-apartment-wizard__created-id">
                Apartment ID:{" "}
                <span className="create-apartment-wizard__created-id-value">
                  {wizard.createdApartmentId}
                </span>
              </div>
            )}

            {!wizard.hasCreatedApartment && (
              <div className="create-apartment-wizard__created-id">
                Not created yet
              </div>
            )}
          </div>
        </div>
      </div>

      {wizard.error && (
        <div className="alert alert-danger" role="alert">
          {wizard.error}
        </div>
      )}

      {wizard.currentStepKey === "details" && (
        <StepApartmentDetails
          value={wizard.details}
          onChange={wizard.setDetails}
          busy={wizard.busy}
          onNext={wizard.handleNextFromDetails}
          onCancel={wizard.handleCancel}
        />
      )}

      {wizard.currentStepKey === "tags" && (
        <StepApartmentTags
          availableTags={wizard.availableTags}
          selectedTagIds={wizard.selectedTagIds}
          onChangeSelectedTagIds={wizard.setSelectedTagIds}
          busy={wizard.busy}
          onPrev={wizard.goPrev}
          onCreate={wizard.handleCreateWithTags}
          onCancel={wizard.handleCancel}
        />
      )}

      {wizard.currentStepKey === "photos" && wizard.createdApartmentId && (
        <StepApartmentPhotos
          apartmentId={wizard.createdApartmentId}
          busy={wizard.busy}
          setBusy={wizard.setBusy}
          setError={wizard.setError}
          onPrev={wizard.goPrev}
          onFinish={wizard.handleFinish}
        />
      )}
    </div>
  );
}