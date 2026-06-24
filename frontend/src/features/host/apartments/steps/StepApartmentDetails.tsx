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
  function handleFieldChange(name: string, nextValue: string) {
    onChange({
      ...value,
      [name]: nextValue,
    });
  }

  return (
    <WizardStepShell
      title="Step 1: Apartment details"
      subtitle="Enter the main information about your apartment."
    >
      <div className="apartment-wizard-step__form-grid apartment-wizard-step__form-grid--two-columns">
        <div className="apartment-wizard-step__field--full">
          <WizardTextField
            label="Title"
            name="title"
            value={value.title}
            placeholder="Modern apartment in city center"
            disabled={busy}
            onChange={handleFieldChange}
          />
        </div>

        <div className="apartment-wizard-step__field--full">
          <WizardTextField
            label="Description"
            name="description"
            value={value.description}
            rows={4}
            multiline
            placeholder="Describe the apartment, location, amenities..."
            disabled={busy}
            onChange={handleFieldChange}
          />
        </div>

        <WizardTextField
          label="Address"
          name="address"
          value={value.address}
          placeholder="Street and number"
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label="City"
          name="city"
          value={value.city}
          placeholder="Belgrade"
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label="Country"
          name="country"
          value={value.country}
          placeholder="Serbia"
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label="Price per night"
          name="price_per_night"
          value={value.price_per_night}
          type="number"
          min="1"
          placeholder="50"
          disabled={busy}
          onChange={handleFieldChange}
        />

        <WizardTextField
          label="Max guests"
          name="max_guests"
          value={value.max_guests}
          type="number"
          min="1"
          placeholder="2"
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
          Next
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary apartment-wizard-step__actions-spacer"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </WizardStepActions>
    </WizardStepShell>
  );
}