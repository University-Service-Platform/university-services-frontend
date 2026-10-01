import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, XCircle, UserPlus, Sparkles } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function TriagePanel({ requests, onUpdateRequest, onRejectClick }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const req = (requests || []).find(r => r.id === id) || (requests && requests[0]);

  const [category, setCategory] = useState(req?.category || 'Hardware Maintenance');
  const [priority, setPriority] = useState(req?.priority || 'MEDIUM');
  const [triageNotes, setTriageNotes] = useState(req?.triageNotes || '');

  if (!req) return <div className="page-container"><p>Ticket not found for triage.</p></div>;

  const handleSaveTriage = (e) => {
    e.preventDefault();
    if (onUpdateRequest) {
      onUpdateRequest({
        ...req,
        category,
        priority,
        triageNotes,
        status: 'PENDING_APPROVAL'
      });
    }
    navigate(`/servicedesk/assignment/${req.id}`);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Queue
          </button>
          <div className="flex items-center gap-2">
            <span className="wo-id-tag">{req.id}</span>
            <span className="badge-pill" style={{ backgroundColor: colors.priority[req.priority].bg, color: colors.priority[req.priority].text }}>
              {colors.priority[req.priority].label}
            </span>
          </div>
          <h1 className="page-title mt-2">Request Triage & Validation</h1>
          <p className="page-subtitle">Inspect impact, verify requester credentials, and adjust SLA classification.</p>
        </div>
      </div>

      <div className="detail-grid-container">
        {/* Form Panel */}
        <div className="detail-card-main">
          <h2>Triage Form & Override Settings</h2>

          <form onSubmit={handleSaveTriage} className="dialog-body mt-4">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Service Category Override</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Hardware Maintenance">Hardware Maintenance</option>
                  <option value="Access & Security">Access & Security</option>
                  <option value="Infrastructure & Cooling">Infrastructure & Cooling</option>
                  <option value="Database Admin">Database Admin</option>
                  <option value="Software License">Software License</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority & SLA Classification</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="CRITICAL">P1 - Critical (&lt; 1 hr SLA)</option>
                  <option value="HIGH">P2 - High (4 hrs SLA)</option>
                  <option value="MEDIUM">P3 - Medium (24 hrs SLA)</option>
                  <option value="LOW">P4 - Low (72 hrs SLA)</option>
                </select>
              </div>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Triage & Validation Notes</label>
              <textarea
                rows={4}
                className="form-textarea"
                placeholder="Log internal triage assessment, hardware specs, or manager verification details..."
                value={triageNotes}
                onChange={(e) => setTriageNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="dialog-footer mt-6">
              {onRejectClick && (
                <button type="button" className="btn-danger mr-auto" onClick={() => onRejectClick(req)}>
                  <XCircle size={16} /> Reject Request
                </button>
              )}
              <button type="submit" className="btn-primary">
                <UserPlus size={16} />
                <span>Validate & Proceed to Assignment</span>
              </button>
            </div>
          </form>
        </div>

        {/* Original Request Info */}
        <div className="detail-card-sidebar">
          <h3>Original Ticket Submission</h3>
          <div className="detail-field mb-3">
            <label>Title</label>
            <span>{req.title}</span>
          </div>
          <div className="detail-field mb-3">
            <label>Requester</label>
            <span>{req.requester} ({req.requesterEmail})</span>
          </div>
          <div className="detail-field mb-3">
            <label>Location</label>
            <span>{req.location || 'Not specified'}</span>
          </div>
          <div className="detail-section">
            <label>User Description</label>
            <p className="detail-box text-xs">{req.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
