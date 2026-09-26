import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle2, Globe, MapPin, XCircle } from 'lucide-react';
import { Button, Card, CardBody, CardFooter, CardHeader, ErrorState, Input, LoadingState } from '@/components/ui';
import {
  DemoDataNotice,
  G8Alert,
  G8PageHeader,
  Group8Page,
  ROLE_LABELS,
  fromDateTimeLocal,
  toDateTimeLocal,
} from '@/components/group8';
import { createEvent, getEvent, updateEvent, validateVenue } from '@/services/group8';
import type { EventMode, EventUpsertRequest, UserRole, VenueValidationResult } from '@/types';
import { cn } from '@/utils';
import './group8Pages.css';

interface FormState {
  title: string;
  description: string;
  mode: EventMode;
  venueResourceId: string;
  onlineLink: string;
  startTime: string;
  endTime: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  capacity: string;
  roles: UserRole[];
  facultyIds: string;
  departmentIds: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const ELIGIBLE_ROLE_OPTIONS: UserRole[] = ['STUDENT', 'STAFF', 'HOD', 'DEAN', 'ADMIN'];

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  mode: 'PHYSICAL',
  venueResourceId: '',
  onlineLink: '',
  startTime: '',
  endTime: '',
  registrationOpensAt: '',
  registrationClosesAt: '',
  capacity: '',
  roles: [],
  facultyIds: '',
  departmentIds: '',
};

const splitIds = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** Client-side checks mirror DV8-01 / BR8-03; the backend re-validates everything. */
function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = 'Enter an event title.';
  else if (form.title.trim().length > 120) errors.title = 'Title must be 120 characters or fewer.';
  if (!form.description.trim()) errors.description = 'Describe the event so participants know what to expect.';

  const capacity = Number(form.capacity);
  if (!form.capacity) errors.capacity = 'Enter the maximum number of participants.';
  else if (!Number.isInteger(capacity) || capacity <= 0) errors.capacity = 'Capacity must be a positive whole number.';

  if (form.mode === 'PHYSICAL' && !form.venueResourceId.trim()) {
    errors.venueResourceId = 'Enter the Facility Services resource ID of the venue.';
  }
  if (form.mode === 'ONLINE') {
    if (!form.onlineLink.trim()) errors.onlineLink = 'Enter the meeting link.';
    else if (!/^https?:\/\/\S+$/i.test(form.onlineLink.trim())) errors.onlineLink = 'Enter a valid http(s) link.';
  }

  if (!form.startTime) errors.startTime = 'Choose when the event starts.';
  if (!form.endTime) errors.endTime = 'Choose when the event ends.';
  else if (form.startTime && form.endTime <= form.startTime) errors.endTime = 'End time must be after the start time.';

  if (!form.registrationOpensAt) errors.registrationOpensAt = 'Choose when registration opens.';
  if (!form.registrationClosesAt) errors.registrationClosesAt = 'Choose when registration closes.';
  else if (form.registrationOpensAt && form.registrationClosesAt <= form.registrationOpensAt) {
    errors.registrationClosesAt = 'Registration must close after it opens.';
  } else if (form.startTime && form.registrationClosesAt > form.startTime) {
    errors.registrationClosesAt = 'Registration must close before the event starts.';
  }
  return errors;
}

function toRequest(form: FormState): EventUpsertRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    mode: form.mode,
    venueResourceId: form.mode === 'PHYSICAL' ? form.venueResourceId.trim().toUpperCase() : undefined,
    onlineLink: form.mode === 'ONLINE' ? form.onlineLink.trim() : undefined,
    startTime: fromDateTimeLocal(form.startTime),
    endTime: fromDateTimeLocal(form.endTime),
    registrationOpensAt: fromDateTimeLocal(form.registrationOpensAt),
    registrationClosesAt: fromDateTimeLocal(form.registrationClosesAt),
    capacity: Number(form.capacity),
    eligibility: {
      roles: form.roles,
      facultyIds: splitIds(form.facultyIds),
      departmentIds: splitIds(form.departmentIds),
    },
  };
}

