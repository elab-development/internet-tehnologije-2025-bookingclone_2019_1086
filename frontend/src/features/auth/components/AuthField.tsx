import type { ChangeEvent } from "react";

type AuthFieldProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function AuthField({
  label,
  name,
  value,
  type,
  placeholder,
  autoComplete,
  required,
  disabled,
  onChange,
}: AuthFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  function getInputType() {
    if (type) {
      return type;
    }

    return "text";
  }

  return (
    <div className="auth-form__field">
      <label className="auth-form__label" htmlFor={name}>
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={getInputType()}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="auth-form__input"
      />
    </div>
  );
}
