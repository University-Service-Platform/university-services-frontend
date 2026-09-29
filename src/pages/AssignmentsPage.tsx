import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardBody, Button } from '@/components/ui';

export const AssignmentsPage: React.FC = () => {
  return (
    <div className="assignments-page" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <nav className="requests-breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Service Desk</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Technician Assignments</span>
      </nav>

      <div className="requests-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="requests-header-text">
          <h2 className="requests-title">Technician Assignment Dispatch</h2>
          <p className="requests-subtitle">Dispatch field work orders to individual technicians based on workload and skill set.</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ backgroundColor: '#FEF3C7', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: '#D97706' }}>
              <AlertTriangle size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>
              Backend Service Dependency Pending: work-order-service
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#4B5563', maxWidth: '560px', margin: '0 0 1.5rem 0' }}>
              Service unit assignment for requests is fully functional via <code>/triage</code>. Individual technician assignment is blocked pending deployment of the Group 7 <code>work-order-service</code> API endpoints.
            </p>
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>
              Check Connection
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
