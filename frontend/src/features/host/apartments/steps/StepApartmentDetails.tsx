import { useTranslation } from "react-i18next";

import WizardStepActions from "./components/WizardStepActions";
import WizardStepShell from "./components/WizardStepShell";
import WizardTextField from "./components/WizardTextField";

import "../styles/ApartmentWizardSteps.css";

export type ApartmentDetailsState = {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: string;
  max_guests: string;
};

type StepApartmentDetailsProps = {
  value: ApartmentDetailsState;
  onChange: (value: ApartmentDetailsState) => void;
  busy: boolean;
  onNext: () => void;
  onCancel: () => void;
};

export default function StepApartmentDetails({
  value,
  onChange,
  busy,
  onNext,
  onCancel,
}: StepApartmentDetailsProps) {
  const { t } = useTranslation();

  function handleFieldChange(name: string, nextValue: string) {
    onChange({
      ...value,
      [name]: nextValue,
    });
  }

  return (
    <WizardStepShell
      title={t("createApartment.details.title")}
      subtitle={t("createApartment.details.subtitle")}
    >
      <div className="apartment-wizard-step__form-grid apartment-wizard-step__form-grid--two-columns">
        <div className="apartment-wizard-step__field--full">
          <WizardTextField
            label={t("createApartment.details.fields.title")}
            name="title"
            value={value.title}
            placeholder={t("createApartment.details.placeholders.title")}
            disabled={busy}
            onChange={handleFieldChange}
          />
        </div>

        <div className="apartment-wizard-step__field--full">
          <WizardTextField
            label={t("createApartment.details.fields.description")}
            name="description"
            value={value.description}
            rows={4}
            multiline
            placeholder={t("createApartment.details.placeholders.description")}
            disabled={busy}
            onChange={handleFieldChange}
          />
        </div>

        <WizardTextField
          label={t("createApartment.details.fields.address")}
          name="address"
          value={value.address}
          placeholder={t("createApartment.details.placeholders.address")}
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label={t("createApartment.details.fields.city")}
          name="city"
          value={value.city}
          placeholder={t("createApartment.details.placeholders.city")}
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label={t("createApartment.details.fields.country")}
          name="country"
          value={value.country}
          placeholder={t("createApartment.details.placeholders.country")}
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label={t("createApartment.details.fields.pricePerNight")}
          name="price_per_night"
          value={value.price_per_night}
          type="number"
          min="1"
          placeholder={t("createApartment.details.placeholders.pricePerNight")}
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label={t("createApartment.details.fields.maxGuests")}
          name="max_guests"
          value={value.max_guests}
          type="number"
          min="1"
          placeholder={t("createApartment.details.placeholders.maxGuests")}
          disabled={busy}
          onChange={handleFieldChange}
        />
      </div>

      <WizardStepActions>
        <button
          type="button"
          className="btn btn-primary px-4"
          onClick={onNext}
          disabled={busy}
        >
          {t("createApartment.actions.next")}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary apartment-wizard-step__actions-spacer"
          onClick={onCancel}
          disabled={busy}
        >
          {t("createApartment.actions.cancel")}
        </button>
      </WizardStepActions>
    </WizardStepShell>
  );
}