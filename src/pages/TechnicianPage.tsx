import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  FileText,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Send,
} from 'lucide-react';
import { useAuth } from '@/auth';
import {
  getWorkOrders,
  startWorkOrder,
  addWorkOrderProgressNote,
  recordWorkOrderResolution,
} from '@/services/workOrderService';
import type { WorkOrder, WorkOrderStatus } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';

export const TechnicianPage: React.FC = () => {
  const { user } = useAuth();
  const technicianId = user?.id || user?.email || '';

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Work Order for Actions / Modal
  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);

  // Action Modals & Forms
  const [progressModalOpen, setProgressModalOpen] = useState<boolean>(false);
  const [progressNote, setProgressNote] = useState<string>('');
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState<boolean>(false);

  const [resolutionModalOpen, setResolutionModalOpen] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);

  const [startingWoId, setStartingWoId] = useState<string | null>(null);

  // Global Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTechnicianWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    // Fetch work orders for current technician
    const result = await getWorkOrders(technicianId ? { technicianId } : undefined);
    if (result.success && result.data) {
      setWorkOrders(result.data);
    } else {
      setFetchError(result.message || 'Unable to load assigned work orders.');
    }
    setIsLoading(false);
  }, [technicianId]);

  useEffect(() => {
    loadTechnicianWorkOrders();
  }, [loadTechnicianWorkOrders]);

  const handleStartWork = async (wo: WorkOrder) => {
    setStartingWoId(wo.workOrderId);
    setNotification(null);

    const result = await startWorkOrder(wo.workOrderId);
    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Work started on Work Order ${wo.workOrderId}. Status updated to IN_PROGRESS.`,
      });
      if (selectedWo?.workOrderId === wo.workOrderId) {
        setSelectedWo(result.data);
      }
      loadTechnicianWorkOrders();
    } else {
      setNotification({
        type: 'error',
        message: result.message || 'Failed to start work order.',
      });
    }
    setStartingWoId(null);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWo) return;

    if (!progressNote.trim()) {
      setProgressError('Progress note is required.');
      return;
    }

    setIsSubmittingProgress(true);
    setProgressError(null);

    const result = await addWorkOrderProgressNote(selectedWo.workOrderId, {
      note: progressNote.trim(),
    });

    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Progress note added to Work Order ${selectedWo.workOrderId}.`,
      });
      setProgressModalOpen(false);
      setProgressNote('');
      setSelectedWo(result.data);
      loadTechnicianWorkOrders();
    } else {
      setProgressError(result.message || 'Failed to add progress note.');
    }

    setIsSubmittingProgress(false);
  };

  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWo) return;

    if (!resolutionText.trim()) {
      setResolutionError('Resolution details are required.');
      return;
    }

    setIsSubmittingResolution(true);
    setResolutionError(null);

    const result = await recordWorkOrderResolution(selectedWo.workOrderId, {
      resolution: resolutionText.trim(),
    });

    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Resolution recorded for Work Order ${selectedWo.workOrderId}. Status updated to RESOLVED.`,
      });
      setResolutionModalOpen(false);
      setResolutionText('');
      setSelectedWo(result.data);
      loadTechnicianWorkOrders();
    } else {
      setResolutionError(result.message || 'Failed to record resolution.');
    }

    setIsSubmittingResolution(false);
  };

  const filteredOrders = workOrders.filter((wo) => {
    if (statusFilter === 'ALL') return true;
    return wo.status === statusFilter;
  });

  const getStatusVariant = (status: WorkOrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'ASSIGNED':
        return 'info';
      case 'CLOSED':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="technician-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Field Work</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Technician Workspace</span>
      </nav>

      {/* Header */}
      <div className="requests-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="requests-title" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Technician Field Workspace</h2>
          <p className="requests-subtitle" style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
            View assigned work orders, update job status, log diagnostic progress, and submit resolutions.
          </p>
        </div>
        <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadTechnicianWorkOrders}>
          Refresh Queue
        </Button>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`form-alert ${notification.type === 'success' ? 'form-alert-success' : 'form-alert-error'}`}
          role="alert"
          style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '6px' }}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-pill ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              backgroundColor: statusFilter === tab ? '#1E40AF' : '#FFFFFF',
              color: statusFilter === tab ? '#FFFFFF' : '#374151',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingState title="Loading Technician Work Queue..." description="Fetching assigned field work orders." />
      ) : fetchError ? (
        <EmptyState
          title="Unable to Load Assigned Work Orders"
          description={fetchError}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadTechnicianWorkOrders}>
              Retry Connection
            </Button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Work Orders Assigned"
          description="There are currently no active work orders assigned to your technician queue."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredOrders.map((wo) => {
            const isAssigned = wo.status === 'ASSIGNED';
            const isInProgress = wo.status === 'IN_PROGRESS';

            return (
              <Card key={wo.workOrderId}>
                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#1E40AF' }}>
                        {wo.workOrderId}
                      </strong>
                      <Badge variant={getStatusVariant(wo.status)}>{wo.status}</Badge>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                      <strong>Service Request:</strong> <span style={{ fontFamily: 'monospace' }}>{wo.requestId}</span>
                    </div>

                    {wo.serviceTeam && (
                      <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                        <strong>Team:</strong> {wo.serviceTeam}
                      </div>
                    )}

                    {wo.schedule && (
                      <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        <strong>Schedule:</strong> {wo.schedule}
                      </div>
                    )}

                    {wo.actionNotes && (
                      <div style={{ backgroundColor: '#F9FAFB', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8125rem', color: '#374151', marginBottom: '0.5rem' }}>
                        <strong>Latest Note:</strong> {wo.actionNotes}
                      </div>
                    )}

                    {wo.resolution && (
                      <div style={{ backgroundColor: '#ECFDF5', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8125rem', color: '#065F46', marginBottom: '0.5rem' }}>
                        <strong>Resolution:</strong> {wo.resolution}
                      </div>
                    )}
                  </div>

                  {/* Actions depending on status */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
                    {isAssigned && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={startingWoId === wo.workOrderId}
                        onClick={() => handleStartWork(wo)}
                        icon={<Play size={14} />}
                      >
                        Start Work
                      </Button>
                    )}

                    {isInProgress && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedWo(wo);
                          setProgressError(null);
                          setProgressModalOpen(true);
                        }}
                        icon={<PlusCircle size={14} />}
                      >
                        Add Progress Note
                      </Button>
                    )}

                    {(isAssigned || isInProgress) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedWo(wo);
                          setResolutionError(null);
                          setResolutionModalOpen(true);
                        }}
                        icon={<CheckCircle size={14} />}
                      >
                        Record Resolution
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWo(wo)}
                      icon={<FileText size={14} />}
                    >
                      Details
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail View Modal */}
      {selectedWo && !progressModalOpen && !resolutionModalOpen && (
        <Modal
          isOpen={!!selectedWo}
          onClose={() => setSelectedWo(null)}
          title={`Work Order ${selectedWo.workOrderId}`}
        >
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Status: <Badge variant={getStatusVariant(selectedWo.status)}>{selectedWo.status}</Badge></span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Created: {new Date(selectedWo.createdTime).toLocaleString()}</span>
            </div>

            <div>
              <strong>Request ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedWo.requestId}</span>
            </div>

            <div>
              <strong>Assigned Technician:</strong> {selectedWo.assignedTechnicianId}
            </div>

            {selectedWo.serviceTeam && (
              <div>
                <strong>Service Team:</strong> {selectedWo.serviceTeam}
              </div>
            )}

            {selectedWo.actionNotes && (
              <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', color: '#374151', marginBottom: '0.25rem' }}>Action Notes:</strong>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedWo.actionNotes}</p>
              </div>
            )}

            {selectedWo.resolution && (
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem', borderRadius: '6px' }}>
                <strong style={{ display: 'block', color: '#065F46', marginBottom: '0.25rem' }}>Recorded Resolution:</strong>
                <p style={{ margin: 0, color: '#064E3B', whiteSpace: 'pre-wrap' }}>{selectedWo.resolution}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => setSelectedWo(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Progress Note Modal */}
      {selectedWo && progressModalOpen && (
        <Modal
          isOpen={progressModalOpen}
          onClose={() => setProgressModalOpen(false)}
          title={`Add Field Progress Note — ${selectedWo.workOrderId}`}
        >
          <form onSubmit={handleProgressSubmit}>
            {progressError && (
              <div className="form-alert form-alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{progressError}</span>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="progress-note-input" className="form-label" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Field Action / Progress Note *
              </label>
              <textarea
                id="progress-note-input"
                className="form-textarea"
                rows={4}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                placeholder="Log diagnostic steps, component replacements, or site visit findings..."
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                disabled={isSubmittingProgress}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" type="button" onClick={() => setProgressModalOpen(false)} disabled={isSubmittingProgress}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmittingProgress} icon={<Send size={16} />}>
                Submit Note
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Resolution Modal */}
      {selectedWo && resolutionModalOpen && (
        <Modal
          isOpen={resolutionModalOpen}
          onClose={() => setResolutionModalOpen(false)}
          title={`Record Resolution — ${selectedWo.workOrderId}`}
        >
          <form onSubmit={handleResolutionSubmit}>
            {resolutionError && (
              <div className="form-alert form-alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{resolutionError}</span>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="resolution-input" className="form-label" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Final Resolution Details *
              </label>
              <textarea
                id="resolution-input"
                className="form-textarea"
                rows={4}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                placeholder="Describe how the issue was fixed, tests performed, and site verification details..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                disabled={isSubmittingResolution}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" type="button" onClick={() => setResolutionModalOpen(false)} disabled={isSubmittingResolution}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmittingResolution} icon={<CheckCircle size={16} />}>
                Record Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
