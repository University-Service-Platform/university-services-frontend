import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Inbox, Filter, ShieldAlert, ArrowRight, UserPlus, XCircle } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function RequestQueue({ requests, onRejectClick }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const unassignedQueue = (requests || []).filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === 'ALL' || r.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <div className="role-icon-pill" style={{ backgroundColor: `${colors.roles.SERVICE_DESK.color}20`, color: colors.roles.SERVICE_DESK.color }}>
            <Inbox size={16} />
            <span>Service Desk Operations</span>
          </div>
          <h1 className="page-title">Incoming Request Queue</h1>
          <p className="page-subtitle">Unassigned service tickets requiring triage, priority validation, and technician assignment.</p>
        </div>
      </div>

      <div className="table-controls-card">
        <div className="search-filter-box">
          <Search size={16} className="input-search-icon" />
          <input
            type="text"
            placeholder="Filter queue by ID, requester, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <div className="filter-group">
            <label>Priority Filter:</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">P1 - Critical</option>
              <option value="HIGH">P2 - High</option>
              <option value="MEDIUM">P3 - Medium</option>
              <option value="LOW">P4 - Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container-card">
        <table className="wo-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Request Title</th>
              <th>Requester & Dept</th>
              <th>Category</th>
              <th>Priority</th>
              <th>SLA Clock</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {unassignedQueue.map(req => {
              const priorityInfo = colors.priority[req.priority] || colors.priority.MEDIUM;

              return (
                <tr key={req.id} className="table-row-hover">
                  <td className="font-mono text-primary font-bold">{req.id}</td>
                  <td className="font-semibold">{req.title}</td>
                  <td>
                    <div className="requester-cell">
                      <span className="req-name">{req.requester}</span>
                      <span className="req-dept">{req.department}</span>
                    </div>
                  </td>
                  <td className="text-muted">{req.category}</td>
                  <td>
                    <span className="badge-pill" style={{ backgroundColor: priorityInfo.bg, color: priorityInfo.text, borderColor: priorityInfo.border }}>
                      {priorityInfo.label}
                    </span>
                  </td>
                  <td className="font-mono text-warning font-bold">{req.slaRemaining}</td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button className="btn-table-action" onClick={() => navigate(`/servicedesk/triage/${req.id}`)}>
                        <ArrowRight size={14} /> Triage
                      </button>
                      <button className="btn-table-action success" onClick={() => navigate(`/servicedesk/assignment/${req.id}`)}>
                        <UserPlus size={14} /> Assign
                      </button>
                      {onRejectClick && (
                        <button className="btn-table-action danger" onClick={() => onRejectClick(req)}>
                          <XCircle size={14} /> Reject
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
