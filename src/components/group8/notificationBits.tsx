import React from 'react';
import { CalendarDays, CheckCircle2, Megaphone, Wrench, Building, Ban, MessageSquareText } from 'lucide-react';
import type { AppNotification } from '@/types';

/** Icon per notification type, so the source is recognisable at a glance. */
export const NotificationIcon: React.FC<{ notification: AppNotification }> = ({ notification }) => {
  switch (notification.type) {
    case 'REGISTRATION_CONFIRMED':
      return <CheckCircle2 size={18} aria-hidden="true" />;
    case 'REGISTRATION_CANCELLED':
    case 'EVENT_CANCELLED':
      return <Ban size={18} aria-hidden="true" />;
    case 'EVENT_UPDATED':
      return <CalendarDays size={18} aria-hidden="true" />;
    case 'ANNOUNCEMENT_PUBLISHED':
      return <Megaphone size={18} aria-hidden="true" />;
    case 'RESERVATION_STATUS':
      return <Building size={18} aria-hidden="true" />;
    case 'SERVICE_REQUEST_STATUS':
      return <Wrench size={18} aria-hidden="true" />;
    case 'FEEDBACK_REQUESTED':
      return <MessageSquareText size={18} aria-hidden="true" />;
    default:
      return <Megaphone size={18} aria-hidden="true" />;
  }
};
