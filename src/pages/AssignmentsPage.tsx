import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { getWorkOrders } from '@/services/workOrderService';
import type { WorkOrder } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Badge,
  LoadingState,
  EmptyState,
} from '@/components/ui';

export const AssignmentsPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAssignments = useCallback(async () => {
    setFetchError(null);

    const result = await getWorkOrders();
    if (result.success && result.data) {
      setWorkOrders(result.data);
    } else {
      setFetchError(result.message || 'Unable to load technician assignment data.');
    }
    setIsLoading(false);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    loadAssignments();
  };

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filteredOrders = workOrders.filter((wo) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      wo.workOrderId.toLowerCase().includes(query) ||
      wo.requestId.toLowerCase().includes(query) ||
      wo.assignedTechnicianId.toLowerCase().includes(query) ||
      (wo.serviceTeam && wo.serviceTeam.toLowerCase().includes(query))
    );
  });

  // Group work orders by Technician ID for aggregate summary view
  const technicianGroupMap = filteredOrders.reduce((acc, wo) => {
    const techId = wo.assignedTechnicianId || 'Unassigned';
    if (!acc[techId]) {
      acc[techId] = [];
    }
    acc[techId].push(wo);
    return acc;
  }, {} as Record<string, WorkOrder[]>);

  const technicianEntries = Object.entries(technicianGroupMap);

  return (
    <div className="assignments-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Service Desk</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Technician Assignments</span>
      </nav>

      {/* Header */}
      <div className="requests-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="requests-title" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Technician Assignment Dispatch View</h2>
          <p className="requests-subtitle" style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
            Work order assignment workload derived directly from active work order telemetry.
          </p>
        </div>
        <Button variant="outline" icon={<RefreshCw size={16} />} onClick={handleRefresh}>
          Refresh Assignments
        </Button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '480px' }}>
        <Input
          id="assignment-search-input"
          placeholder="Filter by technician ID, work order ID, or service team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingState title="Loading Work Order Assignments..." description="Retrieving assigned field work orders." />
      ) : fetchError ? (
        <EmptyState
          title="Unable to Load Assignments"
          description={fetchError}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadAssignments}>
              Retry Connection
            </Button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Work Order Assignments"
          description="No active work order assignments match your filter criteria."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {technicianEntries.map(([techId, orders]) => {
            const activeCount = orders.filter((o) => o.status === 'ASSIGNED' || o.status === 'IN_PROGRESS').length;
            const resolvedCount = orders.filter((o) => o.status === 'RESOLVED' || o.status === 'CLOSED').length;

            return (
              <Card key={techId}>
                <CardBody>
                  {/* Technician Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck size={20} style={{ color: '#1E40AF' }} />
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                        Technician ID: <span style={{ fontFamily: 'monospace' }}>{techId}</span>
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontWeight: 600 }}>
                        {activeCount} Active Task{activeCount !== 1 ? 's' : ''}
                      </span>
                      <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontWeight: 600 }}>
                        {resolvedCount} Resolved
                      </span>
                    </div>
                  </div>

                  {/* Assigned Work Orders List */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Work Order ID</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Request ID</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Service Team</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Schedule</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Created Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((wo) => (
                          <tr key={wo.workOrderId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: '#1E40AF' }}>
                              {wo.workOrderId}
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'monospace', color: '#4B5563' }}>
                              {wo.requestId}
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#6B7280' }}>
                              {wo.serviceTeam || 'General'}
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem' }}>
                              <Badge variant={wo.status === 'IN_PROGRESS' ? 'warning' : wo.status === 'RESOLVED' ? 'success' : 'info'}>
                                {wo.status}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#6B7280' }}>
                              {wo.schedule || 'N/A'}
                            </td>
                            <td style={{ padding: '0.625rem 0.75rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                              {new Date(wo.createdTime).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
