import { useTranslation } from "react-i18next";

import type {
  CreateApartmentStep,
  CreateApartmentStepKey,
} from "../constants/createApartmentSteps";

import "../styles/CreateApartmentWizard.css";

type CreateApartmentStepperProps = {
  steps: CreateApartmentStep[];
  createdApartmentId: number | null;
  hasCreatedApartment: boolean;
  canOpenStep: (key: CreateApartmentStepKey) => boolean;
  goToStep: (key: CreateApartmentStepKey) => void;
  getStepButtonClassName: (step: CreateApartmentStep, index: number) => string;
};

export default function CreateApartmentStepper({
  steps,
  createdApartmentId,
  hasCreatedApartment,
  canOpenStep,
  goToStep,
  getStepButtonClassName,
}: CreateApartmentStepperProps) {
  const { t } = useTranslation();

  function renderCreatedStatus() {
    if (hasCreatedApartment) {
      return (
        <div className="create-apartment-wizard__created-id">
          {t("createApartment.stepper.apartmentId")}{" "}
          <span className="create-apartment-wizard__created-id-value">
            {createdApartmentId}
          </span>
        </div>
      );
    }

    return (
      <div className="create-apartment-wizard__created-id">
        {t("createApartment.stepper.notCreatedYet")}
      </div>
    );
  }

  return (
    <div className="card shadow-sm create-apartment-wizard__stepper-card">
      <div className="card-body create-apartment-wizard__stepper-body">
        <div className="create-apartment-wizard__stepper">
          {steps.map((step, index) => {
            return (
              <button
                key={step.key}
                type="button"
                className={getStepButtonClassName(step, index)}
                onClick={() => goToStep(step.key)}
                disabled={!canOpenStep(step.key)}
              >
                {index + 1}. {t(step.labelKey)}
              </button>
            );
          })}

          {renderCreatedStatus()}
        </div>
      </div>
    </div>
  );
}