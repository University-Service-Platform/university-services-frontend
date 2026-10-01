import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Users, FileText, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/auth';
import { resourceService } from '@/services/group6/resourceService';
import { reservationService } from '@/services/group6/reservationService';
import type { Resource } from '@/types/group6';
import { Button, LoadingState, ErrorState } from '@/components/ui';
import '@/components/group6/group6.css';

export const BookResourcePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedResourceId = searchParams.get('resourceId');
  const { roles } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(
    preselectedResourceId ? Number(preselectedResourceId) : null
  );

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState(1);

  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [resourceError, setResourceError] = useState<string | null>(null);

  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setIsLoadingResources(true);
    setResourceError(null);
    try {
      const res = await resourceService.getResources();
      if (res.error) {
        setResourceError(res.error);
        return;
      }
      const activeResources = (res.data || []).filter((r) => r.active && r.available);
      setResources(activeResources);
      if (!selectedResourceId && activeResources.length > 0) {
        setSelectedResourceId(activeResources[0].id);
      }
    } catch {
      setResourceError('Failed to load campus resources.');
    } finally {
      setIsLoadingResources(false);
    }
  }, [selectedResourceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void loadResources();
  }, [loadResources]);

  // Reset availability check if inputs change
  const handleInputChange = () => {
    if (availabilityResult) {
      setAvailabilityResult(null);
    }
    setSubmitError(null);
  };

  const selectedResource = resources.find((r) => r.id === selectedResourceId);

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) return;

    setIsCheckingAvailability(true);
    setSubmitError(null);

    try {
      const res = await resourceService.checkAvailability({
        resourceId: selectedResourceId,
        date,
        startTime,
        endTime,
        requestedCapacity: Number(expectedAttendees),
        userRole: roles[0] || 'STUDENT',
      });

      if (res.error) {
        setAvailabilityResult({
          checked: true,
          available: false,
          message: res.error,
        });
      } else {
        const isAvail = res.data?.available ?? true;
        setAvailabilityResult({
          checked: true,
          available: isAvail,
          message: isAvail
            ? 'Resource is available for this time slot!'
            : res.data?.message || 'Resource is not available at the selected time.',
        });
      }
    } catch {
      setAvailabilityResult({
        checked: true,
        available: false,
        message: 'Unable to verify availability right now.',
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmitReservation = async () => {
    if (!selectedResourceId || !purpose.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const startDateTime = `${date}T${startTime.length === 5 ? `${startTime}:00` : startTime}`;
    const endDateTime = `${date}T${endTime.length === 5 ? `${endTime}:00` : endTime}`;

    try {
      const res = await reservationService.createReservation({
        resourceId: selectedResourceId,
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: purpose.trim(),
        expectedAttendees: Number(expectedAttendees),
      });

      if (res.error) {
        setSubmitError(res.error);
        return;
      }

      navigate('/reservations');
    } catch {
      setSubmitError('Failed to create reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingResources) {
    return (
      <div className="g6-container">
        <LoadingState title="Loading Resources" description="Fetching active university resources..." />
      </div>
    );
  }

  if (resourceError) {
    return (
      <div className="g6-container">
        <ErrorState
          title="Error Loading Resources"
          description={resourceError}
          onRetry={loadResources}
        />
      </div>
    );
  }

  return (
    <div className="g6-container" style={{ maxWidth: '768px' }}>
      <div className="g6-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <div>
            <h1 className="g6-title">Reserve a Resource</h1>
            <p className="g6-subtitle">Verify availability and request a booking for labs, rooms, or equipment.</p>
          </div>
        </div>
      </div>

      <div className="g6-card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleCheckAvailability} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Resource Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              Select Resource *
            </label>
            <select
              value={selectedResourceId || ''}
              onChange={(e) => {
                setSelectedResourceId(Number(e.target.value));
                handleInputChange();
              }}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                background: '#ffffff',
              }}
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code}) — {r.resourceType} (Cap: {r.capacity})
                  {r.approvalRequired ? ' [Approval Required]' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedResource && (
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem', color: '#475569', border: '1px solid #e2e8f0' }}>
              <div><strong>Location:</strong> {selectedResource.location}</div>
              {selectedResource.rulesDescription && (
                <div style={{ marginTop: '0.25rem' }}><strong>Rules:</strong> {selectedResource.rulesDescription}</div>
              )}
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              <Calendar size={15} /> Reservation Date *
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setDate(e.target.value);
                handleInputChange();
              }}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Time Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
                <Clock size={15} /> Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  handleInputChange();
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
                <Clock size={15} /> End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  handleInputChange();
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Expected Attendees */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              <Users size={15} /> Expected Attendees *
            </label>
            <input
              type="number"
              min="1"
              max={selectedResource?.capacity || 200}
              value={expectedAttendees}
              onChange={(e) => {
                setExpectedAttendees(Math.max(1, Number(e.target.value)));
                handleInputChange();
              }}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Purpose */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', color: '#1e293b' }}>
              <FileText size={15} /> Purpose of Reservation *
            </label>
            <textarea
              rows={3}
              value={purpose}
              placeholder="e.g. Group study session for CS302 coursework"
              onChange={(e) => {
                setPurpose(e.target.value);
                handleInputChange();
              }}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Availability Check Feedback */}
          {availabilityResult && (
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                background: availabilityResult.available ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${availabilityResult.available ? '#a7f3d0' : '#fecaca'}`,
                color: availabilityResult.available ? '#065f46' : '#991b1b',
                fontSize: '0.9rem',
              }}
            >
              {availabilityResult.available ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span>{availabilityResult.message}</span>
            </div>
          )}

          {submitError && (
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.375rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.9rem',
              }}
            >
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/facilities-browse')}
            >
              Cancel
            </Button>

            {!availabilityResult?.available ? (
              <Button
                type="submit"
                variant="primary"
                disabled={isCheckingAvailability}
              >
                {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                disabled={isSubmitting || !purpose.trim()}
                onClick={handleSubmitReservation}
              >
                {isSubmitting ? 'Submitting Booking...' : 'Confirm & Reserve'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
