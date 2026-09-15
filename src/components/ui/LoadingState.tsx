import React from 'react';
import { cn } from '@/utils';
import './ui.css';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading...',
  description = 'Please wait while content is being fetched.',
  className = '',
}) => {
  return (
    <div className={cn('loading-state', className)} role="status">
      <div className="spinner" aria-hidden="true" />
      <h4 className="state-title">{title}</h4>
      {description && <p className="state-description">{description}</p>}
    </div>
  );
};
