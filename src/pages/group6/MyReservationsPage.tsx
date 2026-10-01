import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, XCircle, Plus, AlertTriangle } from 'lucide-react';
import { reservationService } from '@/services/group6/reservationService';
import { resourceService } from '@/services/group6/resourceService';
import type { Reservation, Resource } from '@/types/group6';
import { LoadingState, ErrorState, EmptyState, Button, Badge, Modal } from '@/components/ui';
import '@/components/group6/group6.css';

export const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Record<number, Resource>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resList, rList] = await Promise.all([
        reservationService.getMyReservations(),
        resourceService.getResources(),
      ]);

      if (resList.error) {
        setError(resList.error);
        return;
      }

      setReservations(resList.data || []);

      const resMap: Record<number, Resource> = {};
      (rList.data || []).forEach((r) => {
        resMap[r.id] = r;
      });
      setResources(resMap);
    } catch {
      setError('Failed to fetch your reservations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void loadData();
  }, [loadData]);

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await reservationService.cancelReservation(cancellingId);
      if (res.error) {
        setCancelError(res.error);
        return;
      }

      setCancellingId(null);
      loadData();
    } catch {
      setCancelError('Failed to cancel reservation. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="g6-container">
        <LoadingState title="Loading Reservations" description="Retrieving your reservation history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="g6-container">
        <ErrorState
          title="Could Not Load Reservations"
          description={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="g6-container">
      <div className="g6-header">
        <div>
          <h1 className="g6-title">My Reservations</h1>
          <p className="g6-subtitle">Track your space bookings, approval statuses, and manage upcoming schedules.</p>
        </div>
        <div className="g6-actions">
          <Button icon={<Plus size={16} />} onClick={() => navigate('/reservations/new')}>
            Book a Resource
          </Button>
        </div>
      </div>

      {reservations.length === 0 ? (
        <EmptyState
          title="No Reservations Found"
          description="You haven't made any resource bookings yet."
          action={
            <Button variant="primary" onClick={() => navigate('/reservations/new')}>
              Create Your First Reservation
            </Button>
          }
        />
      ) : (
        <div className="g6-table-container">
          <table className="g6-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Resource</th>
                <th>Date & Time</th>
                <th>Attendees</th>
                <th>Purpose</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => {
                const resource = resources[res.resourceId];
                const startDate = new Date(res.startTime);
                const endDate = new Date(res.endTime);

                const formattedDate = isNaN(startDate.getTime())
                  ? res.startTime.slice(0, 10)
                  : startDate.toLocaleDateString();

                const formattedTime = isNaN(startDate.getTime())
                  ? `${res.startTime.slice(11, 16)} - ${res.endTime.slice(11, 16)}`
                  : `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                const canCancel = res.status === 'PENDING';

                return (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>#{res.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {resource?.name || `Resource #${res.resourceId}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {resource?.location || resource?.resourceType || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
                        <Calendar size={14} color="#64748b" /> {formattedDate}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        <Clock size={14} color="#64748b" /> {formattedTime}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Users size={14} color="#64748b" /> {res.expectedAttendees}
                      </span>
                    </td>
                    <td>
                      <span style={{ maxWidth: '240px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={res.purpose}>
                        {res.purpose}
                      </span>
                    </td>
                    <td>{getStatusBadge(res.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {canCancel ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancellingId(res.id)}
                          style={{ color: '#dc2626' }}
                          icon={<XCircle size={15} />}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancellingId !== null}
        onClose={() => {
          if (!isCancelling) setCancellingId(null);
        }}
        title="Cancel Reservation"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              disabled={isCancelling}
              onClick={() => setCancellingId(null)}
            >
              Keep Reservation
            </Button>
            <Button
              variant="primary"
              disabled={isCancelling}
              onClick={handleConfirmCancel}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
              Are you sure you want to cancel reservation #{cancellingId}? This action will release the time slot for others.
            </p>
            {cancelError && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
                {cancelError}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
