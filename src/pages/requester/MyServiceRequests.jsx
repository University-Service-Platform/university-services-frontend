import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlusCircle, Clock, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function MyServiceRequests({ requests }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = (requests || []).filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <h1 className="page-title">My Service Requests</h1>
          <p className="page-subtitle">View and track all tickets submitted by you or your team.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/requester/create')}>
          <PlusCircle size={18} />
          <span>New Request</span>
        </button>
      </div>

      <div className="table-controls-card">
        <div className="search-filter-box">
          <Search size={16} className="input-search-icon" />
          <input
            type="text"
            placeholder="Search by ticket ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container-card">
        <table className="wo-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Title & Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Technician</th>
              <th>Date Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => {
              const statusInfo = colors.status[req.status] || colors.status.NEW;
              const priorityInfo = colors.priority[req.priority] || colors.priority.MEDIUM;

              return (
                <tr key={req.id} className="table-row-hover">
                  <td className="font-mono text-primary font-bold">{req.id}</td>
                  <td>
                    <div className="wo-title-cell">
                      <span className="wo-title-text">{req.title}</span>
                      <span className="wo-category-badge">{req.category}</span>
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
                  <td className="text-muted">{req.assignedTechName || 'Unassigned'}</td>
                  <td className="text-muted">{req.createdAt}</td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button className="btn-table-action" onClick={() => navigate(`/requester/details/${req.id}`)}>
                        <Eye size={14} /> Details
                      </button>
                      <button className="btn-table-action" onClick={() => navigate(`/requester/timeline/${req.id}`)}>
                        <Clock size={14} /> Timeline
                      </button>
                      {req.status === 'RESOLVED' && (
                        <button className="btn-table-action success" onClick={() => navigate(`/requester/confirm/${req.id}`)}>
                          <CheckCircle2 size={14} /> Rate
                        </button>
                      )}
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
