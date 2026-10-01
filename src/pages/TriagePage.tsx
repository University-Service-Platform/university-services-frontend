import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Layers,
  Wrench,
} from 'lucide-react';
import {
  getMyServiceRequests,
  triageServiceRequest,
  rejectServiceRequest,
  escalateServiceRequest,
} from '@/services/serviceRequestService';
import { createWorkOrder } from '@/services/workOrderService';
import type {
  ServiceRequest,
  RequestCategory,
  RequestPriority,
  RequestStatus,
} from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './TriagePage.css';

const CATEGORY_OPTIONS = [
  { label: 'Facility', value: 'FACILITY' },
  { label: 'Equipment', value: 'EQUIPMENT' },
  { label: 'IT', value: 'IT' },
  { label: 'General', value: 'GENERAL' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low (P4)', value: 'LOW' },
  { label: 'Medium (P3)', value: 'MEDIUM' },
  { label: 'High (P2)', value: 'HIGH' },
  { label: 'Critical (P1)', value: 'CRITICAL' },
];

export const TriagePage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('NEW');

  // Selected Request for Action
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Form States for Triage
  const [triageCategory, setTriageCategory] = useState<RequestCategory>('FACILITY');
  const [triagePriority, setTriagePriority] = useState<RequestPriority>('MEDIUM');
  const [triageUnit, setTriageUnit] = useState<string>('');
  const [triageError, setTriageError] = useState<string | null>(null);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);

  // Modal States
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const [escalateModalOpen, setEscalateModalOpen] = useState<boolean>(false);
  const [escalationUnit, setEscalationUnit] = useState<string>('');
  const [escalateError, setEscalateError] = useState<string | null>(null);
  const [isEscalating, setIsEscalating] = useState<boolean>(false);

  // Create Work Order Modal States
  const [createWoModalOpen, setCreateWoModalOpen] = useState<boolean>(false);
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>('');
  const [serviceTeam, setServiceTeam] = useState<string>('');
  const [schedule, setSchedule] = useState<string>('');
  const [createWoError, setCreateWoError] = useState<string | null>(null);
  const [isCreatingWo, setIsCreatingWo] = useState<boolean>(false);

  // Global Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const result = await getMyServiceRequests();
    if (result.success && result.data) {
      setRequests(result.data);
    } else {
      setFetchError(result.message || 'Unable to connect to Service Request service.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getMyServiceRequests().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setRequests(result.data);
        setFetchError(null);
      } else {
        setFetchError(result.message || 'Unable to connect to Service Request service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectRequestForTriage = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setTriageCategory(req.category || 'FACILITY');
    setTriagePriority(req.priority || 'MEDIUM');
    setTriageUnit(req.responsibleServiceUnit || 'Facilities');
    setTriageError(null);
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!triageUnit.trim()) {
      setTriageError('Responsible Service Unit is required.');
      return;
    }

    setIsTriaging(true);
    setTriageError(null);

    const result = await triageServiceRequest(selectedRequest.requestId, {
      category: triageCategory,
      priority: triagePriority,
      responsibleServiceUnit: triageUnit.trim(),
    });

    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Request ${selectedRequest.requestId} triaged successfully to ${triageUnit.trim()}.`,
      });
      setSelectedRequest(result.data);
      loadRequests();
    } else {
      setTriageError(result.message || 'Failed to triage request.');
    }

    setIsTriaging(false);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      setRejectError('Rejection reason cannot be blank.');
      return;
    }

    setIsRejecting(true);
    setRejectError(null);

    const result = await rejectServiceRequest(selectedRequest.requestId, {
      rejectionReason: rejectionReason.trim(),
    });

    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Request ${selectedRequest.requestId} rejected successfully.`,
      });
      setRejectModalOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      loadRequests();
    } else {
      setRejectError(result.message || 'Failed to reject service request.');
    }

    setIsRejecting(false);
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!escalationUnit.trim()) {
      setEscalateError('Responsible service unit for escalation cannot be blank.');
      return;
    }

    setIsEscalating(true);
    setEscalateError(null);

    const result = await escalateServiceRequest(selectedRequest.requestId, {
      responsibleServiceUnit: escalationUnit.trim(),
    });

    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Request ${selectedRequest.requestId} escalated to ${escalationUnit.trim()} successfully.`,
      });
      setEscalateModalOpen(false);
      setEscalationUnit('');
      setSelectedRequest(result.data);
      loadRequests();
    } else {
      setEscalateError(result.message || 'Failed to escalate service request.');
    }

    setIsEscalating(false);
  };

  const handleCreateWorkOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!assignedTechnicianId.trim()) {
      setCreateWoError('Assigned Technician ID is required.');
      return;
    }

    setIsCreatingWo(true);
    setCreateWoError(null);

    const result = await createWorkOrder({
      requestId: selectedRequest.requestId,
      assignedTechnicianId: assignedTechnicianId.trim(),
      serviceTeam: serviceTeam.trim() || undefined,
      schedule: schedule.trim() || undefined,
    });

    if (result.success && result.data) {
      setNotification({
        type: 'success',
        message: `Work Order ${result.data.workOrderId} created successfully for request ${selectedRequest.requestId}.`,
      });
      setCreateWoModalOpen(false);
      setAssignedTechnicianId('');
      setServiceTeam('');
      setSchedule('');
      setSelectedRequest(null);
      loadRequests();
    } else {
      setCreateWoError(result.message || 'Failed to create work order.');
    }

    setIsCreatingWo(false);
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      req.requestId.toLowerCase().includes(query) ||
      req.category.toLowerCase().includes(query) ||
      req.location.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusVariant = (status: RequestStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'ESCALATED':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'NEW':
      case 'ACKNOWLEDGED':
      case 'ASSIGNED':
        return 'info';
      case 'REJECTED':
        return 'danger';
      case 'CLOSED':
      case 'CANCELLED':
      default:
        return 'neutral';
    }
  };

  const isEligibleForWorkOrder =
    selectedRequest?.status === 'ACKNOWLEDGED' || selectedRequest?.status === 'ESCALATED';

  return (
    <div className="triage-page-container">
      {/* Search Header */}
      <div className="requests-search-bar-wrap">
        <div className="requests-search-input">
          <Input
            id="triage-search-input"
            placeholder="Filter triage queue by request ID, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Service desk</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Triage & Queue</span>
      </nav>

      {/* Header */}
      <div className="requests-page-header">
        <div className="requests-header-text">
          <h2 className="requests-title">Service Desk Request Triage</h2>
          <p className="requests-subtitle">
            Inspect incoming requests, validate SLA priority, assign service units, or reject/escalate tickets.
          </p>
        </div>
        <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadRequests}>
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

      {/* Status Filter Tabs */}
      <div className="requests-filter-tabs" role="tablist">
        {(['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'ESCALATED', 'REJECTED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab}
            className={`tab-pill ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid: Queue Table + Triage Form Panel */}
      {isLoading ? (
        <LoadingState title="Loading Triage Queue..." description="Retrieving service requests." />
      ) : fetchError ? (
        <EmptyState
          title="Unable to Load Triage Queue"
          description={fetchError}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadRequests}>
              Retry Connection
            </Button>
          }
        />
      ) : (
        <div className="triage-main-grid">
          {/* Left: Queue Table */}
          <div className="triage-queue-col">
            <Card className="requests-list-card">
              <div className="triage-card-header">
                <h3>Incoming Queue ({filteredRequests.length})</h3>
              </div>
              {filteredRequests.length === 0 ? (
                <EmptyState title="No Requests Found" description="No requests match your current queue status or search filters." />
              ) : (
                <div className="requests-list-body">
                  {filteredRequests.map((req) => {
                    const isSelected = selectedRequest?.requestId === req.requestId;
                    return (
                      <div
                        key={req.requestId}
                        className={`triage-item-row ${isSelected ? 'selected-triage-row' : ''}`}
                        onClick={() => selectRequestForTriage(req)}
                      >
                        <div className="triage-item-main">
                          <div className="triage-item-top">
                            <strong className="request-id">{req.requestId}</strong>
                            <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                            <span className="priority-pill">{req.priority}</span>
                          </div>
                          <div className="triage-item-title">
                            {req.category} at {req.location}
                          </div>
                          <p className="triage-item-desc">{req.description}</p>
                          <div className="triage-item-meta">
                            <span>Unit: {req.responsibleServiceUnit || 'Unassigned'}</span>
                            <span>Reported: {new Date(req.reportedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <Button
                          variant={isSelected ? 'primary' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectRequestForTriage(req);
                          }}
                        >
                          {isSelected ? 'Editing' : 'Inspect'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Triage Action Form */}
          <div className="triage-action-col">
            <Card className="triage-panel-card">
              <CardBody>
                {selectedRequest ? (
                  <div className="triage-form-container">
                    <div className="panel-heading">
                      <h3>Triage Ticket: {selectedRequest.requestId}</h3>
                      <p className="panel-sub">Validate SLA priority, classify category, and dispatch to service unit.</p>
                    </div>

                    {triageError && (
                      <div className="form-alert form-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                        <AlertCircle size={18} />
                        <span>{triageError}</span>
                      </div>
                    )}

                    <div className="ticket-summary-box">
                      <div className="summary-line">
                        <strong>Requester:</strong> {selectedRequest.requesterId}
                      </div>
                      <div className="summary-line">
                        <strong>Location:</strong> {selectedRequest.location}
                      </div>
                      <div className="summary-line">
                        <strong>Description:</strong> {selectedRequest.description}
                      </div>
                      {selectedRequest.rejectionReason && (
                        <div className="summary-line rejection-text">
                          <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleTriageSubmit} className="triage-form">
                      <Select
                        id="triage-category-select"
                        label="Service Category"
                        value={triageCategory}
                        onChange={(e) => setTriageCategory(e.target.value as RequestCategory)}
                        options={CATEGORY_OPTIONS}
                        disabled={isTriaging}
                      />

                      <Select
                        id="triage-priority-select"
                        label="Priority & SLA Level"
                        value={triagePriority}
                        onChange={(e) => setTriagePriority(e.target.value as RequestPriority)}
                        options={PRIORITY_OPTIONS}
                        disabled={isTriaging}
                      />

                      <Input
                        id="triage-unit-input"
                        label="Responsible Service Unit"
                        placeholder="e.g. Facilities, IT Services, AV Support"
                        value={triageUnit}
                        onChange={(e) => setTriageUnit(e.target.value)}
                        disabled={isTriaging}
                        required
                      />

                      <div className="triage-action-buttons" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <Button
                          variant="primary"
                          type="submit"
                          isLoading={isTriaging}
                          icon={<CheckCircle size={16} />}
                        >
                          Submit Triage
                        </Button>
                        {isEligibleForWorkOrder && (
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                              setCreateWoError(null);
                              setCreateWoModalOpen(true);
                            }}
                            icon={<Wrench size={16} />}
                          >
                            Create Work Order
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => {
                            setEscalationUnit(selectedRequest.responsibleServiceUnit || '');
                            setEscalateModalOpen(true);
                          }}
                          icon={<TrendingUp size={16} />}
                        >
                          Escalate
                        </Button>
                        <Button
                          variant="danger"
                          type="button"
                          onClick={() => setRejectModalOpen(true)}
                          icon={<XCircle size={16} />}
                        >
                          Reject
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="empty-panel-prompt">
                    <Layers size={36} className="state-icon" />
                    <h4>Select a Request to Triage</h4>
                    <p>Choose an incoming request from the queue to inspect details, set category/priority, or dispatch.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {selectedRequest && (
        <Modal
          isOpen={createWoModalOpen}
          onClose={() => setCreateWoModalOpen(false)}
          title={`Create Work Order for Request ${selectedRequest.requestId}`}
        >
          <form onSubmit={handleCreateWorkOrderSubmit}>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '1rem' }}>
              Convert request into a field work order and assign to a field technician.
            </p>
            {createWoError && (
              <div className="form-alert form-alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{createWoError}</span>
              </div>
            )}
            <Input
              id="wo-technician-input"
              label="Assigned Technician ID *"
              placeholder="e.g. TECH-001 or technician user ID"
              value={assignedTechnicianId}
              onChange={(e) => setAssignedTechnicianId(e.target.value)}
              disabled={isCreatingWo}
              required
            />
            <div style={{ marginTop: '0.75rem' }}>
              <Input
                id="wo-team-input"
                label="Service Team (Optional)"
                placeholder="e.g. Electrical Maintenance Team"
                value={serviceTeam}
                onChange={(e) => setServiceTeam(e.target.value)}
                disabled={isCreatingWo}
              />
            </div>
            <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
              <Input
                id="wo-schedule-input"
                label="Schedule / Target Date (Optional)"
                placeholder="e.g. 2026-09-30 09:00"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                disabled={isCreatingWo}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" type="button" onClick={() => setCreateWoModalOpen(false)} disabled={isCreatingWo}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isCreatingWo} icon={<Wrench size={16} />}>
                Create Work Order
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {selectedRequest && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Reject Service Request ${selectedRequest.requestId}`}
        >
          <form onSubmit={handleRejectSubmit}>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '1rem' }}>
              Please provide a clear rejection reason for the requester.
            </p>
            {rejectError && (
              <div className="form-alert form-alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{rejectError}</span>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="rejection-reason-input" className="form-label">
                Rejection Reason *
              </label>
              <textarea
                id="rejection-reason-input"
                className="form-textarea"
                rows={3}
                placeholder="e.g. Duplicate request, out of scope, or insufficient detail provided."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isRejecting}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" type="button" onClick={() => setRejectModalOpen(false)} disabled={isRejecting}>
                Cancel
              </Button>
              <Button variant="danger" type="submit" isLoading={isRejecting}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Escalate Modal */}
      {selectedRequest && (
        <Modal
          isOpen={escalateModalOpen}
          onClose={() => setEscalateModalOpen(false)}
          title={`Escalate Request ${selectedRequest.requestId}`}
        >
          <form onSubmit={handleEscalateSubmit}>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '1rem' }}>
              Specify the target service unit for escalation.
            </p>
            {escalateError && (
              <div className="form-alert form-alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{escalateError}</span>
              </div>
            )}
            <Input
              id="escalation-unit-input"
              label="New Responsible Service Unit *"
              placeholder="e.g. Executive Operations, Specialized IT"
              value={escalationUnit}
              onChange={(e) => setEscalationUnit(e.target.value)}
              disabled={isEscalating}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="outline" type="button" onClick={() => setEscalateModalOpen(false)} disabled={isEscalating}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isEscalating}>
                Submit Escalation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
