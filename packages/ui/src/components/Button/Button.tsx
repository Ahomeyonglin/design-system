import type { ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  variant?: ButtonVariant;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      className="ds-button"
      data-variant={variant}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
