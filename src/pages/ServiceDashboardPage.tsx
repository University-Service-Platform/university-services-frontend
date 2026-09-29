import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { getServiceRequestSummary } from '@/services/serviceRequestService';
import type { SummaryGroupByDimension, ServiceRequestSummaryResponse } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Select,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './ServiceDashboardPage.css';

const GROUP_BY_OPTIONS: { label: string; value: SummaryGroupByDimension }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Category', value: 'category' },
  { label: 'Priority', value: 'priority' },
  { label: 'Location', value: 'location' },
  { label: 'Responsible Service Unit', value: 'responsibleServiceUnit' },
];

export const ServiceDashboardPage: React.FC = () => {
  const [dimension, setDimension] = useState<SummaryGroupByDimension>('status');
  const [summaryData, setSummaryData] = useState<ServiceRequestSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (currentDim: SummaryGroupByDimension) => {
    setIsLoading(true);
    setFetchError(null);

    const result = await getServiceRequestSummary(currentDim);
    if (result.success && result.data) {
      setSummaryData(result.data);
    } else {
      setFetchError(result.message || `Unable to load service summary grouped by ${currentDim}.`);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary(dimension);
  }, [dimension, fetchSummary]);

  const totalCount = summaryData
    ? Object.values(summaryData).reduce((acc, count) => acc + (typeof count === 'number' ? count : 0), 0)
    : 0;

  const entries = summaryData ? Object.entries(summaryData) : [];

  return (
    <div className="dashboard-page-container">
      {/* Breadcrumb */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Service desk</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Service Dashboard</span>
      </nav>

      {/* Page Header */}
      <div className="requests-page-header">
        <div className="requests-header-text">
          <h2 className="requests-title">Service Operations Analytics Dashboard</h2>
          <p className="requests-subtitle">
            Real-time aggregate telemetry of service requests grouped by status, category, priority, location, or unit.
          </p>
        </div>
        <Button
          variant="outline"
          icon={<RefreshCw size={16} />}
          onClick={() => fetchSummary(dimension)}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Filter Controls Card */}
      <Card className="dashboard-controls-card">
        <CardBody>
          <div className="controls-row">
            <div className="dimension-selector">
              <Select
                id="dimension-select"
                label="Aggregation Dimension"
                value={dimension}
                onChange={(e) => setDimension(e.target.value as SummaryGroupByDimension)}
                options={GROUP_BY_OPTIONS}
              />
            </div>
            <div className="total-summary-badge">
              <span className="total-label">Total Requests</span>
              <strong className="total-value">{totalCount}</strong>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary Content */}
      {isLoading ? (
        <LoadingState
          title="Loading Analytics Telemetry..."
          description={`Fetching request counts grouped by ${dimension}.`}
        />
      ) : fetchError ? (
        <EmptyState
          title="Telemetry Connection Error"
          description={fetchError}
          action={
            <Button
              variant="outline"
              icon={<RefreshCw size={16} />}
              onClick={() => fetchSummary(dimension)}
            >
              Retry API Call
            </Button>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No Summary Data"
          description={`No service requests found for dimension '${dimension}'.`}
        />
      ) : (
        <div className="dashboard-content-grid">
          {/* Metrics Grid Cards */}
          <div className="metrics-cards-row">
            {entries.map(([key, count]) => {
              const percentage = totalCount > 0 ? Math.round(((count as number) / totalCount) * 100) : 0;

              return (
                <Card key={key} className="metric-tile-card">
                  <CardBody>
                    <div className="tile-header">
                      <span className="tile-title">{key}</span>
                      <BarChart2 size={18} className="tile-icon" />
                    </div>
                    <div className="tile-value">{count as number}</div>
                    <div className="tile-bar-wrap">
                      <div
                        className="tile-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="tile-footer">
                      <span>{percentage}% of total requests</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Breakdown Table Card */}
          <Card className="breakdown-table-card">
            <CardBody>
              <h3 className="breakdown-heading">
                Detailed Breakdown by {dimension.toUpperCase()}
              </h3>
              <div className="breakdown-table">
                <div className="table-row table-head">
                  <div className="cell cell-key">Dimension Value ({dimension})</div>
                  <div className="cell cell-count">Request Count</div>
                  <div className="cell cell-pct">Percentage</div>
                </div>

                {entries.map(([key, count]) => {
                  const numCount = count as number;
                  const pct = totalCount > 0 ? ((numCount / totalCount) * 100).toFixed(1) : '0';

                  return (
                    <div key={key} className="table-row">
                      <div className="cell cell-key">
                        <strong>{key}</strong>
                      </div>
                      <div className="cell cell-count">{numCount}</div>
                      <div className="cell cell-pct">{pct}%</div>
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
