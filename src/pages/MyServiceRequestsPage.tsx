import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, FileText, RefreshCw } from 'lucide-react';
import { getMyServiceRequests } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types';
import {
  Card,
  Button,
  Input,
  Badge,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './MyServiceRequestsPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
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
      if (result.success && result.data && result.data.length > 0) {
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
      if (result.success && result.data && result.data.length > 0) {
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

  // Filter requests based on tab and search query
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      let matchesTab = true;
      const statusLower = req.status.toLowerCase();

      if (activeTab === 'Open') {
        matchesTab = ['open', 'in progress', 'assigned'].includes(statusLower);
      } else if (activeTab === 'Resolved') {
        matchesTab = statusLower === 'resolved';
      } else if (activeTab === 'Closed') {
        matchesTab = statusLower === 'closed';
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        matchesSearch =
          req.id.toLowerCase().includes(query) ||
          req.title.toLowerCase().includes(query) ||
          req.category.toLowerCase().includes(query) ||
          req.status.toLowerCase().includes(query);
      }

      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, searchQuery]);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
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
      ) : requests.length === 0 ? (
        <EmptyState
          title="Service Request API Integration Pending"
          description={
            fetchError ||
            'The official backend Service Request API contract is not yet available in the repository. The user service requests interface is prepared to connect to backend endpoints.'
          }
          icon={<FileText className="state-icon" />}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchRequestsData}>
              Retry Connection
            </Button>
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
                  <div key={request.id} className="requests-row request-item">
                    <div className="req-col req-col-request">
                      <span className="request-title-line">
                        <strong className="request-id">{request.id}</strong>
                        <span className="request-sep">·</span>
                        <span className="request-name">{request.title}</span>
                      </span>
                    </div>
                    <div className="req-col req-col-category">
                      <span className="category-text">{request.category}</span>
                    </div>
                    <div className="req-col req-col-submitted">
                      <span className="date-text">{request.submittedDate}</span>
                    </div>
                    <div className="req-col req-col-status">
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="req-col req-col-actions">
                      <Link to={`/requests/${request.id}`} style={{ textDecoration: 'none' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`View request ${request.id}`}
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
            Showing 1–{filteredRequests.length} of 12 requests.
          </div>
        </div>
      )}
    </div>
  );
};
