import React, { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Send, Users } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, EmptyState, ErrorState, LoadingState, Modal } from '@/components/ui';
import { G8Alert, RegistrationStatusBadge, formatDateTime, type G8AlertTone } from '@/components/group8';
import { cancelEvent, completeEvent, getRegistrationSummary, publishEvent } from '@/services/group8';
import { useAppDispatch, userActivityRecorded } from '@/store';
import type { RegistrationSummary, UniversityEvent } from '@/types';

interface EventOrganizerPanelProps {
  event: UniversityEvent;
  onEventChanged: (event: UniversityEvent) => void;
}

/**
 * Organizer-only tools on the event page: publish, cancel, complete and the
 * registration/capacity summary (US8-03, US8-07). Visibility here is UX only;
 * event-service enforces organizer authorization (BR8-01, BR8-09).
 */
export const EventOrganizerPanel: React.FC<EventOrganizerPanelProps> = ({ event, onEventChanged }) => {
  const dispatch = useAppDispatch();
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  // Reference time for "has the event started?" - captured once per mount.
  const [now] = useState(() => Date.now());
  const [message, setMessage] = useState<{ tone: G8AlertTone; text: string } | null>(null);

  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    const result = await getRegistrationSummary(event.id);
    if (result.ok) setSummary(result.data);
    else setSummaryError(result.message);
    setIsSummaryLoading(false);
  }, [event.id]);

  useEffect(() => {
    // Refetch when the event status or registration count changes (e.g. after registering on this page).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch when the event changes
    void loadSummary();
  }, [loadSummary, event.status, event.confirmedCount]);

  const handlePublish = async () => {
    setIsPublishing(true);
    setMessage(null);
    const result = await publishEvent(event.id);
    setIsPublishing(false);
    if (result.ok) {
      onEventChanged(result.data);
      setMessage({ tone: 'success', text: 'Event published. Eligible users can now see and register for it.' });
      dispatch(userActivityRecorded());
    } else {
      setMessage({ tone: result.kind === 'dependency_unavailable' ? 'warning' : 'danger', text: result.message });
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    const result = await cancelEvent(event.id);
    setIsCancelling(false);
    if (result.ok) {
      setIsCancelOpen(false);
      onEventChanged(result.data);
      setMessage({
        tone: 'success',
        text: 'Event cancelled. All active registrations were cancelled and registrants have been notified.',
      });
      dispatch(userActivityRecorded());
    } else {
      setCancelError(result.message);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    setMessage(null);
    const result = await completeEvent(event.id);
    setIsCompleting(false);
    if (result.ok) {
      onEventChanged(result.data);
      setMessage({ tone: 'success', text: 'Event marked as completed. Participants can now give feedback.' });
      dispatch(userActivityRecorded());
    } else {
      setMessage({ tone: 'danger', text: result.message });
    }
  };

  const canPublish = event.status === 'DRAFT';
  const canCancel = event.status === 'DRAFT' || event.status === 'PUBLISHED';
  const canComplete = event.status === 'PUBLISHED' && now >= new Date(event.startTime).getTime();

  return (
    <>
      {message && (
        <G8Alert tone={message.tone} onDismiss={() => setMessage(null)}>
          {message.text}
        </G8Alert>
      )}

      <Card>
        <CardHeader
          title="Organizer tools"
          subtitle="Registration and capacity summary for this event."
          action={
            <div className="g8-header-actions">
              {canPublish && (
                <Button icon={<Send size={16} />} onClick={handlePublish} isLoading={isPublishing}>
                  Publish
                </Button>
              )}
              {canComplete && (
                <Button variant="outline" icon={<CheckCircle2 size={16} />} onClick={handleComplete} isLoading={isCompleting}>
                  Mark as completed
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" icon={<Ban size={16} />} onClick={() => setIsCancelOpen(true)}>
                  Cancel event
                </Button>
              )}
            </div>
          }
        />
        <CardBody>
          {isSummaryLoading ? (
            <LoadingState title="Loading registrations..." description="" />
          ) : summaryError ? (
            <ErrorState title="Summary unavailable" description={summaryError} onRetry={loadSummary} />
          ) : summary ? (
            <>
              <div className="g8-stat-row">
                <div className="g8-stat">
                  <span className="g8-stat-value">{summary.confirmed}</span>
                  <span className="g8-stat-label">Confirmed</span>
                </div>
                <div className="g8-stat">
                  <span className="g8-stat-value">{Math.max(summary.capacity - summary.confirmed, 0)}</span>
                  <span className="g8-stat-label">Places left</span>
                </div>
                <div className="g8-stat">
                  <span className="g8-stat-value">{summary.waitlisted}</span>
                  <span className="g8-stat-label">Waitlisted</span>
                </div>
                <div className="g8-stat">
                  <span className="g8-stat-value">{summary.cancelled}</span>
                  <span className="g8-stat-label">Cancelled</span>
                </div>
              </div>
              {summary.registrants.length === 0 && summary.confirmed > 0 ? (
                <p className="g8-muted">
                  The event service reports registration counts only; participant names are not shared with this screen.
                </p>
              ) : summary.registrants.length === 0 ? (
                <EmptyState
                  icon={<Users className="state-icon" />}
                  title="No registrations yet"
                  description={
                    event.status === 'DRAFT'
                      ? 'Registrations will appear here once the event is published.'
                      : 'Nobody is currently registered for this event.'
                  }
                />
              ) : (
                <div className="g8-table-wrap">
                  <table className="g8-table">
                    <caption className="g8-sr-only">Registrants</caption>
                    <thead>
                      <tr>
                        <th scope="col">Participant</th>
                        <th scope="col">Department</th>
                        <th scope="col">Registered</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.registrants.map((registrant) => (
                        <tr key={registrant.registrationId}>
                          <td>{registrant.displayName}</td>
                          <td>{registrant.departmentName ?? '-'}</td>
                          <td>{formatDateTime(registrant.registeredAt)}</td>
                          <td>
                            <RegistrationStatusBadge status={registrant.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {summary.confirmed > summary.registrants.length && (
                    <p className="g8-muted g8-table-note">
                      Showing {summary.registrants.length} most recent of {summary.confirmed} confirmed registrations.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel this event?"
        footer={
          <div className="g8-form-footer">
            <Button variant="ghost" onClick={() => setIsCancelOpen(false)}>
              Keep event
            </Button>
            <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>
              Cancel event
            </Button>
          </div>
        }
      >
        <p className="g8-modal-text">
          Registration will close and {summary ? `all ${summary.confirmed}` : 'all'} active registrations will be
          cancelled. Every registrant receives an in-app cancellation notice. This cannot be undone.
        </p>
        {cancelError && <G8Alert tone="danger">{cancelError}</G8Alert>}
      </Modal>
    </>
  );
};
