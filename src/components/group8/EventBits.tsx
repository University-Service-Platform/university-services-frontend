import React from 'react';
import { Badge } from '@/components/ui';
import type { EventStatus, RegistrationStatus, StatusType } from '@/types';
import { cn } from '@/utils';

const EVENT_STATUS_VARIANT: Record<EventStatus, StatusType> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'info',
};

const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export const EventStatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => (
  <Badge variant={EVENT_STATUS_VARIANT[status]}>{EVENT_STATUS_LABEL[status]}</Badge>
);

const REGISTRATION_STATUS_VARIANT: Record<RegistrationStatus, StatusType> = {
  CONFIRMED: 'success',
  WAITLISTED: 'warning',
  CANCELLED: 'neutral',
};

export const RegistrationStatusBadge: React.FC<{ status: RegistrationStatus }> = ({ status }) => (
  <Badge variant={REGISTRATION_STATUS_VARIANT[status]}>
    {status.charAt(0) + status.slice(1).toLowerCase()}
  </Badge>
);

export const CapacityMeter: React.FC<{ confirmed: number; capacity: number }> = ({ confirmed, capacity }) => {
  const ratio = capacity > 0 ? Math.min(confirmed / capacity, 1) : 0;
  const remaining = Math.max(capacity - confirmed, 0);
  return (
    <div className="g8-capacity">
      <div className="g8-capacity-label">
        <span>
          {confirmed} / {capacity} registered
        </span>
        <span>{remaining === 0 ? 'Full' : `${remaining} left`}</span>
      </div>
      <div
        className="g8-capacity-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={confirmed}
        aria-label="Registration capacity"
      >
        <div
          className={cn('g8-capacity-fill', ratio >= 1 && 'full', ratio >= 0.8 && ratio < 1 && 'warn')}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
};
