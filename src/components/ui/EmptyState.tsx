import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/utils';
import './ui.css';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no items to display at this time.',
  action,
  icon = <FolderOpen className="state-icon" />,
  className = '',
}) => {
  return (
    <div className={cn('empty-state', className)}>
      <div aria-hidden="true">{icon}</div>
      <h4 className="state-title">{title}</h4>
      {description && <p className="state-description">{description}</p>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
};
