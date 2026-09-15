import React, { useId } from 'react';
import { cn } from '@/utils';
import './ui.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  id: customId,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn('form-input', error && 'form-input-error', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...props}
      />
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
