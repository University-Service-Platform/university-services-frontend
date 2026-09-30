import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  RefreshCw,
  Layers,
  Wrench,
} from 'lucide-react';
import { getServiceRequestSummary } from '@/services/serviceRequestService';
import { getWorkOrderSummary } from '@/services/workOrderService';
import type {
  SummaryGroupByDimension,
  WorkOrderSummaryGroupByDimension,
  ServiceRequestSummaryResponse,
} from '@/types';
import {
  Card,
  CardBody,
  Button,
  Select,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './ServiceDashboardPage.css';

const REQUEST_GROUP_BY_OPTIONS: { label: string; value: SummaryGroupByDimension }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Category', value: 'category' },
  { label: 'Priority', value: 'priority' },
  { label: 'Location', value: 'location' },
  { label: 'Responsible Service Unit', value: 'responsibleServiceUnit' },
];

const WORK_ORDER_GROUP_BY_OPTIONS: { label: string; value: WorkOrderSummaryGroupByDimension }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Technician', value: 'technician' },
  { label: 'Service Team', value: 'serviceTeam' },
];

export const ServiceDashboardPage: React.FC = () => {
  // Service Request Summary State
  const [srDimension, setSrDimension] = useState<SummaryGroupByDimension>('status');
  const [srSummaryData, setSrSummaryData] = useState<ServiceRequestSummaryResponse | null>(null);
  const [isSrLoading, setIsSrLoading] = useState<boolean>(true);
  const [srFetchError, setSrFetchError] = useState<string | null>(null);

  // Work Order Summary State
  const [woDimension, setWoDimension] = useState<WorkOrderSummaryGroupByDimension>('status');
  const [woSummaryData, setWoSummaryData] = useState<Record<string, number> | null>(null);
  const [isWoLoading, setIsWoLoading] = useState<boolean>(true);
  const [woFetchError, setWoFetchError] = useState<string | null>(null);

  const fetchSrSummary = useCallback(async (dim: SummaryGroupByDimension) => {
    setIsSrLoading(true);
    setSrFetchError(null);

    const result = await getServiceRequestSummary(dim);
    if (result.success && result.data) {
      setSrSummaryData(result.data);
    } else {
      setSrFetchError(result.message || `Unable to load service request summary grouped by ${dim}.`);
    }

    setIsSrLoading(false);
  }, []);

  const fetchWoSummary = useCallback(async (dim: WorkOrderSummaryGroupByDimension) => {
    setIsWoLoading(true);
    setWoFetchError(null);

    const result = await getWorkOrderSummary(dim);
    if (result.success && result.data) {
      setWoSummaryData(result.data);
    } else {
      setWoFetchError(result.message || `Unable to load work order summary grouped by ${dim}.`);
    }

    setIsWoLoading(false);
  }, []);

  const refreshAll = useCallback(() => {
    fetchSrSummary(srDimension);
    fetchWoSummary(woDimension);
  }, [srDimension, woDimension, fetchSrSummary, fetchWoSummary]);

  useEffect(() => {
    let isMounted = true;
    getServiceRequestSummary(srDimension).then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setSrSummaryData(result.data);
        setSrFetchError(null);
      } else {
        setSrFetchError(result.message || `Unable to load service request summary grouped by ${srDimension}.`);
      }
      setIsSrLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [srDimension]);

  useEffect(() => {
    let isMounted = true;
    getWorkOrderSummary(woDimension).then((result) => {
      if (!isMounted) return;
      if (result.success && result.data) {
        setWoSummaryData(result.data);
        setWoFetchError(null);
      } else {
        setWoFetchError(result.message || `Unable to load work order summary grouped by ${woDimension}.`);
      }
      setIsWoLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [woDimension]);

  const srTotalCount = srSummaryData
    ? Object.values(srSummaryData).reduce((acc, count) => acc + (typeof count === 'number' ? count : 0), 0)
    : 0;

  const woTotalCount = woSummaryData
    ? Object.values(woSummaryData).reduce((acc, count) => acc + (typeof count === 'number' ? count : 0), 0)
    : 0;

  const srEntries = srSummaryData ? Object.entries(srSummaryData) : [];
  const woEntries = woSummaryData ? Object.entries(woSummaryData) : [];

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
          <h2 className="requests-title">Service Desk Analytics & Summary Telemetry</h2>
          <p className="requests-subtitle">
            Verified backend statistics distinguishing Service Request metrics from Work Order telemetry.
          </p>
        </div>
        <Button
          variant="outline"
          icon={<RefreshCw size={16} />}
          onClick={refreshAll}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* SECTION 1: Service Request Telemetry */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Layers size={22} style={{ color: '#1E40AF' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Service Request Telemetry
          </h3>
        </div>

        <Card className="dashboard-controls-card" style={{ marginBottom: '1rem' }}>
          <CardBody>
            <div className="controls-row">
              <div className="dimension-selector">
                <Select
                  id="sr-dimension-select"
                  label="Service Request Aggregation GroupBy"
                  value={srDimension}
                  onChange={(e) => setSrDimension(e.target.value as SummaryGroupByDimension)}
                  options={REQUEST_GROUP_BY_OPTIONS}
                />
              </div>
              <div className="total-summary-badge">
                <span className="total-label">Total Requests</span>
                <strong className="total-value">{srTotalCount}</strong>
              </div>
            </div>
          </CardBody>
        </Card>

        {isSrLoading ? (
          <LoadingState title="Loading Service Request Telemetry..." description={`Grouping by ${srDimension}`} />
        ) : srFetchError ? (
          <EmptyState title="Service Request Summary Error" description={srFetchError} />
        ) : srEntries.length === 0 ? (
          <EmptyState title="No Service Request Data" description={`No records for ${srDimension}.`} />
        ) : (
          <div className="metrics-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {srEntries.map(([key, count]) => {
              const num = typeof count === 'number' ? count : 0;
              const pct = srTotalCount > 0 ? Math.round((num / srTotalCount) * 100) : 0;

              return (
                <Card key={key} className="metric-tile-card">
                  <CardBody>
                    <div className="tile-header">
                      <span className="tile-title">{key}</span>
                      <BarChart2 size={18} className="tile-icon" />
                    </div>
                    <div className="tile-value">{num}</div>
                    <div className="tile-bar-wrap">
                      <div className="tile-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="tile-footer">
                      <span>{pct}% of total requests</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Work Order Telemetry */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Wrench size={22} style={{ color: '#D97706' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Work Order Telemetry
          </h3>
        </div>

        <Card className="dashboard-controls-card" style={{ marginBottom: '1rem' }}>
          <CardBody>
            <div className="controls-row">
              <div className="dimension-selector">
                <Select
                  id="wo-dimension-select"
                  label="Work Order Aggregation GroupBy"
                  value={woDimension}
                  onChange={(e) => setWoDimension(e.target.value as WorkOrderSummaryGroupByDimension)}
                  options={WORK_ORDER_GROUP_BY_OPTIONS}
                />
              </div>
              <div className="total-summary-badge">
                <span className="total-label">Total Work Orders</span>
                <strong className="total-value" style={{ color: '#D97706' }}>{woTotalCount}</strong>
              </div>
            </div>
          </CardBody>
        </Card>

        {isWoLoading ? (
          <LoadingState title="Loading Work Order Telemetry..." description={`Grouping by ${woDimension}`} />
        ) : woFetchError ? (
          <EmptyState title="Work Order Summary Error" description={woFetchError} />
        ) : woEntries.length === 0 ? (
          <EmptyState title="No Work Order Summary Data" description={`No records for ${woDimension}.`} />
        ) : (
          <div className="metrics-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {woEntries.map(([key, count]) => {
              const num = typeof count === 'number' ? count : 0;
              const pct = woTotalCount > 0 ? Math.round((num / woTotalCount) * 100) : 0;

              return (
                <Card key={key} className="metric-tile-card">
                  <CardBody>
                    <div className="tile-header">
                      <span className="tile-title">{key}</span>
                      <Wrench size={18} className="tile-icon" style={{ color: '#D97706' }} />
                    </div>
                    <div className="tile-value">{num}</div>
                    <div className="tile-bar-wrap">
                      <div className="tile-bar-fill" style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }} />
                    </div>
                    <div className="tile-footer">
                      <span>{pct}% of total work orders</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
