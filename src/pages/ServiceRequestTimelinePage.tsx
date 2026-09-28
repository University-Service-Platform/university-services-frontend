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

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const ServiceRequestTimelinePage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const requestId = paramId || 'SR-2041';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    getServiceRequestById(requestId).then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setRequest(result.data);
      } else {
        setFetchError(result.message || `Unable to load timeline for service request ${requestId}.`);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  // Compute default fallback timeline if none specified on object
  const getTimelineSteps = (req: ServiceRequest) => {
    if (req.timeline && req.timeline.length > 0) {
      return req.timeline;
    }

    const techName = req.assignedTo ? req.assignedTo.split(' ')[0] + ' ' + req.assignedTo.split(' ')[1] : 'Technician';
    return [
      { label: 'Reported', timestamp: req.submittedDate || 'Recently', completed: true },
      { label: 'Acknowledged', timestamp: 'Shortly after', completed: true },
      { label: `Assigned to ${techName}`, completed: ['In progress', 'Assigned', 'Resolved', 'Closed'].includes(req.status) },
      { label: 'In progress', completed: ['In progress', 'Resolved', 'Closed'].includes(req.status) },
      { label: 'Resolved', completed: ['Resolved', 'Closed'].includes(req.status) },
    ];
  };

  const steps = request ? getTimelineSteps(request) : [];

  // Find index of latest completed step (current step)
  const currentStepIndex = steps.reduce((latestIdx, step, idx) => {
    return step.completed ? idx : latestIdx;
  }, -1);

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
          {requestId}
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
      ) : (
        <div className="timeline-content">
          {/* Main Title Header */}
          <div className="timeline-header-group">
            <h2 className="timeline-page-title">Request timeline</h2>
            <div className="timeline-subtitle-line">
              <span className="subtitle-item">{request.id}</span>
              <span className="subtitle-sep">·</span>
              <span className="subtitle-item">{request.title}</span>
            </div>
          </div>

          {/* Timeline Vertical Card */}
          <Card className="timeline-card">
            <CardBody>
              <div className="timeline-vertical-list">
                {steps.map((step, index) => {
                  const isCompleted = step.completed;
                  const isCurrent = index === currentStepIndex;
                  const isFuture = !isCompleted;
                  const isLast = index === steps.length - 1;

                  let stepClass = 'completed';
                  if (isCurrent) {
                    stepClass = 'current';
                  } else if (isFuture) {
                    stepClass = 'pending';
                  }

                  return (
                    <div key={index} className={`timeline-step-item ${stepClass}`}>
                      {/* Vertical line connector */}
                      {!isLast && <div className={`timeline-line ${isCompleted && index < currentStepIndex ? 'completed' : isCurrent ? 'active-line' : ''}`} />}

                      {/* Dot Marker */}
                      <div className="timeline-dot-wrap">
                        <div className="timeline-dot" />
                      </div>

                      {/* Step Details Content */}
                      <div className="timeline-step-content">
                        <h4 className="step-label">{step.label}</h4>
                        <div className="step-meta">
                          {isFuture ? (
                            <span className="step-pending-text">Pending</span>
                          ) : (
                            <span className="step-timestamp-text">
                              {step.note || step.timestamp || 'Completed'}
                            </span>
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
