import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function RequesterDashboard({ requests }) {
  const navigate = useNavigate();
  const myRequests = requests || [];

  const activeCount = myRequests.filter(r => r.status !== 'RESOLVED' && r.status !== 'REJECTED').length;
  const resolvedCount = myRequests.filter(r => r.status === 'RESOLVED').length;
  const pendingCount = myRequests.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'NEW').length;

  return (
    <div className="page-container fade-in">
      {/* Welcome Banner */}
      <div className="page-header-banner">
        <div>
          <div className="role-icon-pill" style={{ backgroundColor: `${colors.roles.REQUESTER.color}20`, color: colors.roles.REQUESTER.color }}>
            <Sparkles size={16} />
            <span>Student & Staff Portal</span>
          </div>
          <h1 className="page-title">Welcome back, Jordan</h1>
          <p className="page-subtitle">Submit, track, and manage your IT & campus service requests easily.</p>
        </div>

        <button className="btn-primary" onClick={() => navigate('/requester/create')}>
          <PlusCircle size={18} />
          <span>New Service Request</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Requests</span>
            <div className="metric-icon primary"><Clock size={18} /></div>
          </div>
          <div className="metric-value">{activeCount}</div>
          <div className="metric-footer positive">Currently being processed</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Pending Approval</span>
            <div className="metric-icon warning"><AlertCircle size={18} /></div>
          </div>
          <div className="metric-value warning-text">{pendingCount}</div>
          <div className="metric-footer warning">Awaiting manager/security clearance</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Completed Services</span>
            <div className="metric-icon positive"><CheckCircle2 size={18} /></div>
          </div>
          <div className="metric-value positive-text">{resolvedCount}</div>
          <div className="metric-footer positive">Resolved successfully</div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="dashboard-section-title">
        <h2>Popular Services & Actions</h2>
      </div>
      <div className="quick-actions-grid">
        <div className="quick-card" onClick={() => navigate('/requester/create')}>
          <div className="quick-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <PlusCircle size={22} />
          </div>
          <h3>Report IT / Hardware Issue</h3>
          <p>Laptops, monitors, printer faults, classroom AV gear.</p>
        </div>

        <div className="quick-card" onClick={() => navigate('/requester/create?category=Access')}>
          <div className="quick-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
            <FileText size={22} />
          </div>
          <h3>VPN & Software Access</h3>
          <p>Request account permissions, VPN keys, or software licenses.</p>
        </div>

        <div className="quick-card" onClick={() => navigate('/requester/timeline')}>
          <div className="quick-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Clock size={22} />
          </div>
          <h3>Track Request Timeline</h3>
          <p>View real-time technician progress and estimated SLA resolution.</p>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="dashboard-section-title mt-6">
        <h2>Your Recent Requests</h2>
        <Link to="/requester/requests" className="see-all-link">View All ({myRequests.length}) <ChevronRight size={14} /></Link>
      </div>

      <div className="table-container-card">
        <table className="wo-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Service Title</th>
              <th>Category</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.slice(0, 4).map((req) => {
              const statusInfo = colors.status[req.status] || colors.status.NEW;
              return (
                <tr key={req.id} className="table-row-hover">
                  <td className="font-mono text-primary font-bold">{req.id}</td>
                  <td className="font-semibold">{req.title}</td>
                  <td className="text-muted">{req.category}</td>
                  <td className="text-muted">{req.createdAt}</td>
                  <td>
                    <span className="badge-pill" style={{ backgroundColor: statusInfo.bg, color: statusInfo.text, borderColor: statusInfo.border }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn-table-action" onClick={() => navigate(`/requester/details/${req.id}`)}>
                      View Details
                    </button>
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
