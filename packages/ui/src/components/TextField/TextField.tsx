import { useId } from 'react';
import './TextField.css';

export type TextFieldType = 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';

export type TextFieldProps = {
  label: string;
  description?: string;
  error?: string;
  type?: TextFieldType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
};

export function TextField({
  label,
  description,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  name,
  id,
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : description ? descriptionId : undefined;

  return (
    <div className="ds-text-field">
      <label className="ds-text-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        className="ds-text-field__input"
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error ? (
        <span className="ds-text-field__error" id={errorId}>
          {error}
        </span>
      ) : description ? (
        <span className="ds-text-field__description" id={descriptionId}>
          {description}
        </span>
      ) : null}
    </div>
  );
}
