import React from 'react';
import type { StatusType } from '@/types';
import { cn } from '@/utils';
import './ui.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusType;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
  ...props
}) => {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
