import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  UserCheck,
  FileText,
} from 'lucide-react';
import { getWorkOrders } from '@/services/workOrderService';
import type { WorkOrder, WorkOrderStatus } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';

export const WorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Work Order for Detail View Modal
  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);

  const loadWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const result = await getWorkOrders();
    if (result.success && result.data) {
      setWorkOrders(result.data);
    } else {
      setFetchError(result.message || 'Unable to retrieve work orders.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      wo.workOrderId.toLowerCase().includes(query) ||
      wo.requestId.toLowerCase().includes(query) ||
      wo.assignedTechnicianId.toLowerCase().includes(query) ||
      (wo.serviceTeam && wo.serviceTeam.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const getStatusVariant = (status: WorkOrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'ASSIGNED':
        return 'info';
      case 'CLOSED':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="work-orders-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Field Operations</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Work Orders</span>
      </nav>

      {/* Header */}
      <div className="requests-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="requests-title" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Work Orders Management</h2>
          <p className="requests-subtitle" style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
            Field work order dispatch, tracking, and resolution lifecycle.
          </p>
        </div>
        <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadWorkOrders}>
          Refresh List
        </Button>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <Input
            id="wo-search-input"
            placeholder="Search work order ID, request ID, technician, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-pill ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: statusFilter === tab ? '#1E40AF' : '#FFFFFF',
                color: statusFilter === tab ? '#FFFFFF' : '#374151',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingState title="Loading Work Orders..." description="Retrieving work orders from field service API." />
      ) : fetchError ? (
        <EmptyState
          title="Unable to Load Work Orders"
          description={fetchError}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={loadWorkOrders}>
              Retry Connection
            </Button>
          }
        />
      ) : filteredWorkOrders.length === 0 ? (
        <EmptyState
          title="No Work Orders Found"
          description="No work orders match the selected search query or status filter."
        />
      ) : (
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Work Order ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Service Request ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assigned Technician</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Service Team</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Schedule</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map((wo) => (
                    <tr key={wo.workOrderId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1E40AF', fontFamily: 'monospace' }}>
                        {wo.workOrderId}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', color: '#4B5563' }}>
                        {wo.requestId}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <UserCheck size={14} style={{ color: '#6B7280' }} />
                          <span>{wo.assignedTechnicianId}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6B7280' }}>
                        {wo.serviceTeam || 'Unassigned Team'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6B7280' }}>
                        {wo.schedule || 'N/A'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Badge variant={getStatusVariant(wo.status)}>{wo.status}</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {new Date(wo.createdTime).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWo(wo)}
                          icon={<FileText size={14} />}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Details Modal */}
      {selectedWo && (
        <Modal
          isOpen={!!selectedWo}
          onClose={() => setSelectedWo(null)}
          title={`Work Order Details: ${selectedWo.workOrderId}`}
        >
          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem' }}>
              <div>
                <strong style={{ display: 'block', color: '#6B7280', fontSize: '0.75rem' }}>Status</strong>
                <Badge variant={getStatusVariant(selectedWo.status)}>{selectedWo.status}</Badge>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#6B7280', fontSize: '0.75rem' }}>Upstream Request</strong>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedWo.requestId}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <strong style={{ display: 'block', color: '#6B7280', fontSize: '0.75rem' }}>Assigned Technician</strong>
                <span>{selectedWo.assignedTechnicianId}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#6B7280', fontSize: '0.75rem' }}>Service Team</strong>
                <span>{selectedWo.serviceTeam || 'None specified'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#6B7280', fontSize: '0.75rem' }}>Schedule</strong>
                <span>{selectedWo.schedule || 'Not scheduled'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#6B7280', fontSize: '0.75rem' }}>Created Date</strong>
                <span>{new Date(selectedWo.createdTime).toLocaleString()}</span>
              </div>
            </div>

            {selectedWo.actionNotes && (
              <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                <strong style={{ display: 'block', color: '#374151', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Action / Progress Notes</strong>
                <p style={{ margin: 0, color: '#1F2937', whiteSpace: 'pre-wrap' }}>{selectedWo.actionNotes}</p>
              </div>
            )}

            {selectedWo.resolution && (
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                <strong style={{ display: 'block', color: '#065F46', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Resolution Details</strong>
                <p style={{ margin: 0, color: '#064E3B', whiteSpace: 'pre-wrap' }}>{selectedWo.resolution}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => setSelectedWo(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
