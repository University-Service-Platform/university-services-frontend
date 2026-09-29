import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ArrowLeft, Clock } from 'lucide-react';
import { getServiceRequestById } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './ServiceRequestTimelinePage.css';

interface TimelineStep {
  label: string;
  timestamp: string;
  completed: boolean;
  note?: string;
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

export const ServiceRequestTimelinePage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const requestId = paramId || '';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!requestId) {
        if (isMounted) {
          setFetchError('No Service Request ID specified.');
          setIsLoading(false);
        }
        return;
      }

      const result = await getServiceRequestById(requestId);
      if (!isMounted) return;

      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setFetchError(result.message || `Unable to load timeline for service request ${requestId}.`);
      }
      setIsLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const getTimelineSteps = (req: ServiceRequest): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    if (req.reportedTime) {
      steps.push({
        label: 'Reported',
        timestamp: formatDate(req.reportedTime),
        completed: true,
      });
    }

    if (req.acknowledgedTime) {
      steps.push({
        label: 'Acknowledged',
        timestamp: formatDate(req.acknowledgedTime),
        completed: true,
      });
    }

    if (req.assignedTime) {
      steps.push({
        label: req.responsibleServiceUnit
          ? `Assigned to ${req.responsibleServiceUnit}`
          : 'Assigned',
        timestamp: formatDate(req.assignedTime),
        completed: true,
      });
    }

    if (req.resolvedTime) {
      steps.push({
        label: 'Resolved',
        timestamp: formatDate(req.resolvedTime),
        completed: true,
      });
    }

    if (req.closedTime) {
      steps.push({
        label: 'Closed',
        timestamp: formatDate(req.closedTime),
        completed: true,
        note: req.confirmationFeedback || undefined,
      });
    }

    if (req.status === 'REJECTED' && !req.closedTime) {
      steps.push({
        label: 'Rejected',
        timestamp: formatDate(req.reportedTime),
        completed: true,
        note: req.rejectionReason || 'Service request was rejected.',
      });
    }

    if (req.status === 'CANCELLED' && !req.closedTime) {
      steps.push({
        label: 'Cancelled',
        timestamp: formatDate(req.reportedTime),
        completed: true,
      });
    }

    return steps;
  };

  const steps = request ? getTimelineSteps(request) : [];

  const currentStepIndex = steps.length - 1;

  return (
    <div className="timeline-page-container">
      {/* Search Bar Header */}
      <div className="requests-search-bar-wrap">
        <div className="requests-search-input">
          <Input
            id="timeline-search-input"
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
        <Link to={`/requests/${requestId}`} className="breadcrumb-item breadcrumb-link">
          {requestId || 'Details'}
        </Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Timeline</span>
      </nav>

      {/* Content State Handling */}
      {isLoading ? (
        <LoadingState
          title="Loading Request Timeline..."
          description={`Retrieving lifecycle timeline for request ${requestId}.`}
        />
      ) : fetchError || !request ? (
        <EmptyState
          title="Request Not Found"
          description={fetchError || `The requested service request '${requestId}' could not be located.`}
          icon={<Clock className="state-icon" />}
          action={
            <Link to="/requests/my" style={{ textDecoration: 'none' }}>
              <Button variant="outline" icon={<ArrowLeft size={16} />}>
                Back to My Requests
              </Button>
            </Link>
          }
        />
      ) : steps.length === 0 ? (
        <EmptyState
          title="No Timeline Data Available"
          description="No lifecycle events have been recorded for this service request yet."
          icon={<Clock className="state-icon" />}
          action={
            <Link to={`/requests/${request.requestId}`} style={{ textDecoration: 'none' }}>
              <Button variant="outline" icon={<ArrowLeft size={16} />}>
                Back to Request Details
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="timeline-content">
          {/* Main Title Header */}
          <div className="timeline-header-group">
            <h2 className="timeline-page-title">Request timeline</h2>
            <div className="timeline-subtitle-line">
              <span className="subtitle-item">{request.requestId}</span>
              <span className="subtitle-sep">·</span>
              <span className="subtitle-item">{request.category} issue at {request.location}</span>
            </div>
          </div>

          {/* Timeline Vertical Card */}
          <Card className="timeline-card">
            <CardBody>
              <div className="timeline-vertical-list">
                {steps.map((step, index) => {
                  const isLast = index === steps.length - 1;
                  const isCurrent = index === currentStepIndex;

                  let stepClass = 'completed';
                  if (isCurrent) {
                    stepClass = 'current';
                  }

                  return (
                    <div key={index} className={`timeline-step-item ${stepClass}`}>
                      {/* Vertical line connector */}
                      {!isLast && <div className="timeline-line completed" />}

                      {/* Dot Marker */}
                      <div className="timeline-dot-wrap">
                        <div className="timeline-dot" />
                      </div>

                      {/* Step Details Content */}
                      <div className="timeline-step-content">
                        <h4 className="step-label">{step.label}</h4>
                        <div className="step-meta">
                          <span className="step-timestamp-text">
                            {step.timestamp}
                          </span>
                          {step.note && (
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#4B5563' }}>
                              Note: {step.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
