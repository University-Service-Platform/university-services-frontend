import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/auth';
import {
  fetchNotifications,
  notificationsCleared,
  selectUnreadCount,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import './group8.css';

/** How often to pick up notifications triggered by other services (Groups 6/7). */
const POLL_INTERVAL_MS = 60_000;

/**
 * Header notification bell for the shared app shell.
 * Refreshes on sign-in, after any Group 8 user action (activity revision) and
 * periodically, so cross-team notifications appear without a page reload.
 */
export const NotificationBell: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAccountInactive } = useAuth();
  const unreadCount = useAppSelector(selectUnreadCount);
  const activityRevision = useAppSelector((state) => state.activity.revision);
  const enabled = isAuthenticated && !isAccountInactive;

  useEffect(() => {
    if (!enabled) {
      dispatch(notificationsCleared());
      return;
    }
    void dispatch(fetchNotifications());
  }, [dispatch, enabled, activityRevision]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => void dispatch(fetchNotifications()), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [dispatch, enabled]);

  if (!enabled) return null;

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <Link to="/notifications" className="g8-bell" aria-label={label} title={label}>
      <Bell size={20} aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="g8-bell-badge" aria-hidden="true">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
