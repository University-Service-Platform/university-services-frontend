import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, Users, FileText, AlertCircle } from 'lucide-react';
import { reservationService } from '@/services/group6/reservationService';
import { resourceService } from '@/services/group6/resourceService';
import type { Reservation, Resource } from '@/types/group6';
import { LoadingState, ErrorState, EmptyState, Button, Modal } from '@/components/ui';
import '@/components/group6/group6.css';

export const ApprovalQueuePage: React.FC = () => {
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Record<number, Resource>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval state
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pendRes, resList] = await Promise.all([
        reservationService.getPendingReservations(),
        resourceService.getResources(),
      ]);

      if (pendRes.error) {
        setError(pendRes.error);
        return;
      }

      setPendingReservations(pendRes.data || []);

      const map: Record<number, Resource> = {};
      (resList.data || []).forEach((r) => {
        map[r.id] = r;
      });
      setResources(map);
    } catch {
      setError('Failed to fetch pending approval requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void loadData();
  }, [loadData]);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    setActionError(null);
    try {
      const res = await reservationService.approveReservation(id);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      loadData();
    } catch {
      setActionError('Failed to approve reservation.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;

    setIsRejecting(true);
    setActionError(null);
    try {
      const res = await reservationService.rejectReservation(rejectingId, {
        reason: rejectReason.trim(),
      });
      if (res.error) {
        setActionError(res.error);
        return;
      }

      setRejectingId(null);
      setRejectReason('');
      loadData();
    } catch {
      setActionError('Failed to reject reservation.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="g6-container">
        <LoadingState title="Loading Approvals Queue" description="Retrieving pending resource requests..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="g6-container">
        <ErrorState
          title="Error Loading Approvals"
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
          <h1 className="g6-title">Resource Reservation Approvals</h1>
          <p className="g6-subtitle">
            Review and decide on resource booking requests requiring manager clearance.
          </p>
        </div>
      </div>

      {actionError && (
        <div style={{ padding: '0.875rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {pendingReservations.length === 0 ? (
        <EmptyState
          title="No Pending Approvals"
          description="All resource requests have been processed. Great job!"
        />
      ) : (
        <div className="g6-grid">
          {pendingReservations.map((res) => {
            const resource = resources[res.resourceId];
            const startDate = new Date(res.startTime);
            const endDate = new Date(res.endTime);

            const formattedDate = isNaN(startDate.getTime())
              ? res.startTime.slice(0, 10)
              : startDate.toLocaleDateString();

            const formattedTime = isNaN(startDate.getTime())
              ? `${res.startTime.slice(11, 16)} - ${res.endTime.slice(11, 16)}`
              : `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            return (
              <div key={res.id} className="g6-card">
                <div className="g6-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {resource?.name || `Resource #${res.resourceId}`}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Requester: <strong>{res.requesterId}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '9999px' }}>
                    PENDING
                  </span>
                </div>

                <div className="g6-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                    <Calendar size={15} color="#64748b" />
                    <span>{formattedDate}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                    <Clock size={15} color="#64748b" />
                    <span>{formattedTime}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                    <Users size={15} color="#64748b" />
                    <span>Expected Attendees: {res.expectedAttendees}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <FileText size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontStyle: 'italic' }}>"{res.purpose}"</span>
                  </div>
                </div>

                <div className="g6-card-footer">
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => {
                      setRejectingId(res.id);
                      setRejectReason('');
                    }}
                    icon={<XCircle size={15} />}
                  >
                    Reject
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={approvingId === res.id}
                    onClick={() => handleApprove(res.id)}
                    icon={<CheckCircle2 size={15} />}
                  >
                    {approvingId === res.id ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectingId !== null}
        onClose={() => {
          if (!isRejecting) setRejectingId(null);
        }}
        title="Reject Reservation Request"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              disabled={isRejecting}
              onClick={() => setRejectingId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isRejecting || !rejectReason.trim()}
              onClick={handleConfirmReject}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        }
      >
        <div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#475569' }}>
            Please provide a reason for rejecting reservation #{rejectingId}. This will be recorded and shown in the reservation history.
          </p>
          <textarea
            rows={3}
            maxLength={500}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Schedule conflict with scheduled departmental maintenance"
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
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right', marginTop: '0.25rem' }}>
            {rejectReason.length}/500
          </div>
        </div>
      </Modal>
    </div>
  );
};
