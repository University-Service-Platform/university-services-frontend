import React, { useId } from 'react';
import { cn } from '@/utils';
import './ui.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id: customId,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const hasIcons = Boolean(leftIcon || rightIcon);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className={cn('input-wrapper', hasIcons && 'has-icons')}>
        {leftIcon && <span className="input-left-icon" aria-hidden="true">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'form-input',
            Boolean(leftIcon) && 'has-left-icon',
            Boolean(rightIcon) && 'has-right-icon',
            Boolean(error) && 'form-input-error',
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {rightIcon && <span className="input-right-icon">{rightIcon}</span>}
      </div>
      {error && (
        <span id={errorId} className="form-error-text" role="alert">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="form-helper-text">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
