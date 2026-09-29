import React from 'react';
import { Badge } from '@/components/ui';
import type { AnnouncementStatus, StatusType } from '@/types';

const STATUS_VARIANT: Record<AnnouncementStatus, StatusType> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

export const AnnouncementStatusBadge: React.FC<{ status: AnnouncementStatus }> = ({ status }) => (
  <Badge variant={STATUS_VARIANT[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>
);
