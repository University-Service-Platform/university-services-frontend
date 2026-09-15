import React from 'react';
import type { VariantType, SizeType } from '@/types';
import { cn } from '@/utils';
import './ui.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VariantType;
  size?: SizeType;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', marginBottom: 0 }} aria-hidden="true" />
      ) : icon ? (
        <span className="btn-icon" aria-hidden="true">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
