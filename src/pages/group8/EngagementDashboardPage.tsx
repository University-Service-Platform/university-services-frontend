import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, MessageSquareText } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, ErrorState, LoadingState } from '@/components/ui';
import { DemoDataNotice, G8PageHeader, Group8Page, HorizontalBars, StatTile } from '@/components/group8';
import { getEngagementSummary } from '@/services/group8';
import type { EngagementSummary } from '@/types';
import './group8Pages.css';

export const EngagementDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getEngagementSummary();
    if (result.ok) setSummary(result.data);
    else setError(result.message);
    setIsDemo(result.demo);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void load();
  }, [load]);

  return (
    <Group8Page>
      <G8PageHeader
        title="Engagement Dashboard"
        subtitle="Event participation, announcement reach and feedback at a glance."
        icon={<BarChart3 size={22} />}
        actions={
          <Link to="/feedback/summary">
            <Button variant="outline" icon={<MessageSquareText size={16} />}>
              Feedback details
            </Button>
          </Link>
        }
      />

      <DemoDataNotice show={isDemo} />

      {isLoading ? (
        <LoadingState title="Loading engagement data..." />
      ) : error || !summary ? (
        <ErrorState title="Dashboard unavailable" description={error ?? undefined} onRetry={load} />
      ) : (
        <>
          <div className="g8-stat-row">
            <StatTile label="Published events" value={summary.totals.publishedEvents} />
            <StatTile label="Active registrations" value={summary.totals.activeRegistrations.toLocaleString()} />
            <StatTile label="Announcements" value={summary.totals.announcementsPublished} />
            <StatTile label="Feedback responses" value={summary.totals.feedbackResponses.toLocaleString()} />
            <StatTile label="Average rating" value={`${summary.totals.averageRating.toFixed(1)} / 5`} />
          </div>

          <Card>
            <CardHeader title="Event participation" subtitle="Confirmed registrations as a share of capacity." />
            <CardBody>
              <HorizontalBars
                ariaLabel="Event participation by event"
                data={summary.eventParticipation.map((event) => ({
                  key: event.eventId,
                  label: event.title,
                  value: event.confirmed,
                  max: event.capacity,
                  valueLabel: `${event.confirmed}/${event.capacity} (${Math.round((event.confirmed / Math.max(event.capacity, 1)) * 100)}%)`,
                }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Announcement reach" subtitle="How many targeted recipients have read each announcement." />
            <div className="g8-table-wrap">
              <table className="g8-table">
                <caption className="g8-sr-only">Announcement reach</caption>
                <thead>
                  <tr>
                    <th scope="col">Announcement</th>
                    <th scope="col">Audience</th>
                    <th scope="col" className="g8-num">
                      Recipients
                    </th>
                    <th scope="col" className="g8-num">
                      Read
                    </th>
                    <th scope="col" className="g8-num">
                      Read rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.announcementReach.map((item) => (
                    <tr key={item.announcementId}>
                      <td>{item.title}</td>
                      <td className="g8-muted">{item.audienceLabel}</td>
                      <td className="g8-num">{item.recipients.toLocaleString()}</td>
                      <td className="g8-num">{item.readCount.toLocaleString()}</td>
                      <td className="g8-num">{Math.round((item.readCount / Math.max(item.recipients, 1)) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Group8Page>
  );
};
