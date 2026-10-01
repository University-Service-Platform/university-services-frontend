import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, FileText, RefreshCw } from 'lucide-react';
import { getMyServiceRequests } from '@/services/serviceRequestService';
import type { ServiceRequest, RequestStatus } from '@/types';
import {
  Card,
  Button,
  Input,
  Badge,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './MyServiceRequestsPage.css';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const MyServiceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Resolved' | 'Closed'>('All');

  const fetchRequestsData = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getMyServiceRequests().then((result) => {
      if (result.success && result.data) {
        setRequests(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to Service Request service.');
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getMyServiceRequests().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setRequests(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to Service Request service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter requests based on tab and client-side search query
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      let matchesTab = true;
      const status = req.status;

      if (activeTab === 'Open') {
        matchesTab = ['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'].includes(status);
      } else if (activeTab === 'Resolved') {
        matchesTab = status === 'RESOLVED';
      } else if (activeTab === 'Closed') {
        matchesTab = ['CLOSED', 'REJECTED', 'CANCELLED'].includes(status);
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        matchesSearch =
          req.requestId.toLowerCase().includes(query) ||
          (req.category && req.category.toLowerCase().includes(query)) ||
          (req.location && req.location.toLowerCase().includes(query)) ||
          (req.description && req.description.toLowerCase().includes(query)) ||
          req.status.toLowerCase().includes(query);
      }

      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, searchQuery]);

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

  return (
    <div className="my-requests-container">
      {/* Search Bar Header */}
      <div className="requests-search-bar-wrap">
        <div className="requests-search-input">
          <Input
            id="my-requests-search-input"
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
        <span className="breadcrumb-current">My requests</span>
      </nav>

      {/* Page Title & Main Header */}
      <div className="requests-page-header">
        <div className="requests-header-text">
          <h2 className="requests-title">My service requests</h2>
          <p className="requests-subtitle">Track the requests you've submitted.</p>
        </div>
        <Link to="/requests/new" style={{ textDecoration: 'none' }}>
          <Button variant="primary" icon={<Plus size={16} />}>
            New request
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="requests-filter-tabs" role="tablist">
        {(['All', 'Open', 'Resolved', 'Closed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingState
          title="Loading Submitted Requests..."
          description="Retrieving your service request history."
        />
      ) : fetchError ? (
        <EmptyState
          title="Unable to Load Requests"
          description={fetchError}
          icon={<FileText className="state-icon" />}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchRequestsData}>
              Retry Connection
            </Button>
          }
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Submitted Service Requests"
          description="You have not submitted any service requests yet."
          icon={<FileText className="state-icon" />}
          action={
            <Link to="/requests/new" style={{ textDecoration: 'none' }}>
              <Button variant="primary" icon={<Plus size={16} />}>
                Create Service Request
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="requests-table-container">
          <Card className="requests-list-card">
            {/* Table Header Row */}
            <div className="requests-row requests-table-header">
              <div className="req-col req-col-request">Request</div>
              <div className="req-col req-col-category">Category</div>
              <div className="req-col req-col-submitted">Submitted</div>
              <div className="req-col req-col-status">Status</div>
              <div className="req-col req-col-actions">Actions</div>
            </div>

            {/* Request Rows */}
            {filteredRequests.length > 0 ? (
              <div className="requests-list-body">
                {filteredRequests.map((request) => (
                  <div key={request.requestId} className="requests-row request-item">
                    <div className="req-col req-col-request">
                      <span className="request-title-line">
                        <strong className="request-id">{request.requestId}</strong>
                        <span className="request-sep">·</span>
                        <span className="request-name">
                          {request.category} issue at {request.location}
                        </span>
                      </span>
                    </div>
                    <div className="req-col req-col-category">
                      <span className="category-text">{request.category}</span>
                    </div>
                    <div className="req-col req-col-submitted">
                      <span className="date-text">{formatDate(request.reportedTime)}</span>
                    </div>
                    <div className="req-col req-col-status">
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="req-col req-col-actions">
                      <Link to={`/requests/${request.requestId}`} style={{ textDecoration: 'none' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`View request ${request.requestId}`}
                          icon={<Eye size={16} />}
                        />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No matching requests"
                description="No submitted requests matched your active filter or search terms."
                icon={<FileText className="state-icon" />}
              />
            )}
          </Card>

          {/* Footer Pagination Text */}
          <div className="requests-pagination-footer">
            Showing {filteredRequests.length} of {requests.length} requests.
          </div>
        </div>
      )}
    </div>
  );
};
