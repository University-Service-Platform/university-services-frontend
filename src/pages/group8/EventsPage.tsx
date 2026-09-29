import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Globe, MapPin, Plus, Search, Users } from 'lucide-react';
import { useAuth } from '@/auth';
import { Button, Card, CardBody, EmptyState, ErrorState, Input, LoadingState } from '@/components/ui';
import {
  CapacityMeter,
  DemoDataNotice,
  EventStatusBadge,
  G8PageHeader,
  Group8Page,
  formatDateTime,
  getRegistrationAvailability,
} from '@/components/group8';
import { G8_ORGANIZER_ROLES } from '@/config/group8Routes';
import { listEvents } from '@/services/group8';
import type { EventStatus, UniversityEvent } from '@/types';
import './group8Pages.css';

type StatusTab = '' | EventStatus;

const TABS: Array<{ value: StatusTab; label: string; organizerOnly?: boolean }> = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DRAFT', label: 'Drafts', organizerOnly: true },
];

export const EventsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isOrganizer = hasRole(G8_ORGANIZER_ROLES);

  const [events, setEvents] = useState<UniversityEvent[]>([]);
  const [status, setStatus] = useState<StatusTab>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await listEvents({ status, search: debouncedSearch });
    if (result.ok) {
      setEvents(result.data);
    } else {
      setError(result.message);
    }
    setIsDemo(result.demo);
    setIsLoading(false);
  }, [status, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on filter change
    void load();
  }, [load]);

  return (
    <Group8Page>
      <G8PageHeader
        title="Events"
        subtitle="Browse workshops, talks and campus activities you are eligible to join."
        icon={<CalendarDays size={22} />}
        actions={
          isOrganizer ? (
            <Link to="/events/new">
              <Button icon={<Plus size={16} />}>Create Event</Button>
            </Link>
          ) : undefined
        }
      />

      <DemoDataNotice show={isDemo} />

      <Card>
        <div className="g8-toolbar">
          <Input
            label="Search events"
            placeholder="Title, description or venue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
          <div className="g8-tabs" role="tablist" aria-label="Filter events by status">
            {TABS.filter((tab) => !tab.organizerOnly || isOrganizer).map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                className={`g8-tab ${status === tab.value ? 'active' : ''}`}
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState title="Loading events..." description="Fetching events from the event service." />
      ) : error ? (
        <ErrorState title="Could not load events" description={error} onRetry={load} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description={
            search || status
              ? 'No events match your filters. Try a different search or status.'
              : 'There are no events available to you right now. Check back soon.'
          }
        />
      ) : (
        <div className="g8-event-grid">
          {events.map((event) => {
            const availability = getRegistrationAvailability(event);
            return (
              <Card key={event.id} className="g8-event-card">
                <CardBody className="g8-event-card-body">
                  <div className="g8-event-card-top">
                    <EventStatusBadge status={event.status} />
                    {event.status === 'PUBLISHED' && (
                      <span className={`g8-reg-pill ${availability.open ? 'open' : 'closed'}`}>
                        {availability.open ? 'Registration open' : 'Registration closed'}
                      </span>
                    )}
                  </div>
                  <h3 className="g8-event-title">
                    <Link to={`/events/${event.id}`}>{event.title}</Link>
                  </h3>
                  <p className="g8-event-desc">{event.description}</p>
                  <div className="g8-meta">
                    <span className="g8-meta-item">
                      <Clock size={14} /> {formatDateTime(event.startTime)}
                    </span>
                    <span className="g8-meta-item">
                      {event.mode === 'ONLINE' ? <Globe size={14} /> : <MapPin size={14} />}
                      {event.mode === 'ONLINE' ? 'Online event' : event.venueName ?? event.venueResourceId}
                    </span>
                    <span className="g8-meta-item">
                      <Users size={14} /> {event.organizerName}
                    </span>
                  </div>
                  <CapacityMeter confirmed={event.confirmedCount} capacity={event.capacity} />
                  {event.status === 'PUBLISHED' && !availability.open && (
                    <p className="g8-event-reason">{availability.reason}</p>
                  )}
                  <div className="g8-event-card-actions">
                    <Link to={`/events/${event.id}`}>
                      <Button variant="outline" size="sm" fullWidth>
                        View details
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </Group8Page>
  );
};
