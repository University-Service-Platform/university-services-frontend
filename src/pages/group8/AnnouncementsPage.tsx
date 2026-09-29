import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Send, Users } from 'lucide-react';
import { useAuth } from '@/auth';
import { Button, Card, CardBody, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import {
  AnnouncementStatusBadge,
  DemoDataNotice,
  G8Alert,
  G8PageHeader,
  Group8Page,
  describeAudience,
  formatDateTime,
  formatRelative,
  type G8AlertTone,
} from '@/components/group8';
import { G8_ANNOUNCER_ROLES } from '@/config/group8Routes';
import { listManagedAnnouncements, listMyAnnouncements, publishAnnouncement } from '@/services/group8';
import { useAppDispatch, userActivityRecorded } from '@/store';
import type { Announcement } from '@/types';
import './group8Pages.css';

type View = 'FEED' | 'MANAGE';

export const AnnouncementsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const dispatch = useAppDispatch();
  const canManage = hasRole(G8_ANNOUNCER_ROLES);

  const [view, setView] = useState<View>('FEED');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: G8AlertTone; text: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // The feed shows only what the service returns for this user - no client-side audience filtering (BR8-06).
    const result = view === 'MANAGE' ? await listManagedAnnouncements() : await listMyAnnouncements();
    if (result.ok) setAnnouncements(result.data);
    else setError(result.message);
    setIsDemo(result.demo);
    setIsLoading(false);
  }, [view]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch when the view changes
    void load();
  }, [load]);

  const handlePublish = async (announcement: Announcement) => {
    setPublishingId(announcement.id);
    setMessage(null);
    const result = await publishAnnouncement(announcement.id);
    setPublishingId(null);
    if (result.ok) {
      setAnnouncements((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
      setMessage({ tone: 'success', text: `"${announcement.title}" is now visible to ${describeAudience(announcement.audience)}.` });
      dispatch(userActivityRecorded());
    } else {
      setMessage({ tone: 'danger', text: result.message });
    }
  };

  return (
    <Group8Page>
      <G8PageHeader
        title="Announcements"
        subtitle="University news and updates targeted to you."
        icon={<Megaphone size={22} />}
        actions={
          canManage ? (
            <Link to="/announcements/new">
              <Button icon={<Plus size={16} />}>New Announcement</Button>
            </Link>
          ) : undefined
        }
      />

      <DemoDataNotice show={isDemo} />

      {message && (
        <G8Alert tone={message.tone} onDismiss={() => setMessage(null)}>
          {message.text}
        </G8Alert>
      )}

      {canManage && (
        <Card>
          <div className="g8-toolbar">
            <div className="g8-tabs" role="tablist" aria-label="Announcement view">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'FEED'}
                className={`g8-tab ${view === 'FEED' ? 'active' : ''}`}
                onClick={() => setView('FEED')}
              >
                My feed
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'MANAGE'}
                className={`g8-tab ${view === 'MANAGE' ? 'active' : ''}`}
                onClick={() => setView('MANAGE')}
              >
                Manage announcements
              </button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <LoadingState title="Loading announcements..." />
      ) : error ? (
        <ErrorState title="Could not load announcements" description={error} onRetry={load} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="state-icon" />}
          title="No announcements"
          description={view === 'FEED' ? 'There are no announcements for you right now.' : 'No announcements have been created yet.'}
        />
      ) : (
        <div className="g8-announcement-list">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardBody className="g8-announcement">
                <div className="g8-announcement-top">
                  <h3 className="g8-announcement-title">{announcement.title}</h3>
                  {view === 'MANAGE' && <AnnouncementStatusBadge status={announcement.status} />}
                </div>
                <p className="g8-announcement-content">{announcement.content}</p>
                <div className="g8-announcement-meta">
                  <span>{announcement.publisherName}</span>
                  <span aria-hidden="true">·</span>
                  <span title={formatDateTime(announcement.publishedAt ?? announcement.createdAt)}>
                    {announcement.publishedAt ? formatRelative(announcement.publishedAt) : `Draft, created ${formatRelative(announcement.createdAt)}`}
                  </span>
                  {view === 'MANAGE' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="g8-meta-item">
                        <Users size={14} aria-hidden="true" /> {describeAudience(announcement.audience)}
                      </span>
                    </>
                  )}
                </div>
                {view === 'MANAGE' && announcement.status === 'DRAFT' && (
                  <div>
                    <Button
                      size="sm"
                      icon={<Send size={14} />}
                      onClick={() => handlePublish(announcement)}
                      isLoading={publishingId === announcement.id}
                    >
                      Publish now
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </Group8Page>
  );
};
