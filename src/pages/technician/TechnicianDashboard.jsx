import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Clock, CheckCircle2, AlertTriangle, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function TechnicianDashboard({ requests }) {
  const navigate = useNavigate();

  // Filter requests assigned to technicians or in progress
  const assigned = (requests || []).filter(r => r.status === 'IN_PROGRESS' || r.status === 'PENDING_APPROVAL' || r.assignedTechName !== 'Unassigned');
  const activeJobs = assigned.filter(r => r.status !== 'RESOLVED' && r.status !== 'REJECTED');
  const completedJobs = assigned.filter(r => r.status === 'RESOLVED');

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <div className="role-icon-pill" style={{ backgroundColor: `${colors.roles.TECHNICIAN.color}20`, color: colors.roles.TECHNICIAN.color }}>
            <Wrench size={16} />
            <span>Field Technician Operations</span>
          </div>
          <h1 className="page-title">Technician Daily Work Queue</h1>
          <p className="page-subtitle">Track on-site work orders, log diagnostic notes, and record task resolutions.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Work Orders</span>
            <div className="metric-icon primary"><Wrench size={18} /></div>
          </div>
          <div className="metric-value">{activeJobs.length}</div>
          <div className="metric-footer positive">Assigned to your queue</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Urgent P1 Field Tasks</span>
            <div className="metric-icon danger"><AlertTriangle size={18} /></div>
          </div>
          <div className="metric-value danger-text">
            {activeJobs.filter(r => r.priority === 'CRITICAL').length}
          </div>
          <div className="metric-footer danger">Immediate site visit required</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Resolved Today</span>
            <div className="metric-icon positive"><CheckCircle2 size={18} /></div>
          </div>
          <div className="metric-value positive-text">{completedJobs.length}</div>
          <div className="metric-footer positive">Signed off by requester</div>
        </div>
      </div>

      <div className="dashboard-section-title mt-6">
        <h2>Your Assigned Field Queue</h2>
      </div>

      <div className="table-container-card">
        <table className="wo-table">
          <thead>
            <tr>
              <th>Work Order ID</th>
              <th>Task Summary</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA Clock</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assigned.map(req => {
              const priorityInfo = colors.priority[req.priority] || colors.priority.MEDIUM;
              const statusInfo = colors.status[req.status] || colors.status.IN_PROGRESS;

              return (
                <tr key={req.id} className="table-row-hover">
                  <td className="font-mono text-primary font-bold">{req.workOrderId || req.id}</td>
                  <td>
                    <div className="wo-title-cell">
                      <span className="wo-title-text">{req.title}</span>
                      <span className="wo-category-badge">{req.category}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-muted text-xs">
                      <MapPin size={13} />
                      <span>{req.location || 'On Site'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill" style={{ backgroundColor: priorityInfo.bg, color: priorityInfo.text, borderColor: priorityInfo.border }}>
                      {priorityInfo.label}
                    </span>
                  </td>
                  <td>
                    <span className="badge-pill" style={{ backgroundColor: statusInfo.bg, color: statusInfo.text, borderColor: statusInfo.border }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="font-mono text-warning font-bold">{req.slaRemaining}</td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button className="btn-table-action" onClick={() => navigate(`/technician/work-order/${req.id}`)}>
                        Details
                      </button>
                      <button className="btn-table-action success" onClick={() => navigate(`/technician/update/${req.id}`)}>
                        <Wrench size={14} /> Log Progress
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
