import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock, FileText, ArrowLeft, Paperclip } from 'lucide-react';
import { getServiceRequestById } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types';
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

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export interface RequestDetailsPageProps {
  requestId?: string;
}

export const RequestDetailsPage: React.FC<RequestDetailsPageProps> = ({ requestId: propRequestId }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const activeRequestId = propRequestId || paramId || 'SR-2041';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    getServiceRequestById(activeRequestId).then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setFetchError(result.message || `Unable to load details for service request ${activeRequestId}.`);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeRequestId]);

  const getStatusVariant = (status?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    if (!status) return 'neutral';
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'assigned':
      case 'open':
        return 'info';
      case 'closed':
        return 'neutral';
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
        <Link to="/my-requests" className="breadcrumb-item breadcrumb-link">
          My requests
        </Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{activeRequestId}</span>
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
            <Link to="/my-requests" style={{ textDecoration: 'none' }}>
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
              <h2 className="details-title">{request.title}</h2>
              <div className="details-subtitle-line">
                <span className="subtitle-item">{request.id}</span>
                <span className="subtitle-sep">·</span>
                <span className="subtitle-item">{request.category}</span>
                <span className="subtitle-sep">·</span>
                <span className="subtitle-item">Submitted {request.submittedDate}</span>
              </div>
            </div>
            <div className="details-header-badge">
              <Badge variant={getStatusVariant(request.status)}>
                {request.status}
              </Badge>
            </div>
          </div>

          {/* Request Details Section Card */}
          <Card className="details-main-card">
            <CardBody>
              <h3 className="details-section-heading">Request details</h3>

              {/* 2-Column Grid for Metadata */}
              <div className="details-grid">
                <div className="details-field-group">
                  <span className="field-label">Location</span>
                  <span className="field-value">{request.location || 'Not specified'}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Priority</span>
                  <span className="field-value">{request.priority || 'Normal'}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Assigned to</span>
                  <span className="field-value">{request.assignedTo || 'Unassigned'}</span>
                </div>

                <div className="details-field-group">
                  <span className="field-label">Category</span>
                  <span className="field-value">{request.category}</span>
                </div>
              </div>

              {/* Description Section */}
              <div className="details-full-field">
                <span className="field-label">Description</span>
                <p className="field-description-text">
                  {request.description || 'No detailed description provided for this request.'}
                </p>
              </div>

              {/* Attachment Section (if any) */}
              {request.attachmentName && (
                <div className="details-full-field">
                  <span className="field-label">Attachment</span>
                  <div className="attachment-link-box">
                    <Paperclip size={16} className="attachment-icon" />
                    <span className="attachment-name">{request.attachmentName}</span>
                  </div>
                </div>
              )}

              {/* Resolution Section (if resolved or closed with notes) */}
              {request.resolution && (
                <div className="details-full-field resolution-section">
                  <span className="field-label">Resolution</span>
                  <p className="field-resolution-text">{request.resolution}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Timeline Navigation Button */}
          <div className="details-action-bar">
            <Link to={`/requests/${request.id}/timeline`} style={{ textDecoration: 'none', width: '100%' }}>
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
