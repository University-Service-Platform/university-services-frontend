import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, LoadingState, Select } from '@/components/ui';
import {
  DemoDataNotice,
  G8Alert,
  G8PageHeader,
  Group8Page,
  NOTIFICATION_SOURCE_LABEL,
  NotificationIcon,
  formatDateTime,
  formatRelative,
  notificationLink,
  notificationPriority,
} from '@/components/group8';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  selectNotifications,
  selectUnreadCount,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import type { AppNotification, NotificationSource } from '@/types';
import { cn } from '@/utils';
import './group8Pages.css';

type Filter = 'ALL' | 'UNREAD';

export const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status, error, isDemo } = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [source, setSource] = useState<'' | NotificationSource>('');

  useEffect(() => {
    void dispatch(fetchNotifications());
  }, [dispatch]);

  const visible = useMemo(
    () =>
      items.filter(
        (notification) => (filter === 'ALL' || !notification.read) && (!source || notification.source === source)
      ),
    [items, filter, source]
  );

  const sourceOptions = [
    { value: '', label: 'All sources' },
    ...(Object.keys(NOTIFICATION_SOURCE_LABEL) as NotificationSource[]).map((key) => ({
      value: key,
      label: NOTIFICATION_SOURCE_LABEL[key],
    })),
  ];

  const openNotification = (notification: AppNotification) => {
    if (!notification.read) void dispatch(markNotificationAsRead(notification.id));
    const link = notificationLink(notification);
    if (link) navigate(link);
  };

  const isInitialLoad = status === 'loading' && items.length === 0;

  return (
    <Group8Page>
      <G8PageHeader
        title="Notifications"
        subtitle="Updates about your events, registrations, announcements and requests across university services."
        icon={<Bell size={22} />}
        actions={
          <>
            <Button
              variant="ghost"
              icon={<RefreshCw size={16} />}
              onClick={() => dispatch(fetchNotifications())}
              isLoading={status === 'loading'}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              icon={<CheckCheck size={16} />}
              onClick={() => dispatch(markAllNotificationsAsRead())}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </>
        }
      />

      <DemoDataNotice show={isDemo} />

      {/* Show errors inline whenever notifications are still on screen (e.g. a failed refresh). */}
      {error && (status !== 'failed' || items.length > 0) && <G8Alert tone="danger">{error}</G8Alert>}

      <Card>
        <div className="g8-toolbar">
          <div className="g8-tabs" role="tablist" aria-label="Filter notifications">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'ALL'}
              className={`g8-tab ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'UNREAD'}
              className={`g8-tab ${filter === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <Select
            label="Source"
            options={sourceOptions}
            value={source}
            onChange={(e) => setSource(e.target.value as '' | NotificationSource)}
          />
        </div>
      </Card>

      {isInitialLoad ? (
        <LoadingState title="Loading notifications..." />
      ) : status === 'failed' && items.length === 0 ? (
        <ErrorState
          title="Could not load notifications"
          description={error ?? undefined}
          onRetry={() => dispatch(fetchNotifications())}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Bell className="state-icon" />}
          title={
            source
              ? `No ${filter === 'UNREAD' ? 'unread ' : ''}${NOTIFICATION_SOURCE_LABEL[source]} notifications`
              : filter === 'UNREAD'
                ? "You're all caught up"
                : 'No notifications yet'
          }
          description={
            source
              ? 'Try another source or show all sources.'
              : filter === 'UNREAD'
                ? 'There are no unread notifications.'
                : 'Registration confirmations, event changes and announcements will appear here.'
          }
        />
      ) : (
        <Card>
          <ul className="g8-notification-list" aria-label="Notifications">
            {visible.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  className={cn(
                    'g8-notification',
                    !notification.read && 'unread',
                    notificationPriority(notification) === 'high' && 'important'
                  )}
                  onClick={() => openNotification(notification)}
                  aria-label={`${notificationPriority(notification) === 'high' ? 'Important. ' : ''}${notification.read ? '' : 'Unread: '}${notification.title}. ${notification.message}`}
                >
                  <span className={cn('g8-notification-icon', `source-${notification.source.toLowerCase()}`)}>
                    <NotificationIcon notification={notification} />
                  </span>
                  <span className="g8-notification-body">
                    <span className="g8-notification-title">
                      {notification.title}
                      {notificationPriority(notification) === 'high' && (
                        <span className="g8-important-badge">Important</span>
                      )}
                    </span>
                    <span className="g8-notification-message">{notification.message}</span>
                    <span className="g8-notification-meta">
                      {NOTIFICATION_SOURCE_LABEL[notification.source]} ·{' '}
                      <time dateTime={notification.createdAt} title={formatDateTime(notification.createdAt)}>
                        {formatRelative(notification.createdAt)}
                      </time>
                    </span>
                  </span>
                  {!notification.read && <span className="g8-unread-dot" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Group8Page>
  );
};
