import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal } from '@/components/ui';
import {
  DemoDataNotice,
  EventStatusBadge,
  G8Alert,
  G8PageHeader,
  Group8Page,
  RegistrationStatusBadge,
  formatDateTime,
  type G8AlertTone,
} from '@/components/group8';
import { cancelRegistration, getMyRegistrations } from '@/services/group8';
import { useAppDispatch, userActivityRecorded } from '@/store';
import type { Registration } from '@/types';
import './group8Pages.css';

type Tab = 'UPCOMING' | 'PAST' | 'CANCELLED';

const TAB_LABELS: Record<Tab, string> = {
  UPCOMING: 'Upcoming',
  PAST: 'Past',
  CANCELLED: 'Cancelled',
};

function tabOf(registration: Registration, now: number): Tab {
  if (registration.status === 'CANCELLED') return 'CANCELLED';
  if (registration.eventStatus === 'COMPLETED' || new Date(registration.eventStartTime).getTime() < now) return 'PAST';
  return 'UPCOMING';
}

/** Cancellation is allowed until registration closes (BR8-03). The backend applies the final rule. */
function cancellationState(registration: Registration, now: number): { allowed: boolean; note: string } {
  if (registration.status === 'CANCELLED') {
    return { allowed: false, note: registration.cancelledAt ? `Cancelled ${formatDateTime(registration.cancelledAt)}` : 'Cancelled' };
  }
  if (registration.eventStatus === 'CANCELLED') return { allowed: false, note: 'The event was cancelled by the organizer.' };
  if (registration.eventStatus === 'COMPLETED') return { allowed: false, note: 'Event completed.' };
  if (now > new Date(registration.registrationClosesAt).getTime()) {
    return { allowed: false, note: 'Cancellation deadline has passed.' };
  }
  return { allowed: true, note: `Cancel before ${formatDateTime(registration.registrationClosesAt)}` };
}

export const MyRegistrationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tab, setTab] = useState<Tab>('UPCOMING');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  // Reference time for deadline/tab decisions, refreshed on every load.
  const [now, setNow] = useState(() => Date.now());
  const [pendingCancel, setPendingCancel] = useState<Registration | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<{ tone: G8AlertTone; text: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getMyRegistrations();
    if (result.ok) setRegistrations(result.data);
    else setError(result.message);
    setNow(Date.now());
    setIsDemo(result.demo);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const groups: Record<Tab, Registration[]> = { UPCOMING: [], PAST: [], CANCELLED: [] };
    registrations.forEach((registration) => groups[tabOf(registration, now)].push(registration));
    groups.UPCOMING.sort((a, b) => a.eventStartTime.localeCompare(b.eventStartTime));
    groups.PAST.sort((a, b) => b.eventStartTime.localeCompare(a.eventStartTime));
    return groups;
  }, [registrations, now]);

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;
    setIsCancelling(true);
    const result = await cancelRegistration(pendingCancel.id);
    setIsCancelling(false);
    const title = pendingCancel.eventTitle;
    setPendingCancel(null);

    if (result.ok) {
      setRegistrations((prev) => prev.map((item) => (item.id === result.data.id ? result.data : item)));
      setMessage({ tone: 'success', text: `Your registration for "${title}" was cancelled and your place released.` });
      dispatch(userActivityRecorded());
    } else {
      setMessage({ tone: result.kind === 'dependency_unavailable' ? 'warning' : 'danger', text: result.message });
      if (result.kind === 'conflict') void load();
    }
  };

  const visible = grouped[tab];

  return (
    <Group8Page>
      <G8PageHeader
        title="My Registrations"
        subtitle="Track your event registrations and cancel before the deadline to release your place."
        icon={<Ticket size={22} />}
        actions={
          <Link to="/events">
            <Button variant="outline">Browse events</Button>
          </Link>
        }
      />

      <DemoDataNotice show={isDemo} />

      {message && (
        <G8Alert tone={message.tone} onDismiss={() => setMessage(null)}>
          {message.text}
        </G8Alert>
      )}

      <Card>
        <div className="g8-toolbar">
          <div className="g8-tabs" role="tablist" aria-label="Filter registrations">
            {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`g8-tab ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)}
              >
                {TAB_LABELS[key]} ({grouped[key].length})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState title="Loading your registrations..." />
      ) : error ? (
        <ErrorState title="Could not load registrations" description={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Ticket className="state-icon" />}
          title={`No ${TAB_LABELS[tab].toLowerCase()} registrations`}
          description={tab === 'UPCOMING' ? 'Find an event and register to see it here.' : 'Nothing to show in this list.'}
          action={
            tab === 'UPCOMING' ? (
              <Link to="/events">
                <Button size="sm">Browse events</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <div className="g8-table-wrap">
            <table className="g8-table">
              <caption className="g8-sr-only">{TAB_LABELS[tab]} registrations</caption>
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Starts</th>
                  <th scope="col">Event status</th>
                  <th scope="col">Your status</th>
                  <th scope="col">
                    <span className="g8-sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((registration) => {
                  const cancellation = cancellationState(registration, now);
                  return (
                    <tr key={registration.id}>
                      <td>
                        <Link to={`/events/${registration.eventId}`} className="g8-table-link">
                          {registration.eventTitle}
                        </Link>
                        <div className="g8-muted">Registered {formatDateTime(registration.registeredAt)}</div>
                      </td>
                      <td>{formatDateTime(registration.eventStartTime)}</td>
                      <td>
                        <EventStatusBadge status={registration.eventStatus} />
                      </td>
                      <td>
                        <RegistrationStatusBadge status={registration.status} />
                      </td>
                      <td className="g8-cell-actions">
                        {cancellation.allowed ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setPendingCancel(registration)}>
                              Cancel registration
                            </Button>
                            <div className="g8-muted g8-small">{cancellation.note}</div>
                          </>
                        ) : (
                          <span className="g8-muted">{cancellation.note}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        title="Cancel registration?"
        footer={
          <div className="g8-form-footer">
            <Button variant="ghost" onClick={() => setPendingCancel(null)}>
              Keep my place
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} isLoading={isCancelling}>
              Cancel registration
            </Button>
          </div>
        }
      >
        <p className="g8-modal-text">
          You will lose your place at <strong>{pendingCancel?.eventTitle}</strong>. If the event fills up you may not be
          able to register again.
        </p>
      </Modal>
    </Group8Page>
  );
};
