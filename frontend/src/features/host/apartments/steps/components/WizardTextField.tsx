import type { ChangeEvent } from "react";

type WizardTextFieldProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  min?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  multiline?: boolean;
  onChange: (name: string, value: string) => void;
};

export default function WizardTextField({
  label,
  name,
  value,
  type,
  min,
  placeholder,
  rows,
  disabled,
  multiline,
  onChange,
}: WizardTextFieldProps) {
  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    onChange(name, event.target.value);
  }

  function getInputType() {
    if (type) {
      return type;
    }

    return "text";
  }

  if (multiline) {
    return (
      <div className="apartment-wizard-step__field">
        <label className="form-label apartment-wizard-step__label">
          {label}
        </label>

        <textarea
          className="form-control apartment-wizard-step__control"
          name={name}
          value={value}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div className="apartment-wizard-step__field">
      <label className="form-label apartment-wizard-step__label">{label}</label>

      <input
        className="form-control apartment-wizard-step__control"
        name={name}
        value={value}
        type={getInputType()}
        min={min}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleInputChange}
      />
    </div>
  );
}