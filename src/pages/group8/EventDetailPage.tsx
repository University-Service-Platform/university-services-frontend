import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CalendarDays, Clock, Globe, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth';
import { Button, Card, CardBody, CardHeader, ErrorState, LoadingState } from '@/components/ui';
import {
  CapacityMeter,
  DemoDataNotice,
  EventStatusBadge,
  G8Alert,
  G8PageHeader,
  Group8Page,
  RegistrationStatusBadge,
  describeEligibility,
  formatDateTime,
  getRegistrationAvailability,
  type G8AlertTone,
} from '@/components/group8';
import { G8_ORGANIZER_ROLES } from '@/config/group8Routes';
import { getEvent, getMyRegistrations, registerForEvent } from '@/services/group8';
import { useAppDispatch, userActivityRecorded } from '@/store';
import type { Registration, UniversityEvent } from '@/types';
import { EventOrganizerPanel } from './EventOrganizerPanel';
import './group8Pages.css';

interface Feedback {
  tone: G8AlertTone;
  message: string;
}

export const EventDetailPage: React.FC = () => {
  const { eventId = '' } = useParams();
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const { hasRole } = useAuth();
  const dispatch = useAppDispatch();
  const isOrganizer = hasRole(G8_ORGANIZER_ROLES);

  const [event, setEvent] = useState<UniversityEvent | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(flash ? { tone: 'success', message: flash } : null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const [eventResult, registrationsResult] = await Promise.all([getEvent(eventId), getMyRegistrations()]);
    if (!eventResult.ok) {
      setLoadError(eventResult.message);
    } else {
      setEvent(eventResult.data);
    }
    if (registrationsResult.ok) {
      setRegistration(
        registrationsResult.data.find((item) => item.eventId === eventId && item.status !== 'CANCELLED') ?? null
      );
    }
    setIsDemo(eventResult.demo);
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch when the route param changes
    void load();
  }, [load]);

  const handleRegister = async () => {
    if (!event) return;
    setIsRegistering(true);
    setFeedback(null);
    const result = await registerForEvent(event.id);
    setIsRegistering(false);

    if (result.ok) {
      setRegistration(result.data);
      setEvent({ ...event, confirmedCount: event.confirmedCount + (result.data.status === 'CONFIRMED' ? 1 : 0) });
      setFeedback({
        tone: 'success',
        message:
          result.data.status === 'WAITLISTED'
            ? 'You have been added to the waitlist. We will notify you if a place becomes available.'
            : 'Registration confirmed! A confirmation has been sent to your notifications.',
      });
      dispatch(userActivityRecorded());
      return;
    }

    // Backend is the source of truth: show its explanation (capacity, eligibility, window, ...).
    const tone: G8AlertTone = result.kind === 'dependency_unavailable' ? 'warning' : 'danger';
    setFeedback({ tone, message: result.message });
    if (result.kind === 'conflict') {
      // Capacity or status may have changed since the page loaded.
      const refreshed = await getEvent(event.id);
      if (refreshed.ok) setEvent(refreshed.data);
    }
  };

  if (isLoading) {
    return (
      <Group8Page>
        <LoadingState title="Loading event..." />
      </Group8Page>
    );
  }

  if (loadError || !event) {
    return (
      <Group8Page>
        <ErrorState title="Event unavailable" description={loadError ?? undefined} onRetry={load} />
        <Link to="/events">
          <Button variant="ghost" icon={<ArrowLeft size={16} />}>
            Back to events
          </Button>
        </Link>
      </Group8Page>
    );
  }

  const availability = getRegistrationAvailability(event);
  const canManage = isOrganizer && (event.status === 'DRAFT' || event.status === 'PUBLISHED');

  return (
    <Group8Page>
      <div>
        <Link to="/events" className="g8-back-link">
          <ArrowLeft size={16} aria-hidden="true" /> Back to events
        </Link>
      </div>

      <G8PageHeader
        title={event.title}
        subtitle={`Organised by ${event.organizerName}`}
        icon={<CalendarDays size={22} />}
        actions={
          canManage ? (
            <Link to={`/events/${event.id}/edit`}>
              <Button variant="outline">Edit event</Button>
            </Link>
          ) : undefined
        }
      />

      <DemoDataNotice show={isDemo} />

      {feedback && (
        <G8Alert tone={feedback.tone} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </G8Alert>
      )}

      <div className="g8-detail-layout">
        <Card>
          <CardHeader title="About this event" action={<EventStatusBadge status={event.status} />} />
          <CardBody className="g8-detail-body">
            <p className="g8-detail-desc">{event.description}</p>
            <dl className="g8-detail-list">
              <div>
                <dt>
                  <Clock size={16} aria-hidden="true" /> Schedule
                </dt>
                <dd>
                  {formatDateTime(event.startTime)} – {formatDateTime(event.endTime)}
                </dd>
              </div>
              <div>
                <dt>
                  {event.mode === 'ONLINE' ? <Globe size={16} aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
                  {event.mode === 'ONLINE' ? ' Online' : ' Venue'}
                </dt>
                <dd>
                  {event.mode === 'ONLINE'
                    ? registration
                      ? event.onlineLink
                      : 'Meeting link is shared with registered participants.'
                    : `${event.venueName ?? event.venueResourceId} (validated with Facility Services)`}
                </dd>
              </div>
              <div>
                <dt>
                  <CalendarClock size={16} aria-hidden="true" /> Registration period
                </dt>
                <dd>
                  {formatDateTime(event.registrationOpensAt)} – {formatDateTime(event.registrationClosesAt)}
                </dd>
              </div>
              <div>
                <dt>
                  <ShieldCheck size={16} aria-hidden="true" /> Eligibility
                </dt>
                <dd>{describeEligibility(event)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="g8-register-card">
          <CardHeader title="Registration" />
          <CardBody className="g8-detail-body">
            <CapacityMeter confirmed={event.confirmedCount} capacity={event.capacity} />

            {registration ? (
              <div className="g8-registered-box">
                <div className="g8-registered-row">
                  <span>Your status</span>
                  <RegistrationStatusBadge status={registration.status} />
                </div>
                <p className="g8-muted">Registered on {formatDateTime(registration.registeredAt)}.</p>
                <Link to="/registrations">
                  <Button variant="outline" size="sm" fullWidth>
                    Manage in My Registrations
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <p className={availability.open ? 'g8-muted' : 'g8-event-reason'}>{availability.reason}</p>
                <Button
                  fullWidth
                  onClick={handleRegister}
                  isLoading={isRegistering}
                  disabled={!availability.open}
                  aria-describedby="g8-register-hint"
                >
                  {availability.open ? 'Register for this event' : 'Registration unavailable'}
                </Button>
                <p id="g8-register-hint" className="g8-muted g8-small">
                  Eligibility is confirmed with University Identity Services when you register.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {isOrganizer && <EventOrganizerPanel event={event} onEventChanged={setEvent} />}
    </Group8Page>
  );
};