export const EventFormPage: React.FC = () => {
  const { eventId } = useParams();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [venueCheck, setVenueCheck] = useState<VenueValidationResult | null>(null);
  const [venueCheckError, setVenueCheckError] = useState<string | null>(null);
  const [isCheckingVenue, setIsCheckingVenue] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    getEvent(eventId).then((result) => {
      if (!active) return;
      if (result.ok) {
        const event = result.data;
        setForm({
          title: event.title,
          description: event.description,
          mode: event.mode,
          venueResourceId: event.venueResourceId ?? '',
          onlineLink: event.onlineLink ?? '',
          startTime: toDateTimeLocal(event.startTime),
          endTime: toDateTimeLocal(event.endTime),
          registrationOpensAt: toDateTimeLocal(event.registrationOpensAt),
          registrationClosesAt: toDateTimeLocal(event.registrationClosesAt),
          capacity: String(event.capacity),
          roles: event.eligibility.roles,
          facultyIds: event.eligibility.facultyIds.join(', '),
          departmentIds: event.eligibility.departmentIds.join(', '),
        });
        if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
          setSubmitError(`This event is ${event.status.toLowerCase()} and can no longer be edited.`);
        }
      } else {
        setLoadError(result.message);
      }
      setIsDemo(result.demo);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === 'venueResourceId') {
      setVenueCheck(null);
      setVenueCheckError(null);
    }
  };

  const toggleRole = (role: UserRole) => {
    update('roles', form.roles.includes(role) ? form.roles.filter((item) => item !== role) : [...form.roles, role]);
  };

  const handleVenueCheck = async () => {
    if (!form.venueResourceId.trim()) {
      setErrors((prev) => ({ ...prev, venueResourceId: 'Enter a resource ID to check.' }));
      return;
    }
    setIsCheckingVenue(true);
    setVenueCheckError(null);
    const result = await validateVenue(form.venueResourceId.trim().toUpperCase());
    setIsCheckingVenue(false);
    if (result.ok) {
      setVenueCheck(result.data);
      if (result.demo) setIsDemo(true);
    } else {
      setVenueCheck(null);
      setVenueCheckError(
        result.kind === 'dependency_unavailable'
          ? 'Facility Services (Group 6) is unavailable right now. You can save a draft and validate the venue before publishing.'
          : result.message
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError('Please correct the highlighted fields.');
      return;
    }

    setIsSaving(true);
    const request = toRequest(form);
    const result = eventId ? await updateEvent(eventId, request) : await createEvent(request);
    setIsSaving(false);

    if (result.ok) {
      navigate(`/events/${result.data.id}`, {
        state: { flash: isEdit ? 'Event updated.' : 'Event saved as a draft. Publish it when you are ready.' },
      });
      return;
    }
    setSubmitError(result.message);
  };

  const venueCapacityWarning =
    venueCheck?.valid && venueCheck.capacity && Number(form.capacity) > venueCheck.capacity
      ? `Capacity exceeds the venue's limit of ${venueCheck.capacity}.`
      : null;

  if (isLoading) {
    return (
      <Group8Page>
        <LoadingState title="Loading event..." />
      </Group8Page>
    );
  }

  if (loadError) {
    return (
      <Group8Page>
        <ErrorState title="Event unavailable" description={loadError} />
      </Group8Page>
    );
  }

  return (
    <Group8Page>
      <div>
        <Link to={eventId ? `/events/${eventId}` : '/events'} className="g8-back-link">
          <ArrowLeft size={16} aria-hidden="true" /> {eventId ? 'Back to event' : 'Back to events'}
        </Link>
      </div>

      <G8PageHeader
        title={isEdit ? 'Edit Event' : 'Create Event'}
        subtitle={
          isEdit
            ? 'Update schedule, venue, capacity or eligibility. Registrants are notified of changes.'
            : 'New events are saved as drafts. Publish from the event page once details are final.'
        }
        icon={<CalendarPlus size={22} />}
      />

      <DemoDataNotice show={isDemo} />

      {submitError && (
        <G8Alert tone="danger" onDismiss={() => setSubmitError(null)}>
          {submitError}
        </G8Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="g8-form">
        <Card>
          <CardHeader title="Event details" />
          <CardBody>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              error={errors.title}
              maxLength={120}
              required
            />
            <div className="form-group">
              <label htmlFor="g8-description" className="form-label">
                Description
              </label>
              <textarea
                id="g8-description"
                className={cn('form-input g8-textarea', errors.description && 'form-input-error')}
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'g8-description-error' : undefined}
              />
              {errors.description && (
                <span id="g8-description-error" className="form-error-text" role="alert">
                  {errors.description}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Location" subtitle="Physical venues are validated with Facility Services (Group 6)." />
          <CardBody>
            <div className="g8-segmented" role="radiogroup" aria-label="Event mode">
              {(['PHYSICAL', 'ONLINE'] as EventMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={form.mode === mode}
                  className={cn('g8-segment', form.mode === mode && 'active')}
                  onClick={() => update('mode', mode)}
                >
                  {mode === 'PHYSICAL' ? <MapPin size={16} /> : <Globe size={16} />}
                  {mode === 'PHYSICAL' ? 'Physical venue' : 'Online'}
                </button>
              ))}
            </div>

            {form.mode === 'PHYSICAL' ? (
              <div className="g8-venue-row">
                <Input
                  label="Venue resource ID"
                  placeholder="e.g. RES-204"
                  value={form.venueResourceId}
                  onChange={(e) => update('venueResourceId', e.target.value)}
                  error={errors.venueResourceId}
                  helperText="Use the resource ID from Facility Services."
                />
                <Button type="button" variant="outline" onClick={handleVenueCheck} isLoading={isCheckingVenue}>
                  Check venue
                </Button>
              </div>
            ) : (
              <Input
                label="Meeting link"
                placeholder="https://"
                value={form.onlineLink}
                onChange={(e) => update('onlineLink', e.target.value)}
                error={errors.onlineLink}
                helperText="Only shown to registered participants."
              />
            )}

            {form.mode === 'PHYSICAL' && venueCheck && (
              <div className={cn('g8-venue-result', venueCheck.valid ? 'valid' : 'invalid')} role="status">
                {venueCheck.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>
                  {venueCheck.valid
                    ? `${venueCheck.venueName} is available${venueCheck.capacity ? ` (capacity ${venueCheck.capacity})` : ''}.`
                    : `Venue cannot be used: ${venueCheck.reason ?? 'not valid.'}`}
                </span>
              </div>
            )}
            {form.mode === 'PHYSICAL' && venueCheckError && (
              <G8Alert tone="warning">{venueCheckError}</G8Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Schedule & registration" />
          <CardBody>
            <div className="g8-form-grid">
              <Input
                label="Starts"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                error={errors.startTime}
              />
              <Input
                label="Ends"
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                error={errors.endTime}
              />
              <Input
                label="Registration opens"
                type="datetime-local"
                value={form.registrationOpensAt}
                onChange={(e) => update('registrationOpensAt', e.target.value)}
                error={errors.registrationOpensAt}
              />
              <Input
                label="Registration closes"
                type="datetime-local"
                value={form.registrationClosesAt}
                onChange={(e) => update('registrationClosesAt', e.target.value)}
                error={errors.registrationClosesAt}
                helperText="Also the deadline for cancelling a registration."
              />
              <Input
                label="Capacity"
                type="number"
                min={1}
                step={1}
                value={form.capacity}
                onChange={(e) => update('capacity', e.target.value)}
                error={errors.capacity ?? venueCapacityWarning ?? undefined}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Eligibility"
            subtitle="Leave everything empty to open the event to all university members. Checked against Identity Services (Group 5) at registration."
          />
          <CardBody>
            <fieldset className="g8-fieldset">
              <legend className="form-label">Eligible roles</legend>
              <div className="g8-checkbox-row">
                {ELIGIBLE_ROLE_OPTIONS.map((role) => (
                  <label key={role} className="g8-checkbox">
                    <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                    <span>{ROLE_LABELS[role]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="g8-form-grid">
              <Input
                label="Faculty IDs (optional)"
                placeholder="e.g. FAC-SCI, FAC-CMS"
                value={form.facultyIds}
                onChange={(e) => update('facultyIds', e.target.value)}
                helperText="Comma-separated Group 5 faculty IDs."
              />
              <Input
                label="Department IDs (optional)"
                placeholder="e.g. DEP-CS"
                value={form.departmentIds}
                onChange={(e) => update('departmentIds', e.target.value)}
                helperText="Comma-separated Group 5 department IDs."
              />
            </div>
          </CardBody>
          <CardFooter className="g8-form-footer">
            <Link to={eventId ? `/events/${eventId}` : '/events'}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSaving}>
              {isEdit ? 'Save changes' : 'Save as draft'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Group8Page>
  );
};
