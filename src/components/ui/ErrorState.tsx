import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils';
import './ui.css';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading this section.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={cn('error-state', className)} role="alert">
      <AlertTriangle className="state-icon" aria-hidden="true" />
      <h4 className="state-title">{title}</h4>
      {description && <p className="state-description">{description}</p>}
      {onRetry && (
        <div style={{ marginTop: '1rem' }}>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
