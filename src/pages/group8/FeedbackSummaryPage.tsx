import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Star } from 'lucide-react';
import { Card, CardBody, CardHeader, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { DemoDataNotice, G8PageHeader, Group8Page, HorizontalBars, StatTile } from '@/components/group8';
import { getFeedbackSummaries } from '@/services/group8';
import type { ActivityType, FeedbackSummary } from '@/types';
import './group8Pages.css';

type Filter = '' | ActivityType;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: '', label: 'All activities' },
  { value: 'EVENT', label: 'Events' },
  { value: 'SERVICE_REQUEST', label: 'Service requests' },
];

export const FeedbackSummaryPage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('');
  const [summaries, setSummaries] = useState<FeedbackSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getFeedbackSummaries(filter || undefined);
    if (result.ok) setSummaries(result.data);
    else setError(result.message);
    setIsDemo(result.demo);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch when the filter changes
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const responses = summaries.reduce((sum, summary) => sum + summary.responseCount, 0);
    const average = responses
      ? summaries.reduce((sum, summary) => sum + summary.averageRating * summary.responseCount, 0) / responses
      : 0;
    return { responses, average };
  }, [summaries]);

  return (
    <Group8Page>
      <div>
        <Link to="/feedback" className="g8-back-link">
          <ArrowLeft size={16} aria-hidden="true" /> Back to feedback
        </Link>
      </div>

      <G8PageHeader
        title="Feedback Summary"
        subtitle="Aggregated ratings and comments for events and services. Individual respondents are not identified."
        icon={<BarChart3 size={22} />}
      />

      <DemoDataNotice show={isDemo} />

      <Card>
        <div className="g8-toolbar">
          <div className="g8-tabs" role="tablist" aria-label="Filter by activity type">
            {FILTERS.map((option) => (
              <button
                key={option.label}
                type="button"
                role="tab"
                aria-selected={filter === option.value}
                className={`g8-tab ${filter === option.value ? 'active' : ''}`}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState title="Loading feedback summaries..." />
      ) : error ? (
        <ErrorState title="Could not load summaries" description={error} onRetry={load} />
      ) : summaries.length === 0 ? (
        <EmptyState title="No feedback yet" description="Summaries appear once participants start submitting feedback." />
      ) : (
        <>
          <div className="g8-stat-row">
            <StatTile label="Responses" value={totals.responses.toLocaleString()} />
            <StatTile label="Average rating" value={`${totals.average.toFixed(1)} / 5`} />
            <StatTile label="Activities reviewed" value={summaries.length} />
          </div>

          <div className="g8-summary-grid">
            {summaries.map((summary) => (
              <Card key={`${summary.activityType}-${summary.activityId}`}>
                <CardHeader
                  title={summary.title}
                  subtitle={`${summary.activityType === 'EVENT' ? 'Event' : 'Service category'} · ${summary.responseCount} responses`}
                  action={
                    <span className="g8-rating-badge" aria-label={`Average rating ${summary.averageRating} out of 5`}>
                      <Star size={14} aria-hidden="true" /> {summary.averageRating.toFixed(1)}
                    </span>
                  }
                />
                <CardBody className="g8-detail-body">
                  <HorizontalBars
                    ariaLabel={`Rating distribution for ${summary.title}`}
                    data={(['5', '4', '3', '2', '1'] as const).map((score) => {
                      const count = summary.ratingDistribution[score];
                      const pct = summary.responseCount ? Math.round((count / summary.responseCount) * 100) : 0;
                      return {
                        key: score,
                        label: `${score} star${score === '1' ? '' : 's'}`,
                        value: count,
                        max: summary.responseCount,
                        valueLabel: `${count} (${pct}%)`,
                      };
                    })}
                  />
                  {summary.recentComments.length > 0 && (
                    <div>
                      <h4 className="g8-subheading">Recent comments</h4>
                      <ul className="g8-comments">
                        {summary.recentComments.map((comment) => (
                          <li key={comment}>“{comment}”</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </Group8Page>
  );
};
