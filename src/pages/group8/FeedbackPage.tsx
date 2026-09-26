import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, CalendarDays, CheckCircle2, Clock, MessageSquareText, Wrench } from 'lucide-react';
import { useAuth } from '@/auth';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { DemoDataNotice, G8Alert, G8PageHeader, Group8Page, formatDate } from '@/components/group8';
import { G8_INSIGHT_ROLES } from '@/config/group8Routes';
import { getMyFeedbackActivities } from '@/services/group8';
import type { FeedbackActivity } from '@/types';
import './group8Pages.css';

const ActivityIcon: React.FC<{ activity: FeedbackActivity }> = ({ activity }) =>
  activity.activityType === 'EVENT' ? <CalendarDays size={18} aria-hidden="true" /> : <Wrench size={18} aria-hidden="true" />;

const activityKindLabel = (activity: FeedbackActivity) => (activity.activityType === 'EVENT' ? 'Event' : 'Service request');

export const FeedbackPage: React.FC = () => {
  const { hasRole } = useAuth();
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const canViewSummaries = hasRole(G8_INSIGHT_ROLES);

  const [activities, setActivities] = useState<FeedbackActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [message, setMessage] = useState<string | null>(flash ?? null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getMyFeedbackActivities();
    if (result.ok) setActivities(result.data);
    else setError(result.message);
    setIsDemo(result.demo);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void load();
  }, [load]);

  const groups = useMemo(
    () => ({
      ready: activities.filter((activity) => activity.eligible && !activity.alreadySubmitted),
      pending: activities.filter((activity) => !activity.eligible && !activity.alreadySubmitted),
      done: activities.filter((activity) => activity.alreadySubmitted),
    }),
    [activities]
  );

  return (
    <Group8Page>
      <G8PageHeader
        title="Feedback"
        subtitle="Share your experience of completed events and resolved service requests."
        icon={<MessageSquareText size={22} />}
        actions={
          canViewSummaries ? (
            <Link to="/feedback/summary">
              <Button variant="outline" icon={<BarChart3 size={16} />}>
                Feedback summary
              </Button>
            </Link>
          ) : undefined
        }
      />

      <DemoDataNotice show={isDemo} />

      {message && (
        <G8Alert tone="success" onDismiss={() => setMessage(null)}>
          {message}
        </G8Alert>
      )}

      {isLoading ? (
        <LoadingState title="Loading your activities..." />
      ) : error ? (
        <ErrorState title="Could not load feedback activities" description={error} onRetry={load} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="state-icon" />}
          title="Nothing to review yet"
          description="Once you attend an event or a service request you raised is resolved, you can leave feedback here."
        />
      ) : (
        <>
          <Card>
            <CardHeader title="Ready for your feedback" subtitle={`${groups.ready.length} completed activities`} />
            <CardBody>
              {groups.ready.length === 0 ? (
                <p className="g8-muted">You're all caught up - no completed activities are waiting for feedback.</p>
              ) : (
                <ul className="g8-activity-list">
                  {groups.ready.map((activity) => (
                    <li key={`${activity.activityType}-${activity.activityId}`} className="g8-activity">
                      <span className="g8-activity-icon ready">
                        <ActivityIcon activity={activity} />
                      </span>
                      <div className="g8-activity-body">
                        <span className="g8-activity-title">{activity.title}</span>
                        <span className="g8-muted">
                          {activityKindLabel(activity)} · {activity.activityId}
                          {activity.completedAt && ` · completed ${formatDate(activity.completedAt)}`}
                        </span>
                      </div>
                      <Link to={`/feedback/${activity.activityType.toLowerCase()}/${encodeURIComponent(activity.activityId)}`}>
                        <Button size="sm">Give feedback</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {groups.pending.length > 0 && (
            <Card>
              <CardHeader title="Not yet available" subtitle="Feedback opens only for completed activities." />
              <CardBody>
                <ul className="g8-activity-list">
                  {groups.pending.map((activity) => (
                    <li key={`${activity.activityType}-${activity.activityId}`} className="g8-activity">
                      <span className="g8-activity-icon">
                        <Clock size={18} aria-hidden="true" />
                      </span>
                      <div className="g8-activity-body">
                        <span className="g8-activity-title">{activity.title}</span>
                        <span className="g8-muted">
                          {activityKindLabel(activity)} · {activity.activityId}
                        </span>
                        <span className="g8-activity-reason">{activity.ineligibleReason}</span>
                      </div>
                      <Badge variant={activity.sourceStatus === 'REJECTED' ? 'danger' : 'warning'}>
                        {activity.sourceStatus.replace('_', ' ')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {groups.done.length > 0 && (
            <Card>
              <CardHeader title="Submitted" />
              <CardBody>
                <ul className="g8-activity-list">
                  {groups.done.map((activity) => (
                    <li key={`${activity.activityType}-${activity.activityId}`} className="g8-activity">
                      <span className="g8-activity-icon done">
                        <CheckCircle2 size={18} aria-hidden="true" />
                      </span>
                      <div className="g8-activity-body">
                        <span className="g8-activity-title">{activity.title}</span>
                        <span className="g8-muted">
                          {activityKindLabel(activity)} · thank you for your feedback
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </Group8Page>
  );
};
