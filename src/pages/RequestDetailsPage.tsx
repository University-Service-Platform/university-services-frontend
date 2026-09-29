import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock, FileText, ArrowLeft, Paperclip, CheckCircle, AlertCircle } from 'lucide-react';
import { getServiceRequestById, confirmAndCloseServiceRequest } from '@/services/serviceRequestService';
import type { ServiceRequest, RequestStatus } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Badge,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './RequestDetailsPage.css';

export interface RequestDetailsPageProps {
  requestId?: string;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export const RequestDetailsPage: React.FC<RequestDetailsPageProps> = ({ requestId: propRequestId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const activeRequestId = propRequestId || paramId || '';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Confirm & Close state
  const [confirmationFeedback, setConfirmationFeedback] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!activeRequestId) {
        if (isMounted) {
          setFetchError('No Service Request ID specified.');
          setIsLoading(false);
        }
        return;
      }

      const result = await getServiceRequestById(activeRequestId);
      if (!isMounted) return;

      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setFetchError(result.message || `Unable to load details for service request ${activeRequestId}.`);
      }
      setIsLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeRequestId]);

  const handleConfirmAndClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    if (!confirmationFeedback.trim()) {
      setConfirmError('Please provide confirmation feedback.');
      return;
    }

    setIsConfirming(true);
    setConfirmError(null);
    setConfirmSuccess(null);

    const result = await confirmAndCloseServiceRequest(request.requestId, {
      confirmationFeedback: confirmationFeedback.trim(),
    });

    if (result.success && result.data) {
      setRequest(result.data);
      setConfirmSuccess('Service request has been confirmed and closed successfully.');
    } else {
      setConfirmError(result.message || 'Failed to confirm service request.');
    }

    setIsConfirming(false);
  };

  const getStatusVariant = (status?: RequestStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    if (!status) return 'neutral';
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

  return (
    <div className="request-details-container">
      {/* Search Bar Header */}
      <div className="requests-search-bar-wrap">
        <div className="requests-search-input">
          <Input
            id="request-details-search-input"
            placeholder="Search my requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Service requests</span>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to="/requests/my" className="breadcrumb-item breadcrumb-link">
          My requests
        </Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{activeRequestId || 'Details'}</span>
      </nav>

      {/* Content State Handling */}
      {isLoading ? (
        <LoadingState
          title="Loading Request Details..."
          description={`Retrieving full details for request ${activeRequestId}.`}
        />
      ) : fetchError || !request ? (
        <EmptyState
          title="Request Not Found"
          description={fetchError || `The requested service request '${activeRequestId}' could not be located.`}
          icon={<FileText className="state-icon" />}
          action={
            <Link to="/requests/my" style={{ textDecoration: 'none' }}>
              <Button variant="outline" icon={<ArrowLeft size={16} />}>
                Back to My Requests
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="request-details-content">
          {/* Main Request Title Header */}
          <div className="details-header-card">
            <div className="details-header-info">
              <h2 className="details-title">{request.category} issue at {request.location}</h2>
              <div className="details-subtitle-line">
                <span className="subtitle-item">{request.requestId}</span>
                <span className="subtitle-sep">·</span>
                <span className="subtitle-item">{request.category}</span>
                <span className="subtitle-sep">·</span>
                <span className="subtitle-item">Submitted {formatDate(request.reportedTime)}</span>
              </div>
            </div>
            <div className="details-header-badge">
              <Badge variant={getStatusVariant(request.status)}>
                {request.status}
              </Badge>
            </div>
          </div>

          {/* Success Feedback Banner */}
          {confirmSuccess && (
            <div className="form-alert form-alert-success" role="alert" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
              <CheckCircle size={18} />
              <span>{confirmSuccess}</span>
            </div>
          )}

          {/* Error Feedback Banner */}
          {confirmError && (
            <div className="form-alert form-alert-error" role="alert" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
              <AlertCircle size={18} />
              <span>{confirmError}</span>
            </div>
          )}

          {/* Request Details Section Card */}
          <Card className="details-main-card">
            <CardBody>
              <h3 className="details-section-heading">Request details</h3>

              {/* 2-Column Grid for Metadata */}
              <div className="details-grid">
                <div className="details-field-group">
                  <span className="field-label">Location</span>
                  <span className="field-value">{request.location}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Priority</span>
                  <span className="field-value">{request.priority}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Responsible Service Unit</span>
                  <span className="field-value">{request.responsibleServiceUnit || 'Unassigned'}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Category</span>
                  <span className="field-value">{request.category}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Requester ID</span>
                  <span className="field-value">{request.requesterId}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Reported Time</span>
                  <span className="field-value">{formatDate(request.reportedTime)}</span>
                </div>
              </div>

              {/* Description Section */}
              <div className="details-full-field">
                <span className="field-label">Description</span>
                <p className="field-description-text">
                  {request.description}
                </p>
              </div>

              {/* Attachment Section */}
              {request.attachmentReference && (
                <div className="details-full-field">
                  <span className="field-label">Attachment Reference</span>
                  <div className="attachment-link-box">
                    <Paperclip size={16} className="attachment-icon" />
                    <span className="attachment-name">{request.attachmentReference}</span>
                  </div>
                </div>
              )}

              {/* Rejection Reason Section */}
              {request.rejectionReason && (
                <div className="details-full-field rejection-section">
                  <span className="field-label" style={{ color: '#DC2626' }}>Rejection Reason</span>
                  <p className="field-resolution-text" style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: '4px', borderLeft: '3px solid #DC2626' }}>
                    {request.rejectionReason}
                  </p>
                </div>
              )}

              {/* Confirmation Feedback Section */}
              {request.confirmationFeedback && (
                <div className="details-full-field resolution-section">
                  <span className="field-label">Requester Confirmation Feedback</span>
                  <p className="field-resolution-text" style={{ backgroundColor: '#F0FDF4', padding: '0.75rem', borderRadius: '4px', borderLeft: '3px solid #16A34A' }}>
                    {request.confirmationFeedback}
                  </p>
                </div>
              )}

              {/* Confirm & Close Action Block (Only when RESOLVED) */}
              {request.status === 'RESOLVED' && (
                <div className="confirm-close-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                    Confirm &amp; Close Request
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
                    The service desk has marked this request as resolved. Please provide feedback and confirm to close.
                  </p>
                  <form onSubmit={handleConfirmAndClose}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="confirm-feedback-input" className="form-label">
                        Confirmation Feedback
                      </label>
                      <textarea
                        id="confirm-feedback-input"
                        className="form-textarea"
                        placeholder="Issue has been fixed completely. Thank you!"
                        value={confirmationFeedback}
                        rows={3}
                        onChange={(e) => setConfirmationFeedback(e.target.value)}
                        disabled={isConfirming}
                        required
                      />
                    </div>
                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={isConfirming}
                      icon={<CheckCircle size={16} />}
                    >
                      Confirm &amp; Close Request
                    </Button>
                  </form>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Timeline Navigation Button */}
          <div className="details-action-bar">
            <Link to={`/requests/${request.requestId}/timeline`} style={{ textDecoration: 'none', width: '100%' }}>
              <Button
                variant="outline"
                fullWidth
                className="view-timeline-btn"
                icon={<Clock size={16} />}
              >
                View timeline
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
