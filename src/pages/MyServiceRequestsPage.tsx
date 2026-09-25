import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, FileText, Calendar, Tag } from 'lucide-react';
import { getMyServiceRequests } from '@/services/serviceRequestService';
import type { ServiceRequest, ServiceRequestStatus } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Badge,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './MyServiceRequestsPage.css';

type FilterTab = 'ALL' | 'OPEN' | 'RESOLVED' | 'CLOSED';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request contract and DTO schema are not yet documented in the repository.
 * Page layout and service interaction serve as an integration boundary ready for official endpoints.
 */
export const MyServiceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    getMyServiceRequests().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setRequests(result.data);
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return {
      ALL: requests.length,
      OPEN: requests.filter((r) => ['NEW', 'IN_PROGRESS', 'ASSIGNED'].includes(r.status)).length,
      RESOLVED: requests.filter((r) => r.status === 'RESOLVED').length,
      CLOSED: requests.filter((r) => ['CLOSED', 'REJECTED'].includes(r.status)).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (activeTab === 'OPEN') {
        if (!['NEW', 'IN_PROGRESS', 'ASSIGNED'].includes(req.status)) return false;
      } else if (activeTab === 'RESOLVED') {
        if (req.status !== 'RESOLVED') return false;
      } else if (activeTab === 'CLOSED') {
        if (!['CLOSED', 'REJECTED'].includes(req.status)) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = req.title.toLowerCase().includes(query);
        const matchCategory = req.category.toLowerCase().includes(query);
        const matchId = req.id.toLowerCase().includes(query);
        if (!matchTitle && !matchCategory && !matchId) return false;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  const getBadgeVariant = (status: ServiceRequestStatus): 'neutral' | 'warning' | 'info' | 'success' | 'danger' => {
    switch (status) {
      case 'NEW':
        return 'neutral';
      case 'IN_PROGRESS':
        return 'warning';
      case 'ASSIGNED':
        return 'info';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'neutral';
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const formatStatusText = (status: ServiceRequestStatus): string => {
    switch (status) {
      case 'NEW':
        return 'New';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'ASSIGNED':
        return 'Assigned';
      case 'RESOLVED':
        return 'Resolved';
      case 'CLOSED':
        return 'Closed';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="my-requests-container">
      {/* Page Header Card */}
      <Card>
        <div className="my-requests-header-card">
          <div className="my-requests-header-text">
            <h2 className="my-requests-title">My Service Requests</h2>
            <p className="my-requests-subtitle">
              View, track, and manage all your submitted service requests and reported issues.
            </p>
          </div>
          <Link to="/requests/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary" icon={<Plus size={16} />}>
              New Request
            </Button>
          </Link>
        </div>
      </Card>

      {/* Controls Card: Filter Tabs & Search Bar */}
      <Card className="my-requests-controls-card">
        <div className="my-requests-controls-container">
          <div className="my-requests-filter-tabs" role="tablist" aria-label="Filter requests by status">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ALL'}
              className={`filter-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              All ({counts.ALL})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'OPEN'}
              className={`filter-tab-btn ${activeTab === 'OPEN' ? 'active' : ''}`}
              onClick={() => setActiveTab('OPEN')}
            >
              Open ({counts.OPEN})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'RESOLVED'}
              className={`filter-tab-btn ${activeTab === 'RESOLVED' ? 'active' : ''}`}
              onClick={() => setActiveTab('RESOLVED')}
            >
              Resolved ({counts.RESOLVED})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'CLOSED'}
              className={`filter-tab-btn ${activeTab === 'CLOSED' ? 'active' : ''}`}
              onClick={() => setActiveTab('CLOSED')}
            >
              Closed ({counts.CLOSED})
            </button>
          </div>

          <div className="my-requests-search-input">
            <Input
              id="my-requests-search-input"
              placeholder="Search requests by title, category, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
        </div>
      </Card>

      {/* Content Area: Loading / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading Submitted Requests..."
          description="Retrieving your service requests from the platform."
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Service Requests Submitted"
          description="You have not submitted any service requests yet. Create a new request to get started."
          icon={<FileText className="state-icon" />}
          action={
            <Link to="/requests/new" style={{ textDecoration: 'none' }}>
              <Button variant="primary" icon={<Plus size={16} />}>
                Submit New Request
              </Button>
            </Link>
          }
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No Matching Requests Found"
          description="No service requests match your current search query or status filter."
          icon={<Search className="state-icon" />}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="my-requests-grid">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="request-card">
              <CardBody>
                <div className="request-card-header">
                  <div className="request-card-identity">
                    <span className="request-card-id">{request.id}</span>
                    <h3 className="request-card-title">{request.title}</h3>
                  </div>
                  <Badge variant={getBadgeVariant(request.status)}>
                    {formatStatusText(request.status)}
                  </Badge>
                </div>

                <div className="request-card-body">
                  <div className="request-meta-item">
                    <Tag size={14} />
                    <span>{request.category}</span>
                  </div>
                  <div className="request-meta-item">
                    <Calendar size={14} />
                    <span>Submitted: {request.submittedDate}</span>
                  </div>
                </div>

                <div className="request-card-actions">
                  <Link to={`/requests/${request.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="sm" icon={<Eye size={16} />}>
                      View
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
