import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, UserCheck, ShieldAlert, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function ServiceRequestDetails({ requests }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const req = (requests || []).find(r => r.id === id) || (requests && requests[0]);

  if (!req) {
    return <div className="page-container"><p>Request not found.</p></div>;
  }

  const statusInfo = colors.status[req.status] || colors.status.NEW;
  const priorityInfo = colors.priority[req.priority] || colors.priority.MEDIUM;

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Requests
          </button>
          <div className="flex items-center gap-3">
            <span className="wo-id-tag">{req.id}</span>
            <span className="badge-pill" style={{ backgroundColor: priorityInfo.bg, color: priorityInfo.text, borderColor: priorityInfo.border }}>
              {priorityInfo.label}
            </span>
            <span className="badge-pill" style={{ backgroundColor: statusInfo.bg, color: statusInfo.text, borderColor: statusInfo.border }}>
              {statusInfo.label}
            </span>
          </div>
          <h1 className="page-title mt-2">{req.title}</h1>
        </div>

        <button className="btn-primary" onClick={() => navigate(`/requester/timeline/${req.id}`)}>
          <Clock size={16} />
          <span>View Progress Timeline</span>
        </button>
      </div>

      <div className="detail-grid-container">
        <div className="detail-card-main">
          <h2>Request Overview</h2>
          <div className="detail-grid mt-4">
            <div className="detail-field">
              <label>Service Category</label>
              <span>{req.category}</span>
            </div>
            <div className="detail-field">
              <label>Location</label>
              <span>{req.location || 'N/A'}</span>
            </div>
            <div className="detail-field">
              <label>Requester</label>
              <span>{req.requester} ({req.department})</span>
            </div>
            <div className="detail-field">
              <label>Assigned Technician</label>
              <span>{req.assignedTechName || 'Unassigned Queue'}</span>
            </div>
          </div>

          <div className="detail-section mt-6">
            <label>Description & Scope</label>
            <div className="detail-box">{req.description}</div>
          </div>

          {req.status === 'REJECTED' && (
            <div className="danger-box mt-6">
              <div className="danger-box-header">
                <AlertTriangle size={18} />
                <span>Rejection Reason: {req.rejectionReason}</span>
              </div>
              <p>{req.rejectionNotes}</p>
            </div>
          )}

          {req.status === 'RESOLVED' && req.resolutionDetails && (
            <div className="success-box mt-6">
              <div className="success-box-header">
                <CheckCircle2 size={18} />
                <span>Resolution Summary</span>
              </div>
              <p>{req.resolutionDetails}</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="detail-card-sidebar">
          <h3>SLA & Audit Stats</h3>
          <div className="sidebar-stat-row">
            <span>SLA Target:</span>
            <strong>{req.slaRemaining}</strong>
          </div>
          <div className="sidebar-stat-row">
            <span>Created At:</span>
            <span>{req.createdAt}</span>
          </div>
          <div className="sidebar-stat-row">
            <span>Work Order Ref:</span>
            <span className="font-mono text-primary">{req.workOrderId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
