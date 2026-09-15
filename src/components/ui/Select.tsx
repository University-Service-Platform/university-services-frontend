import React, { useId } from 'react';
import { cn } from '@/utils';
import './ui.css';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  placeholder,
  id: customId,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn('form-select', error && 'form-select-error', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
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

Select.displayName = 'Select';
